"""Pemrosesan pesan masuk: identitas → consent → agent loop (tool calling) → balasan + notifikasi."""
import json
import logging
import re
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..geo import cari_lokasi
from ..llm.client import ChatModel, LLMError, OpenAICompatClient
from ..matching import proses_kedaluwarsa
from ..messaging import conversation_for, kirim
from ..models import LaporanPanen, Message, Petani, User
from ..normalize import SATUAN_LOKAL, hari_ini, ke_kg, normalisasi_nomor
from ..settings_store import llm_config
from .fallback import ekstrak_laporan
from .prompts import system_prompt
from .tools import REGISTRY, Actor, ToolContext, ToolError, tools_for

log = logging.getLogger(__name__)

LLMFactory = Callable[[Session], ChatModel]

PESAN_GANGGUAN = "Mohon maaf, sistem PanganDali sedang ada gangguan. Pesan Bapak/Ibu sudah kami terima, coba kirim lagi beberapa saat lagi ya."
PESAN_CONSENT = (
    "Halo, ini PanganDali, layanan pencatatan panen dan angkutan hasil tani dari Dinas Pertanian Rejang Lebong. "
    "Untuk memakai layanan ini, kami akan menyimpan nomor WhatsApp, nama, desa, dan laporan panen Bapak/Ibu. "
    "Data dipakai hanya untuk pencatatan pasokan, pencarian pembeli, dan angkutan, serta tidak dibagikan ke pihak lain tanpa izin. "
    "Apakah Bapak/Ibu setuju? Balas ya kalau setuju."
)
PESAN_TIDAK_TERDAFTAR = (
    "Halo, terima kasih sudah menghubungi PanganDali. Nomor ini belum terdaftar sebagai petani mitra. "
    "Silakan hubungi penyuluh (PPL), ketua kelompok tani, atau petugas Dinas Pertanian Rejang Lebong untuk didaftarkan."
)
_YA = re.compile(r"^\s*(ya+|iya+|yes|y|setuju|ok(e|ey)?|boleh|siap|mau)\b", re.I)
_TIDAK = re.compile(r"^\s*(tidak|tdk|ga+k?|nggak|engga+k?|no|tolak)\b", re.I)


@dataclass
class HasilProses:
    balasan: list[Message]
    notifikasi: list[Message]


def default_llm(db: Session) -> ChatModel:
    return OpenAICompatClient(llm_config())


def resolve_actor(db: Session, phone: str) -> Actor:
    user = db.scalar(select(User).where(User.phone == phone, User.is_active.is_(True)))
    if user is not None and user.role in ("driver", "distributor"):
        return Actor(role=user.role, phone=phone, user=user)
    petani = db.scalar(select(Petani).where(Petani.phone == phone, Petani.is_active.is_(True)))
    if petani is None:
        # Proposal: hanya petani terdaftar (didaftarkan admin/PPL) yang dilayani.
        return Actor(role="tidak_terdaftar", phone=phone)
    return Actor(role="petani", phone=phone, petani=petani)


def sistem_notifier(db: Session, channel: str | None = None):
    """Notifier untuk kejadian yang dipicu sistem/admin (bukan oleh pesan masuk)."""
    terkirim: list[Message] = []

    def notify(phone: str | None, role: str, text: str) -> None:
        if not phone:
            return
        # Kirim lewat kanal milik penerima; kanal pemicu hanya dipakai bila penerima belum pernah chat.
        conv = conversation_for(db, phone, role, channel)
        terkirim.append(kirim(db, conv, text, notification=True))

    notify.terkirim = terkirim  # type: ignore[attr-defined]
    return notify


def handle_incoming(
    db: Session,
    phone: str,
    text: str,
    channel: str,
    wa_message_id: str | None = None,
    profile_name: str | None = None,
    llm_factory: LLMFactory | None = None,
) -> HasilProses | None:
    """Proses satu pesan masuk. Mengembalikan None bila pesan duplikat (idempotensi webhook)."""
    phone = normalisasi_nomor(phone)
    if wa_message_id and db.scalar(select(Message.id).where(Message.wa_message_id == wa_message_id)):
        return None

    # Penawaran/kunci pesanan yang lewat batas diproses dulu supaya agent melihat keadaan terbaru.
    proses_kedaluwarsa(db, sistem_notifier(db, channel))
    actor = resolve_actor(db, phone)
    if actor.petani is not None and not actor.petani.name and profile_name:
        actor.petani.name = profile_name[:120]
    conv = conversation_for(db, phone, actor.role, channel)
    conv.channel = channel
    conv.last_inbound_at = datetime.now(timezone.utc)
    masuk = Message(conversation_id=conv.id, direction="in", text=text, channel=channel, wa_message_id=wa_message_id)
    db.add(masuk)
    db.flush()

    ctx = ToolContext(db=db, actor=actor, conversation=conv, turn_id=masuk.id)
    meta: dict = {}
    try:
        if actor.role == "tidak_terdaftar":
            balasan = PESAN_TIDAK_TERDAFTAR
        elif actor.petani is not None and actor.petani.consent_at is None:
            balasan = _gerbang_consent(ctx, text)
        else:
            balasan, meta = _jalankan_agent(ctx, text, (llm_factory or default_llm))
    except Exception:  # noqa: BLE001 - jangan sampai pengguna tidak dibalas
        log.exception("Gagal memproses pesan dari %s", phone)
        db.rollback()
        return _balas_gangguan_setelah_rollback(db, phone, text, channel, wa_message_id)

    keluar = kirim(db, conv, balasan, channel, meta=meta)
    notif_msgs = []
    # Satu pesan per penerima per giliran (mis. "dimuat" + "dalam perjalanan" digabung) supaya tidak membanjiri WA.
    gabung: dict[str, tuple[str, list[str]]] = {}
    for n in ctx.notifikasi:
        role, teks = gabung.setdefault(n.phone, (n.role, []))
        if n.text not in teks:
            teks.append(n.text)
    for phone, (role, teks) in gabung.items():
        # Kanal milik penerima (nomor demo di simulator tidak dikirimi lewat WA asli, dan sebaliknya).
        c = conversation_for(db, phone, role, channel)
        notif_msgs.append(kirim(db, c, "\n".join(teks), notification=True))
    db.commit()
    return HasilProses(balasan=[keluar], notifikasi=notif_msgs)


def _gerbang_consent(ctx: ToolContext, text: str) -> str:
    conv, petani = ctx.conversation, ctx.actor.petani
    sudah_ditanya = bool(conv.pending_action and conv.pending_action.get("consent"))
    if sudah_ditanya and _YA.match(text):
        petani.consent_at = datetime.now(timezone.utc)
        conv.pending_action = None
        sapaan = f"Pak/Bu {petani.name}" if petani.name else "Bapak/Ibu"
        return f"Terima kasih {sapaan}, persetujuan sudah kami catat. Silakan langsung kabari kalau ada panen, mau cek harga, atau butuh angkutan."
    if sudah_ditanya and _TIDAK.match(text):
        conv.pending_action = None
        return "Baik, data Bapak/Ibu tidak kami proses. Kalau berubah pikiran, kirim pesan lagi kapan saja."
    conv.pending_action = {"consent": True}
    return PESAN_CONSENT


def _riwayat(ctx: ToolContext) -> list[dict]:
    n = get_settings().agent_history_messages
    rows = ctx.db.scalars(
        select(Message)
        .where(Message.conversation_id == ctx.conversation.id, Message.id != ctx.turn_id)
        .order_by(Message.id.desc())
        .limit(n)
    ).all()
    return [{"role": "user" if m.direction == "in" else "assistant", "content": m.text} for m in reversed(rows)]


def _jalankan_agent(ctx: ToolContext, text: str, llm_factory: LLMFactory) -> tuple[str, dict]:
    pending = ctx.conversation.pending_action
    if pending and pending.get("consent"):
        pending = ctx.conversation.pending_action = None
    tools = tools_for(ctx.actor.role)
    schemas = [t.schema() for t in tools]
    allowed = {t.name for t in tools}
    messages = [{"role": "system", "content": system_prompt(ctx.actor, hari_ini(), pending)}, *_riwayat(ctx)]
    messages.append({"role": "user", "content": text})

    try:
        llm = llm_factory(ctx.db)
    except LLMError as exc:
        return _fallback(ctx, text, str(exc))

    try:
        for _ in range(get_settings().agent_max_iterations):
            reply = llm.chat(messages, schemas)
            if not reply.tool_calls:
                teks = bersihkan_markdown(reply.content or "")
                return (teks or "Maaf, bisa diulang pesannya?"), {"tools": ctx.log}
            assistant = dict(reply.raw_message)
            assistant["role"] = "assistant"
            assistant.setdefault("content", None)
            messages.append(assistant)
            for call in reply.tool_calls:
                hasil = _eksekusi(ctx, call.name, call.arguments, allowed)
                ctx.log.append({"tool": call.name, "args": call.arguments, "hasil": hasil})
                messages.append({"role": "tool", "tool_call_id": call.id, "content": json.dumps(hasil, ensure_ascii=False, default=str)})
        return "Maaf, permintaannya belum bisa saya selesaikan. Bisa dijelaskan lagi dengan lebih singkat?", {"tools": ctx.log, "max_iter": True}
    except LLMError as exc:
        return _fallback(ctx, text, str(exc))
    finally:
        close = getattr(llm, "close", None)
        if close:
            close()


def _eksekusi(ctx: ToolContext, name: str, raw_args: str, allowed: set[str]) -> dict:
    if name not in allowed:
        return {"error": f"Tool {name} tidak tersedia untuk peran ini."}
    try:
        args = json.loads(raw_args or "{}")
        if not isinstance(args, dict):
            raise ValueError
    except ValueError:
        return {"error": "Argumen tool bukan JSON objek yang valid."}
    tool = REGISTRY[name]
    try:
        if tool.writes:
            ringkasan, norm = tool.prepare(ctx, args)
            ctx.conversation.pending_action = {
                "tool": name,
                "args": norm,
                "ringkasan": ringkasan,
                "turn_id": ctx.turn_id,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            return {
                "status": "menunggu_konfirmasi",
                "ringkasan": ringkasan,
                "instruksi": "Belum tersimpan. Tanyakan ke pengguna apakah ringkasan ini sudah benar.",
            }
        return tool.run(ctx, args)
    except ToolError as exc:
        return {"error": str(exc)}


def _fallback(ctx: ToolContext, text: str, alasan: str) -> tuple[str, dict]:
    """LLM tidak bisa dipakai: tetap tangkap laporan panen dengan rule-based, tandai perlu_review."""
    log.warning("LLM fallback: %s", alasan)
    meta = {"fallback": True, "alasan": alasan}
    if ctx.actor.petani is None:
        return PESAN_GANGGUAN, meta
    data = ekstrak_laporan(text)
    if not data:
        return PESAN_GANGGUAN, meta
    p = ctx.actor.petani
    # Satuan lokal tidak dikonversi tanpa kesepakatan; petugas memastikan beratnya saat review.
    kg = None if data["satuan"] in SATUAN_LOKAL else ke_kg(data["jumlah"], data["satuan"])
    desa = data["desa"] or p.desa
    lokasi = cari_lokasi(ctx.db, desa)
    lap = LaporanPanen(
        petani_id=p.id,
        komoditas=data["komoditas"],
        jumlah=data["jumlah"],
        satuan=data["satuan"],
        jumlah_kg=kg,
        sisa_kg=kg,
        desa=desa,
        lokasi_id=lokasi.id if lokasi else None,
        tanggal_panen=data["tanggal_panen"],
        status="perlu_review",
        sumber="fallback",
        teks_asli=text,
    )
    ctx.db.add(lap)
    ctx.db.flush()
    meta["laporan_id"] = lap.id
    return (
        f"Mohon maaf, sistem sedang ada gangguan. Laporan panen {data['komoditas']} {data['jumlah']:g} {data['satuan']} "
        "sudah kami catat sementara dan akan dicek petugas Dinas Pertanian. Terima kasih.",
        meta,
    )


def _balas_gangguan_setelah_rollback(db: Session, phone: str, text: str, channel: str, wa_message_id: str | None) -> HasilProses:
    actor = resolve_actor(db, phone)
    conv = conversation_for(db, phone, actor.role, channel)
    conv.channel = channel
    conv.last_inbound_at = datetime.now(timezone.utc)
    db.add(Message(conversation_id=conv.id, direction="in", text=text, channel=channel, wa_message_id=wa_message_id))
    keluar = kirim(db, conv, PESAN_GANGGUAN, channel, meta={"error": True})
    db.commit()
    return HasilProses(balasan=[keluar], notifikasi=[])


_MD = [
    (re.compile(r"\*\*(.+?)\*\*"), r"\1"),
    (re.compile(r"__(.+?)__"), r"\1"),
    (re.compile(r"(?<!\w)\*(\S.*?\S|\S)\*(?!\w)"), r"\1"),
    (re.compile(r"^#{1,6}\s*", re.M), ""),
    (re.compile(r"`{1,3}([^`]*)`{1,3}"), r"\1"),
    (re.compile(r"^\s*[-*•]\s+", re.M), "- "),
]


def bersihkan_markdown(teks: str) -> str:
    for pola, ganti in _MD:
        teks = pola.sub(ganti, teks)
    return teks.strip()

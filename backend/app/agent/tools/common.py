from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from ...audit import catat
from ...models import Harga
from ...normalize import KOMODITAS, normalisasi_komoditas
from .base import REGISTRY, ToolContext, ToolError, obj, tool

SEMUA = ("petani", "driver", "distributor")
PENDING_TTL = timedelta(minutes=30)


def wajib_komoditas(teks: str | None) -> str:
    k = normalisasi_komoditas(teks)
    if not k:
        raise ToolError(f"Komoditas '{teks}' tidak dikenali. Yang didukung: {', '.join(KOMODITAS)}.")
    return k


@tool(
    "cek_harga",
    "Lihat harga terbaru suatu komoditas per pasar dari database. Jangan pernah menyebut harga tanpa memanggil tool ini.",
    obj({"komoditas": {"type": "string", "description": "Nama komoditas, mis. cabai besar, kol, terung"}}, ["komoditas"]),
    SEMUA,
)
def cek_harga(ctx: ToolContext, args: dict):
    k = wajib_komoditas(args.get("komoditas"))
    rows = ctx.db.scalars(select(Harga).where(Harga.komoditas == k).order_by(Harga.tanggal.desc()).limit(20)).all()
    terbaru: dict[str, Harga] = {}
    for r in rows:
        terbaru.setdefault(r.pasar, r)
    if not terbaru:
        return {"komoditas": k, "harga": [], "catatan": "Belum ada data harga untuk komoditas ini."}
    return {
        "komoditas": k,
        "harga": [
            {"pasar": r.pasar, "rp_per_kg": r.harga_per_kg, "tanggal": r.tanggal.isoformat(), "sumber": r.sumber}
            for r in terbaru.values()
        ],
    }


@tool("profil_saya", "Lihat profil pengguna yang sedang chat (nama, desa, kapasitas armada, dsb).", obj({}), SEMUA)
def profil_saya(ctx: ToolContext, args: dict):
    a = ctx.actor
    if a.petani is not None:
        p = a.petani
        return {"peran": "petani", "nama": p.name, "desa": p.desa, "kecamatan": p.kecamatan, "nomor": p.phone}
    u = a.user
    data = {"peran": a.role, "nama": u.name, "nomor": u.phone, "status_verifikasi": u.verification_status}
    if a.role == "driver":
        data.update(
            kapasitas_kg=u.kapasitas_kg,
            plat_nomor=u.plat_nomor,
            lokasi=u.lokasi,
            jenis_kendaraan=u.jenis_kendaraan,
            komoditas_cocok=u.komoditas_cocok or "semua",
        )
    if a.role == "distributor":
        data.update(nama_usaha=u.nama_usaha)
    return data


@tool(
    "konfirmasi_aksi",
    "Jalankan aksi yang tertunda SETELAH pengguna menyatakan setuju/benar pada pesan berikutnya. "
    "Jangan dipanggil pada giliran yang sama dengan saat aksi diajukan.",
    obj({}),
    SEMUA,
)
def konfirmasi_aksi(ctx: ToolContext, args: dict):
    pending = ctx.conversation.pending_action
    if not pending:
        raise ToolError("Tidak ada aksi yang menunggu konfirmasi.")
    if pending.get("turn_id") == ctx.turn_id:
        raise ToolError("Pengguna belum menjawab. Tanyakan konfirmasi dulu dan tunggu balasannya.")
    dibuat = datetime.fromisoformat(pending["created_at"])
    if datetime.now(timezone.utc) - dibuat > PENDING_TTL:
        ctx.conversation.pending_action = None
        raise ToolError("Aksi tertunda sudah kedaluwarsa. Ajukan ulang bila pengguna masih mau.")
    t = REGISTRY[pending["tool"]]
    ctx.conversation.pending_action = None
    hasil = t.run(ctx, pending["args"])
    catat(ctx.db, ctx.actor.aktor, t.name, data={"args": pending["args"], "hasil": hasil})
    return {"status": "berhasil", "aksi": t.name, "hasil": hasil}


@tool("batalkan_aksi", "Batalkan aksi yang menunggu konfirmasi bila pengguna tidak setuju.", obj({}), SEMUA)
def batalkan_aksi(ctx: ToolContext, args: dict):
    if not ctx.conversation.pending_action:
        return {"status": "tidak_ada_aksi"}
    ctx.conversation.pending_action = None
    return {"status": "dibatalkan"}

from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from ...geo import cari_lokasi
from ...matching import TUJUAN_DEFAULT, fmt_kg, fmt_rp, lepas_kunci_pesanan
from ...models import LaporanPanen, Penawaran, Pengiriman, Pesanan
from ...operasional import get_operasional
from .base import ToolContext, ToolError, obj, tool
from .common import wajib_komoditas

DISTRIBUTOR = ("distributor",)


def _distributor(ctx: ToolContext):
    if ctx.actor.role != "distributor" or ctx.actor.user is None:
        raise ToolError("Tool ini khusus distributor.")
    u = ctx.actor.user
    if u.verification_status != "disetujui":
        raise ToolError("Akun distributor belum diverifikasi admin, belum bisa memesan.")
    return u


def _stok_query(komoditas: str, jumlah_min: float = 0):
    # Hanya stok tervalidasi admin yang beratnya sudah diketahui.
    return (
        select(LaporanPanen)
        .where(LaporanPanen.komoditas == komoditas, LaporanPanen.status == "tersedia", LaporanPanen.sisa_kg > 0)
        .where(LaporanPanen.sisa_kg >= jumlah_min)
        .order_by(LaporanPanen.tanggal_panen.is_(None), LaporanPanen.tanggal_panen, LaporanPanen.id)
    )


@tool(
    "cari_stok",
    "Cari stok tervalidasi dari laporan petani. Jangan pernah menyebut stok tanpa tool ini.",
    obj(
        {
            "komoditas": {"type": "string"},
            "jumlah_min_kg": {"type": "number", "description": "Minimal sisa stok per laporan, dalam kg"},
        },
        ["komoditas"],
    ),
    DISTRIBUTOR,
)
def cari_stok(ctx: ToolContext, args: dict):
    k = wajib_komoditas(args.get("komoditas"))
    rows = ctx.db.scalars(_stok_query(k, float(args.get("jumlah_min_kg") or 0)).limit(10)).all()
    # Minimisasi data (UU PDP): nomor dan nama petani tidak dibagikan ke distributor.
    return {
        "komoditas": k,
        "total_tersedia_kg": sum(r.sisa_kg for r in rows),
        "stok": [
            {
                "laporan_id": r.id,
                "sisa_kg": r.sisa_kg,
                "desa": r.desa,
                "tanggal_panen": r.tanggal_panen.isoformat() if r.tanggal_panen else None,
                "harga_harapan_petani_per_kg": r.harga_harapan_per_kg,
            }
            for r in rows
        ],
    }


def _prep_pesan(ctx: ToolContext, args: dict):
    _distributor(ctx)
    try:
        jumlah = float(args.get("jumlah_kg"))
    except (TypeError, ValueError):
        raise ToolError("Jumlah pesanan (kg) belum jelas.") from None
    if jumlah <= 0:
        raise ToolError("Jumlah pesanan harus lebih dari 0.")
    if args.get("laporan_id"):
        lap = ctx.db.get(LaporanPanen, int(args["laporan_id"]))
        if lap is None or lap.status != "tersedia" or not lap.sisa_kg:
            raise ToolError(f"Stok #{args['laporan_id']} tidak tersedia.")
    else:
        k = wajib_komoditas(args.get("komoditas"))
        lap = ctx.db.scalars(_stok_query(k, jumlah).limit(1)).first()
        if lap is None:
            raise ToolError(f"Tidak ada satu stok {k} yang cukup untuk {fmt_kg(jumlah)}. Tawarkan beberapa stok lewat cari_stok.")
    if jumlah > lap.sisa_kg:
        raise ToolError(f"Sisa stok #{lap.id} hanya {fmt_kg(lap.sisa_kg)}.")
    harga = args.get("harga_tawar_per_kg")
    if harga is not None:
        try:
            harga = float(harga)
        except (TypeError, ValueError):
            raise ToolError("Harga tawar harus angka rupiah per kg.") from None
    tujuan = (args.get("tujuan") or TUJUAN_DEFAULT).strip()
    d = {"laporan_id": lap.id, "jumlah_kg": jumlah, "tujuan": tujuan, "harga_tawar_per_kg": harga}
    teks_harga = f" seharga {fmt_rp(harga)}/kg" if harga else ""
    return (
        f"Ajukan permintaan {lap.komoditas} {fmt_kg(jumlah)}{teks_harga} dari stok #{lap.id} ({lap.desa}), kirim ke {tujuan}. "
        "Volume dikunci sementara sampai petani menjawab",
        d,
    )


@tool(
    "buat_pesanan",
    "Ajukan permintaan pembelian atas stok petani. Volume dikunci sementara, lalu petani menerima atau menolak. "
    "Butuh konfirmasi. Isi laporan_id bila distributor memilih stok tertentu, atau komoditas bila tidak.",
    obj(
        {
            "laporan_id": {"type": "integer"},
            "komoditas": {"type": "string"},
            "jumlah_kg": {"type": "number"},
            "harga_tawar_per_kg": {"type": "number", "description": "Harga yang ditawarkan distributor, rupiah per kg (opsional)"},
            "tujuan": {"type": "string", "description": "Alamat/pasar tujuan, default Pasar Panorama, Kota Bengkulu"},
        },
        ["jumlah_kg"],
    ),
    DISTRIBUTOR,
    prepare=_prep_pesan,
)
def buat_pesanan(ctx: ToolContext, d: dict):
    u = _distributor(ctx)
    lap = ctx.db.get(LaporanPanen, d["laporan_id"])
    # Cek ulang: stok bisa berubah selama menunggu konfirmasi (mencegah pemesanan ganda).
    if lap is None or lap.status != "tersedia" or (lap.sisa_kg or 0) < d["jumlah_kg"]:
        raise ToolError("Maaf, stok ini baru saja berkurang/dipesan pihak lain. Cek stok lagi.")
    op = get_operasional(ctx.db)
    pesanan = Pesanan(
        distributor_id=u.id,
        laporan_id=lap.id,
        jumlah_kg=d["jumlah_kg"],
        harga_tawar_per_kg=d.get("harga_tawar_per_kg"),
        tujuan=d["tujuan"],
        tujuan_lokasi_id=getattr(cari_lokasi(ctx.db, d["tujuan"]), "id", None),
        status="menunggu_petani",
        kunci_sampai=datetime.now(timezone.utc) + timedelta(hours=op.batas_respon_petani_jam),
    )
    ctx.db.add(pesanan)
    lap.sisa_kg = round(lap.sisa_kg - d["jumlah_kg"], 2)
    if lap.sisa_kg <= 0:
        lap.status = "dipesan"
    ctx.db.flush()
    harga = f" dengan harga {fmt_rp(pesanan.harga_tawar_per_kg)}/kg" if pesanan.harga_tawar_per_kg else ""
    ctx.notify(
        lap.petani.phone,
        "petani",
        f"Ada permintaan pembelian #{pesanan.id} dari {u.nama_usaha or u.name}: {lap.komoditas} {fmt_kg(d['jumlah_kg'])}{harga} "
        f"dari laporan #{lap.id}, dikirim ke {d['tujuan']}. Bapak/Ibu mau terima atau tolak? "
        f"Permintaan ini menunggu jawaban {op.batas_respon_petani_jam:g} jam.",
    )
    return {"pesanan_id": pesanan.id, "status": pesanan.status, "jumlah_kg": d["jumlah_kg"], "menunggu_jawaban_petani_jam": op.batas_respon_petani_jam}


def _pesanan_milik(ctx: ToolContext, pesanan_id) -> Pesanan:
    u = _distributor(ctx)
    try:
        pes = ctx.db.get(Pesanan, int(pesanan_id))
    except (TypeError, ValueError):
        pes = None
    if pes is None or pes.distributor_id != u.id:
        raise ToolError(f"Pesanan #{pesanan_id} tidak ditemukan.")
    return pes


def _prep_batal_pesanan(ctx: ToolContext, args: dict):
    pes = _pesanan_milik(ctx, args.get("pesanan_id"))
    if pes.status == "menunggu_angkutan":
        kirim = ctx.db.scalar(select(Pengiriman).where(Pengiriman.pesanan_id == pes.id))
        if kirim and kirim.driver_id:
            raise ToolError("Armada sudah ditugaskan; pembatalan harus lewat petugas.")
    elif pes.status != "menunggu_petani":
        raise ToolError(f"Pesanan #{pes.id} berstatus {pes.status}, tidak bisa dibatalkan lewat chat.")
    return f"Batalkan pesanan #{pes.id} ({pes.laporan.komoditas} {fmt_kg(pes.jumlah_kg)})", {"pesanan_id": pes.id}


@tool(
    "batalkan_pesanan",
    "Batalkan pesanan distributor yang belum mendapat armada. Butuh konfirmasi.",
    obj({"pesanan_id": {"type": "integer"}}, ["pesanan_id"]),
    DISTRIBUTOR,
    prepare=_prep_batal_pesanan,
)
def batalkan_pesanan(ctx: ToolContext, d: dict):
    pes = _pesanan_milik(ctx, d["pesanan_id"])
    kirim = ctx.db.scalar(select(Pengiriman).where(Pengiriman.pesanan_id == pes.id))
    if kirim:
        if kirim.driver_id:
            raise ToolError("Armada baru saja ditugaskan; pembatalan harus lewat petugas.")
        kirim.status = "dibatalkan"
        for pen in ctx.db.scalars(select(Penawaran).where(Penawaran.pengiriman_id == kirim.id, Penawaran.status == "ditawarkan")):
            pen.status = "dibatalkan"
    lepas_kunci_pesanan(ctx.db, pes, "dibatalkan")
    ctx.notify(pes.laporan.petani.phone, "petani", f"Permintaan #{pes.id} ({pes.laporan.komoditas} {fmt_kg(pes.jumlah_kg)}) dibatalkan pembeli. Stok kembali tersedia.")
    return {"pesanan_id": pes.id, "status": pes.status}


@tool("lihat_pesanan_saya", "Lihat 10 pesanan terakhir distributor beserta status pengirimannya.", obj({}), DISTRIBUTOR)
def lihat_pesanan_saya(ctx: ToolContext, args: dict):
    u = _distributor(ctx)
    rows = ctx.db.scalars(select(Pesanan).where(Pesanan.distributor_id == u.id).order_by(Pesanan.id.desc()).limit(10)).all()
    hasil = []
    for p in rows:
        kirim = ctx.db.scalar(select(Pengiriman).where(Pengiriman.pesanan_id == p.id))
        hasil.append(
            {
                "pesanan_id": p.id,
                "komoditas": p.laporan.komoditas,
                "jumlah_kg": p.jumlah_kg,
                "status": p.status,
                "pengiriman": {"kode": kirim.kode, "status": kirim.status} if kirim else None,
            }
        )
    return {"pesanan": hasil}


def _kirim_untuk_distributor(ctx: ToolContext, kode) -> Pengiriman:
    u = _distributor(ctx)
    k = (str(kode or "")).strip().upper()
    if k.isdigit():
        k = f"TRK-{k}"
    kirim = ctx.db.scalar(select(Pengiriman).where(Pengiriman.kode == k))
    if kirim is None or not kirim.pesanan or kirim.pesanan.distributor_id != u.id:
        raise ToolError(f"Pengiriman {kode} tidak ditemukan untuk distributor ini.")
    return kirim


def _prep_terima_barang(ctx: ToolContext, args: dict):
    kirim = _kirim_untuk_distributor(ctx, args.get("kode"))
    if kirim.status not in ("dimuat", "dalam_perjalanan", "selesai"):
        raise ToolError(f"Barang order {kirim.kode} belum dimuat (status {kirim.status}).")
    try:
        terima = float(args.get("berat_terima_kg"))
    except (TypeError, ValueError):
        raise ToolError("Berat diterima (kg) belum jelas. Tanyakan hasil timbangan.") from None
    ditolak = args.get("berat_ditolak_kg")
    ditolak = float(ditolak) if ditolak not in (None, "") else None
    if terima < 0 or (ditolak is not None and ditolak < 0):
        raise ToolError("Berat tidak boleh negatif.")
    alasan = (args.get("alasan_tolak_mutu") or "").strip() or None
    d = {"kode": kirim.kode, "berat_terima_kg": terima, "berat_ditolak_kg": ditolak, "alasan_tolak_mutu": alasan}
    teks = f"Catat penerimaan {kirim.kode}: diterima {fmt_kg(terima)}"
    if ditolak:
        teks += f", ditolak {fmt_kg(ditolak)}" + (f" ({alasan})" if alasan else "")
    if kirim.berat_muat_kg:
        teks += f" (berat saat muat {fmt_kg(kirim.berat_muat_kg)})"
    return teks, d


@tool(
    "catat_penerimaan",
    "Catat hasil timbang barang saat tiba (untuk menghitung susut distribusi). Butuh konfirmasi. "
    "berat_terima_kg = berat yang DITERIMA (lolos mutu); berat_ditolak_kg = berat yang ditolak karena mutu. "
    "Kalau tidak jelas apakah angka yang disebut sudah termasuk yang ditolak, tanyakan dulu.",
    obj(
        {
            "kode": {"type": "string"},
            "berat_terima_kg": {"type": "number", "description": "Berat bersih yang diterima/lolos mutu, kg"},
            "berat_ditolak_kg": {"type": "number", "description": "Berat bersih yang ditolak karena mutu, kg"},
            "alasan_tolak_mutu": {"type": "string"},
        },
        ["kode", "berat_terima_kg"],
    ),
    DISTRIBUTOR,
    prepare=_prep_terima_barang,
)
def catat_penerimaan(ctx: ToolContext, d: dict):
    kirim = _kirim_untuk_distributor(ctx, d["kode"])
    kirim.berat_terima_kg = d["berat_terima_kg"]
    kirim.berat_ditolak_kg = d.get("berat_ditolak_kg")
    kirim.alasan_tolak_mutu = d.get("alasan_tolak_mutu")
    if kirim.waktu_terima is None:
        kirim.waktu_terima = datetime.now(timezone.utc)
    susut = None
    if kirim.berat_muat_kg:
        tiba = kirim.berat_terima_kg + (kirim.berat_ditolak_kg or 0)
        susut = round(100 * (kirim.berat_muat_kg - tiba) / kirim.berat_muat_kg, 2)
    return {"kode": kirim.kode, "berat_terima_kg": kirim.berat_terima_kg, "susut_persen": susut}

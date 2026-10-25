from datetime import date, datetime, timezone

from sqlalchemy import select

from ...geo import cari_lokasi
from ...matching import TUJUAN_DEFAULT, buat_pengiriman, fmt_kg, fmt_rp, lepas_kunci_pesanan, tawarkan_berikutnya
from ...models import LaporanPanen, Pengiriman, Pesanan
from ...normalize import SATUAN_LOKAL, ke_kg, normalisasi_satuan, normalisasi_tanggal
from .base import ToolContext, ToolError, obj, tool
from .common import wajib_komoditas

PETANI = ("petani",)

_PARAM_LAPORAN = {
    "komoditas": {"type": "string", "description": "Komoditas seperti yang disebut petani (cabe, kol, kembang kol, terong, wortel, tomat)"},
    "jumlah": {"type": "number", "description": "Angka jumlah panen"},
    "satuan": {"type": "string", "description": "Satuan apa adanya: kg, kilo, ton, kwintal, karung, pikul, ikat"},
    "kg_per_satuan": {
        "type": "number",
        "description": "Khusus satuan lokal (karung/pikul/ikat): berat per satuan dalam kg MENURUT PETANI. "
        "Jangan diisi dengan tebakan; kosongkan bila petani tidak tahu.",
    },
    "desa": {"type": "string", "description": "Nama desa lokasi panen bila disebut"},
    "tanggal_panen": {"type": "string", "description": "Waktu panen apa adanya: 'hari ini', 'besok', 'lusa', 'kamis', '20/10', atau YYYY-MM-DD"},
    "harga_harapan_per_kg": {"type": "number", "description": "Harga jual yang diharapkan petani, rupiah per kg, bila disebut"},
}


def _petani(ctx: ToolContext):
    if ctx.actor.petani is None:
        raise ToolError("Tool ini khusus petani.")
    return ctx.actor.petani


def _laporan_milik(ctx: ToolContext, laporan_id) -> LaporanPanen:
    try:
        lid = int(laporan_id)
    except (TypeError, ValueError):
        raise ToolError("laporan_id harus angka.") from None
    lap = ctx.db.get(LaporanPanen, lid)
    if lap is None or lap.petani_id != _petani(ctx).id:
        raise ToolError(f"Laporan #{laporan_id} tidak ditemukan untuk petani ini.")
    return lap


def _ada_ikatan(ctx: ToolContext, lap: LaporanPanen) -> bool:
    """Laporan sudah punya pesanan/pengiriman aktif sehingga tidak boleh diubah lewat chat."""
    pes = ctx.db.scalar(
        select(Pesanan.id).where(Pesanan.laporan_id == lap.id, Pesanan.status.in_(("menunggu_petani", "menunggu_angkutan", "dalam_pengiriman")))
    )
    kirim = ctx.db.scalar(select(Pengiriman.id).where(Pengiriman.laporan_id == lap.id, Pengiriman.status != "dibatalkan"))
    return bool(pes or kirim)


def _normalisasi_laporan(ctx: ToolContext, args: dict, lama: LaporanPanen | None = None) -> dict:
    p = _petani(ctx)
    komoditas = wajib_komoditas(args["komoditas"]) if args.get("komoditas") else (lama.komoditas if lama else None)
    if not komoditas:
        raise ToolError("Komoditas belum disebut.")
    jumlah = args.get("jumlah")
    if jumlah is None and lama is not None:
        jumlah = lama.jumlah
    try:
        jumlah = float(jumlah)
    except (TypeError, ValueError):
        raise ToolError("Jumlah panen belum jelas, tanyakan angkanya.") from None
    if jumlah <= 0 or jumlah > 1_000_000:
        raise ToolError("Jumlah panen tidak masuk akal.")
    satuan_teks = args.get("satuan") or (lama.satuan if lama else None)
    satuan = normalisasi_satuan(satuan_teks)
    if not satuan:
        raise ToolError(f"Satuan '{satuan_teks}' tidak dikenali. Tanyakan satuannya (kg, ton, kwintal, karung, pikul, ikat).")
    kg_per = args.get("kg_per_satuan")
    if kg_per is None and lama is not None and satuan == lama.satuan:
        kg_per = lama.kg_per_satuan
    if satuan in SATUAN_LOKAL:
        # Proposal: satuan lokal tidak dikonversi tanpa kesepakatan. Hanya pakai angka dari petani.
        if kg_per is not None:
            try:
                kg_per = float(kg_per)
            except (TypeError, ValueError):
                raise ToolError("Berat per satuan harus angka kg.") from None
            if not 0 < kg_per <= 500:
                raise ToolError("Berat per satuan tidak masuk akal.")
        jumlah_kg = round(jumlah * kg_per, 2) if kg_per else None
    else:
        kg_per = None
        jumlah_kg = ke_kg(jumlah, satuan)
    desa = (args.get("desa") or (lama.desa if lama else None) or p.desa or "").strip().title() or None
    if not desa:
        raise ToolError("Desa belum diketahui. Tanyakan desa lokasi panen.")
    lokasi = cari_lokasi(ctx.db, desa)
    tanggal: date | None = lama.tanggal_panen if lama else None
    if args.get("tanggal_panen"):
        tanggal = normalisasi_tanggal(args["tanggal_panen"])
        if tanggal is None:
            raise ToolError(f"Tanggal '{args['tanggal_panen']}' tidak bisa dipahami. Tanyakan kapan panennya.")
    harga = args.get("harga_harapan_per_kg")
    if harga is None and lama is not None:
        harga = lama.harga_harapan_per_kg
    if harga is not None:
        try:
            harga = float(harga)
        except (TypeError, ValueError):
            raise ToolError("Harga harapan harus angka rupiah per kg.") from None
        if not 100 <= harga <= 500_000:
            raise ToolError("Harga harapan per kg tidak masuk akal, tanyakan lagi.")
    return {
        "komoditas": komoditas,
        "jumlah": jumlah,
        "satuan": satuan,
        "kg_per_satuan": kg_per,
        "jumlah_kg": jumlah_kg,
        "desa": lokasi.nama if lokasi and lokasi.jenis == "desa" else desa,
        "lokasi_id": lokasi.id if lokasi else None,
        "tanggal_panen": tanggal.isoformat() if tanggal else None,
        "harga_harapan_per_kg": harga,
    }


def _ringkas(d: dict) -> str:
    jumlah = f"{d['jumlah']:g} {d['satuan']}"
    if d["satuan"] in SATUAN_LOKAL:
        if d["jumlah_kg"] is not None:
            jumlah += f" (sekitar {fmt_kg(d['jumlah_kg'])}, 1 {d['satuan']} = {d['kg_per_satuan']:g} kg menurut Bapak/Ibu)"
        else:
            jumlah += " (berat kg belum diketahui, nanti dipastikan petugas)"
    elif d["satuan"] != "kg":
        jumlah += f" ({fmt_kg(d['jumlah_kg'])})"
    tgl = f", panen {d['tanggal_panen']}" if d["tanggal_panen"] else ""
    harga = f", harga harapan {fmt_rp(d['harga_harapan_per_kg'])}/kg" if d.get("harga_harapan_per_kg") else ""
    return f"{d['komoditas']} {jumlah}, desa {d['desa']}{tgl}{harga}"


def _isi_laporan(lap: LaporanPanen, d: dict) -> None:
    lap.komoditas, lap.jumlah, lap.satuan = d["komoditas"], d["jumlah"], d["satuan"]
    lap.kg_per_satuan = d["kg_per_satuan"]
    lap.jumlah_kg = lap.sisa_kg = d["jumlah_kg"]
    lap.desa, lap.lokasi_id = d["desa"], d["lokasi_id"]
    lap.tanggal_panen = date.fromisoformat(d["tanggal_panen"]) if d["tanggal_panen"] else None
    lap.harga_harapan_per_kg = d["harga_harapan_per_kg"]


def _prep_simpan(ctx: ToolContext, args: dict):
    d = _normalisasi_laporan(ctx, args)
    return f"Simpan laporan panen: {_ringkas(d)}", d


@tool(
    "simpan_laporan_panen",
    "Catat laporan panen baru. Butuh konfirmasi pengguna. Setelah tersimpan, laporan diperiksa petugas "
    "sebelum ditawarkan ke pembeli. Untuk satuan karung/pikul/ikat, tanyakan dulu kira-kira berapa kg per satuan; "
    "kalau petani tidak tahu, simpan tanpa kg_per_satuan.",
    obj(_PARAM_LAPORAN, ["komoditas", "jumlah", "satuan"]),
    PETANI,
    prepare=_prep_simpan,
)
def simpan_laporan_panen(ctx: ToolContext, d: dict):
    p = _petani(ctx)
    lap = LaporanPanen(petani_id=p.id, sumber="agent", status="menunggu_validasi")
    _isi_laporan(lap, d)
    if not p.desa:
        p.desa = d["desa"]
    ctx.db.add(lap)
    ctx.db.flush()
    return {"laporan_id": lap.id, "status": lap.status, "ringkasan": _ringkas(d), "catatan": "Menunggu pemeriksaan petugas."}


def _prep_ubah(ctx: ToolContext, args: dict):
    lap = _laporan_milik(ctx, args.get("laporan_id"))
    if lap.status not in ("menunggu_validasi", "tersedia", "perlu_review") or _ada_ikatan(ctx, lap):
        raise ToolError("Laporan ini sudah dipesan/diangkut sehingga tidak bisa diubah lewat chat.")
    d = _normalisasi_laporan(ctx, args, lama=lap)
    d["laporan_id"] = lap.id
    return f"Ubah laporan #{lap.id} menjadi: {_ringkas(d)} (akan diperiksa ulang petugas)", d


@tool(
    "ubah_laporan_panen",
    "Ubah laporan panen milik petani (koreksi jumlah, komoditas, desa, tanggal, harga). Butuh konfirmasi. "
    "Laporan yang diubah akan diperiksa ulang petugas.",
    obj({"laporan_id": {"type": "integer"}, **_PARAM_LAPORAN}, ["laporan_id"]),
    PETANI,
    prepare=_prep_ubah,
)
def ubah_laporan_panen(ctx: ToolContext, d: dict):
    lap = _laporan_milik(ctx, d["laporan_id"])
    if _ada_ikatan(ctx, lap):
        raise ToolError("Laporan ini baru saja dipesan, tidak bisa diubah lewat chat.")
    _isi_laporan(lap, d)
    lap.status = "menunggu_validasi"
    lap.divalidasi_oleh = lap.divalidasi_at = None
    return {"laporan_id": lap.id, "status": lap.status, "ringkasan": _ringkas(d)}


def _prep_batal(ctx: ToolContext, args: dict):
    lap = _laporan_milik(ctx, args.get("laporan_id"))
    if lap.status in ("dibatalkan", "ditolak", "selesai") or _ada_ikatan(ctx, lap):
        raise ToolError("Laporan ini sudah dipesan/diangkut atau sudah tidak aktif; pembatalan harus lewat petugas.")
    return f"Batalkan laporan #{lap.id} ({lap.komoditas} {lap.jumlah:g} {lap.satuan})", {"laporan_id": lap.id}


@tool(
    "batalkan_laporan",
    "Batalkan laporan panen yang belum dipesan. Butuh konfirmasi.",
    obj({"laporan_id": {"type": "integer"}}, ["laporan_id"]),
    PETANI,
    prepare=_prep_batal,
)
def batalkan_laporan(ctx: ToolContext, d: dict):
    lap = _laporan_milik(ctx, d["laporan_id"])
    lap.status = "dibatalkan"
    lap.sisa_kg = 0
    return {"laporan_id": lap.id, "status": lap.status}


@tool("lihat_laporan_saya", "Lihat 10 laporan panen terakhir milik petani beserta status validasi, pesanan, dan angkutan.", obj({}), PETANI)
def lihat_laporan_saya(ctx: ToolContext, args: dict):
    p = _petani(ctx)
    rows = ctx.db.scalars(
        select(LaporanPanen).where(LaporanPanen.petani_id == p.id).order_by(LaporanPanen.id.desc()).limit(10)
    ).all()
    hasil = []
    for r in rows:
        kirim = ctx.db.scalars(select(Pengiriman).where(Pengiriman.laporan_id == r.id)).all()
        hasil.append(
            {
                "laporan_id": r.id,
                "komoditas": r.komoditas,
                "jumlah": f"{r.jumlah:g} {r.satuan}",
                "jumlah_kg": r.jumlah_kg,
                "sisa_kg": r.sisa_kg,
                "desa": r.desa,
                "tanggal_panen": r.tanggal_panen.isoformat() if r.tanggal_panen else None,
                "status": r.status,
                "catatan_petugas": r.catatan_validasi,
                "pengiriman": [{"kode": k.kode, "status": k.status, "tujuan": k.tujuan} for k in kirim],
            }
        )
    return {"laporan": hasil}


def _pesanan_untuk_petani(ctx: ToolContext, pesanan_id) -> Pesanan:
    try:
        pid = int(pesanan_id)
    except (TypeError, ValueError):
        raise ToolError("pesanan_id harus angka.") from None
    pes = ctx.db.get(Pesanan, pid)
    if pes is None or pes.laporan.petani_id != _petani(ctx).id:
        raise ToolError(f"Permintaan #{pesanan_id} tidak ditemukan untuk petani ini.")
    if pes.status != "menunggu_petani":
        raise ToolError(f"Permintaan #{pes.id} sudah tidak menunggu jawaban (status {pes.status}).")
    return pes


@tool("lihat_permintaan_masuk", "Lihat permintaan pembelian dari distributor yang menunggu jawaban petani.", obj({}), PETANI)
def lihat_permintaan_masuk(ctx: ToolContext, args: dict):
    p = _petani(ctx)
    rows = ctx.db.scalars(
        select(Pesanan).join(LaporanPanen).where(LaporanPanen.petani_id == p.id, Pesanan.status == "menunggu_petani").order_by(Pesanan.id)
    ).all()
    return {
        "permintaan": [
            {
                "pesanan_id": r.id,
                "laporan_id": r.laporan_id,
                "komoditas": r.laporan.komoditas,
                "jumlah_kg": r.jumlah_kg,
                "harga_tawar_per_kg": r.harga_tawar_per_kg,
                "pembeli": r.distributor.nama_usaha or r.distributor.name,
                "tujuan": r.tujuan,
                "batas_jawab": r.kunci_sampai.isoformat() if r.kunci_sampai else None,
            }
            for r in rows
        ]
    }


def _prep_terima(ctx: ToolContext, args: dict):
    pes = _pesanan_untuk_petani(ctx, args.get("pesanan_id"))
    harga = f" dengan harga {fmt_rp(pes.harga_tawar_per_kg)}/kg" if pes.harga_tawar_per_kg else ""
    return (
        f"Terima permintaan #{pes.id}: {pes.laporan.komoditas} {fmt_kg(pes.jumlah_kg)} untuk "
        f"{pes.distributor.nama_usaha or pes.distributor.name}{harga}, dikirim ke {pes.tujuan}",
        {"pesanan_id": pes.id},
    )


@tool(
    "terima_pesanan",
    "Petani menerima permintaan pembelian. Butuh konfirmasi. Setelah diterima sistem mencarikan armada.",
    obj({"pesanan_id": {"type": "integer"}}, ["pesanan_id"]),
    PETANI,
    prepare=_prep_terima,
)
def terima_pesanan(ctx: ToolContext, d: dict):
    pes = _pesanan_untuk_petani(ctx, d["pesanan_id"])
    pes.status, pes.direspons_at = "menunggu_angkutan", datetime.now(timezone.utc)
    kirim = buat_pengiriman(ctx.db, pes.laporan, pes.jumlah_kg, pes.tujuan, pesanan=pes)
    ctx.notify(
        pes.distributor.phone,
        "distributor",
        f"Permintaan #{pes.id} ({pes.laporan.komoditas} {fmt_kg(pes.jumlah_kg)}) DITERIMA petani. "
        f"Order angkutan {kirim.kode} sedang dicarikan mitra logistik. Pembayaran diatur langsung antarpihak.",
    )
    pen = tawarkan_berikutnya(ctx.db, kirim, ctx.notify)
    return {"pesanan_id": pes.id, "kode_pengiriman": kirim.kode, "armada": "sedang ditawarkan" if pen else "ditangani petugas"}


def _prep_tolak(ctx: ToolContext, args: dict):
    pes = _pesanan_untuk_petani(ctx, args.get("pesanan_id"))
    return f"Tolak permintaan #{pes.id} ({pes.laporan.komoditas} {fmt_kg(pes.jumlah_kg)})", {
        "pesanan_id": pes.id,
        "alasan": (args.get("alasan") or "").strip() or None,
    }


@tool(
    "tolak_pesanan",
    "Petani menolak permintaan pembelian; volume kembali tersedia. Butuh konfirmasi.",
    obj({"pesanan_id": {"type": "integer"}, "alasan": {"type": "string"}}, ["pesanan_id"]),
    PETANI,
    prepare=_prep_tolak,
)
def tolak_pesanan(ctx: ToolContext, d: dict):
    pes = _pesanan_untuk_petani(ctx, d["pesanan_id"])
    lepas_kunci_pesanan(ctx.db, pes, "ditolak_petani")
    pes.alasan_tolak, pes.direspons_at = d.get("alasan"), datetime.now(timezone.utc)
    alasan = f" Alasan: {d['alasan']}." if d.get("alasan") else ""
    ctx.notify(pes.distributor.phone, "distributor", f"Permintaan #{pes.id} ({pes.laporan.komoditas} {fmt_kg(pes.jumlah_kg)}) ditolak petani.{alasan}")
    return {"pesanan_id": pes.id, "status": pes.status}


def _prep_angkut(ctx: ToolContext, args: dict):
    lap = _laporan_milik(ctx, args.get("laporan_id"))
    if lap.status != "tersedia" or not lap.sisa_kg:
        raise ToolError("Laporan ini belum tervalidasi atau tidak punya sisa stok yang bisa diangkut.")
    tujuan = (args.get("tujuan") or TUJUAN_DEFAULT).strip()
    return f"Minta angkutan untuk {lap.komoditas} {fmt_kg(lap.sisa_kg)} dari {lap.desa} ke {tujuan}", {"laporan_id": lap.id, "tujuan": tujuan}


@tool(
    "minta_angkutan",
    "Petani meminta mitra logistik mengangkut sendiri hasil panennya ke pasar (tanpa pembeli lewat sistem). Butuh konfirmasi.",
    obj({"laporan_id": {"type": "integer"}, "tujuan": {"type": "string", "description": "Default Pasar Panorama, Kota Bengkulu"}}, ["laporan_id"]),
    PETANI,
    prepare=_prep_angkut,
)
def minta_angkutan(ctx: ToolContext, d: dict):
    lap = _laporan_milik(ctx, d["laporan_id"])
    if lap.status != "tersedia" or not lap.sisa_kg:
        raise ToolError("Stok laporan ini sudah tidak tersedia.")
    jumlah = lap.sisa_kg
    lap.sisa_kg = 0
    lap.status = "diangkut"
    kirim = buat_pengiriman(ctx.db, lap, jumlah, d["tujuan"])
    pen = tawarkan_berikutnya(ctx.db, kirim, ctx.notify)
    return {"kode": kirim.kode, "jumlah_kg": kirim.jumlah_kg, "armada": "sedang ditawarkan" if pen else "ditangani petugas"}

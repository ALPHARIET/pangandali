"""Pencocokan muatan balik berbasis aturan/skor (proposal: bukan model AI terlatih).

1. Saring batasan wajib: perjalanan aktif mitra terverifikasi, kapasitas cukup, komoditas cocok
   dengan bak kendaraan, tanggal perjalanan masuk jendela jemput, tambahan jarak <= batas.
2. Urutkan kandidat layak: tambahan jarak (50%), tingkat isian (30%), keandalan mitra (20%).
3. Tawarkan ke satu kandidat per waktu. Rekomendasi belum menjadi penugasan sampai mitra setuju;
   penolakan/kedaluwarsa diteruskan ke kandidat berikutnya, lalu ke admin bila habis.
"""
from collections.abc import Callable
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .audit import catat
from .geo import tambahan_jarak
from .models import LaporanPanen, Penawaran, Pengiriman, Perjalanan, Pesanan, User, as_utc
from .operasional import Operasional, get_operasional

Notify = Callable[[str | None, str, str], None]  # (phone, role, text)


def fmt_kg(kg: float | None) -> str:
    """Format gaya Indonesia: 1.250 kg, 12,5 kg."""
    if kg is None:
        return "berat belum diketahui"
    s = f"{kg:,.1f}".rstrip("0").rstrip(".")
    return s.translate(str.maketrans(",.", ".,")) + " kg"


def fmt_rp(v: float) -> str:
    return "Rp" + f"{v:,.0f}".replace(",", ".")


def keandalan(db: Session, driver_id: int) -> float:
    """Rasio sukses dengan smoothing Laplace: (selesai+1)/(selesai+gagal+2). Mitra baru = 0,5."""
    selesai = db.scalar(select(func.count()).where(Pengiriman.driver_id == driver_id, Pengiriman.status == "selesai")) or 0
    gagal = db.scalar(
        select(func.count()).where(Penawaran.driver_id == driver_id, Penawaran.status.in_(("ditolak", "kedaluwarsa")))
    ) or 0
    batal = db.scalar(select(func.count()).where(Pengiriman.driver_id == driver_id, Pengiriman.status == "dibatalkan")) or 0
    return round((selesai + 1) / (selesai + gagal + batal + 2), 3)


def susun_kandidat(db: Session, kirim: Pengiriman, op: Operasional | None = None) -> tuple[list[dict], list[dict]]:
    """Kembalikan (kandidat_layak_terurut, kandidat_tersaring_beserta_alasan)."""
    op = op or get_operasional(db)
    komoditas = kirim.laporan.komoditas
    sudah = set(db.scalars(select(Penawaran.driver_id).where(Penawaran.pengiriman_id == kirim.id)).all())
    q = (
        select(Perjalanan)
        .join(User, User.id == Perjalanan.driver_id)
        .where(
            Perjalanan.status == "aktif",
            User.is_active.is_(True),
            User.verification_status == "disetujui",
            User.phone.is_not(None),
        )
    )
    layak, tersaring = [], []
    for perj in db.scalars(q):
        drv = perj.driver
        alasan = None
        if drv.id in sudah:
            alasan = "sudah pernah ditawari order ini"
        elif perj.kapasitas_tersedia_kg < kirim.jumlah_kg:
            alasan = f"kapasitas tersisa {fmt_kg(perj.kapasitas_tersedia_kg)} kurang dari {fmt_kg(kirim.jumlah_kg)}"
        elif drv.komoditas_cocok and komoditas not in drv.komoditas_cocok:
            alasan = f"kendaraan tidak untuk {komoditas}"
        elif kirim.jemput_mulai and perj.tanggal < kirim.jemput_mulai:
            alasan = "jadwal perjalanan sebelum panen siap"
        elif kirim.jemput_sampai and perj.tanggal > kirim.jemput_sampai:
            alasan = "jadwal perjalanan lewat batas kesegaran/jemput"
        dev = tambahan_jarak(db, perj.asal, kirim.jemput_lokasi, kirim.tujuan_lokasi, perj.tujuan)
        if alasan is None and dev["km_deviasi"] is not None and dev["km_deviasi"] > op.maks_deviasi_km:
            alasan = f"tambahan jarak {dev['km_deviasi']:g} km melebihi batas {op.maks_deviasi_km:g} km"
        if alasan:
            tersaring.append({"driver_id": drv.id, "perjalanan_id": perj.id, "alasan": alasan})
            continue
        isian = min(1.0, kirim.jumlah_kg / perj.kapasitas_tersedia_kg)
        andal = keandalan(db, drv.id)
        if dev["km_deviasi"] is None:
            s_jarak = 0.3  # jarak belum diisi: tetap kandidat, tetapi diberi skor rendah dan ditandai
        else:
            s_jarak = 1 - min(dev["km_deviasi"] / op.maks_deviasi_km, 1.0) if op.maks_deviasi_km else 1.0
        skor = round(100 * (0.5 * s_jarak + 0.3 * isian + 0.2 * andal), 1)
        layak.append(
            {
                "driver": drv,
                "perjalanan": perj,
                "skor": skor,
                "detail": {
                    "km_deviasi": dev["km_deviasi"],
                    "km_rute": dev["km_rute"],
                    "km_langsung": dev["km_langsung"],
                    "jarak_belum_diisi": dev["jarak_belum_diisi"],
                    "tingkat_isian": round(isian, 3),
                    "keandalan": andal,
                },
            }
        )
    layak.sort(key=lambda k: (-k["skor"], k["perjalanan"].id))
    return layak, tersaring


def penawaran_aktif(db: Session, kirim: Pengiriman) -> Penawaran | None:
    return db.scalar(select(Penawaran).where(Penawaran.pengiriman_id == kirim.id, Penawaran.status == "ditawarkan"))


def tawarkan_berikutnya(db: Session, kirim: Pengiriman, notify: Notify, op: Operasional | None = None) -> Penawaran | None:
    if kirim.status not in ("menunggu_driver", "perlu_admin"):
        return None
    aktif = penawaran_aktif(db, kirim)
    if aktif:
        return aktif
    op = op or get_operasional(db)
    layak, tersaring = susun_kandidat(db, kirim, op)
    if not layak:
        if kirim.status != "perlu_admin":
            kirim.status = "perlu_admin"
            catat(db, "sistem", "pengiriman_perlu_admin", "pengiriman", kirim.id, {"tersaring": tersaring})
            teks = (
                f"Order angkutan {kirim.kode} ({kirim.laporan.komoditas} {fmt_kg(kirim.jumlah_kg)}) belum menemukan "
                "armada yang cocok. Petugas PanganDali akan membantu mencarikan."
            )
            notify(kirim.laporan.petani.phone, "petani", teks)
            if kirim.pesanan:
                notify(kirim.pesanan.distributor.phone, "distributor", teks)
        return None
    k = layak[0]
    urutan = (db.scalar(select(func.count()).where(Penawaran.pengiriman_id == kirim.id)) or 0) + 1
    pen = Penawaran(
        pengiriman_id=kirim.id,
        driver_id=k["driver"].id,
        perjalanan_id=k["perjalanan"].id,
        urutan=urutan,
        skor=k["skor"],
        detail=k["detail"],
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=op.batas_respon_driver_menit),
    )
    db.add(pen)
    kirim.status = "menunggu_driver"
    db.flush()
    catat(db, "sistem", "penawaran_dibuat", "penawaran", pen.id, {"kode": kirim.kode, "driver_id": k["driver"].id, "skor": k["skor"]})
    dev = k["detail"]["km_deviasi"]
    jarak = f"tambahan jalan sekitar {dev:g} km" if dev is not None else "tambahan jarak belum tercatat"
    notify(
        k["driver"].phone,
        "driver",
        f"Ada rekomendasi muatan balik untuk perjalanan Bapak tanggal {k['perjalanan'].tanggal.isoformat()}: "
        f"order {kirim.kode}, {kirim.laporan.komoditas} {fmt_kg(kirim.jumlah_kg)}, jemput di {kirim.asal}, "
        f"antar ke {kirim.tujuan}, {jarak}. Mau diambil? Penawaran berlaku {op.batas_respon_driver_menit:g} menit.",
    )
    return pen


def terima_penawaran(db: Session, pen: Penawaran, notify: Notify) -> Pengiriman:
    kirim = pen.pengiriman
    perj = pen.perjalanan
    pen.status, pen.responded_at = "diterima", datetime.now(timezone.utc)
    kirim.driver_id = pen.driver_id
    kirim.perjalanan_id = pen.perjalanan_id
    kirim.status = "diambil"
    drv = pen.driver
    kirim.jenis_kendaraan = drv.jenis_kendaraan
    kirim.kapasitas_kg = perj.kapasitas_tersedia_kg if perj else drv.kapasitas_kg
    if pen.detail:
        kirim.km_rute = pen.detail.get("km_rute")
        kirim.km_deviasi = pen.detail.get("km_deviasi")
    if perj:
        perj.kapasitas_tersedia_kg = round(perj.kapasitas_tersedia_kg - kirim.jumlah_kg, 2)
    catat(db, f"driver:{drv.id}", "penawaran_diterima", "pengiriman", kirim.id, {"kode": kirim.kode, "penawaran_id": pen.id})
    kabari_pihak(kirim, notify, f"Order {kirim.kode} ({kirim.laporan.komoditas} {fmt_kg(kirim.jumlah_kg)}) sudah disetujui mitra logistik {drv.name}"
                 + (f", plat {drv.plat_nomor}" if drv.plat_nomor else "") + ".")
    return kirim


def tolak_penawaran(db: Session, pen: Penawaran, alasan: str | None, notify: Notify) -> Penawaran | None:
    pen.status, pen.responded_at, pen.alasan = "ditolak", datetime.now(timezone.utc), (alasan or None)
    catat(db, f"driver:{pen.driver_id}", "penawaran_ditolak", "penawaran", pen.id, {"alasan": alasan})
    return tawarkan_berikutnya(db, pen.pengiriman, notify)


def kabari_pihak(kirim: Pengiriman, notify: Notify, teks: str) -> None:
    notify(kirim.laporan.petani.phone, "petani", teks)
    if kirim.pesanan:
        notify(kirim.pesanan.distributor.phone, "distributor", teks)


def lepas_kunci_pesanan(db: Session, pesanan: Pesanan, status: str) -> None:
    """Kembalikan volume yang dikunci ke stok (pesanan ditolak/kedaluwarsa/dibatalkan)."""
    lap: LaporanPanen = pesanan.laporan
    pesanan.status = status
    lap.sisa_kg = round((lap.sisa_kg or 0) + pesanan.jumlah_kg, 2)
    if lap.status == "dipesan" and lap.sisa_kg > 0:
        lap.status = "tersedia"


def proses_kedaluwarsa(db: Session, notify: Notify, now: datetime | None = None) -> dict:
    now = now or datetime.now(timezone.utc)
    hasil = {"penawaran": 0, "pesanan": 0}
    for pen in db.scalars(select(Penawaran).where(Penawaran.status == "ditawarkan")).all():
        if pen.expires_at and as_utc(pen.expires_at) <= now:
            pen.status = "kedaluwarsa"
            catat(db, "sistem", "penawaran_kedaluwarsa", "penawaran", pen.id)
            notify(pen.driver.phone, "driver", f"Penawaran order {pen.pengiriman.kode} sudah lewat batas waktu dan diteruskan ke mitra lain.")
            tawarkan_berikutnya(db, pen.pengiriman, notify)
            hasil["penawaran"] += 1
    for p in db.scalars(select(Pesanan).where(Pesanan.status == "menunggu_petani")).all():
        if p.kunci_sampai and as_utc(p.kunci_sampai) <= now:
            lepas_kunci_pesanan(db, p, "kedaluwarsa")
            catat(db, "sistem", "pesanan_kedaluwarsa", "pesanan", p.id)
            notify(
                p.distributor.phone,
                "distributor",
                f"Permintaan #{p.id} ({p.laporan.komoditas} {fmt_kg(p.jumlah_kg)}) belum dijawab petani sampai batas waktu, "
                "jadi kuncinya dilepas. Silakan cek stok lain.",
            )
            hasil["pesanan"] += 1
    return hasil


TUJUAN_DEFAULT = "Pasar Panorama, Kota Bengkulu"


def kode_baru(db: Session, prefix: str = "TRK") -> str:
    from .models import Counter

    row = db.get(Counter, prefix)
    if row is None:
        row = Counter(name=prefix, value=1000)
        db.add(row)
    row.value += 1
    db.flush()
    return f"{prefix}-{row.value}"


def buat_pengiriman(db: Session, lap: LaporanPanen, jumlah_kg: float, tujuan: str, pesanan: Pesanan | None = None) -> Pengiriman:
    from .geo import cari_lokasi
    from .normalize import hari_ini

    op = get_operasional(db)
    mulai = max(hari_ini(), lap.tanggal_panen or hari_ini())
    kirim = Pengiriman(
        kode=kode_baru(db),
        laporan_id=lap.id,
        pesanan_id=pesanan.id if pesanan else None,
        asal=f"{lap.desa or '-'}, Kec. {lap.petani.kecamatan or 'Selupu Rejang'}",
        tujuan=tujuan,
        jemput_lokasi_id=lap.lokasi_id,
        tujuan_lokasi_id=(pesanan.tujuan_lokasi_id if pesanan and pesanan.tujuan_lokasi_id else None)
        or getattr(cari_lokasi(db, tujuan), "id", None),
        jemput_mulai=mulai,
        jemput_sampai=mulai + timedelta(days=op.batas_jemput_hari),
        jumlah_kg=jumlah_kg,
    )
    db.add(kirim)
    db.flush()
    return kirim

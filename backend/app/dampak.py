"""Pengukuran dampak distribusi (proposal Inovatera: Dampak Inovasi & Lampiran 1 butir 5).

Prinsip: angka hanya dihitung dari data tercatat. Data yang kurang ditandai, bukan diisi tebakan.
Emisi TIDAK dihitung sampai jenis BBM, faktor emisi, dan batas perhitungan ditetapkan.

Definisi:
- Berat tiba = berat diterima (lolos mutu) + berat ditolak mutu, semuanya berat bersih tanpa kemasan.
- Susut distribusi = berat muat − berat tiba pada kiriman yang sama. Penolakan mutu dilaporkan terpisah.
- Skenario pembanding (tanpa pencocokan): mitra tetap menempuh perjalanannya langsung (asal → tujuan),
  dan kiriman diangkut perjalanan khusus jemput → antar (pulang-pergi bila diatur demikian).
- BBM bersih dihemat = BBM skenario pembanding − BBM aktual. Asumsi: kendaraan khusus memakai rasio
  km/liter yang sama dengan kendaraan mitra.
"""
from datetime import date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from .geo import jarak_km
from .models import Pengiriman, Perjalanan, as_utc
from .normalize import hari_ini
from .operasional import Operasional, get_operasional


def _jam(a: datetime | None, b: datetime | None) -> float | None:
    if a is None or b is None:
        return None
    return round((as_utc(b) - as_utc(a)).total_seconds() / 3600, 2)


def metrik_pengiriman(db: Session, k: Pengiriman, op: Operasional | None = None) -> dict:
    op = op or get_operasional(db)
    kurang: list[str] = []
    for field, label in (
        ("berat_muat_kg", "berat muat"),
        ("berat_terima_kg", "berat terima"),
        ("waktu_muat", "waktu muat"),
        ("waktu_terima", "waktu terima"),
        ("km_aktual", "km aktual"),
        ("bbm_liter", "BBM aktual"),
    ):
        if getattr(k, field) is None:
            kurang.append(label)

    susut_kg = susut_persen = None
    if k.berat_muat_kg and k.berat_terima_kg is not None:
        susut_kg = round(k.berat_muat_kg - (k.berat_terima_kg + (k.berat_ditolak_kg or 0)), 2)
        susut_persen = round(100 * susut_kg / k.berat_muat_kg, 2)

    perj: Perjalanan | None = k.perjalanan
    km_langsung = jarak_km(db, perj.asal_lokasi_id, perj.tujuan_lokasi_id) if perj else None
    km_khusus = jarak_km(db, k.jemput_lokasi_id, k.tujuan_lokasi_id)
    km_pembanding = None
    if km_langsung is not None and km_khusus is not None:
        km_pembanding = round(km_langsung + km_khusus * (2 if op.pembanding_pulang_pergi else 1), 1)
    elif perj is None:
        kurang.append("perjalanan mitra (pembanding)")
    else:
        kurang.append("jarak di tabel (pembanding)")

    km_aktual = k.km_aktual if k.km_aktual is not None else k.km_rute
    km_aktual_sumber = "odometer mitra" if k.km_aktual is not None else ("tabel jarak (rencana)" if k.km_rute is not None else None)

    kpl = k.driver.km_per_liter if k.driver else None
    if k.bbm_liter is not None:
        bbm_aktual, bbm_sumber = k.bbm_liter, "dilaporkan mitra"
    elif km_aktual is not None and kpl:
        bbm_aktual, bbm_sumber = round(km_aktual / kpl, 2), "estimasi dari km/liter"
    else:
        bbm_aktual, bbm_sumber = None, None
    bbm_pembanding = round(km_pembanding / kpl, 2) if km_pembanding is not None and kpl else None
    if kpl is None:
        kurang.append("rasio km/liter kendaraan")
    bbm_hemat = round(bbm_pembanding - bbm_aktual, 2) if bbm_pembanding is not None and bbm_aktual is not None else None

    return {
        "kode": k.kode,
        "status": k.status,
        "komoditas": k.laporan.komoditas,
        "jumlah_kg": k.jumlah_kg,
        "jenis_kendaraan": k.jenis_kendaraan,
        "kapasitas_kg": k.kapasitas_kg,
        "berat_muat_kg": k.berat_muat_kg,
        "berat_terima_kg": k.berat_terima_kg,
        "berat_ditolak_kg": k.berat_ditolak_kg,
        "alasan_tolak_mutu": k.alasan_tolak_mutu,
        "susut_kg": susut_kg,
        "susut_persen": susut_persen,
        "waktu_tunggu_jam": _jam(k.created_at, k.waktu_muat),
        "waktu_distribusi_jam": _jam(k.waktu_muat, k.waktu_terima),
        "km_rute": k.km_rute,
        "km_deviasi": k.km_deviasi,
        "km_aktual": km_aktual,
        "km_aktual_sumber": km_aktual_sumber,
        "km_pembanding": km_pembanding,
        "km_hemat": round(km_pembanding - km_aktual, 1) if km_pembanding is not None and km_aktual is not None else None,
        "bbm_aktual_liter": bbm_aktual,
        "bbm_aktual_sumber": bbm_sumber,
        "bbm_pembanding_liter": bbm_pembanding,
        "bbm_hemat_liter": bbm_hemat,
        "is_muatan_balik": bool(perj and perj.is_balik),
        "data_belum_lengkap": kurang,
    }


def ringkasan(db: Session, dari: date | None = None, sampai: date | None = None) -> dict:
    op = get_operasional(db)
    sampai = sampai or hari_ini()
    dari = dari or (sampai - timedelta(days=90))
    q = select(Pengiriman).where(Pengiriman.driver_id.is_not(None)).order_by(Pengiriman.id.desc())
    kirim = [k for k in db.scalars(q) if dari <= as_utc(k.created_at).date() <= sampai]
    rows = [metrik_pengiriman(db, k, op) for k in kirim]
    selesai = [r for r in rows if r["status"] == "selesai"]

    def _jumlah(key, data):
        vals = [r[key] for r in data if r[key] is not None]
        return (round(sum(vals), 2), len(vals)) if vals else (None, 0)

    def _rata(key, data):
        vals = [r[key] for r in data if r[key] is not None]
        return (round(sum(vals) / len(vals), 2), len(vals)) if vals else (None, 0)

    lengkap_susut = [r for r in selesai if r["susut_kg"] is not None]
    total_muat = sum(r["berat_muat_kg"] for r in lengkap_susut)
    total_susut = sum(r["susut_kg"] for r in lengkap_susut)
    bbm_hemat, n_bbm = _jumlah("bbm_hemat_liter", selesai)
    km_hemat, n_km = _jumlah("km_hemat", selesai)
    tunggu, n_tunggu = _rata("waktu_tunggu_jam", selesai)
    distribusi, n_dist = _rata("waktu_distribusi_jam", selesai)
    ditolak, n_tolak = _jumlah("berat_ditolak_kg", selesai)

    perj = [
        p
        for p in db.scalars(select(Perjalanan).where(Perjalanan.is_balik.is_(True), Perjalanan.status != "dibatalkan"))
        # Perjalanan dihitung bila sudah selesai, atau tanggalnya sudah lewat (tidak menunggu lagi).
        if dari <= p.tanggal and (p.status == "selesai" or p.tanggal < min(sampai, hari_ini()))
    ]
    berisi = 0
    for p in perj:
        if db.scalar(select(Pengiriman.id).where(Pengiriman.perjalanan_id == p.id, Pengiriman.status != "dibatalkan")):
            berisi += 1

    return {
        "periode": {"dari": dari.isoformat(), "sampai": sampai.isoformat()},
        "pengiriman": {"tercatat": len(rows), "selesai": len(selesai), "dalam_proses": len(rows) - len(selesai)},
        "utilisasi_muatan_balik": {
            "perjalanan_balik": len(perj),
            "berisi_muatan": berisi,
            "persen": round(100 * berisi / len(perj), 1) if perj else None,
            "target_pilot_persen": 60,
            "catatan": "Dihitung dari perjalanan balik yang diumumkan mitra lewat sistem; bandingkan dengan baseline armada peserta.",
        },
        "susut": {
            "persen": round(100 * total_susut / total_muat, 2) if total_muat else None,
            "total_kg": round(total_susut, 2) if lengkap_susut else None,
            "n_data": len(lengkap_susut),
            "ditolak_mutu_kg": ditolak,
            "n_ditolak": n_tolak,
        },
        "waktu": {"rata_tunggu_jam": tunggu, "n_tunggu": n_tunggu, "rata_distribusi_jam": distribusi, "n_distribusi": n_dist},
        "bbm": {
            "hemat_bersih_liter": bbm_hemat,
            "n_data": n_bbm,
            "km_hemat": km_hemat,
            "n_km": n_km,
            "asumsi": "Pembanding: perjalanan mitra langsung + angkutan khusus jemput→antar"
            + (" pulang-pergi" if op.pembanding_pulang_pergi else " sekali jalan")
            + "; rasio km/liter sama dengan kendaraan mitra.",
        },
        "emisi": {"status": "belum_dihitung", "alasan": "Jenis BBM, faktor emisi, dan batas perhitungan belum ditetapkan."},
        "data_belum_lengkap": sum(1 for r in selesai if r["data_belum_lengkap"]),
        "rincian": rows,
    }

"""Ringkasan pasokan, transaksi, distribusi, dan peringatan berbasis ambang untuk dashboard Admin/TPID.

Peringatan bersifat aturan sederhana dengan ambang yang bisa diatur Admin, bukan prediksi.
Proyeksi 7–14 hari baru dikembangkan setelah data memadai (proposal).
"""
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .dampak import metrik_pengiriman
from .models import Harga, LaporanPanen, Pengiriman, Pesanan, as_utc
from .normalize import KOMODITAS, hari_ini
from .operasional import get_operasional


def ringkasan_pasokan(db: Session) -> dict:
    op = get_operasional(db)
    today = hari_ini()
    now = datetime.now(timezone.utc)

    stok = {k: 0.0 for k in KOMODITAS}
    for kom, total in db.execute(
        select(LaporanPanen.komoditas, func.sum(LaporanPanen.sisa_kg)).where(LaporanPanen.status == "tersedia").group_by(LaporanPanen.komoditas)
    ):
        stok[kom] = round(total or 0, 2)

    # Laporan masuk 14 hari terakhir per tanggal & komoditas (kg yang diketahui)
    seri: dict[str, dict[str, float]] = defaultdict(lambda: {k: 0.0 for k in KOMODITAS})
    batas = today - timedelta(days=13)
    for lap in db.scalars(select(LaporanPanen).where(LaporanPanen.status.not_in(("dibatalkan", "ditolak")))):
        tgl = as_utc(lap.created_at).date()
        if tgl >= batas:
            seri[tgl.isoformat()][lap.komoditas] += lap.jumlah_kg or 0
    tren = [{"tanggal": (batas + timedelta(days=i)).isoformat(), **seri[(batas + timedelta(days=i)).isoformat()]} for i in range(14)]

    def hitung(model, kolom):
        return {s: n for s, n in db.execute(select(kolom, func.count()).group_by(kolom))}

    status_laporan = hitung(LaporanPanen, LaporanPanen.status)
    status_pesanan = hitung(Pesanan, Pesanan.status)
    status_kirim = hitung(Pengiriman, Pengiriman.status)

    # Harga: terbaru vs rata-rata 7 hari sebelumnya, per komoditas (semua pasar digabung)
    harga = []
    for kom in KOMODITAS:
        rows = db.scalars(select(Harga).where(Harga.komoditas == kom).order_by(Harga.tanggal.desc()).limit(60)).all()
        if not rows:
            continue
        terbaru = rows[0]
        sebelum = [r.harga_per_kg for r in rows if terbaru.tanggal - timedelta(days=7) <= r.tanggal < terbaru.tanggal]
        rata = sum(sebelum) / len(sebelum) if sebelum else None
        harga.append(
            {
                "komoditas": kom,
                "terbaru": terbaru.harga_per_kg,
                "tanggal": terbaru.tanggal.isoformat(),
                "pasar": terbaru.pasar,
                "sumber": terbaru.sumber,
                "rata_7_hari_sebelumnya": round(rata, 0) if rata else None,
                "perubahan_persen": round(100 * (terbaru.harga_per_kg - rata) / rata, 1) if rata else None,
            }
        )

    peringatan = []
    for h in harga:
        if h["perubahan_persen"] is not None and h["perubahan_persen"] >= op.ambang_kenaikan_harga_persen:
            peringatan.append(
                {
                    "level": "tinggi",
                    "jenis": "harga_naik",
                    "komoditas": h["komoditas"],
                    "pesan": f"Harga {h['komoditas']} naik {h['perubahan_persen']}% dibanding rata-rata 7 hari sebelumnya "
                    f"(ambang {op.ambang_kenaikan_harga_persen:g}%).",
                }
            )
    ada_laporan = {lap.komoditas for lap in db.scalars(select(LaporanPanen).where(LaporanPanen.created_at >= now - timedelta(days=30)))}
    for kom in KOMODITAS:
        if kom in ada_laporan and stok[kom] < op.ambang_stok_rendah_kg:
            peringatan.append(
                {
                    "level": "sedang",
                    "jenis": "stok_rendah",
                    "komoditas": kom,
                    "pesan": f"Stok tervalidasi {kom} tercatat {stok[kom]:g} kg, di bawah ambang {op.ambang_stok_rendah_kg:g} kg. "
                    "Angka hanya mencakup petani yang melapor lewat PanganDali.",
                }
            )
    tertunda = [
        lap
        for lap in db.scalars(select(LaporanPanen).where(LaporanPanen.status.in_(("menunggu_validasi", "perlu_review"))))
        if now - as_utc(lap.created_at) > timedelta(hours=op.ambang_validasi_tertunda_jam)
    ]
    if tertunda:
        peringatan.append(
            {
                "level": "sedang",
                "jenis": "validasi_tertunda",
                "pesan": f"{len(tertunda)} laporan panen menunggu validasi lebih dari {op.ambang_validasi_tertunda_jam:g} jam.",
            }
        )
    perlu_admin = status_kirim.get("perlu_admin", 0)
    if perlu_admin:
        peringatan.append(
            {"level": "tinggi", "jenis": "armada_tidak_ada", "pesan": f"{perlu_admin} order angkutan belum mendapat armada dan perlu ditangani petugas."}
        )
    selesai_tidak_lengkap = sum(
        1 for k in db.scalars(select(Pengiriman).where(Pengiriman.status == "selesai")) if metrik_pengiriman(db, k, op)["data_belum_lengkap"]
    )
    if selesai_tidak_lengkap:
        peringatan.append(
            {
                "level": "rendah",
                "jenis": "data_dampak_kurang",
                "pesan": f"{selesai_tidak_lengkap} pengiriman selesai belum lengkap data pengukurannya (berat/km/BBM).",
            }
        )

    return {
        "tanggal": today.isoformat(),
        "stok_tersedia_kg": stok,
        "tren_laporan_kg": tren,
        "status_laporan": status_laporan,
        "status_pesanan": status_pesanan,
        "status_pengiriman": status_kirim,
        "harga": harga,
        "peringatan": peringatan,
        "catatan": "Peringatan berbasis ambang yang dapat diatur Admin; bukan prediksi dan tidak menggantikan survei harga resmi.",
    }

"""Aturan operasional (ambang & batas waktu), dibaca dari backend/.env.

Nilai default di config.py adalah titik awal untuk uji coba, BUKAN hasil kesepakatan mitra.
Proposal mensyaratkan ambang disepakati dengan pengelola; ubah di .env lalu jalankan ulang API.
"""
from dataclasses import dataclass, fields

from sqlalchemy.orm import Session

from .config import get_settings


@dataclass
class Operasional:
    # Jendela jemput: dari tanggal panen sampai N hari sesudahnya.
    batas_jemput_hari: int
    # Kandidat armada dengan tambahan jarak di atas ini tidak direkomendasikan.
    maks_deviasi_km: float
    # Kunci volume pesanan menunggu jawaban petani.
    batas_respon_petani_jam: float
    # Lama penawaran ke satu kandidat armada sebelum diteruskan ke kandidat berikutnya.
    batas_respon_driver_menit: float
    # Skenario pembanding BBM: tanpa pencocokan, kiriman diangkut perjalanan khusus pulang-pergi.
    pembanding_pulang_pergi: bool
    # Peringatan dashboard
    ambang_stok_rendah_kg: float
    ambang_kenaikan_harga_persen: float
    ambang_validasi_tertunda_jam: float
    # Antrean kirim ulang WA
    maks_kirim_ulang: int


def get_operasional(db: Session | None = None) -> Operasional:  # noqa: ARG001 - db dipertahankan agar pemanggil tidak berubah
    s = get_settings()
    return Operasional(**{f.name: getattr(s, f.name) for f in fields(Operasional)})

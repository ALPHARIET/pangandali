"""Model database PanganDali.

Status dan peran disimpan sebagai string (bukan enum DB) supaya migrasi mudah;
nilai yang sah didefinisikan di konstanta di bawah dan divalidasi di lapisan tools/router.

Alur sesuai proposal Inovatera:
laporan (konfirmasi petani) → validasi admin → stok tersedia → pesanan distributor
(volume dikunci, petani terima/tolak) → penawaran ke kandidat armada berurutan
(baru jadi penugasan setelah mitra setuju) → pemantauan + pengukuran dampak.
"""
from datetime import date, datetime, timezone

from sqlalchemy import JSON, Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base

ROLES = ("admin", "tpid", "driver", "distributor")
VERIFIKASI = ("belum", "menunggu", "disetujui", "ditolak")
STATUS_LAPORAN = ("menunggu_validasi", "perlu_review", "tersedia", "dipesan", "diangkut", "selesai", "dibatalkan", "ditolak")
STATUS_PESANAN = (
    "menunggu_petani",
    "ditolak_petani",
    "kedaluwarsa",
    "menunggu_angkutan",
    "dalam_pengiriman",
    "selesai",
    "dibatalkan",
)
STATUS_PENGIRIMAN = (
    "menunggu_driver",
    "perlu_admin",  # tidak ada kandidat armada / semua menolak
    "diambil",
    "menuju_jemput",
    "sampai_jemput",
    "dimuat",
    "dalam_perjalanan",
    "selesai",
    "dibatalkan",
)
STATUS_PERJALANAN = ("aktif", "selesai", "dibatalkan")
STATUS_PENAWARAN = ("ditawarkan", "diterima", "ditolak", "kedaluwarsa", "dibatalkan")


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def as_utc(dt: datetime | None) -> datetime | None:
    """SQLite mengembalikan datetime tanpa zona; anggap UTC."""
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class User(Base):
    """Akun dashboard: Admin, TPID, Mitra Logistik (driver), Distributor."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(120))
    role: Mapped[str] = mapped_column(String(20), index=True)
    phone: Mapped[str | None] = mapped_column(String(20), unique=True, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    verification_status: Mapped[str] = mapped_column(String(20), default="belum")
    # Profil mitra logistik
    kapasitas_kg: Mapped[float | None] = mapped_column(Float)
    plat_nomor: Mapped[str | None] = mapped_column(String(20))
    lokasi: Mapped[str | None] = mapped_column(String(120))  # posisi/pangkalan saat ini (teks bebas)
    jenis_kendaraan: Mapped[str | None] = mapped_column(String(60))
    km_per_liter: Mapped[float | None] = mapped_column(Float)  # rasio konsumsi BBM kendaraan, diisi mitra
    # None = semua komoditas boleh; selain itu daftar komoditas yang cocok untuk bak kendaraan
    komoditas_cocok: Mapped[list | None] = mapped_column(JSON)
    # Profil distributor
    nama_usaha: Mapped[str | None] = mapped_column(String(160))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Lokasi(Base):
    """Titik yang dipakai untuk jarak: desa, kota, pasar, pangkalan armada."""

    __tablename__ = "lokasi"

    id: Mapped[int] = mapped_column(primary_key=True)
    nama: Mapped[str] = mapped_column(String(120), unique=True)
    jenis: Mapped[str] = mapped_column(String(20), default="desa")  # desa | kota | pasar | pangkalan
    kecamatan: Mapped[str | None] = mapped_column(String(120))
    alias: Mapped[list | None] = mapped_column(JSON)  # ejaan lain untuk pencocokan teks


class Jarak(Base):
    """Jarak jalan antar-lokasi (km), diisi admin. Berlaku dua arah."""

    __tablename__ = "jarak"
    __table_args__ = (UniqueConstraint("asal_id", "tujuan_id", name="uq_jarak_pasangan"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    asal_id: Mapped[int] = mapped_column(ForeignKey("lokasi.id", ondelete="CASCADE"))
    tujuan_id: Mapped[int] = mapped_column(ForeignKey("lokasi.id", ondelete="CASCADE"))
    km: Mapped[float] = mapped_column(Float)
    sumber: Mapped[str | None] = mapped_column(String(160))  # mis. "odometer mitra", "Google Maps 2026-10"


class Petani(Base):
    """Petani hanya lewat WhatsApp: tanpa password, identitas dari nomor WA.

    Sesuai proposal, petani harus didaftarkan dulu (oleh admin/PPL/kelompok tani).
    """

    __tablename__ = "petani"

    id: Mapped[int] = mapped_column(primary_key=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    name: Mapped[str | None] = mapped_column(String(120))
    desa: Mapped[str | None] = mapped_column(String(120))
    kecamatan: Mapped[str | None] = mapped_column(String(120), default="Selupu Rejang")
    kelompok_tani: Mapped[str | None] = mapped_column(String(120))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    didaftarkan_oleh: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    # UU PDP: persetujuan pemrosesan data. Agent tidak dijalankan sebelum consent_at terisi.
    consent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    laporan: Mapped[list["LaporanPanen"]] = relationship(back_populates="petani")


class LaporanPanen(Base):
    __tablename__ = "laporan_panen"

    id: Mapped[int] = mapped_column(primary_key=True)
    petani_id: Mapped[int] = mapped_column(ForeignKey("petani.id"), index=True)
    komoditas: Mapped[str] = mapped_column(String(40), index=True)
    jumlah: Mapped[float] = mapped_column(Float)
    satuan: Mapped[str] = mapped_column(String(20))
    # Satuan lokal hanya dikonversi bila petani menyebut beratnya (proposal: tanpa kesepakatan tidak dikonversi).
    kg_per_satuan: Mapped[float | None] = mapped_column(Float)
    jumlah_kg: Mapped[float | None] = mapped_column(Float)
    sisa_kg: Mapped[float | None] = mapped_column(Float)  # belum dikunci/dipesan distributor
    harga_harapan_per_kg: Mapped[float | None] = mapped_column(Float)
    desa: Mapped[str | None] = mapped_column(String(120))
    lokasi_id: Mapped[int | None] = mapped_column(ForeignKey("lokasi.id"))
    tanggal_panen: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(20), default="menunggu_validasi", index=True)
    sumber: Mapped[str] = mapped_column(String(20), default="agent")  # agent | fallback | admin
    teks_asli: Mapped[str | None] = mapped_column(Text)
    divalidasi_oleh: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    divalidasi_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    catatan_validasi: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    petani: Mapped[Petani] = relationship(back_populates="laporan")
    lokasi: Mapped[Lokasi | None] = relationship()


class Pesanan(Base):
    """Permintaan distributor atas stok. Volume dikunci sampai petani menjawab atau kunci habis."""

    __tablename__ = "pesanan"

    id: Mapped[int] = mapped_column(primary_key=True)
    distributor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    laporan_id: Mapped[int] = mapped_column(ForeignKey("laporan_panen.id"), index=True)
    jumlah_kg: Mapped[float] = mapped_column(Float)
    harga_tawar_per_kg: Mapped[float | None] = mapped_column(Float)
    tujuan: Mapped[str] = mapped_column(String(160), default="Pasar Panorama, Kota Bengkulu")
    tujuan_lokasi_id: Mapped[int | None] = mapped_column(ForeignKey("lokasi.id"))
    status: Mapped[str] = mapped_column(String(30), default="menunggu_petani", index=True)
    kunci_sampai: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    alasan_tolak: Mapped[str | None] = mapped_column(Text)
    direspons_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    distributor: Mapped[User] = relationship()
    laporan: Mapped[LaporanPanen] = relationship()


class Perjalanan(Base):
    """Perjalanan yang diumumkan mitra logistik (biasanya perjalanan pulang yang kosong)."""

    __tablename__ = "perjalanan"

    id: Mapped[int] = mapped_column(primary_key=True)
    driver_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    asal_lokasi_id: Mapped[int] = mapped_column(ForeignKey("lokasi.id"))
    tujuan_lokasi_id: Mapped[int] = mapped_column(ForeignKey("lokasi.id"))
    tanggal: Mapped[date] = mapped_column(Date, index=True)
    kapasitas_tersedia_kg: Mapped[float] = mapped_column(Float)
    is_balik: Mapped[bool] = mapped_column(Boolean, default=True)  # perjalanan balik yang berpotensi kosong
    status: Mapped[str] = mapped_column(String(20), default="aktif", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    driver: Mapped[User] = relationship()
    asal: Mapped[Lokasi] = relationship(foreign_keys=[asal_lokasi_id])
    tujuan: Mapped[Lokasi] = relationship(foreign_keys=[tujuan_lokasi_id])


class Pengiriman(Base):
    """Order angkutan (TRK-xxxx) + data pengukuran dampak per kiriman."""

    __tablename__ = "pengiriman"

    id: Mapped[int] = mapped_column(primary_key=True)
    kode: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    laporan_id: Mapped[int] = mapped_column(ForeignKey("laporan_panen.id"), index=True)
    pesanan_id: Mapped[int | None] = mapped_column(ForeignKey("pesanan.id"))
    driver_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)
    perjalanan_id: Mapped[int | None] = mapped_column(ForeignKey("perjalanan.id"))
    asal: Mapped[str] = mapped_column(String(160))
    tujuan: Mapped[str] = mapped_column(String(160))
    jemput_lokasi_id: Mapped[int | None] = mapped_column(ForeignKey("lokasi.id"))
    tujuan_lokasi_id: Mapped[int | None] = mapped_column(ForeignKey("lokasi.id"))
    jemput_mulai: Mapped[date | None] = mapped_column(Date)
    jemput_sampai: Mapped[date | None] = mapped_column(Date)
    jumlah_kg: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(30), default="menunggu_driver", index=True)

    # --- Pengukuran dampak (proposal Inovatera, Lampiran 1 butir 5) ---
    jenis_kendaraan: Mapped[str | None] = mapped_column(String(60))
    kapasitas_kg: Mapped[float | None] = mapped_column(Float)
    berat_muat_kg: Mapped[float | None] = mapped_column(Float)
    berat_terima_kg: Mapped[float | None] = mapped_column(Float)
    berat_ditolak_kg: Mapped[float | None] = mapped_column(Float)
    alasan_tolak_mutu: Mapped[str | None] = mapped_column(Text)
    waktu_muat: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    waktu_berangkat: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    waktu_terima: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    km_rute: Mapped[float | None] = mapped_column(Float)  # dari tabel jarak (rencana)
    km_deviasi: Mapped[float | None] = mapped_column(Float)  # tambahan km karena menjemput
    km_aktual: Mapped[float | None] = mapped_column(Float)  # dilaporkan mitra (odometer)
    bbm_liter: Mapped[float | None] = mapped_column(Float)  # dilaporkan mitra

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    laporan: Mapped[LaporanPanen] = relationship()
    pesanan: Mapped[Pesanan | None] = relationship()
    driver: Mapped[User | None] = relationship()
    perjalanan: Mapped[Perjalanan | None] = relationship()
    jemput_lokasi: Mapped[Lokasi | None] = relationship(foreign_keys=[jemput_lokasi_id])
    tujuan_lokasi: Mapped[Lokasi | None] = relationship(foreign_keys=[tujuan_lokasi_id])


class Penawaran(Base):
    """Rekomendasi pengiriman ke satu kandidat armada. Ditawarkan satu per satu sesuai urutan skor."""

    __tablename__ = "penawaran"

    id: Mapped[int] = mapped_column(primary_key=True)
    pengiriman_id: Mapped[int] = mapped_column(ForeignKey("pengiriman.id"), index=True)
    driver_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    perjalanan_id: Mapped[int | None] = mapped_column(ForeignKey("perjalanan.id"))
    urutan: Mapped[int] = mapped_column(Integer)
    skor: Mapped[float] = mapped_column(Float)
    detail: Mapped[dict | None] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(20), default="ditawarkan", index=True)
    alasan: Mapped[str | None] = mapped_column(Text)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    pengiriman: Mapped[Pengiriman] = relationship()
    driver: Mapped[User] = relationship()
    perjalanan: Mapped[Perjalanan | None] = relationship()


class Harga(Base):
    __tablename__ = "harga"

    id: Mapped[int] = mapped_column(primary_key=True)
    komoditas: Mapped[str] = mapped_column(String(40), index=True)
    pasar: Mapped[str] = mapped_column(String(120))
    harga_per_kg: Mapped[float] = mapped_column(Float)
    tanggal: Mapped[date] = mapped_column(Date, index=True)
    sumber: Mapped[str | None] = mapped_column(String(120))


class Conversation(Base):
    """Satu percakapan per nomor WA. pending_action menahan aksi tulis sampai dikonfirmasi."""

    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(primary_key=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    role: Mapped[str] = mapped_column(String(20))  # petani | driver | distributor | tidak_terdaftar
    channel: Mapped[str] = mapped_column(String(20), default="simulator")
    pending_action: Mapped[dict | None] = mapped_column(JSON)
    last_inbound_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    messages: Mapped[list["Message"]] = relationship(back_populates="conversation", order_by="Message.id")


class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (UniqueConstraint("wa_message_id", name="uq_messages_wa_message_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("conversations.id"), index=True)
    direction: Mapped[str] = mapped_column(String(3))  # in | out
    text: Mapped[str] = mapped_column(Text)
    channel: Mapped[str] = mapped_column(String(20))
    wa_message_id: Mapped[str | None] = mapped_column(String(128))
    # Antrean kirim ulang untuk pesan keluar: terkirim | gagal | menyerah
    send_status: Mapped[str | None] = mapped_column(String(12), index=True)
    send_attempts: Mapped[int] = mapped_column(Integer, default=0)
    next_retry_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_notification: Mapped[bool] = mapped_column(Boolean, default=False)
    # Metadata untuk audit: tool yang dipanggil, error LLM, dsb.
    meta: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    conversation: Mapped[Conversation] = relationship(back_populates="messages")


class AuditLog(Base):
    """Jejak perubahan data: siapa mengubah apa, kapan, dan isinya."""

    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(primary_key=True)
    aktor: Mapped[str] = mapped_column(String(60), index=True)  # "user:3", "petani:5", "sistem"
    aksi: Mapped[str] = mapped_column(String(60), index=True)
    entitas: Mapped[str | None] = mapped_column(String(40))
    entitas_id: Mapped[int | None] = mapped_column(Integer)
    data: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)


class Setting(Base):
    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    value: Mapped[str] = mapped_column(Text)
    encrypted: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class Counter(Base):
    """Penomoran kode TRK-xxxx yang aman di Postgres maupun SQLite."""

    __tablename__ = "counters"

    name: Mapped[str] = mapped_column(String(32), primary_key=True)
    value: Mapped[int] = mapped_column(Integer, default=0)

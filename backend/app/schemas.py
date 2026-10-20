from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class Orm(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Auth & user ----------


class LoginIn(BaseModel):
    email: str
    password: str


class UserOut(Orm):
    id: int
    email: str
    name: str
    role: str
    phone: str | None
    verification_status: str
    is_active: bool = True
    kapasitas_kg: float | None = None
    plat_nomor: str | None = None
    lokasi: str | None = None
    jenis_kendaraan: str | None = None
    km_per_liter: float | None = None
    komoditas_cocok: list[str] | None = None
    nama_usaha: str | None = None


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=2, max_length=120)
    role: Literal["driver", "distributor"]
    phone: str | None = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str
    role: str
    phone: str | None = None
    kapasitas_kg: float | None = None
    plat_nomor: str | None = None
    lokasi: str | None = None
    jenis_kendaraan: str | None = None
    km_per_liter: float | None = None
    komoditas_cocok: list[str] | None = None
    nama_usaha: str | None = None
    verification_status: str = "belum"


class UserUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    is_active: bool | None = None
    kapasitas_kg: float | None = None
    plat_nomor: str | None = None
    lokasi: str | None = None
    jenis_kendaraan: str | None = None
    km_per_liter: float | None = None
    komoditas_cocok: list[str] | None = None
    nama_usaha: str | None = None


# ---------- Master data ----------


class PetaniIn(BaseModel):
    phone: str
    name: str = Field(min_length=2, max_length=120)
    desa: str | None = None
    kecamatan: str | None = "Selupu Rejang"
    kelompok_tani: str | None = None


class PetaniUpdate(BaseModel):
    name: str | None = None
    desa: str | None = None
    kecamatan: str | None = None
    kelompok_tani: str | None = None
    is_active: bool | None = None


class PetaniOut(Orm):
    id: int
    phone: str
    name: str | None
    desa: str | None
    kecamatan: str | None
    kelompok_tani: str | None
    is_active: bool
    consent_at: datetime | None
    created_at: datetime


class LokasiIn(BaseModel):
    nama: str = Field(min_length=2, max_length=120)
    jenis: Literal["desa", "kota", "pasar", "pangkalan"] = "desa"
    kecamatan: str | None = None
    alias: list[str] | None = None


class LokasiOut(Orm):
    id: int
    nama: str
    jenis: str
    kecamatan: str | None
    alias: list[str] | None


class JarakIn(BaseModel):
    asal_id: int
    tujuan_id: int
    km: float = Field(gt=0, le=2000)
    sumber: str | None = None


class JarakOut(Orm):
    id: int
    asal_id: int
    tujuan_id: int
    km: float
    sumber: str | None


# ---------- Simulator ----------


class SimChatIn(BaseModel):
    phone: str
    text: str = Field(min_length=1, max_length=4000)


class MessageOut(Orm):
    id: int
    direction: str
    text: str
    channel: str
    meta: dict | None
    send_status: str | None = None
    is_notification: bool = False
    created_at: datetime
    phone: str | None = None


class SimContact(BaseModel):
    phone: str
    role: str
    name: str | None
    detail: str | None = None


# ---------- Operasi ----------


class LaporanOut(Orm):
    id: int
    petani_id: int
    komoditas: str
    jumlah: float
    satuan: str
    kg_per_satuan: float | None
    jumlah_kg: float | None
    sisa_kg: float | None
    harga_harapan_per_kg: float | None
    desa: str | None
    lokasi_id: int | None
    tanggal_panen: date | None
    status: str
    sumber: str
    teks_asli: str | None
    catatan_validasi: str | None
    divalidasi_at: datetime | None
    created_at: datetime
    petani_nama: str | None = None
    petani_phone_masked: str | None = None


class LaporanManualIn(BaseModel):
    """Jalur input web/manual oleh admin/pendamping (proposal: pendampingan & pencatatan manual)."""

    petani_id: int
    komoditas: str
    jumlah: float = Field(gt=0)
    satuan: str
    kg_per_satuan: float | None = Field(default=None, gt=0)
    desa: str | None = None
    tanggal_panen: date | None = None
    harga_harapan_per_kg: float | None = Field(default=None, gt=0)
    catatan: str | None = None


class ValidasiIn(BaseModel):
    setujui: bool
    catatan: str | None = None
    # Untuk satuan lokal: berat per satuan yang sudah dikonfirmasi petugas dengan petani.
    kg_per_satuan: float | None = Field(default=None, gt=0)
    jumlah_kg: float | None = Field(default=None, gt=0)
    desa: str | None = None


class PesananOut(Orm):
    id: int
    distributor_id: int
    laporan_id: int
    jumlah_kg: float
    harga_tawar_per_kg: float | None
    tujuan: str
    status: str
    kunci_sampai: datetime | None
    alasan_tolak: str | None
    created_at: datetime
    komoditas: str | None = None
    distributor_nama: str | None = None
    pengiriman_kode: str | None = None


class PenawaranOut(Orm):
    id: int
    pengiriman_id: int
    driver_id: int
    perjalanan_id: int | None
    urutan: int
    skor: float
    detail: dict | None
    status: str
    alasan: str | None
    expires_at: datetime | None
    created_at: datetime
    responded_at: datetime | None
    driver_nama: str | None = None


class PengirimanOut(Orm):
    id: int
    kode: str
    laporan_id: int
    pesanan_id: int | None
    driver_id: int | None
    perjalanan_id: int | None
    asal: str
    tujuan: str
    jemput_lokasi_id: int | None
    tujuan_lokasi_id: int | None
    jemput_mulai: date | None
    jemput_sampai: date | None
    jumlah_kg: float
    status: str
    jenis_kendaraan: str | None
    kapasitas_kg: float | None
    berat_muat_kg: float | None
    berat_terima_kg: float | None
    berat_ditolak_kg: float | None
    alasan_tolak_mutu: str | None
    waktu_muat: datetime | None
    waktu_berangkat: datetime | None
    waktu_terima: datetime | None
    km_rute: float | None
    km_deviasi: float | None
    km_aktual: float | None
    bbm_liter: float | None
    created_at: datetime
    updated_at: datetime
    komoditas: str | None = None
    driver_nama: str | None = None


class PengirimanDampakIn(BaseModel):
    """Koreksi/isi manual data pengukuran oleh admin."""

    jenis_kendaraan: str | None = None
    berat_muat_kg: float | None = Field(default=None, ge=0)
    berat_terima_kg: float | None = Field(default=None, ge=0)
    berat_ditolak_kg: float | None = Field(default=None, ge=0)
    alasan_tolak_mutu: str | None = None
    waktu_muat: datetime | None = None
    waktu_berangkat: datetime | None = None
    waktu_terima: datetime | None = None
    km_rute: float | None = Field(default=None, ge=0)
    km_deviasi: float | None = Field(default=None, ge=0)
    km_aktual: float | None = Field(default=None, ge=0)
    bbm_liter: float | None = Field(default=None, ge=0)


class TugaskanIn(BaseModel):
    driver_id: int
    perjalanan_id: int | None = None


class PerjalananOut(Orm):
    id: int
    driver_id: int
    asal_lokasi_id: int
    tujuan_lokasi_id: int
    tanggal: date
    kapasitas_tersedia_kg: float
    is_balik: bool
    status: str
    created_at: datetime


class AuditOut(Orm):
    id: int
    aktor: str
    aksi: str
    entitas: str | None
    entitas_id: int | None
    data: dict | None
    created_at: datetime


class HargaIn(BaseModel):
    komoditas: str
    pasar: str
    harga_per_kg: float = Field(gt=0)
    tanggal: date
    sumber: str | None = None


class HargaOut(Orm):
    id: int
    komoditas: str
    pasar: str
    harga_per_kg: float
    tanggal: date
    sumber: str | None

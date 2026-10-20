"""REST untuk portal web Mitra Logistik (driver) dan Distributor.

Semua aksi memanggil tools agent yang sama dengan kanal WhatsApp (lihat app/web_tools.py), jadi aturan
kunci volume, penawaran armada berurutan, dan alur status tidak diduplikasi di sini. Router hanya
menambahkan detail tampilan (tanggal jemput, data dampak) yang tidak dibutuhkan agent.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..agent.tools.logistik import ALUR
from ..audit import catat
from ..auth import require_roles
from ..db import get_db
from ..models import Lokasi, Penawaran, Pengiriman, Pesanan, Petani, User, as_utc
from ..normalize import KOMODITAS, normalisasi_komoditas, normalisasi_nomor
from ..schemas import LokasiOut, UserOut
from ..web_tools import jalankan, segarkan

mitra = require_roles("driver", "distributor")


def terverifikasi(role: str):
    """Peran cocok + akun sudah disetujui admin (sama dengan syarat tools agent)."""

    def dep(user: User = Depends(require_roles(role))) -> User:
        if user.verification_status != "disetujui":
            raise HTTPException(403, "Akun belum diverifikasi admin.")
        return user

    return dep


# ---------------- Akun & profil (semua status verifikasi) ----------------

akun = APIRouter(prefix="/api/akun", tags=["akun mitra"])


@akun.get("/lokasi", response_model=list[LokasiOut], dependencies=[Depends(mitra)])
def daftar_lokasi(db: Session = Depends(get_db)):
    return db.scalars(select(Lokasi).order_by(Lokasi.jenis, Lokasi.nama)).all()


class ProfilIn(BaseModel):
    """Hanya data yang dipakai pencocokan & kontak (minimisasi data: tanpa rekening/NPWP/foto dokumen)."""

    phone: str = Field(min_length=8, max_length=20)
    # Mitra logistik
    jenis_kendaraan: str | None = Field(default=None, max_length=60)
    plat_nomor: str | None = Field(default=None, max_length=20)
    kapasitas_kg: float | None = Field(default=None, gt=0, le=40000)
    km_per_liter: float | None = Field(default=None, gt=0, le=50)
    lokasi: str | None = Field(default=None, max_length=120)
    komoditas_cocok: list[str] | None = None
    # Distributor
    nama_usaha: str | None = Field(default=None, max_length=160)


@akun.post("/profil", response_model=UserOut)
def ajukan_profil(body: ProfilIn, user: User = Depends(mitra), db: Session = Depends(get_db)):
    """Mitra melengkapi profil lalu status verifikasi menjadi 'menunggu' sampai admin memeriksa."""
    if user.verification_status == "disetujui":
        raise HTTPException(409, "Akun sudah terverifikasi. Perubahan data dilakukan lewat petugas.")
    phone = normalisasi_nomor(body.phone)
    if not phone:
        raise HTTPException(422, "Nomor WhatsApp tidak valid.")
    bentrok_user = db.scalar(select(User).where(User.phone == phone, User.id != user.id))
    if bentrok_user is not None or db.scalar(select(Petani).where(Petani.phone == phone)) is not None:
        raise HTTPException(409, "Nomor WhatsApp sudah dipakai akun lain.")

    if user.role == "driver":
        kurang = [n for n, v in (("jenis kendaraan", body.jenis_kendaraan), ("plat nomor", body.plat_nomor), ("kapasitas", body.kapasitas_kg)) if not v]
        if kurang:
            raise HTTPException(422, f"Lengkapi {', '.join(kurang)}.")
        komoditas = []
        for k in body.komoditas_cocok or []:
            n = normalisasi_komoditas(k)
            if not n:
                raise HTTPException(422, f"Komoditas '{k}' tidak dikenali. Pilihan: {', '.join(KOMODITAS)}")
            komoditas.append(n)
        user.jenis_kendaraan = body.jenis_kendaraan.strip()
        user.plat_nomor = body.plat_nomor.strip().upper()
        user.kapasitas_kg = body.kapasitas_kg
        user.km_per_liter = body.km_per_liter
        user.lokasi = (body.lokasi or "").strip() or None
        user.komoditas_cocok = sorted(set(komoditas)) or None
    else:
        if not (body.nama_usaha or "").strip():
            raise HTTPException(422, "Lengkapi nama usaha.")
        user.nama_usaha = body.nama_usaha.strip()

    user.phone = phone
    user.verification_status = "menunggu"
    catat(db, f"{user.role}:{user.id}", "ajukan_verifikasi", "user", user.id, {"kanal": "web"})
    db.commit()
    return user


# ---------------- Mitra Logistik ----------------

driver = APIRouter(prefix="/api/driver", tags=["driver"])
DriverUser = Depends(terverifikasi("driver"))


class PerjalananIn(BaseModel):
    asal: str
    tujuan: str
    tanggal: str = "hari ini"
    kapasitas_kg: float | None = Field(default=None, gt=0)
    perjalanan_balik: bool = True


class TolakIn(BaseModel):
    alasan: str | None = None


class StatusIn(BaseModel):
    status: str
    berat_muat_kg: float | None = None


class DataPerjalananIn(BaseModel):
    km_aktual: float | None = None
    bbm_liter: float | None = None
    berat_muat_kg: float | None = None


@driver.get("/perjalanan")
def perjalanan_saya(user: User = DriverUser, db: Session = Depends(get_db)):
    return jalankan(db, user, "lihat_perjalanan_saya")["perjalanan"]


@driver.post("/perjalanan", status_code=201)
def umumkan_perjalanan(body: PerjalananIn, user: User = DriverUser, db: Session = Depends(get_db)):
    return jalankan(db, user, "umumkan_perjalanan", body.model_dump(exclude_none=True))


@driver.post("/perjalanan/{perjalanan_id}/batal")
def batalkan_perjalanan(perjalanan_id: int, user: User = DriverUser, db: Session = Depends(get_db)):
    return jalankan(db, user, "batalkan_perjalanan", {"perjalanan_id": perjalanan_id})


@driver.get("/penawaran")
def penawaran_aktif(user: User = DriverUser, db: Session = Depends(get_db)):
    segarkan(db)
    rows = jalankan(db, user, "lihat_penawaran")["penawaran"]
    for r in rows:
        pen = db.get(Penawaran, r["penawaran_id"])
        k = pen.pengiriman
        r.update(
            berlaku_sampai=as_utc(pen.expires_at),
            jemput_mulai=k.jemput_mulai,
            jemput_sampai=k.jemput_sampai,
            km_rute=(pen.detail or {}).get("km_rute"),
            jarak_belum_diisi=(pen.detail or {}).get("jarak_belum_diisi"),
            perjalanan_tanggal=pen.perjalanan.tanggal if pen.perjalanan else None,
            ditawarkan_admin=bool((pen.detail or {}).get("ditawarkan_admin")),
        )
    return rows


@driver.post("/penawaran/{penawaran_id}/terima")
def terima_penawaran(penawaran_id: int, user: User = DriverUser, db: Session = Depends(get_db)):
    segarkan(db)
    return jalankan(db, user, "terima_penawaran", {"penawaran_id": penawaran_id})


@driver.post("/penawaran/{penawaran_id}/tolak")
def tolak_penawaran(penawaran_id: int, body: TolakIn | None = None, user: User = DriverUser, db: Session = Depends(get_db)):
    segarkan(db)
    return jalankan(db, user, "tolak_penawaran", {"penawaran_id": penawaran_id, "alasan": (body.alasan if body else None)})


@driver.get("/muatan")
def cari_muatan(user: User = DriverUser, db: Session = Depends(get_db)):
    segarkan(db)
    return jalankan(db, user, "cari_muatan_balik")


@driver.post("/muatan/{kode}/ambil")
def ambil_muatan(kode: str, perjalanan_id: int | None = None, user: User = DriverUser, db: Session = Depends(get_db)):
    segarkan(db)
    return jalankan(db, user, "ambil_muatan", {"kode": kode, "perjalanan_id": perjalanan_id})


def _tugas_detail(k: Pengiriman) -> dict:
    i = ALUR.index(k.status) if k.status in ALUR else None
    return {
        "id": k.id,
        "jemput_mulai": k.jemput_mulai,
        "jemput_sampai": k.jemput_sampai,
        "km_rute": k.km_rute,
        "km_deviasi": k.km_deviasi,
        "berat_terima_kg": k.berat_terima_kg,
        "waktu_muat": as_utc(k.waktu_muat),
        "waktu_terima": as_utc(k.waktu_terima),
        "perjalanan_tanggal": k.perjalanan.tanggal if k.perjalanan else None,
        "status_berikut": ALUR[i + 1] if i is not None and i + 1 < len(ALUR) else None,
    }


@driver.get("/tugas")
def tugas_saya(user: User = DriverUser, db: Session = Depends(get_db)):
    rows = jalankan(db, user, "lihat_tugas_saya")["tugas"]
    for r in rows:
        r.update(_tugas_detail(db.scalar(select(Pengiriman).where(Pengiriman.kode == r["kode"]))))
    return rows


@driver.post("/tugas/{kode}/status")
def update_status(kode: str, body: StatusIn, user: User = DriverUser, db: Session = Depends(get_db)):
    return jalankan(db, user, "update_status_pengiriman", {"kode": kode, **body.model_dump(exclude_none=True)})


@driver.post("/tugas/{kode}/data")
def catat_data(kode: str, body: DataPerjalananIn, user: User = DriverUser, db: Session = Depends(get_db)):
    return jalankan(db, user, "catat_data_perjalanan", {"kode": kode, **body.model_dump(exclude_none=True)})


# ---------------- Distributor ----------------

distributor = APIRouter(prefix="/api/distributor", tags=["distributor"])
DistUser = Depends(terverifikasi("distributor"))


class PesananIn(BaseModel):
    laporan_id: int
    jumlah_kg: float = Field(gt=0)
    harga_tawar_per_kg: float | None = Field(default=None, gt=0)
    tujuan: str | None = None


class PenerimaanIn(BaseModel):
    berat_terima_kg: float = Field(ge=0)
    berat_ditolak_kg: float | None = Field(default=None, ge=0)
    alasan_tolak_mutu: str | None = None


@distributor.get("/stok")
def cari_stok(komoditas: str | None = None, jumlah_min_kg: float = 0, user: User = DistUser, db: Session = Depends(get_db)):
    segarkan(db)
    if komoditas and not normalisasi_komoditas(komoditas):
        return []
    daftar = [komoditas] if komoditas else list(KOMODITAS)
    hasil = []
    for k in daftar:
        r = jalankan(db, user, "cari_stok", {"komoditas": k, "jumlah_min_kg": jumlah_min_kg}, commit=False)
        hasil.extend({"komoditas": r["komoditas"], **s} for s in r["stok"])
    db.commit()
    return hasil


@distributor.post("/pesanan", status_code=201)
def ajukan_pesanan(body: PesananIn, user: User = DistUser, db: Session = Depends(get_db)):
    segarkan(db)
    return jalankan(db, user, "buat_pesanan", body.model_dump(exclude_none=True))


@distributor.post("/pesanan/{pesanan_id}/batal")
def batalkan_pesanan(pesanan_id: int, user: User = DistUser, db: Session = Depends(get_db)):
    segarkan(db)
    return jalankan(db, user, "batalkan_pesanan", {"pesanan_id": pesanan_id})


@distributor.get("/pesanan")
def pesanan_saya(user: User = DistUser, db: Session = Depends(get_db)):
    segarkan(db)
    rows = jalankan(db, user, "lihat_pesanan_saya")["pesanan"]
    for r in rows:
        p = db.get(Pesanan, r["pesanan_id"])
        k = db.scalar(select(Pengiriman).where(Pengiriman.pesanan_id == p.id))
        r.update(
            laporan_id=p.laporan_id,
            desa=p.laporan.desa,
            tujuan=p.tujuan,
            harga_tawar_per_kg=p.harga_tawar_per_kg,
            kunci_sampai=as_utc(p.kunci_sampai),
            alasan_tolak=p.alasan_tolak,
            created_at=as_utc(p.created_at),
            bisa_batal=p.status == "menunggu_petani" or (p.status == "menunggu_angkutan" and not (k and k.driver_id)),
        )
        if k:
            r["pengiriman"].update(
                driver_nama=k.driver.name if k.driver else None,
                plat_nomor=k.driver.plat_nomor if k.driver else None,
                berat_muat_kg=k.berat_muat_kg,
                berat_terima_kg=k.berat_terima_kg,
                berat_ditolak_kg=k.berat_ditolak_kg,
                alasan_tolak_mutu=k.alasan_tolak_mutu,
                waktu_terima=as_utc(k.waktu_terima),
                bisa_catat_terima=k.status in ("dimuat", "dalam_perjalanan", "selesai") and k.berat_terima_kg is None,
            )
    return rows


@distributor.post("/pengiriman/{kode}/penerimaan")
def catat_penerimaan(kode: str, body: PenerimaanIn, user: User = DistUser, db: Session = Depends(get_db)):
    return jalankan(db, user, "catat_penerimaan", {"kode": kode, **body.model_dump(exclude_none=True)})

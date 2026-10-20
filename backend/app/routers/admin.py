from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..audit import catat
from ..auth import require_admin
from ..db import get_db
from ..models import ROLES, VERIFIKASI, Jarak, Lokasi, Petani, User
from ..normalize import KOMODITAS, normalisasi_komoditas, normalisasi_nomor
from ..schemas import (
    JarakIn,
    JarakOut,
    LokasiIn,
    LokasiOut,
    PetaniIn,
    PetaniOut,
    PetaniUpdate,
    UserCreate,
    UserOut,
    UserUpdate,
)
from ..security import hash_password

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _aktor(user: User) -> str:
    return f"user:{user.id}"


# ---------------- Akun mitra ----------------


def _komoditas_list(items: list[str] | None) -> list[str] | None:
    if not items:
        return None
    hasil = []
    for it in items:
        k = normalisasi_komoditas(it)
        if not k:
            raise HTTPException(422, f"Komoditas '{it}' tidak dikenali. Pilihan: {', '.join(KOMODITAS)}")
        hasil.append(k)
    return sorted(set(hasil))


@router.get("/users", response_model=list[UserOut], dependencies=[Depends(require_admin)])
def list_users(role: str | None = None, db: Session = Depends(get_db)):
    q = select(User).order_by(User.id)
    if role:
        q = q.where(User.role == role)
    return db.scalars(q).all()


@router.post("/users", response_model=UserOut, status_code=201)
def create_user(body: UserCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if body.role not in ROLES:
        raise HTTPException(422, f"Peran harus salah satu dari {ROLES}")
    if body.verification_status not in VERIFIKASI:
        raise HTTPException(422, f"Status verifikasi harus salah satu dari {VERIFIKASI}")
    data = body.model_dump(exclude={"password"})
    data["email"] = data["email"].lower()
    data["phone"] = normalisasi_nomor(body.phone) if body.phone else None
    data["komoditas_cocok"] = _komoditas_list(body.komoditas_cocok)
    user = User(**data, password_hash=hash_password(body.password))
    db.add(user)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Email atau nomor HP sudah dipakai.") from None
    catat(db, _aktor(admin), "buat_akun", "user", user.id, {"role": user.role, "email": user.email})
    db.commit()
    return user


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, body: UserUpdate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(404, "User tidak ditemukan.")
    data = body.model_dump(exclude_unset=True)
    if "phone" in data:
        data["phone"] = normalisasi_nomor(data["phone"]) if data["phone"] else None
    if "komoditas_cocok" in data:
        data["komoditas_cocok"] = _komoditas_list(data["komoditas_cocok"])
    for k, v in data.items():
        setattr(user, k, v)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Nomor HP sudah dipakai.") from None
    catat(db, _aktor(admin), "ubah_akun", "user", user.id, data)
    db.commit()
    return user


@router.patch("/users/{user_id}/verification", response_model=UserOut)
def set_verification(user_id: int, status: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if status not in VERIFIKASI:
        raise HTTPException(422, f"Status harus salah satu dari {VERIFIKASI}")
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(404, "User tidak ditemukan.")
    user.verification_status = status
    catat(db, _aktor(admin), "verifikasi_akun", "user", user.id, {"status": status})
    db.commit()
    return user


# ---------------- Petani (wajib terdaftar) ----------------


@router.get("/petani", response_model=list[PetaniOut], dependencies=[Depends(require_admin)])
def list_petani(q: str | None = None, db: Session = Depends(get_db)):
    stmt = select(Petani).order_by(Petani.id.desc()).limit(500)
    if q:
        like = f"%{q.lower()}%"
        stmt = stmt.where(or_(Petani.name.ilike(like), Petani.phone.like(f"%{normalisasi_nomor(q) or q}%"), Petani.desa.ilike(like)))
    return db.scalars(stmt).all()


@router.post("/petani", response_model=PetaniOut, status_code=201)
def create_petani(body: PetaniIn, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    phone = normalisasi_nomor(body.phone)
    if len(phone) < 9:
        raise HTTPException(422, "Nomor WA tidak valid.")
    if db.scalar(select(User.id).where(User.phone == phone)):
        raise HTTPException(409, "Nomor ini sudah dipakai akun mitra (driver/distributor).")
    p = Petani(
        phone=phone,
        name=body.name.strip(),
        desa=(body.desa or "").strip().title() or None,
        kecamatan=body.kecamatan,
        kelompok_tani=body.kelompok_tani,
        didaftarkan_oleh=admin.id,
    )
    db.add(p)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Nomor petani sudah terdaftar.") from None
    catat(db, _aktor(admin), "daftarkan_petani", "petani", p.id, {"phone": phone, "desa": p.desa})
    db.commit()
    return p


@router.patch("/petani/{petani_id}", response_model=PetaniOut)
def update_petani(petani_id: int, body: PetaniUpdate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    p = db.get(Petani, petani_id)
    if p is None:
        raise HTTPException(404, "Petani tidak ditemukan.")
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(p, k, v)
    catat(db, _aktor(admin), "ubah_petani", "petani", p.id, data)
    db.commit()
    return p


# ---------------- Lokasi & jarak ----------------


@router.get("/lokasi", response_model=list[LokasiOut], dependencies=[Depends(require_admin)])
def list_lokasi(db: Session = Depends(get_db)):
    return db.scalars(select(Lokasi).order_by(Lokasi.jenis, Lokasi.nama)).all()


@router.post("/lokasi", response_model=LokasiOut, status_code=201)
def create_lokasi(body: LokasiIn, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    lok = Lokasi(nama=body.nama.strip(), jenis=body.jenis, kecamatan=body.kecamatan, alias=[a.strip() for a in body.alias or [] if a.strip()] or None)
    db.add(lok)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Nama lokasi sudah ada.") from None
    catat(db, _aktor(admin), "buat_lokasi", "lokasi", lok.id, body.model_dump())
    db.commit()
    return lok


@router.delete("/lokasi/{lokasi_id}")
def delete_lokasi(lokasi_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    lok = db.get(Lokasi, lokasi_id)
    if lok is None:
        raise HTTPException(404, "Lokasi tidak ditemukan.")
    for j in db.scalars(select(Jarak).where(or_(Jarak.asal_id == lok.id, Jarak.tujuan_id == lok.id))):
        db.delete(j)
    db.delete(lok)
    try:
        catat(db, _aktor(admin), "hapus_lokasi", "lokasi", lokasi_id, {"nama": lok.nama})
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Lokasi masih dipakai laporan/perjalanan; tidak bisa dihapus.") from None
    return {"ok": True}


@router.get("/jarak", response_model=list[JarakOut], dependencies=[Depends(require_admin)])
def list_jarak(db: Session = Depends(get_db)):
    return db.scalars(select(Jarak).order_by(Jarak.asal_id, Jarak.tujuan_id)).all()


@router.put("/jarak", response_model=JarakOut)
def upsert_jarak(body: JarakIn, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if body.asal_id == body.tujuan_id:
        raise HTTPException(422, "Asal dan tujuan tidak boleh sama.")
    if not db.get(Lokasi, body.asal_id) or not db.get(Lokasi, body.tujuan_id):
        raise HTTPException(404, "Lokasi tidak ditemukan.")
    a, b = sorted((body.asal_id, body.tujuan_id))  # simpan satu baris per pasangan (berlaku dua arah)
    row = db.scalar(select(Jarak).where(or_((Jarak.asal_id == a) & (Jarak.tujuan_id == b), (Jarak.asal_id == b) & (Jarak.tujuan_id == a))))
    if row is None:
        row = Jarak(asal_id=a, tujuan_id=b, km=body.km, sumber=body.sumber)
        db.add(row)
    else:
        row.km, row.sumber = body.km, body.sumber
    db.flush()
    catat(db, _aktor(admin), "ubah_jarak", "jarak", row.id, body.model_dump())
    db.commit()
    return row


@router.delete("/jarak/{jarak_id}")
def delete_jarak(jarak_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    row = db.get(Jarak, jarak_id)
    if row is None:
        raise HTTPException(404, "Jarak tidak ditemukan.")
    db.delete(row)
    catat(db, _aktor(admin), "hapus_jarak", "jarak", jarak_id)
    db.commit()
    return {"ok": True}

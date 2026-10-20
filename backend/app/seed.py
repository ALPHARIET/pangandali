"""Seed data.

  python -m app.seed           # admin dari env ADMIN_EMAIL / ADMIN_PASSWORD
  python -m app.seed --demo    # + akun, lokasi, jarak, dan data CONTOH untuk demo (JANGAN di production)
  python -m app.seed --set-demo-password   # samakan password semua akun demo dengan DEMO_PASSWORD di .env
"""
import argparse
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import get_settings
from .db import SessionLocal
from .models import Harga, Jarak, Lokasi, Perjalanan, Petani, User
from .normalize import hari_ini
from .security import hash_password

LABEL_CONTOH = "DATA CONTOH demo - ganti dengan data terverifikasi"


def seed_admin(db: Session) -> str:
    s = get_settings()
    if db.scalar(select(User).where(User.email == s.admin_email.lower())):
        return f"Admin {s.admin_email} sudah ada."
    if len(s.admin_password) < 8:
        raise SystemExit("ADMIN_PASSWORD wajib diisi (min. 8 karakter) di .env sebelum seed.")
    db.add(User(email=s.admin_email.lower(), password_hash=hash_password(s.admin_password), name=s.admin_name, role="admin", verification_status="disetujui"))
    return f"Admin {s.admin_email} dibuat."


def _lokasi(db: Session, nama: str, jenis: str, kecamatan: str | None = None, alias: list[str] | None = None) -> Lokasi:
    lok = db.scalar(select(Lokasi).where(Lokasi.nama == nama))
    if lok is None:
        lok = Lokasi(nama=nama, jenis=jenis, kecamatan=kecamatan, alias=alias)
        db.add(lok)
        db.flush()
    return lok


def seed_demo(db: Session) -> list[str]:
    log = []
    # Lokasi pilot. Desa sesuai pilot Selupu Rejang; jarak di bawah hanya CONTOH untuk demo.
    desa = {n: _lokasi(db, n, "desa", "Selupu Rejang") for n in ("Lubuk Ubar", "Kampung Baru", "Air Putih Lama", "Mekar Sari")}
    curup = _lokasi(db, "Curup", "kota", "Curup", ["curup kota"])
    bkl = _lokasi(db, "Kota Bengkulu", "kota", None, ["bengkulu"])
    panorama = _lokasi(db, "Pasar Panorama", "pasar", None, ["panorama", "pasar panorama bengkulu"])
    if not db.scalar(select(Jarak.id).limit(1)):
        contoh = [
            (curup, bkl, 85),
            (bkl, panorama, 5),
            (curup, panorama, 88),
            (desa["Lubuk Ubar"], curup, 9),
            (desa["Kampung Baru"], curup, 7),
            (desa["Air Putih Lama"], curup, 11),
            (desa["Mekar Sari"], curup, 13),
        ]
        for a, b, km in contoh:
            db.add(Jarak(asal_id=a.id, tujuan_id=b.id, km=km, sumber=LABEL_CONTOH))
        # Desa → Pasar Panorama lewat Curup (contoh)
        for d in desa.values():
            km_desa_curup = next(km for a, b, km in contoh if a is d)
            db.add(Jarak(asal_id=d.id, tujuan_id=panorama.id, km=km_desa_curup + 88, sumber=LABEL_CONTOH))
            db.add(Jarak(asal_id=d.id, tujuan_id=bkl.id, km=km_desa_curup + 85, sumber=LABEL_CONTOH))
        log.append("lokasi & jarak CONTOH ditambahkan")

    akun = [
        dict(email="driver.demo@pangandali.id", name="Andi Pratama", role="driver", phone="6281234567890",
             kapasitas_kg=2000, plat_nomor="BD 8123 RL", lokasi="Curup", jenis_kendaraan="Truk engkel bak terbuka",
             km_per_liter=8.0),
        dict(email="driver2.demo@pangandali.id", name="Rudi Hartono", role="driver", phone="6281234560002",
             kapasitas_kg=1000, plat_nomor="BD 8456 RL", lokasi="Curup", jenis_kendaraan="Pikap",
             km_per_liter=10.0),
        dict(email="distributor.demo@pangandali.id", name="Budi Grosir", role="distributor", phone="6281299998888",
             nama_usaha="UD Budi Grosir Panorama"),
        # TPID hanya melihat tampilan agregat (Pasokan & Peringatan, Evaluasi Distribusi).
        dict(email="tpid.demo@pangandali.id", name="Pengguna TPID (demo)", role="tpid"),
    ]
    demo_pw = get_settings().demo_password
    for a in akun:
        if db.scalar(select(User).where(User.email == a["email"])):
            continue
        pw = demo_pw or secrets.token_urlsafe(9)
        u = User(**a, password_hash=hash_password(pw), verification_status="disetujui")
        db.add(u)
        db.flush()
        log.append(f"{a['role']}: {a['email']} / {'(DEMO_PASSWORD di .env)' if demo_pw else pw}")
        if a["role"] == "driver":
            # Perjalanan balik contoh supaya rekomendasi muatan bisa langsung didemokan.
            db.add(Perjalanan(driver_id=u.id, asal_lokasi_id=curup.id, tujuan_lokasi_id=bkl.id, tanggal=hari_ini() + timedelta(days=1),
                              kapasitas_tersedia_kg=a["kapasitas_kg"], is_balik=True))
    petani = [
        ("6281300001111", "Pak Slamet", "Lubuk Ubar"),
        ("6281300002222", "Bu Sri", "Air Putih Lama"),
    ]
    for phone, name, nama_desa in petani:
        if not db.scalar(select(Petani).where(Petani.phone == phone)):
            db.add(Petani(phone=phone, name=name, desa=nama_desa, kelompok_tani="Kelompok contoh", consent_at=datetime.now(timezone.utc)))
            log.append(f"petani: {name} ({phone})")
    if not db.scalar(select(Harga.id).limit(1)):
        # Angka contoh untuk demo, BUKAN data harga resmi.
        contoh = {"Cabai Besar": 38000, "Kubis": 6000, "Terung": 9000, "Wortel": 11000, "Kembang Kol": 14000, "Tomat": 10000}
        for k, v in contoh.items():
            db.add(Harga(komoditas=k, pasar="Pasar Panorama", harga_per_kg=v, tanggal=hari_ini() - timedelta(days=1), sumber="data contoh (demo)"))
        log.append("harga contoh ditambahkan")
    return log


def set_demo_password(db: Session) -> list[str]:
    pw = get_settings().demo_password
    if len(pw) < 8:
        raise SystemExit("Isi DEMO_PASSWORD (min. 8 karakter) di backend/.env dulu.")
    rows = db.scalars(select(User).where(User.email.like("%.demo@pangandali.id"))).all()
    for u in rows:
        u.password_hash = hash_password(pw)
    return [f"password demo diperbarui: {u.email}" for u in rows]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--demo", action="store_true")
    ap.add_argument("--set-demo-password", action="store_true")
    args = ap.parse_args()
    with SessionLocal() as db:
        print(seed_admin(db))
        if args.demo:
            for line in seed_demo(db):
                print(line)
        if args.set_demo_password:
            for line in set_demo_password(db):
                print(line)
        db.commit()


if __name__ == "__main__":
    main()

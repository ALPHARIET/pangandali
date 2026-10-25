"""REST untuk dashboard: validasi laporan, input manual, pesanan, pengiriman, penawaran, audit, harga."""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..agent.runner import sistem_notifier
from ..audit import catat
from ..auth import require_admin, require_roles
from ..db import get_db
from ..geo import cari_lokasi, tambahan_jarak
from ..matching import fmt_kg, penawaran_aktif, susun_kandidat, tawarkan_berikutnya
from ..models import AuditLog, Harga, LaporanPanen, Penawaran, Pengiriman, Perjalanan, Pesanan, Petani, User
from ..normalize import SATUAN_LOKAL, ke_kg, normalisasi_komoditas, normalisasi_satuan
from ..operasional import get_operasional
from ..schemas import (
    AuditOut,
    HargaIn,
    HargaOut,
    LaporanManualIn,
    LaporanOut,
    PenawaranOut,
    PengirimanDampakIn,
    PengirimanOut,
    PerjalananOut,
    PesananOut,
    TugaskanIn,
    ValidasiIn,
)

router = APIRouter(prefix="/api", tags=["data"])
staff = require_roles("admin", "tpid")


def _mask(phone: str | None) -> str | None:
    return f"{phone[:5]}****{phone[-3:]}" if phone and len(phone) > 8 else phone


def _laporan_out(r: LaporanPanen) -> LaporanOut:
    o = LaporanOut.model_validate(r)
    o.petani_nama = r.petani.name
    o.petani_phone_masked = _mask(r.petani.phone)
    return o


# ---------------- Laporan panen ----------------


@router.get("/laporan", response_model=list[LaporanOut], dependencies=[Depends(staff)])
def list_laporan(status: str | None = None, komoditas: str | None = None, limit: int = 100, db: Session = Depends(get_db)):
    q = select(LaporanPanen).order_by(LaporanPanen.id.desc()).limit(min(limit, 500))
    if status:
        q = q.where(LaporanPanen.status.in_(status.split(",")))
    if komoditas:
        q = q.where(LaporanPanen.komoditas == (normalisasi_komoditas(komoditas) or komoditas))
    return [_laporan_out(r) for r in db.scalars(q)]


@router.post("/laporan", response_model=LaporanOut, status_code=201)
def create_laporan_manual(body: LaporanManualIn, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Input manual oleh petugas (mis. dari kunjungan lapangan/telepon). Tetap melewati validasi."""
    p = db.get(Petani, body.petani_id)
    if p is None or not p.is_active:
        raise HTTPException(404, "Petani tidak ditemukan.")
    k = normalisasi_komoditas(body.komoditas)
    s = normalisasi_satuan(body.satuan)
    if not k or not s:
        raise HTTPException(422, "Komoditas atau satuan tidak dikenali.")
    if s in SATUAN_LOKAL:
        kg = round(body.jumlah * body.kg_per_satuan, 2) if body.kg_per_satuan else None
    else:
        kg = ke_kg(body.jumlah, s)
    desa = (body.desa or p.desa or "").strip().title() or None
    lok = cari_lokasi(db, desa)
    lap = LaporanPanen(
        petani_id=p.id,
        komoditas=k,
        jumlah=body.jumlah,
        satuan=s,
        kg_per_satuan=body.kg_per_satuan if s in SATUAN_LOKAL else None,
        jumlah_kg=kg,
        sisa_kg=kg,
        harga_harapan_per_kg=body.harga_harapan_per_kg,
        desa=desa,
        lokasi_id=lok.id if lok else None,
        tanggal_panen=body.tanggal_panen,
        status="menunggu_validasi",
        sumber="admin",
        teks_asli=body.catatan,
    )
    db.add(lap)
    db.flush()
    catat(db, f"user:{admin.id}", "input_manual_laporan", "laporan", lap.id, body.model_dump(mode="json"))
    db.commit()
    return _laporan_out(lap)


@router.post("/laporan/{laporan_id}/validasi", response_model=LaporanOut)
def validasi_laporan(laporan_id: int, body: ValidasiIn, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    lap = db.get(LaporanPanen, laporan_id)
    if lap is None:
        raise HTTPException(404, "Laporan tidak ditemukan.")
    if lap.status not in ("menunggu_validasi", "perlu_review"):
        raise HTTPException(409, f"Laporan berstatus {lap.status}, tidak sedang menunggu validasi.")
    notify = sistem_notifier(db)
    if body.desa:
        lap.desa = body.desa.strip().title()
        lok = cari_lokasi(db, lap.desa)
        lap.lokasi_id = lok.id if lok else None
    if body.setujui:
        if body.kg_per_satuan and lap.satuan in SATUAN_LOKAL:
            lap.kg_per_satuan = body.kg_per_satuan
            lap.jumlah_kg = round(lap.jumlah * body.kg_per_satuan, 2)
        if body.jumlah_kg:
            lap.jumlah_kg = body.jumlah_kg
        if not lap.jumlah_kg:
            raise HTTPException(422, "Berat kg belum diketahui. Isi berat per satuan atau total kg yang sudah dipastikan dengan petani.")
        if not lap.desa:
            raise HTTPException(422, "Desa belum terisi.")
        lap.sisa_kg = lap.jumlah_kg
        lap.status = "tersedia"
        pesan = (
            f"Laporan panen #{lap.id} ({lap.komoditas} {fmt_kg(lap.jumlah_kg)}) sudah diperiksa petugas dan sekarang "
            "ditawarkan ke pembeli. Kami kabari kalau ada permintaan."
        )
    else:
        lap.status, lap.sisa_kg = "ditolak", 0
        alasan = f" Catatan petugas: {body.catatan}." if body.catatan else ""
        pesan = f"Mohon maaf, laporan panen #{lap.id} ({lap.komoditas}) belum bisa diterima.{alasan} Silakan hubungi petugas bila ada pertanyaan."
    lap.catatan_validasi = body.catatan
    lap.divalidasi_oleh, lap.divalidasi_at = admin.id, datetime.now(timezone.utc)
    catat(db, f"user:{admin.id}", "validasi_laporan", "laporan", lap.id, body.model_dump())
    notify(lap.petani.phone, "petani", pesan)
    db.commit()
    return _laporan_out(lap)


# ---------------- Pesanan ----------------


@router.get("/pesanan", response_model=list[PesananOut], dependencies=[Depends(staff)])
def list_pesanan(status: str | None = None, db: Session = Depends(get_db)):
    q = select(Pesanan).order_by(Pesanan.id.desc()).limit(200)
    if status:
        q = q.where(Pesanan.status.in_(status.split(",")))
    rows = db.scalars(q).all()
    kode = dict(db.execute(select(Pengiriman.pesanan_id, Pengiriman.kode).where(Pengiriman.pesanan_id.in_([p.id for p in rows]))).all())
    hasil = []
    for p in rows:
        o = PesananOut.model_validate(p)
        o.komoditas = p.laporan.komoditas
        o.distributor_nama = p.distributor.nama_usaha or p.distributor.name
        o.pengiriman_kode = kode.get(p.id)
        hasil.append(o)
    return hasil


# ---------------- Pengiriman & penawaran ----------------


def _kirim_out(k: Pengiriman) -> PengirimanOut:
    o = PengirimanOut.model_validate(k)
    o.komoditas = k.laporan.komoditas
    o.driver_nama = k.driver.name if k.driver else None
    return o


def _kirim(db: Session, pengiriman_id: int) -> Pengiriman:
    k = db.get(Pengiriman, pengiriman_id)
    if k is None:
        raise HTTPException(404, "Pengiriman tidak ditemukan.")
    return k


@router.get("/pengiriman", response_model=list[PengirimanOut], dependencies=[Depends(staff)])
def list_pengiriman(status: str | None = None, db: Session = Depends(get_db)):
    q = select(Pengiriman).order_by(Pengiriman.id.desc()).limit(200)
    if status:
        q = q.where(Pengiriman.status.in_(status.split(",")))
    return [_kirim_out(k) for k in db.scalars(q)]


@router.get("/pengiriman/{pengiriman_id}", dependencies=[Depends(staff)])
def detail_pengiriman(pengiriman_id: int, db: Session = Depends(get_db)):
    k = _kirim(db, pengiriman_id)
    layak, tersaring = susun_kandidat(db, k) if k.status in ("menunggu_driver", "perlu_admin") else ([], [])
    return {
        "pengiriman": _kirim_out(k),
        "penawaran": [
            PenawaranOut.model_validate(p).model_copy(update={"driver_nama": p.driver.name})
            for p in db.scalars(select(Penawaran).where(Penawaran.pengiriman_id == k.id).order_by(Penawaran.urutan))
        ],
        "kandidat": [
            {"driver_id": c["driver"].id, "driver": c["driver"].name, "perjalanan_id": c["perjalanan"].id, "skor": c["skor"], **c["detail"]}
            for c in layak
        ],
        "tersaring": tersaring,
    }


@router.post("/pengiriman/{pengiriman_id}/cocokkan", response_model=PengirimanOut)
def cocokkan_ulang(pengiriman_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    k = _kirim(db, pengiriman_id)
    if k.status not in ("menunggu_driver", "perlu_admin"):
        raise HTTPException(409, "Pengiriman sudah punya armada.")
    tawarkan_berikutnya(db, k, sistem_notifier(db))
    catat(db, f"user:{admin.id}", "cocokkan_ulang", "pengiriman", k.id)
    db.commit()
    return _kirim_out(k)


@router.post("/pengiriman/{pengiriman_id}/tawarkan", response_model=PenawaranOut)
def tawarkan_manual(pengiriman_id: int, body: TugaskanIn, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Admin menawarkan order ke mitra tertentu. Tetap perlu persetujuan mitra (bukan penugasan langsung)."""
    k = _kirim(db, pengiriman_id)
    if k.status not in ("menunggu_driver", "perlu_admin"):
        raise HTTPException(409, "Pengiriman sudah punya armada.")
    if penawaran_aktif(db, k):
        raise HTTPException(409, "Masih ada penawaran aktif untuk order ini.")
    drv = db.get(User, body.driver_id)
    if drv is None or drv.role != "driver" or drv.verification_status != "disetujui" or not drv.phone:
        raise HTTPException(422, "Mitra logistik tidak valid atau belum diverifikasi.")
    perj = db.get(Perjalanan, body.perjalanan_id) if body.perjalanan_id else None
    if perj is not None and perj.driver_id != drv.id:
        raise HTTPException(422, "Perjalanan bukan milik mitra ini.")
    dev = tambahan_jarak(db, perj.asal, k.jemput_lokasi, k.tujuan_lokasi, perj.tujuan) if perj else {}
    urutan = (db.scalar(select(func.count()).where(Penawaran.pengiriman_id == k.id)) or 0) + 1
    pen = Penawaran(
        pengiriman_id=k.id,
        driver_id=drv.id,
        perjalanan_id=perj.id if perj else None,
        urutan=urutan,
        skor=0,
        detail={**{key: dev.get(key) for key in ("km_rute", "km_deviasi", "km_langsung")}, "ditawarkan_admin": True},
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=get_operasional(db).batas_respon_driver_menit),
    )
    db.add(pen)
    k.status = "menunggu_driver"
    db.flush()
    sistem_notifier(db)(
        drv.phone,
        "driver",
        f"Petugas PanganDali menawarkan order {k.kode}: {k.laporan.komoditas} {fmt_kg(k.jumlah_kg)}, jemput di {k.asal}, "
        f"antar ke {k.tujuan}. Mau diambil?",
    )
    catat(db, f"user:{admin.id}", "tawarkan_manual", "penawaran", pen.id, body.model_dump())
    db.commit()
    return pen


@router.patch("/pengiriman/{pengiriman_id}/dampak", response_model=PengirimanOut)
def ubah_data_dampak(pengiriman_id: int, body: PengirimanDampakIn, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Isi/koreksi data pengukuran (jalur manual). Setiap perubahan tercatat di audit log."""
    k = _kirim(db, pengiriman_id)
    data = body.model_dump(exclude_unset=True)
    sebelum = {key: getattr(k, key) for key in data}
    for key, v in data.items():
        setattr(k, key, v)
    catat(db, f"user:{admin.id}", "ubah_data_dampak", "pengiriman", k.id, {"sebelum": sebelum, "sesudah": data})
    db.commit()
    return _kirim_out(k)


@router.get("/perjalanan", response_model=list[PerjalananOut], dependencies=[Depends(staff)])
def list_perjalanan(status: str | None = None, db: Session = Depends(get_db)):
    q = select(Perjalanan).order_by(Perjalanan.id.desc()).limit(200)
    if status:
        q = q.where(Perjalanan.status == status)
    return db.scalars(q).all()


# ---------------- Audit ----------------


@router.get("/audit", response_model=list[AuditOut], dependencies=[Depends(require_admin)])
def list_audit(entitas: str | None = None, entitas_id: int | None = None, limit: int = 200, db: Session = Depends(get_db)):
    q = select(AuditLog).order_by(AuditLog.id.desc()).limit(min(limit, 1000))
    if entitas:
        q = q.where(AuditLog.entitas == entitas)
    if entitas_id is not None:
        q = q.where(AuditLog.entitas_id == entitas_id)
    return db.scalars(q).all()


# ---------------- Harga ----------------


@router.get("/harga", response_model=list[HargaOut])
def list_harga(komoditas: str | None = None, db: Session = Depends(get_db)):
    q = select(Harga).order_by(Harga.tanggal.desc(), Harga.komoditas).limit(200)
    if komoditas:
        q = q.where(Harga.komoditas == (normalisasi_komoditas(komoditas) or komoditas))
    return db.scalars(q).all()


@router.post("/harga", response_model=HargaOut, status_code=201)
def add_harga(body: HargaIn, db: Session = Depends(get_db), user: User = Depends(staff)):
    k = normalisasi_komoditas(body.komoditas)
    if not k:
        raise HTTPException(422, "Komoditas tidak dikenali.")
    row = Harga(**body.model_dump(exclude={"komoditas"}), komoditas=k)
    db.add(row)
    db.flush()
    catat(db, f"user:{user.id}", "input_harga", "harga", row.id, body.model_dump(mode="json"))
    db.commit()
    return row

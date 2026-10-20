from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import require_roles
from ..dampak import metrik_pengiriman, ringkasan
from ..db import get_db
from ..models import Pengiriman
from ..pasokan import ringkasan_pasokan

router = APIRouter(prefix="/api", tags=["dashboard"], dependencies=[Depends(require_roles("admin", "tpid"))])


@router.get("/dashboard/pasokan")
def dashboard_pasokan(db: Session = Depends(get_db)):
    return ringkasan_pasokan(db)


@router.get("/dampak/ringkasan")
def dampak_ringkasan(dari: date | None = None, sampai: date | None = None, db: Session = Depends(get_db)):
    if dari and sampai and dari > sampai:
        raise HTTPException(422, "Tanggal 'dari' harus sebelum 'sampai'.")
    return ringkasan(db, dari, sampai)


@router.get("/dampak/pengiriman/{pengiriman_id}")
def dampak_pengiriman(pengiriman_id: int, db: Session = Depends(get_db)):
    k = db.get(Pengiriman, pengiriman_id)
    if k is None:
        raise HTTPException(404, "Pengiriman tidak ditemukan.")
    return metrik_pengiriman(db, k)

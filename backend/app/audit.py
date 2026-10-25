from sqlalchemy.orm import Session

from .models import AuditLog


def catat(db: Session, aktor: str, aksi: str, entitas: str | None = None, entitas_id: int | None = None, data: dict | None = None) -> None:
    """Tambahkan jejak perubahan. Dipanggil di transaksi yang sama dengan perubahan datanya."""
    db.add(AuditLog(aktor=aktor, aksi=aksi, entitas=entitas, entitas_id=entitas_id, data=data))

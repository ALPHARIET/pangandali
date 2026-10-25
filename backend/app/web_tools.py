"""Menjalankan tools agent dari dashboard web.

Dashboard Driver/Distributor memakai logika yang sama dengan agent WhatsApp (validasi, kunci volume,
penawaran armada berurutan) supaya kedua kanal tidak berbeda aturan. Bedanya hanya konfirmasi:
di WhatsApp aksi tulis ditahan sebagai pending_action, di web konfirmasi sudah terjadi di dialog
tombol sehingga `prepare` lalu `run` dijalankan dalam satu permintaan.
"""
from fastapi import HTTPException
from sqlalchemy.orm import Session

from .agent.runner import sistem_notifier
from .agent.tools import REGISTRY, Actor, ToolContext, ToolError
from .audit import catat
from .matching import proses_kedaluwarsa
from .models import User


def konteks(db: Session, user: User) -> ToolContext:
    actor = Actor(role=user.role, phone=user.phone or "", user=user)
    # conversation hanya dipakai konfirmasi_aksi (alur WhatsApp), tidak di jalur web.
    return ToolContext(db=db, actor=actor, conversation=None, turn_id=0)  # type: ignore[arg-type]


def segarkan(db: Session) -> None:
    """Lepas penawaran/kunci pesanan yang kedaluwarsa supaya dashboard melihat keadaan terbaru."""
    proses_kedaluwarsa(db, sistem_notifier(db))
    db.commit()


def jalankan(db: Session, user: User, nama: str, args: dict | None = None, *, commit: bool = True):
    """Jalankan satu tool atas nama `user`. ToolError menjadi HTTP 409 dengan pesan yang sama."""
    t = REGISTRY[nama]
    if user.role not in t.roles:
        raise HTTPException(403, "Tidak punya akses.")
    ctx = konteks(db, user)
    args = dict(args or {})
    try:
        if t.writes:
            _, d = t.prepare(ctx, args)
            hasil = t.run(ctx, d)
            catat(db, ctx.actor.aktor, t.name, data={"args": d, "hasil": hasil, "kanal": "web"})
        else:
            hasil = t.run(ctx, args)
    except ToolError as exc:
        db.rollback()
        raise HTTPException(409, str(exc)) from None
    notify = sistem_notifier(db)
    for n in ctx.notifikasi:
        notify(n.phone, n.role, n.text)
    if commit:
        db.commit()
    return hasil

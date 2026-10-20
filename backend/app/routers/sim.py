"""Simulator Chat: jalur yang sama dengan webhook WA, tapi pesan keluar hanya disimpan di DB."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..agent.runner import handle_incoming
from ..auth import require_admin
from ..db import get_db
from ..models import Conversation, Message, Petani, User
from ..normalize import normalisasi_nomor
from ..schemas import MessageOut, SimChatIn, SimContact

router = APIRouter(prefix="/api/sim", tags=["simulator"], dependencies=[Depends(require_admin)])


def _out(m: Message, phone: str) -> MessageOut:
    o = MessageOut.model_validate(m)
    o.phone = phone
    return o


@router.post("/chat")
def sim_chat(body: SimChatIn, db: Session = Depends(get_db)):
    phone = normalisasi_nomor(body.phone)
    if len(phone) < 9:
        raise HTTPException(422, "Nomor tidak valid.")
    hasil = handle_incoming(db, phone, body.text.strip(), channel="simulator")
    if hasil is None:
        return {"replies": [], "notifications": []}
    ids = {m.conversation_id for m in hasil.notifikasi}
    phones = dict(db.execute(select(Conversation.id, Conversation.phone).where(Conversation.id.in_(ids))).all())
    return {
        "replies": [_out(m, phone) for m in hasil.balasan],
        "notifications": [_out(m, phones.get(m.conversation_id)) for m in hasil.notifikasi],
    }


@router.get("/messages", response_model=list[MessageOut])
def sim_messages(phone: str, after_id: int = 0, db: Session = Depends(get_db)):
    phone = normalisasi_nomor(phone)
    conv = db.scalar(select(Conversation).where(Conversation.phone == phone))
    if conv is None:
        return []
    rows = db.scalars(
        select(Message).where(Message.conversation_id == conv.id, Message.id > after_id).order_by(Message.id).limit(200)
    ).all()
    return [_out(m, phone) for m in rows]


@router.get("/contacts", response_model=list[SimContact])
def sim_contacts(db: Session = Depends(get_db)):
    kontak: list[SimContact] = []
    for u in db.scalars(select(User).where(User.role.in_(("driver", "distributor")), User.phone.is_not(None))):
        detail = f"{u.kapasitas_kg:g} kg, {u.plat_nomor or '-'}" if u.role == "driver" and u.kapasitas_kg else u.nama_usaha
        kontak.append(SimContact(phone=u.phone, role=u.role, name=u.name, detail=detail))
    for p in db.scalars(select(Petani).order_by(Petani.id).limit(50)):
        kontak.append(SimContact(phone=p.phone, role="petani", name=p.name, detail=p.desa))
    return kontak


@router.delete("/conversations/{phone}")
def sim_reset(phone: str, reset_consent: bool = False, db: Session = Depends(get_db)):
    phone = normalisasi_nomor(phone)
    conv = db.scalar(select(Conversation).where(Conversation.phone == phone))
    if conv is not None:
        db.execute(delete(Message).where(Message.conversation_id == conv.id))
        conv.pending_action = None
    if reset_consent:
        p = db.scalar(select(Petani).where(Petani.phone == phone))
        if p is not None:
            p.consent_at = None
    db.commit()
    return {"ok": True}

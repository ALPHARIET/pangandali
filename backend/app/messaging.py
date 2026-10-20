"""Penyimpanan dan pengiriman pesan keluar + antrean kirim ulang."""
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from .channels import OutgoingMessage, get_channel
from .config import get_settings
from .models import Conversation, Message, as_utc
from .operasional import get_operasional

log = logging.getLogger(__name__)


def conversation_for(db: Session, phone: str, role: str, channel: str | None = None) -> Conversation:
    conv = db.scalar(select(Conversation).where(Conversation.phone == phone))
    if conv is None:
        conv = Conversation(phone=phone, role=role, channel=channel or default_channel())
        db.add(conv)
        db.flush()
    conv.role = role
    return conv


def default_channel() -> str:
    """Kanal untuk notifikasi yang dipicu sistem/admin kepada nomor yang belum pernah chat."""
    s = get_settings()
    if s.wa_access_token and s.wa_phone_number_id:
        return "whatsapp"
    if s.wa_web_secret:
        return "whatsapp_web"
    return "simulator"


def kirim(
    db: Session,
    conv: Conversation,
    text: str,
    channel: str | None = None,
    *,
    notification: bool = False,
    meta: dict | None = None,
) -> Message:
    """Simpan pesan keluar lalu coba kirim. Gagal kirim tidak membatalkan transaksi; pesan masuk antrean ulang."""
    channel = channel or conv.channel
    msg = Message(
        conversation_id=conv.id,
        direction="out",
        text=text,
        channel=channel,
        is_notification=notification,
        meta=dict(meta or {}) or None,
    )
    db.add(msg)
    db.flush()
    _coba_kirim(db, msg, conv)
    return msg


def _coba_kirim(db: Session, msg: Message, conv: Conversation) -> None:
    msg.send_attempts = (msg.send_attempts or 0) + 1
    try:
        info = get_channel(msg.channel).send(
            OutgoingMessage(phone=conv.phone, text=msg.text, is_notification=msg.is_notification),
            last_inbound_at=as_utc(conv.last_inbound_at),
        )
    except Exception as exc:  # noqa: BLE001
        log.warning("Gagal mengirim pesan %s ke %s via %s: %s", msg.id, conv.phone, msg.channel, exc)
        meta = dict(msg.meta or {})
        meta["send_error"] = str(exc)[:300]
        msg.meta = meta
        maks = get_operasional(db).maks_kirim_ulang
        if msg.send_attempts >= maks:
            msg.send_status, msg.next_retry_at = "menyerah", None
        else:
            msg.send_status = "gagal"
            # Backoff: 1, 2, 4, 8 ... menit
            msg.next_retry_at = datetime.now(timezone.utc) + timedelta(minutes=2 ** (msg.send_attempts - 1))
        return
    msg.send_status, msg.next_retry_at = "terkirim", None
    msg.wa_message_id = info.get("wa_message_id") or msg.wa_message_id
    extra = {k: v for k, v in info.items() if k != "wa_message_id"}
    if extra:
        msg.meta = {**(msg.meta or {}), **extra}


def kirim_ulang_tertunda(db: Session, now: datetime | None = None) -> int:
    now = now or datetime.now(timezone.utc)
    rows = db.scalars(select(Message).where(Message.send_status == "gagal").order_by(Message.id).limit(50)).all()
    n = 0
    for m in rows:
        if m.next_retry_at and as_utc(m.next_retry_at) > now:
            continue
        _coba_kirim(db, m, m.conversation)
        n += 1
    return n

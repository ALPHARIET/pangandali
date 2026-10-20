"""Webhook WhatsApp Cloud API: verifikasi GET, cek signature POST, balas 200 cepat lalu proses di background."""
import hmac
import json
import logging

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, Query, Request, Response
from pydantic import BaseModel, Field

from ..agent.runner import handle_incoming
from ..channels.whatsapp import verify_signature
from ..config import get_settings
from ..db import SessionLocal

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/webhook", tags=["webhook"])


@router.get("/whatsapp")
def verify(
    mode: str = Query(None, alias="hub.mode"),
    token: str = Query(None, alias="hub.verify_token"),
    challenge: str = Query(None, alias="hub.challenge"),
):
    expected = get_settings().wa_verify_token
    if mode == "subscribe" and expected and token == expected:
        return Response(content=challenge or "", media_type="text/plain")
    raise HTTPException(403, "Verifikasi gagal.")


@router.post("/whatsapp")
async def receive(request: Request, background: BackgroundTasks):
    raw = await request.body()
    if not verify_signature(raw, request.headers.get("X-Hub-Signature-256")):
        raise HTTPException(401, "Signature tidak valid.")
    try:
        payload = json.loads(raw)
    except ValueError:
        raise HTTPException(400, "Body bukan JSON.") from None
    for pesan in extract_messages(payload):
        background.add_task(process_message, **pesan)
    return {"ok": True}


def extract_messages(payload: dict) -> list[dict]:
    hasil = []
    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            names = {c.get("wa_id"): (c.get("profile") or {}).get("name") for c in value.get("contacts", [])}
            for m in value.get("messages", []):
                if m.get("type") == "text":
                    text = m["text"]["body"]
                elif m.get("type") == "button":
                    text = m["button"].get("text", "")
                elif m.get("type") == "interactive":
                    inter = m["interactive"]
                    text = (inter.get("button_reply") or inter.get("list_reply") or {}).get("title", "")
                else:
                    # Foto/suara/lokasi belum didukung agent; tetap dibalas supaya petani tahu.
                    text = f"[pesan {m.get('type')} belum didukung]"
                hasil.append({"phone": m["from"], "text": text, "wa_message_id": m["id"], "profile_name": names.get(m["from"])})
    return hasil


class PesanBridge(BaseModel):
    phone: str = Field(min_length=6, max_length=20)
    text: str = Field(max_length=4000)
    id: str = Field(min_length=1, max_length=128)
    name: str | None = Field(default=None, max_length=120)


@router.post("/wa-web")
def receive_wa_web(body: PesanBridge, background: BackgroundTasks, x_bridge_secret: str | None = Header(default=None)):
    """Pesan masuk dari wa-bridge (Baileys). Diamankan dengan kunci rahasia bersama WA_WEB_SECRET."""
    secret = get_settings().wa_web_secret
    if not secret or not x_bridge_secret or not hmac.compare_digest(secret, x_bridge_secret):
        raise HTTPException(401, "Kunci bridge tidak valid.")
    if body.text.strip():
        # Prefix id supaya tidak bentrok dengan id pesan Cloud API.
        background.add_task(process_message, body.phone, body.text, f"waweb:{body.id}", body.name, "whatsapp_web")
    return {"ok": True}


def process_message(phone: str, text: str, wa_message_id: str, profile_name: str | None = None, channel: str = "whatsapp") -> None:
    db = SessionLocal()
    try:
        handle_incoming(db, phone, text, channel=channel, wa_message_id=wa_message_id, profile_name=profile_name)
    except Exception:  # noqa: BLE001
        log.exception("Gagal memproses pesan WA %s", wa_message_id)
        db.rollback()
    finally:
        db.close()

"""WhatsApp Cloud API resmi (Meta)."""
import hashlib
import hmac
import logging
from datetime import datetime, timedelta, timezone

import httpx

from ..config import get_settings
from .base import OutgoingMessage

log = logging.getLogger(__name__)

WINDOW = timedelta(hours=24)


class WhatsAppError(RuntimeError):
    pass


def verify_signature(raw_body: bytes, header: str | None) -> bool:
    secret = get_settings().wa_app_secret
    if not secret or not header or not header.startswith("sha256="):
        return False
    expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, header.removeprefix("sha256="))


class WhatsAppChannel:
    name = "whatsapp"

    def __init__(self, transport: httpx.BaseTransport | None = None):
        s = get_settings()
        self.s = s
        self._http = httpx.Client(timeout=20, transport=transport)

    @property
    def _url(self) -> str:
        return f"https://graph.facebook.com/{self.s.wa_graph_version}/{self.s.wa_phone_number_id}/messages"

    def send(self, msg: OutgoingMessage, *, last_inbound_at: datetime | None = None) -> dict:
        if not self.s.wa_access_token or not self.s.wa_phone_number_id:
            raise WhatsAppError("WA_ACCESS_TOKEN / WA_PHONE_NUMBER_ID belum diset.")
        if last_inbound_at is not None and last_inbound_at.tzinfo is None:
            last_inbound_at = last_inbound_at.replace(tzinfo=timezone.utc)
        in_window = last_inbound_at is not None and datetime.now(timezone.utc) - last_inbound_at < WINDOW
        if in_window:
            body = {"type": "text", "text": {"body": msg.text, "preview_url": False}}
        elif self.s.wa_notify_template:
            # Di luar jendela 24 jam Meta hanya menerima template yang sudah disetujui.
            body = {
                "type": "template",
                "template": {
                    "name": self.s.wa_notify_template,
                    "language": {"code": self.s.wa_template_lang},
                    "components": [{"type": "body", "parameters": [{"type": "text", "text": msg.text[:1000]}]}],
                },
            }
        else:
            raise WhatsAppError("Penerima di luar jendela 24 jam dan WA_NOTIFY_TEMPLATE belum diset.")
        payload = {"messaging_product": "whatsapp", "recipient_type": "individual", "to": msg.phone, **body}
        resp = self._http.post(self._url, json=payload, headers={"Authorization": f"Bearer {self.s.wa_access_token}"})
        if resp.status_code >= 400:
            raise WhatsAppError(f"Graph API HTTP {resp.status_code}: {resp.text[:300]}")
        data = resp.json()
        return {"wa_message_id": (data.get("messages") or [{}])[0].get("id"), "template": not in_window}

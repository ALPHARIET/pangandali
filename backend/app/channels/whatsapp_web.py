"""WhatsApp lewat jembatan Baileys (wa-bridge/, login scan QR).

TIDAK RESMI: hanya untuk uji lokal/demo dengan nomor cadangan. Jalur produksi tetap WhatsAppChannel (Cloud API).
Tidak ada aturan jendela 24 jam di sini, tapi tetap batasi pesan yang dikirim duluan supaya nomor tidak diblokir.
"""
import httpx

from ..config import get_settings
from .base import OutgoingMessage


class WhatsAppWebError(RuntimeError):
    pass


class WhatsAppWebChannel:
    name = "whatsapp_web"

    def __init__(self, transport: httpx.BaseTransport | None = None):
        self.s = get_settings()
        self._http = httpx.Client(timeout=20, transport=transport)

    def send(self, msg: OutgoingMessage, *, last_inbound_at=None) -> dict:
        if not self.s.wa_web_secret:
            raise WhatsAppWebError("WA_WEB_SECRET belum diset.")
        try:
            resp = self._http.post(
                f"{self.s.wa_web_bridge_url.rstrip('/')}/send",
                json={"to": msg.phone, "text": msg.text},
                headers={"X-Bridge-Secret": self.s.wa_web_secret},
            )
        except httpx.HTTPError as exc:
            raise WhatsAppWebError(f"wa-bridge tidak bisa dihubungi: {exc.__class__.__name__}") from exc
        if resp.status_code >= 400:
            raise WhatsAppWebError(f"wa-bridge HTTP {resp.status_code}: {resp.text[:200]}")
        return {"wa_message_id": resp.json().get("id")}

from dataclasses import dataclass
from typing import Protocol


@dataclass
class OutgoingMessage:
    phone: str
    text: str
    is_notification: bool = False  # dikirim duluan oleh sistem (bukan balasan langsung)


class Channel(Protocol):
    name: str

    def send(self, msg: OutgoingMessage, *, last_inbound_at=None) -> dict:
        """Kirim pesan. Kembalikan metadata (mis. id pesan WA) untuk disimpan."""
        ...

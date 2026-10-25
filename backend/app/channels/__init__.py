from .base import Channel, OutgoingMessage
from .simulator import SimulatorChannel
from .whatsapp import WhatsAppChannel
from .whatsapp_web import WhatsAppWebChannel

_registry: dict[str, Channel] = {}


def get_channel(name: str) -> Channel:
    if name not in _registry:
        if name == "whatsapp":
            _registry[name] = WhatsAppChannel()
        elif name == "whatsapp_web":
            _registry[name] = WhatsAppWebChannel()
        elif name == "simulator":
            _registry[name] = SimulatorChannel()
        else:
            raise KeyError(name)
    return _registry[name]


def set_channel(name: str, channel: Channel) -> None:
    """Untuk test: ganti implementasi channel."""
    _registry[name] = channel


__all__ = ["Channel", "OutgoingMessage", "get_channel", "set_channel"]

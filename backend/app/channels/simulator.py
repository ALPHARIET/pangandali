from .base import OutgoingMessage


class SimulatorChannel:
    """Pesan keluar cukup disimpan di DB; UI Simulator Chat mengambilnya lewat polling."""

    name = "simulator"

    def send(self, msg: OutgoingMessage, *, last_inbound_at=None) -> dict:
        return {}

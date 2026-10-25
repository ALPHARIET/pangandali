"""Kerangka tools agent.

Tool baca langsung dijalankan. Tool tulis (writes=True) TIDAK langsung dijalankan:
`prepare` memvalidasi + menormalisasi argumen dan menghasilkan ringkasan, lalu runner
menyimpannya sebagai pending_action. Aksi baru dieksekusi saat agent memanggil
`konfirmasi_aksi` pada giliran pesan berikutnya (setelah pengguna menjawab).
"""
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy.orm import Session

from ...models import Conversation, Petani, User


class ToolError(Exception):
    """Kesalahan yang aman ditampilkan ke model (input tidak valid, data tidak ditemukan)."""


@dataclass
class Notifikasi:
    phone: str
    role: str
    text: str


@dataclass
class Actor:
    role: str  # petani | driver | distributor
    phone: str
    petani: Petani | None = None
    user: User | None = None

    @property
    def aktor(self) -> str:
        """Label untuk audit log."""
        if self.petani is not None:
            return f"petani:{self.petani.id}"
        return f"{self.role}:{self.user.id}" if self.user else f"nomor:{self.phone}"

    @property
    def nama(self) -> str:
        if self.petani is not None:
            return self.petani.name or "Bapak/Ibu"
        return self.user.name if self.user else "Bapak/Ibu"


@dataclass
class ToolContext:
    db: Session
    actor: Actor
    conversation: Conversation
    turn_id: int  # id pesan masuk yang sedang diproses
    notifikasi: list[Notifikasi] = field(default_factory=list)
    log: list[dict] = field(default_factory=list)

    def notify(self, phone: str | None, role: str, text: str) -> None:
        if phone and phone != self.actor.phone:
            self.notifikasi.append(Notifikasi(phone=phone, role=role, text=text))


Handler = Callable[[ToolContext, dict], Any]


@dataclass
class Tool:
    name: str
    description: str
    parameters: dict
    roles: tuple[str, ...]
    run: Handler
    prepare: Callable[[ToolContext, dict], tuple[str, dict]] | None = None

    @property
    def writes(self) -> bool:
        return self.prepare is not None

    def schema(self) -> dict:
        return {"type": "function", "function": {"name": self.name, "description": self.description, "parameters": self.parameters}}


REGISTRY: dict[str, Tool] = {}


def tool(name: str, description: str, parameters: dict, roles: tuple[str, ...], prepare=None):
    def deco(fn: Handler) -> Handler:
        REGISTRY[name] = Tool(name, description, parameters, roles, fn, prepare)
        return fn

    return deco


def obj(properties: dict, required: list[str] | None = None) -> dict:
    return {"type": "object", "properties": properties, "required": required or []}


def tools_for(role: str) -> list[Tool]:
    return [t for t in REGISTRY.values() if role in t.roles]

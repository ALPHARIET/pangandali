import json
import os
import tempfile
from pathlib import Path

_tmp = Path(tempfile.mkdtemp()) / "test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp.as_posix()}"
os.environ["SETTINGS_ENCRYPTION_KEY"] = __import__("cryptography.fernet").fernet.Fernet.generate_key().decode()
os.environ["JWT_SECRET"] = "test-secret-yang-cukup-panjang-untuk-hs256"
os.environ["ADMIN_PASSWORD"] = "rahasia123"
os.environ["WA_APP_SECRET"] = "app-secret"
os.environ["WA_VERIFY_TOKEN"] = "verify-me"
os.environ["BACKGROUND_JOBS"] = "false"
os.environ["WA_ACCESS_TOKEN"] = ""
os.environ["WA_PHONE_NUMBER_ID"] = ""
# Jangan pernah memakai wa-bridge asli saat tes (bisa mengirim WhatsApp sungguhan).
os.environ["WA_WEB_SECRET"] = ""

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.db import Base, SessionLocal, engine  # noqa: E402
from app.llm.client import LLMReply, ToolCall  # noqa: E402
from app.main import app  # noqa: E402
from app.seed import seed_admin, seed_demo  # noqa: E402


@pytest.fixture(autouse=True)
def fresh_db():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed_admin(db)
        seed_demo(db)
        db.commit()
    yield


@pytest.fixture
def db():
    with SessionLocal() as s:
        yield s


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def admin_headers(client):
    r = client.post("/api/auth/login", json={"email": "admin@pangandali.id", "password": "rahasia123"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


class ScriptedLLM:
    """LLM palsu: tiap panggilan chat() mengambil langkah berikutnya dari skrip.

    Langkah berupa str (balasan teks) atau list[(nama_tool, args_dict)].
    Semua pesan yang dikirim ke LLM disimpan di .calls untuk diperiksa.
    """

    def __init__(self, steps):
        self.steps = list(steps)
        self.calls: list[list[dict]] = []

    def chat(self, messages, tools=None):
        self.calls.append(json.loads(json.dumps(messages, default=str)))
        step = self.steps.pop(0)
        if isinstance(step, Exception):
            raise step
        if isinstance(step, str):
            return LLMReply(content=step, raw_message={"role": "assistant", "content": step})
        calls = [ToolCall(id=f"c{i}", name=n, arguments=json.dumps(a)) for i, (n, a) in enumerate(step)]
        raw = {
            "role": "assistant",
            "content": None,
            "tool_calls": [{"id": c.id, "type": "function", "function": {"name": c.name, "arguments": c.arguments}} for c in calls],
        }
        return LLMReply(content=None, tool_calls=calls, raw_message=raw)

    def tool_results(self, call_index: int) -> list[dict]:
        return [json.loads(m["content"]) for m in self.calls[call_index] if m["role"] == "tool"]


@pytest.fixture
def scripted():
    return ScriptedLLM


def kirim_pesan(db, phone, text, llm, **kw):
    from app.agent.runner import handle_incoming

    return handle_incoming(db, phone, text, channel="simulator", llm_factory=lambda _db: llm, **kw)


def aksi(db, phone, tool, args, balasan="Betul?"):
    """Jalankan satu aksi tulis lengkap: ajukan (tool) lalu pengguna setuju (konfirmasi_aksi)."""
    llm1 = ScriptedLLM([[(tool, args)], balasan])
    kirim_pesan(db, phone, f"[{tool}]", llm1)
    hasil_ajuan = llm1.tool_results(1)[0]
    assert hasil_ajuan.get("status") == "menunggu_konfirmasi", hasil_ajuan
    llm2 = ScriptedLLM([[("konfirmasi_aksi", {})], "Siap."])
    h = kirim_pesan(db, phone, "ya", llm2)
    hasil = llm2.tool_results(1)[0]
    assert hasil.get("status") == "berhasil", hasil
    return hasil["hasil"], h


def panggil(db, phone, tool, args):
    """Panggil tool baca/langsung, kembalikan hasilnya."""
    llm = ScriptedLLM([[(tool, args)], "Oke."])
    h = kirim_pesan(db, phone, f"[{tool}]", llm)
    return llm.tool_results(1)[0], h

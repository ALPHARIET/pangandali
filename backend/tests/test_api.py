import hashlib
import hmac
import json

import httpx
import pytest
from pydantic import ValidationError
from sqlalchemy import select

from app.channels import set_channel
from app.channels.simulator import SimulatorChannel
from app.config import Settings, get_settings
from app.llm.client import OpenAICompatClient
from app.messaging import conversation_for, kirim, kirim_ulang_tertunda
from app.models import AuditLog, LaporanPanen, Message, Petani
from app.operasional import get_operasional
from app.routers import webhook
from app.settings_store import LLMConfig, llm_config


def test_login_dan_rbac(client, admin_headers):
    assert client.post("/api/auth/login", json={"email": "admin@pangandali.id", "password": "salah"}).status_code == 401
    assert client.get("/api/admin/users").status_code == 401
    assert client.get("/api/auth/me", headers=admin_headers).json()["role"] == "admin"


def test_pengaturan_hanya_dari_env(client, admin_headers, monkeypatch):
    # Menu/endpoint pengaturan sudah dihapus: LLM dan ambang dibaca dari backend/.env.
    assert client.get("/api/admin/settings/llm", headers=admin_headers).status_code == 404
    assert client.put("/api/admin/settings/operasional", headers=admin_headers, json={}).status_code in (404, 405)
    s = get_settings()
    monkeypatch.setattr(s, "maks_deviasi_km", 25.0)
    monkeypatch.setattr(s, "llm_base_url", "https://openrouter.ai/api/v1/chat/completions/")
    assert get_operasional().maks_deviasi_km == 25.0
    assert llm_config().base_url == "https://openrouter.ai/api/v1"


def test_ambang_env_divalidasi(monkeypatch):
    monkeypatch.setenv("MAKS_DEVIASI_KM", "-1")
    with pytest.raises(ValidationError):
        Settings()


def test_daftar_petani_lokasi_jarak(client, admin_headers):
    r = client.post("/api/admin/petani", headers=admin_headers, json={"phone": "0857 1111 4444", "name": "Bu Ani", "desa": "mekar sari"})
    assert r.status_code == 201 and r.json()["phone"] == "6285711114444"
    assert client.post("/api/admin/petani", headers=admin_headers, json={"phone": "085711114444", "name": "Dobel"}).status_code == 409
    assert client.post("/api/admin/petani", headers=admin_headers, json={"phone": "081234567890", "name": "Driver"}).status_code == 409

    lok = client.post("/api/admin/lokasi", headers=admin_headers, json={"nama": "Air Duku", "jenis": "desa", "kecamatan": "Selupu Rejang"}).json()
    curup = next(l for l in client.get("/api/admin/lokasi", headers=admin_headers).json() if l["nama"] == "Curup")
    j1 = client.put("/api/admin/jarak", headers=admin_headers, json={"asal_id": lok["id"], "tujuan_id": curup["id"], "km": 12, "sumber": "odometer"}).json()
    j2 = client.put("/api/admin/jarak", headers=admin_headers, json={"asal_id": curup["id"], "tujuan_id": lok["id"], "km": 12.5}).json()
    assert j1["id"] == j2["id"] and j2["km"] == 12.5, "satu baris per pasangan, berlaku dua arah"


def test_validasi_laporan_satuan_lokal_wajib_kg(client, admin_headers, db):
    p = db.scalar(select(Petani).where(Petani.phone == "6281300001111"))
    r = client.post("/api/laporan", headers=admin_headers, json={"petani_id": p.id, "komoditas": "cabe", "jumlah": 6, "satuan": "karung"})
    assert r.status_code == 201 and r.json()["jumlah_kg"] is None and r.json()["status"] == "menunggu_validasi"
    lid = r.json()["id"]
    assert client.post(f"/api/laporan/{lid}/validasi", headers=admin_headers, json={"setujui": True}).status_code == 422
    r = client.post(f"/api/laporan/{lid}/validasi", headers=admin_headers, json={"setujui": True, "kg_per_satuan": 45, "catatan": "dikonfirmasi via telepon"})
    assert r.json()["status"] == "tersedia" and r.json()["jumlah_kg"] == 270 and r.json()["sisa_kg"] == 270
    notif = db.scalars(select(Message).where(Message.is_notification.is_(True))).all()
    assert any("sudah diperiksa petugas" in m.text for m in notif)
    assert client.post(f"/api/laporan/{lid}/validasi", headers=admin_headers, json={"setujui": False}).status_code == 409
    assert db.scalar(select(AuditLog).where(AuditLog.aksi == "validasi_laporan", AuditLog.entitas_id == lid)) is not None


def test_tolak_laporan(client, admin_headers, db):
    p = db.scalar(select(Petani).where(Petani.phone == "6281300001111"))
    lid = client.post("/api/laporan", headers=admin_headers, json={"petani_id": p.id, "komoditas": "kubis", "jumlah": 1, "satuan": "ton"}).json()["id"]
    r = client.post(f"/api/laporan/{lid}/validasi", headers=admin_headers, json={"setujui": False, "catatan": "foto tidak sesuai"})
    assert r.json()["status"] == "ditolak"
    assert db.get(LaporanPanen, lid).sisa_kg == 0


def test_dashboard_pasokan(client, admin_headers):
    r = client.get("/api/dashboard/pasokan", headers=admin_headers)
    assert r.status_code == 200
    body = r.json()
    assert set(body["stok_tersedia_kg"]) >= {"Cabai Besar", "Kubis"} and len(body["tren_laporan_kg"]) == 14


def test_simulator_endpoint(client, admin_headers, monkeypatch):
    from app.agent import runner
    from app.llm.client import LLMReply

    class Fake:
        def chat(self, messages, tools=None):
            return LLMReply(content="Halo Pak Slamet!", raw_message={})

    monkeypatch.setattr(runner, "default_llm", lambda db: Fake())
    r = client.post("/api/sim/chat", headers=admin_headers, json={"phone": "081300001111", "text": "halo"})
    assert r.status_code == 200 and r.json()["replies"][0]["text"] == "Halo Pak Slamet!"
    msgs = client.get("/api/sim/messages", headers=admin_headers, params={"phone": "6281300001111"}).json()
    assert [m["direction"] for m in msgs] == ["in", "out"]


def test_antrean_kirim_ulang(db):
    class Rusak:
        name = "simulator"
        gagal = True

        def send(self, msg, *, last_inbound_at=None):
            if Rusak.gagal:
                raise RuntimeError("jaringan putus")
            return {}

    set_channel("simulator", Rusak())
    try:
        conv = conversation_for(db, "6281300001111", "petani", "simulator")
        m = kirim(db, conv, "tes", "simulator", notification=True)
        assert m.send_status == "gagal" and m.send_attempts == 1
        Rusak.gagal = False
        from datetime import datetime, timedelta, timezone

        assert kirim_ulang_tertunda(db, now=datetime.now(timezone.utc) + timedelta(minutes=5)) == 1
        assert m.send_status == "terkirim" and m.send_attempts == 2
    finally:
        set_channel("simulator", SimulatorChannel())


def test_webhook_verifikasi_dan_signature(client, monkeypatch):
    r = client.get("/api/webhook/whatsapp", params={"hub.mode": "subscribe", "hub.verify_token": "verify-me", "hub.challenge": "42"})
    assert r.text == "42"
    assert client.get("/api/webhook/whatsapp", params={"hub.mode": "subscribe", "hub.verify_token": "x"}).status_code == 403

    payload = {
        "entry": [{"changes": [{"value": {
            "contacts": [{"wa_id": "6281300001111", "profile": {"name": "Slamet"}}],
            "messages": [{"from": "6281300001111", "id": "wamid.X", "type": "text", "text": {"body": "halo"}}],
        }}]}]
    }
    raw = json.dumps(payload).encode()
    assert client.post("/api/webhook/whatsapp", content=raw, headers={"X-Hub-Signature-256": "sha256=salah"}).status_code == 401

    diterima = []
    monkeypatch.setattr(webhook, "process_message", lambda **kw: diterima.append(kw))
    sig = "sha256=" + hmac.new(b"app-secret", raw, hashlib.sha256).hexdigest()
    r = client.post("/api/webhook/whatsapp", content=raw, headers={"X-Hub-Signature-256": sig, "Content-Type": "application/json"})
    assert r.status_code == 200
    assert diterima == [{"phone": "6281300001111", "text": "halo", "wa_message_id": "wamid.X", "profile_name": "Slamet"}]


def test_llm_client_format_openai():
    def handler(request: httpx.Request):
        body = json.loads(request.content)
        assert request.url.path.endswith("/chat/completions")
        assert request.headers["Authorization"] == "Bearer k"
        assert body["tools"][0]["function"]["name"] == "ping"
        return httpx.Response(200, json={"choices": [{"message": {"role": "assistant", "content": None, "tool_calls": [
            {"id": "a", "type": "function", "function": {"name": "ping", "arguments": "{\"ok\": true}"}}]}}]})

    c = OpenAICompatClient(LLMConfig("https://x/v1", "k", "m"), transport=httpx.MockTransport(handler))
    reply = c.chat([{"role": "user", "content": "hi"}], tools=[{"type": "function", "function": {"name": "ping", "parameters": {}}}])
    assert reply.tool_calls[0].name == "ping"


def test_llm_client_balasan_sse_dirangkai():
    sse = (
        'data: {"choices":[{"index":0,"delta":{"role":"assistant"}}]}\n\n'
        'data: {"choices":[{"index":0,"delta":{"tool_calls":[{"id":"c1","index":0,"type":"function","function":{"name":"cek_harga","arguments":"{\\"komo"}}]}}]}\n\n'
        'data: {"choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"function":{"arguments":"ditas\\": \\"kol\\"}"}}]}}]}\n\n'
        'data: {"choices":[{"index":0,"delta":{},"finish_reason":"tool_calls"}]}\n\ndata: [DONE]\n'
    )

    def handler(request: httpx.Request):
        assert json.loads(request.content)["stream"] is False
        return httpx.Response(200, text=sse, headers={"content-type": "text/event-stream"})

    c = OpenAICompatClient(LLMConfig("https://x/v1", "k", "m"), transport=httpx.MockTransport(handler))
    reply = c.chat([{"role": "user", "content": "hi"}])
    assert reply.tool_calls[0].name == "cek_harga" and json.loads(reply.tool_calls[0].arguments) == {"komoditas": "kol"}


def test_wa_web_bridge_masuk_dan_keluar(client, db, monkeypatch):
    from app.channels import set_channel
    from app.channels.whatsapp_web import WhatsAppWebChannel
    from app.config import get_settings

    terkirim = []

    def handler(request: httpx.Request):
        assert request.headers["X-Bridge-Secret"] == "rahasia-bridge"
        terkirim.append(json.loads(request.content))
        return httpx.Response(200, json={"id": "BAE5"})

    monkeypatch.setattr(get_settings(), "wa_web_secret", "rahasia-bridge")
    set_channel("whatsapp_web", WhatsAppWebChannel(transport=httpx.MockTransport(handler)))
    try:
        body = {"phone": "6285711110000", "text": "halo", "id": "ABC", "name": "Tes"}
        assert client.post("/api/webhook/wa-web", json=body).status_code == 401
        assert client.post("/api/webhook/wa-web", json=body, headers={"X-Bridge-Secret": "salah"}).status_code == 401
        assert client.post("/api/webhook/wa-web", json=body, headers={"X-Bridge-Secret": "rahasia-bridge"}).status_code == 200
        # Nomor belum terdaftar → dibalas pesan sopan lewat bridge
        assert terkirim and terkirim[0]["to"] == "6285711110000" and "belum terdaftar" in terkirim[0]["text"]
        msg = db.scalars(select(Message).where(Message.direction == "out").order_by(Message.id.desc())).first()
        assert msg.channel == "whatsapp_web" and msg.send_status == "terkirim"
    finally:
        set_channel("whatsapp_web", WhatsAppWebChannel())

"""Klien LLM OpenAI-compatible (/chat/completions dengan tools).

Bisa dipakai untuk Gemini (endpoint OpenAI-compat), OpenRouter, Groq, Ollama, OpenAI, dll.
Base URL diisi sampai sebelum '/chat/completions', misalnya:
  https://generativelanguage.googleapis.com/v1beta/openai
  https://openrouter.ai/api/v1
  https://api.groq.com/openai/v1
  http://localhost:11434/v1
"""
import json
from dataclasses import dataclass, field
from typing import Any, Protocol

import httpx

from ..config import get_settings
from ..settings_store import LLMConfig


class LLMError(RuntimeError):
    pass


@dataclass
class ToolCall:
    id: str
    name: str
    arguments: str  # JSON string, apa adanya dari model


@dataclass
class LLMReply:
    content: str | None
    tool_calls: list[ToolCall] = field(default_factory=list)
    raw_message: dict[str, Any] = field(default_factory=dict)


class ChatModel(Protocol):
    def chat(self, messages: list[dict], tools: list[dict] | None = None) -> LLMReply: ...


class OpenAICompatClient:
    def __init__(self, cfg: LLMConfig, timeout: float | None = None, transport: httpx.BaseTransport | None = None):
        if not cfg.api_key and "localhost" not in cfg.base_url and "127.0.0.1" not in cfg.base_url:
            raise LLMError("API key LLM belum diatur.")
        self.cfg = cfg
        self._http = httpx.Client(
            timeout=timeout or get_settings().llm_timeout_seconds,
            transport=transport,
        )

    def chat(self, messages: list[dict], tools: list[dict] | None = None, max_tokens: int | None = None) -> LLMReply:
        body: dict[str, Any] = {"model": self.cfg.model, "messages": messages, "temperature": 0.3, "stream": False}
        if tools:
            body["tools"] = tools
            body["tool_choice"] = "auto"
        if max_tokens:
            body["max_tokens"] = max_tokens
        headers = {"Content-Type": "application/json"}
        if self.cfg.api_key:
            headers["Authorization"] = f"Bearer {self.cfg.api_key}"
        try:
            resp = self._http.post(f"{self.cfg.base_url}/chat/completions", json=body, headers=headers)
        except httpx.HTTPError as exc:
            raise LLMError(f"Gagal menghubungi LLM: {exc.__class__.__name__}") from exc
        if resp.status_code >= 400:
            raise LLMError(f"LLM membalas HTTP {resp.status_code}: {_ringkas_error(resp)}")
        try:
            if "event-stream" in resp.headers.get("content-type", "") or resp.text.lstrip().startswith("data:"):
                # Sebagian proxy (mis. router lokal) selalu membalas SSE walau stream=false.
                msg = _rangkai_sse(resp.text)
            else:
                msg = resp.json()["choices"][0]["message"]
        except (ValueError, KeyError, IndexError, TypeError) as exc:
            raise LLMError("Format balasan LLM tidak dikenali.") from exc
        calls = [
            ToolCall(id=c.get("id") or f"call_{i}", name=c["function"]["name"], arguments=c["function"].get("arguments") or "{}")
            for i, c in enumerate(msg.get("tool_calls") or [])
            if c.get("type", "function") == "function"
        ]
        return LLMReply(content=msg.get("content"), tool_calls=calls, raw_message=msg)

    def close(self) -> None:
        self._http.close()


def _rangkai_sse(text: str) -> dict[str, Any]:
    """Gabungkan potongan chat.completion.chunk menjadi satu pesan assistant."""
    content: list[str] = []
    calls: dict[int, dict[str, Any]] = {}
    extra: dict[str, Any] = {}
    ada_chunk = False
    for line in text.splitlines():
        line = line.strip()
        if not line.startswith("data:"):
            continue
        data = line[5:].strip()
        if not data or data == "[DONE]":
            continue
        chunk = json.loads(data)
        if "error" in chunk:
            raise LLMError(f"LLM mengirim error: {str(chunk['error'])[:300]}")
        for choice in chunk.get("choices") or []:
            ada_chunk = True
            delta = choice.get("delta") or choice.get("message") or {}
            if delta.get("content"):
                content.append(delta["content"])
            for tc in delta.get("tool_calls") or []:
                slot = calls.setdefault(tc.get("index", len(calls)), {"id": None, "type": "function", "function": {"name": "", "arguments": ""}})
                if tc.get("id"):
                    slot["id"] = tc["id"]
                fn = tc.get("function") or {}
                if fn.get("name"):
                    slot["function"]["name"] += fn["name"]
                if fn.get("arguments"):
                    slot["function"]["arguments"] += fn["arguments"]
            # Field tambahan (mis. thought signature Gemini) ikut disimpan supaya bisa dikirim balik.
            for key, val in delta.items():
                if key not in ("role", "content", "tool_calls") and val is not None:
                    extra[key] = val
    if not ada_chunk:
        raise ValueError("SSE tanpa choices")
    msg: dict[str, Any] = {"role": "assistant", "content": "".join(content) or None, **extra}
    if calls:
        msg["tool_calls"] = [calls[i] for i in sorted(calls)]
    return msg


def _ringkas_error(resp: httpx.Response) -> str:
    try:
        data = resp.json()
        err = data.get("error", data) if isinstance(data, dict) else data
        if isinstance(err, list) and err:
            err = err[0].get("error", err[0]) if isinstance(err[0], dict) else err[0]
        msg = err.get("message") if isinstance(err, dict) else str(err)
        return str(msg)[:300]
    except ValueError:
        return resp.text[:300]


def test_connection(cfg: LLMConfig) -> dict:
    """Uji koneksi + dukungan tool calling dengan satu panggilan kecil."""
    client = OpenAICompatClient(cfg, timeout=20)
    try:
        tool = {
            "type": "function",
            "function": {
                "name": "ping",
                "description": "Panggil fungsi ini untuk menjawab.",
                "parameters": {"type": "object", "properties": {"ok": {"type": "boolean"}}, "required": ["ok"]},
            },
        }
        reply = client.chat(
            [{"role": "user", "content": "Tes koneksi. Panggil fungsi ping dengan ok=true."}],
            tools=[tool],
            max_tokens=64,
        )
        return {
            "ok": True,
            "model": cfg.model,
            "tool_calling": any(c.name == "ping" for c in reply.tool_calls),
        }
    finally:
        client.close()

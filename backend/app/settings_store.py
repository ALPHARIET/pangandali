"""Konfigurasi LLM. Sumbernya hanya backend/.env (tidak ada lagi pengaturan dari halaman Admin)."""
from dataclasses import dataclass

from .config import get_settings


@dataclass
class LLMConfig:
    base_url: str
    api_key: str
    model: str


def llm_config() -> LLMConfig:
    env = get_settings()
    # Terima juga URL yang terlanjur ditulis lengkap sampai /chat/completions.
    base = env.llm_base_url.strip().rstrip("/").removesuffix("/chat/completions")
    return LLMConfig(base_url=base, api_key=env.llm_api_key.strip(), model=env.llm_model.strip())

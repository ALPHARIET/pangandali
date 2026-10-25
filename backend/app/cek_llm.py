"""Cek koneksi LLM dari backend/.env (pengganti tombol "Tes koneksi" di halaman Admin).

  python -m app.cek_llm
"""
import sys

from .llm.client import LLMError, test_connection
from .settings_store import llm_config


def main() -> int:
    cfg = llm_config()
    print(f"Base URL : {cfg.base_url}")
    print(f"Model    : {cfg.model}")
    print(f"API key  : {'terisi' if cfg.api_key else 'KOSONG (isi LLM_API_KEY di backend/.env)'}")
    try:
        hasil = test_connection(cfg)
    except LLMError as exc:
        print(f"Gagal    : {exc}")
        return 1
    print(f"Koneksi  : OK | tool calling: {'didukung' if hasil['tool_calling'] else 'TIDAK terdeteksi (agent butuh tool calling)'}")
    return 0 if hasil["tool_calling"] else 2


if __name__ == "__main__":
    sys.exit(main())

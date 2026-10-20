from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "dev"
    database_url: str = "sqlite:///./pangandali.db"
    cors_origins: str = "http://localhost:5173"
    timezone: str = "Asia/Jakarta"
    # Job berkala: penawaran/kunci pesanan kedaluwarsa + kirim ulang WA
    background_jobs: bool = True
    background_interval_seconds: int = 60

    # Auth
    jwt_secret: str = "ganti-ini-di-production"
    jwt_expire_minutes: int = 60 * 12
    admin_email: str = "admin@pangandali.id"
    admin_password: str = ""
    admin_name: str = "Admin Dinas Pertanian"
    # Password bersama akun demo (*.demo@pangandali.id). Kosong = acak dan dicetak sekali saat seed.
    demo_password: str = ""

    # Kunci Fernet untuk secret yang disimpan di DB. Saat ini tidak ada secret di DB
    # (LLM & ambang dibaca dari .env), jadi boleh dikosongkan.
    settings_encryption_key: str = ""

    # Aturan operasional (lihat operasional.py). Titik awal uji coba, bukan hasil kesepakatan mitra.
    batas_jemput_hari: int = Field(2, ge=0)
    maks_deviasi_km: float = Field(40.0, ge=0)
    batas_respon_petani_jam: float = Field(12.0, gt=0)
    batas_respon_driver_menit: float = Field(60.0, gt=0)
    pembanding_pulang_pergi: bool = True
    ambang_stok_rendah_kg: float = Field(200.0, ge=0)
    ambang_kenaikan_harga_persen: float = Field(15.0, ge=0)
    ambang_validasi_tertunda_jam: float = Field(24.0, ge=0)
    maks_kirim_ulang: int = Field(5, ge=1)

    # LLM (OpenAI-compatible). Base URL diisi sampai sebelum /chat/completions.
    llm_base_url: str = "https://generativelanguage.googleapis.com/v1beta/openai"
    llm_api_key: str = ""
    llm_model: str = "gemini-2.5-flash"
    llm_timeout_seconds: float = 45
    agent_max_iterations: int = 6
    agent_history_messages: int = 12

    # WhatsApp Cloud API
    wa_verify_token: str = ""
    wa_app_secret: str = ""
    wa_access_token: str = ""
    wa_phone_number_id: str = ""
    wa_graph_version: str = "v21.0"
    # Template yang sudah disetujui Meta untuk pesan di luar jendela 24 jam.
    # Template harus punya satu variabel body {{1}} yang diisi teks notifikasi.
    wa_notify_template: str = ""
    wa_template_lang: str = "id"

    # WhatsApp lewat wa-bridge (Baileys, scan QR). Tidak resmi: hanya untuk uji lokal/demo.
    wa_web_bridge_url: str = "http://127.0.0.1:3010"
    wa_web_secret: str = ""

    @property
    def resolved_database_url(self) -> str:
        """SQLite relatif (sqlite:///./x.db) diartikan relatif ke folder backend, bukan cwd."""
        prefix = "sqlite:///./"
        if self.database_url.startswith(prefix):
            return f"sqlite:///{(BACKEND_DIR / self.database_url[len(prefix):]).as_posix()}"
        # Connection string Neon/Render berawalan postgres:// atau postgresql://; driver yang terpasang psycopg 3.
        for awal in ("postgres://", "postgresql://"):
            if self.database_url.startswith(awal):
                return "postgresql+psycopg://" + self.database_url[len(awal):]
        return self.database_url

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

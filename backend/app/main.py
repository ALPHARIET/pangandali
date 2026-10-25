import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import admin, auth, dashboard, data, mitra, sim, webhook

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger(__name__)

settings = get_settings()
if settings.app_env != "dev" and settings.jwt_secret == "ganti-ini-di-production":
    raise RuntimeError("JWT_SECRET wajib diganti di luar mode dev.")


def jalankan_job_berkala() -> None:
    """Lepas penawaran/kunci pesanan yang kedaluwarsa dan kirim ulang pesan WA yang gagal."""
    from .agent.runner import sistem_notifier
    from .db import SessionLocal
    from .matching import proses_kedaluwarsa
    from .messaging import kirim_ulang_tertunda

    with SessionLocal() as db:
        try:
            proses_kedaluwarsa(db, sistem_notifier(db))
            kirim_ulang_tertunda(db)
            db.commit()
        except Exception:  # noqa: BLE001
            log.exception("Job berkala gagal")
            db.rollback()


async def _loop_berkala(interval: int) -> None:
    while True:
        await asyncio.sleep(interval)
        await asyncio.to_thread(jalankan_job_berkala)


@asynccontextmanager
async def lifespan(_: FastAPI):
    task = asyncio.create_task(_loop_berkala(settings.background_interval_seconds)) if settings.background_jobs else None
    yield
    if task:
        task.cancel()


app = FastAPI(title="PanganDali API", version="0.2.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
)

for r in (auth.router, admin.router, sim.router, webhook.router, data.router, dashboard.router, mitra.akun, mitra.driver, mitra.distributor):
    app.include_router(r)


@app.get("/api/health")
def health():
    return {"ok": True}

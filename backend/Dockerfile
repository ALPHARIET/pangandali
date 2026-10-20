FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN useradd --create-home pangandali && chown -R pangandali /app
USER pangandali

EXPOSE 8000
# Migrasi, buat admin (dan data demo bila SEED_DEMO=1) secara idempoten, lalu jalankan API.
# Seed tidak menggagalkan start bila ADMIN_PASSWORD belum diisi. PORT diisi platform (mis. Render).
CMD ["sh", "-c", "alembic upgrade head && (python -m app.seed ${SEED_DEMO:+--demo} || echo 'seed dilewati') && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'"]

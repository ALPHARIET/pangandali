# PanganDali

**Platform Distribution Intelligence untuk Pengendalian Inflasi Pangan Daerah**

PanganDali mengintegrasikan pelaporan panen petani lewat WhatsApp yang dilayani AI agent, Smart Backhaul Matching untuk optimasi logistik, dan dashboard Early Warning System (EWS) untuk TPID.

## Status

Sedang dimigrasikan dari mockup frontend (GEMASTIK XIX, divisi Kota Cerdas) ke sistem production:

Acuan pengembangan: proposal Inovatera NEON 2026 (tim ALKAIQ).

- **Sudah jalan:**
  - Backend FastAPI dan AI agent dengan tool calling untuk Petani, Mitra Logistik, dan Distributor.
  - Alur lengkap sesuai proposal: laporan → konfirmasi petani → validasi admin → permintaan distributor (volume dikunci, petani terima/tolak) → rekomendasi armada berurutan (baru jadi penugasan setelah mitra setuju) → pemantauan.
  - Modul pengukuran dampak (susut, BBM, km, waktu, utilisasi muatan balik).
  - Dashboard pasokan dengan peringatan berbasis ambang, audit log, input manual, antrean kirim ulang WA, dan skrip uji akurasi ekstraksi.
  - Login JWT, webhook WhatsApp Cloud API, dan wa-bridge (uji lokal).
- **Menu Admin** mengikuti alur proposal: Pantauan (Pasokan & Peringatan, Evaluasi Distribusi), Alur distribusi (Validasi Laporan, Pesanan, Pengiriman & Armada), Data mitra (Petani Terdaftar, Akun Mitra, Lokasi & Jarak). Semua dari database; halaman ilustrasi lama sudah dihapus.
- **Portal web Mitra Logistik & Distributor** memakai `/api/driver/*` dan `/api/distributor/*`, yang menjalankan tools agent yang sama dengan WhatsApp (kunci volume, penawaran berurutan, status pengiriman, catat berat/km/BBM). Mitra baru mengisi profil (`/api/akun/profil`, tanpa unggah dokumen, rekening, atau NPWP), lalu admin menyetujui di menu **Akun Mitra**.

## Lingkup Pilot

- **Wilayah:** Kecamatan Selupu Rejang (Kabupaten Rejang Lebong) menuju Kota Bengkulu (Pasar Panorama)
- **Komoditas:** Cabai Besar, Kubis, Terung, Wortel, Kembang Kol (+ Tomat)
- **Aktor:** Petani (lewat WA, tanpa password), Mitra Logistik, Distributor, TPID, Admin Dinas Pertanian

## Arsitektur

```
WhatsApp Cloud API ──webhook──▶ FastAPI ──▶ BackgroundTasks
Simulator (/api/sim, uji) ────▶ /api/sim/chat ─┘
                                   ▼
                 Agent loop (OpenAI-compatible, tool calling)
                                   ▼
                          Tools → PostgreSQL / SQLite
                                   ▼
          Balasan + notifikasi lintas peran (WhatsAppChannel | SimulatorChannel)
Dashboard React ──JWT──▶ REST API
```

| Bagian | Lokasi |
| --- | --- |
| Konfigurasi (env) | `backend/app/config.py`, `backend/.env.example` |
| Model DB + migrasi | `backend/app/models.py`, `backend/alembic/` |
| Klien LLM | `backend/app/llm/client.py` |
| Agent loop + prompt | `backend/app/agent/runner.py`, `backend/app/agent/prompts.py` |
| Tools per peran | `backend/app/agent/tools/{common,petani,logistik,distributor}.py` |
| Normalisasi komoditas/satuan/tanggal | `backend/app/normalize.py` |
| Channel WA & simulator | `backend/app/channels/` |
| Pencocokan armada (aturan/skor) | `backend/app/matching.py` |
| Lokasi & tabel jarak | `backend/app/geo.py` |
| Pengukuran dampak | `backend/app/dampak.py` |
| Pasokan & peringatan | `backend/app/pasokan.py` |
| Aturan operasional (ambang) | `backend/app/operasional.py` |
| Uji akurasi ekstraksi | `backend/app/evaluasi.py`, `backend/eval/` |
| Frontend API + halaman Admin | `src/api.js`, `src/components/admin/` |

### Cara kerja agent

- Identitas pengguna diambil dari nomor WA. Nomor milik akun driver atau distributor dikenali sesuai perannya.
- **Petani harus terdaftar dulu** lewat menu Petani Terdaftar, yang diisi petugas, PPL, atau kelompok tani. Nomor yang belum terdaftar dibalas sopan dan diarahkan ke petugas. Saat pertama chat, petani diminta menyetujui pemrosesan data (UU PDP).
- **Konfirmasi wajib** untuk aksi tulis. Tool tulis hanya menyimpan `pending_action` dan ringkasannya. Data baru tersimpan setelah pengguna menyetujui di pesan berikutnya, lalu agent memanggil `konfirmasi_aksi`. Server menolak konfirmasi yang dipanggil di giliran yang sama dengan saat aksi diajukan.
- **Pengecualian konfirmasi:** `update_status_pengiriman` dan `tolak_penawaran` milik driver tidak perlu konfirmasi, supaya respons di jalan cepat. Status pengiriman hanya bisa maju dan divalidasi di server.
- **Normalisasi di server:** komoditas dan tanggal relatif (besok, lusa, nama hari). Satuan baku (kg, kwintal, ton) dikonversi otomatis. **Satuan lokal (karung, pikul, ikat) tidak dikonversi tanpa kesepakatan:** agent menanyakan berat per satuan ke petani, dan kalau petani tidak tahu, petugas memastikannya saat validasi.
- **Pencocokan armada:**
  - Syarat wajib: perjalanan mitra yang aktif, kapasitas cukup, komoditas cocok, tanggal masuk jendela jemput, dan tambahan jarak di bawah batas.
  - Ranking: tambahan jarak (50%), tingkat isian (30%), keandalan mitra (20%).
  - Tambahan jarak dihitung dari tabel jarak yang diisi Admin. Jarak yang belum diisi ditandai, bukan ditebak.
  - Penawaran yang ditolak atau kedaluwarsa diteruskan ke kandidat berikutnya, lalu ke petugas kalau kandidat habis.
- **Modul dampak:**
  - Susut = berat muat − berat terima. Penolakan mutu dicatat terpisah.
  - BBM bersih dihemat = BBM skenario pembanding − BBM aktual. Pembanding: perjalanan mitra langsung + angkutan khusus jemput→antar, yang bisa diatur pulang-pergi.
  - Emisi belum dihitung sampai faktor emisi ditetapkan.
- **Ambang dan batas waktu** (jendela jemput, batas deviasi, kunci pesanan, batas jawab penawaran, ambang peringatan) diatur di `backend/.env` (lihat `.env.example`, perlu jalankan ulang API). Nilai awalnya hanya titik mulai uji, bukan hasil kesepakatan mitra.
- Kalau LLM gangguan atau belum diatur, sistem tetap membalas dengan sopan. Laporan panen yang terdeteksi oleh ekstraksi rule-based disimpan dengan status `perlu_review` agar diperiksa admin.
- Webhook bersifat idempoten berdasarkan `message_id` WA, langsung membalas 200, lalu memproses pesan di background.

## Menjalankan (dev lokal)

Prasyarat: Python 3.12+ dan Node 22+.

```bash
cd backend
python -m venv .venv
.venv/Scripts/pip install -r requirements-dev.txt   # Linux/macOS: .venv/bin/pip
cp .env.example .env    # isi ADMIN_PASSWORD, JWT_SECRET, LLM_BASE_URL/LLM_API_KEY/LLM_MODEL
.venv/Scripts/alembic upgrade head
.venv/Scripts/python -m app.seed --demo   # admin + akun demo (driver, distributor, tpid) & data contoh
.venv/Scripts/python -m app.seed --set-demo-password   # samakan password akun demo dengan DEMO_PASSWORD
.venv/Scripts/uvicorn app.main:app --reload --port 8000
```

Di terminal lain (root repo):

```bash
npm install
npm run dev
```

Buka http://localhost:5173 dan login dengan `ADMIN_EMAIL`/`ADMIN_PASSWORD` dari `.env`. Akun demo `driver.demo@`, `driver2.demo@`, `distributor.demo@`, dan `tpid.demo@pangandali.id` memakai `DEMO_PASSWORD` (TPID hanya melihat tampilan agregat). Setelah itu:

1. **LLM** diatur di `backend/.env` (`LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`). Cek koneksi dan dukungan tool calling dengan `python -m app.cek_llm` dari folder `backend`.
2. **Chat sebagai petani/driver/distributor** lewat WhatsApp (wa-bridge untuk uji lokal) atau langsung ke endpoint `/api/sim/*`.

Contoh Base URL:

| Provider | Base URL |
| --- | --- |
| Gemini | `https://generativelanguage.googleapis.com/v1beta/openai` |
| OpenRouter | `https://openrouter.ai/api/v1` |
| Groq | `https://api.groq.com/openai/v1` |
| OpenAI | `https://api.openai.com/v1` |
| Ollama | `http://localhost:11434/v1` |

### Test

```bash
cd backend
.venv/Scripts/python -m pytest -q
```

Test memakai LLM palsu (scripted). Yang diuji: tools, konfirmasi, consent, petani terdaftar, satuan lokal, penguncian pesanan, terima/tolak, penawaran berurutan, kedaluwarsa, batas deviasi, pemesanan ganda, perhitungan dampak, fallback, idempotensi, antrean kirim ulang, RBAC, dan signature webhook.

### Uji akurasi ekstraksi (target proposal ≥85%)

```bash
cd backend
.venv/Scripts/python -m app.evaluasi eval/pesan_uji_contoh.jsonl --out hasil.json
```

Skrip ini membandingkan LLM (dari `backend/.env`) dengan baseline rule-based, per entitas: komoditas, jumlah, satuan, desa, tanggal, dan harga. `eval/pesan_uji_contoh.jsonl` hanya contoh sintetis untuk mengecek skrip. Untuk klaim akurasi, kumpulkan set uji terpisah dari pesan petani asli (dengan izin) dalam format yang sama.

### Data demo

`python -m app.seed --demo` membuat akun, lokasi pilot, perjalanan balik contoh, dan **jarak serta harga CONTOH**. Semuanya diberi label "DATA CONTOH" atau "data contoh (demo)". Ganti dengan data terverifikasi sebelum uji lapangan.

## Docker Compose

```bash
cp backend/.env.example backend/.env   # isi secret
docker compose up --build
docker compose exec api python -m app.seed
```

Web tersedia di http://localhost:8080 dan API di http://localhost:8000 (PostgreSQL 16).

## WhatsApp Cloud API

1. Buat app di Meta for Developers, tambahkan produk WhatsApp, lalu pakai nomor test.
2. Isi `WA_ACCESS_TOKEN`, `WA_PHONE_NUMBER_ID`, `WA_APP_SECRET`, dan `WA_VERIFY_TOKEN` di `.env`.
3. Atur Callback URL ke `https://<domain>/api/webhook/whatsapp` dengan verify token yang sama, lalu subscribe ke field `messages`.
4. Notifikasi ke pengguna yang tidak chat dalam 24 jam terakhir wajib memakai template yang disetujui Meta. Isi `WA_NOTIFY_TEMPLATE` dengan nama template yang punya satu variabel body `{{1}}`.

## Keamanan

- Password di-hash dengan Argon2 dan sesi memakai JWT. RBAC per peran: `admin`, `tpid`, `driver`, `distributor`.
- Tidak ada akun hardcode. Admin dibuat dari env lewat `python -m app.seed`.
- API key LLM hanya ada di server, dienkripsi Fernet saat disimpan di DB. Browser hanya menerima versi tersamar.
- Distributor tidak menerima nama atau nomor petani (minimisasi data).

## Lisensi

Dibuat untuk keperluan lomba neon. Hak cipta © 2024–2026 Tim PanganDali.

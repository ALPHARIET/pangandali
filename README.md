# PanganDali

**Platform Distribution Intelligence untuk Pengendalian Inflasi Pangan Daerah**

PanganDali adalah platform digital yang mengintegrasikan pelaporan panen petani via WhatsApp (NLP), Smart Backhaul Matching untuk optimasi logistik, dan dashboard Early Warning System (EWS) bagi TPID untuk mendeteksi anomali pasokan serta lonjakan harga komoditas hortikultura.

## Status

**MOCKUP** frontend untuk lomba **GEMASTIK XIX** divisi **Kota Cerdas**.  
Seluruh data yang ditampilkan adalah simulasi/ilustrasi. Sistem belum berjalan secara operasional.

## Lingkup Pilot

- **Wilayah:** Kecamatan Selupu Rejang (Kabupaten Rejang Lebong) menuju Kota Bengkulu
- **Komoditas:** 5 hortikultura — Cabai Besar, Kubis, Terung, Wortel, Kembang Kol
- **Aktor:** Petani, Distributor, Mitra Logistik, TPID, dan Admin Dinas Pertanian

## Arsitektur (Proposal)

Arsitektur yang diusulkan dalam proposal menggunakan **FastAPI** (backend) dan **PostgreSQL** (database). Repo ini hanya berisi frontend mockup yang dibangun dengan **React 19 + Vite** dan menyimpan data sementara di **localStorage** (tanpa backend).

## Cara Menjalankan

```bash
# Install dependencies
npm install

# Jalankan development server
npm run dev

# Build untuk produksi
npm run build
```

## Akun Demo

| Peran            | Username / Email        | Password         |
| ---------------- | ----------------------- | ---------------- |
| Admin            | `admin`                 | `admin`          |
| TPID             | `budi@pangandali.id`    | `password123`    |
| Mitra Logistik   | `driver`                | `driver123`      |
| Distributor      | `distributor`           | `distributor123` |

## Teknologi

- React 19
- Vite
- Recharts (grafik)
- Framer Motion (animasi)
- Lucide React (ikon)
- localStorage (penyimpanan sesi)

## Lisensi

Dibuat untuk keperluan lomba GEMASTIK XIX. Hak cipta © 2024–2026 Tim PanganDali.

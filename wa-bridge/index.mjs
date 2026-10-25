// wa-bridge: menghubungkan nomor WhatsApp (login scan QR, Baileys) ke backend PanganDali.
//
// TIDAK RESMI dan melanggar ketentuan WhatsApp: hanya untuk uji lokal/demo dengan NOMOR CADANGAN.
// Jalur produksi tetap WhatsApp Cloud API (backend/app/channels/whatsapp.py).
//
//   Pesan masuk  : WhatsApp → bridge → POST {BACKEND_URL}/api/webhook/wa-web
//   Pesan keluar : backend → POST http://127.0.0.1:{PORT}/send → WhatsApp
//   QR login     : buka http://127.0.0.1:{PORT}/qr di browser
//
// Konfigurasi dibaca dari backend/.env (WA_WEB_SECRET, WA_WEB_BRIDGE_URL) atau variabel lingkungan.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import makeWASocket, { DisconnectReason, fetchLatestBaileysVersion, useMultiFileAuthState } from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';

const DIR = path.dirname(fileURLToPath(import.meta.url));

// libsignal (dipakai Baileys) mencetak isi sesi enkripsi, termasuk kunci privat, lewat console.log/info.
// Saring supaya kunci tidak masuk log terminal/berkas log.
for (const fn of ['log', 'info', 'warn']) {
  const asli = console[fn].bind(console);
  console[fn] = (...args) => {
    const awal = typeof args[0] === 'string' ? args[0] : '';
    if (/^(Closing session|Opening session|Removing old closed session|Closing open session|Session already)/.test(awal)) return;
    asli(...args);
  };
}

function bacaEnv(file) {
  const env = {};
  try {
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* tidak ada .env: pakai variabel lingkungan saja */
  }
  return env;
}

const fileEnv = bacaEnv(path.join(DIR, '..', 'backend', '.env'));
const cfg = (k, d) => process.env[k] || fileEnv[k] || d;
const SECRET = cfg('WA_WEB_SECRET', '');
const PORT = Number(new URL(cfg('WA_WEB_BRIDGE_URL', 'http://127.0.0.1:3010')).port || 3010);
const BACKEND = cfg('BACKEND_URL', 'http://127.0.0.1:8000');
const AUTH_DIR = path.join(DIR, 'auth');

if (!SECRET) {
  console.error('WA_WEB_SECRET belum diisi di backend/.env');
  process.exit(1);
}

const log = pino({ level: process.env.LOG_LEVEL || 'warn' });
let sock = null;
let status = 'memulai';
let qrTerakhir = null;
let nomorSaya = null;

// Hapus angka di JID: "62812xxx:3@s.whatsapp.net" → "62812xxx"
const digitJid = (jid) => (jid || '').split('@')[0].split(':')[0];

function nomorPengirim(key) {
  // WhatsApp kini sering memakai LID (@lid) sebagai id chat; nomor asli ada di remoteJidAlt.
  const kandidat = [key.remoteJid, key.remoteJidAlt, key.senderPn, key.participantAlt];
  const pn = kandidat.find((j) => j && j.endsWith('@s.whatsapp.net'));
  return pn ? digitJid(pn) : null;
}

function teksPesan(m) {
  const msg = m.message || {};
  const inner = msg.ephemeralMessage?.message || msg.viewOnceMessage?.message || msg;
  return (
    inner.conversation ||
    inner.extendedTextMessage?.text ||
    inner.imageMessage?.caption ||
    inner.buttonsResponseMessage?.selectedDisplayText ||
    inner.listResponseMessage?.title ||
    (inner.imageMessage ? '[pesan gambar belum didukung]' : null) ||
    (inner.audioMessage ? '[pesan suara belum didukung]' : null) ||
    (inner.locationMessage ? '[pesan lokasi belum didukung]' : null)
  );
}

async function teruskan(m) {
  const phone = nomorPengirim(m.key);
  const text = teksPesan(m);
  if (!phone || !text) {
    log.warn({ jid: m.key.remoteJid }, 'pesan dilewati (nomor tidak terbaca atau bukan teks)');
    return;
  }
  try {
    await sock.readMessages([m.key]);
    await sock.sendPresenceUpdate('composing', m.key.remoteJid);
  } catch {
    /* indikator mengetik tidak penting */
  }
  const res = await fetch(`${BACKEND}/api/webhook/wa-web`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Bridge-Secret': SECRET },
    body: JSON.stringify({ phone, text, id: m.key.id, name: m.pushName || null }),
  }).catch((e) => ({ ok: false, status: 0, text: async () => e.message }));
  console.log(`[masuk] +${phone}: ${text.slice(0, 60)}${res.ok ? '' : `  (gagal diteruskan: HTTP ${res.status})`}`);
}

async function mulai() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }));
  sock = makeWASocket({ auth: state, version, logger: log, browser: ['PanganDali Bridge', 'Chrome', '1.0'], markOnlineOnConnect: false });
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      qrTerakhir = qr;
      status = 'menunggu_scan';
      console.log(`\nScan QR: buka http://127.0.0.1:${PORT}/qr di browser, lalu di HP: WhatsApp → Perangkat tertaut → Tautkan perangkat.\n`);
    }
    if (connection === 'open') {
      status = 'terhubung';
      qrTerakhir = null;
      nomorSaya = digitJid(sock.user?.id);
      console.log(`Terhubung sebagai +${nomorSaya}. Pesan WA masuk akan diteruskan ke ${BACKEND}`);
    }
    if (connection === 'close') {
      const kode = lastDisconnect?.error?.output?.statusCode;
      if (kode === DisconnectReason.loggedOut) {
        status = 'logout';
        console.log('Perangkat dilepas dari HP. Hapus folder wa-bridge/auth lalu jalankan ulang untuk scan QR baru.');
        return;
      }
      status = 'menyambung_ulang';
      console.log(`Koneksi terputus (kode ${kode ?? '-'}), menyambung ulang...`);
      setTimeout(mulai, 3000);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const m of messages) {
      const jid = m.key.remoteJid || '';
      if (m.key.fromMe || jid.endsWith('@g.us') || jid === 'status@broadcast' || jid.endsWith('@newsletter')) continue;
      teruskan(m).catch((e) => console.error('Gagal memproses pesan:', e.message));
    }
  });
}

function bacaBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 64_000) reject(new Error('body terlalu besar'));
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function kirimJson(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

http
  .createServer(async (req, res) => {
    try {
      if (req.method === 'GET' && req.url === '/status') return kirimJson(res, 200, { status, nomor: nomorSaya });
      if (req.method === 'GET' && req.url === '/qr') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        const isi = qrTerakhir
          ? `<img alt="QR WhatsApp" src="${await QRCode.toDataURL(qrTerakhir, { margin: 2, width: 320 })}">
             <p>WhatsApp → Perangkat tertaut → Tautkan perangkat. Halaman memuat ulang otomatis.</p>`
          : `<p>Status: <b>${status}</b>${nomorSaya ? ` sebagai +${nomorSaya}` : ''}.</p>`;
        return res.end(`<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="5">
          <title>PanganDali wa-bridge</title><body style="font-family:sans-serif;text-align:center;padding:24px">
          <h2>PanganDali wa-bridge</h2>${isi}<p style="color:#b45309">Tidak resmi: gunakan nomor cadangan.</p></body>`);
      }
      if (req.method === 'POST' && req.url === '/send') {
        if (req.headers['x-bridge-secret'] !== SECRET) return kirimJson(res, 401, { error: 'kunci salah' });
        if (status !== 'terhubung') return kirimJson(res, 503, { error: `bridge belum terhubung (${status})` });
        const { to, text } = JSON.parse((await bacaBody(req)) || '{}');
        if (!/^\d{8,15}$/.test(String(to || '')) || !text) return kirimJson(res, 422, { error: 'to/text tidak valid' });
        const jid = `${to}@s.whatsapp.net`;
        await sock.sendPresenceUpdate('paused', jid).catch(() => {});
        const r = await sock.sendMessage(jid, { text: String(text).slice(0, 4000) });
        console.log(`[keluar] +${to}: ${String(text).slice(0, 60)}`);
        return kirimJson(res, 200, { id: r?.key?.id || null });
      }
      kirimJson(res, 404, { error: 'tidak ada' });
    } catch (e) {
      console.error('Error HTTP bridge:', e.message);
      kirimJson(res, 500, { error: e.message });
    }
  })
  // Hanya dengarkan di localhost: /send tidak boleh terbuka ke jaringan.
  .listen(PORT, '127.0.0.1', () => console.log(`wa-bridge mendengarkan di http://127.0.0.1:${PORT}`));

mulai().catch((e) => {
  console.error('Gagal memulai Baileys:', e);
  process.exit(1);
});

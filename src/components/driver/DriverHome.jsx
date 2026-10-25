import React from 'react';
import {
  ArrowRight, Truck, DollarSign, Bell, Calendar, Shield, Route, MapPin, Package, Workflow, HelpCircle,
} from 'lucide-react';
import { PortalBar, PortalHero, SectionHead, BenefitGrid, StepList, FaqList, PortalFooter } from '../portal/PortalParts';
import DriverOperasional from './DriverOperasional';

/* ─── SVG Illustrations ─── */
const TruckIllustration = () => (
  <svg width="360" height="260" viewBox="0 0 360 260" fill="none" style={{ maxWidth: '100%', height: 'auto' }}>
    <circle cx="180" cy="130" r="110" fill="rgba(34,197,94,0.04)" />
    <circle cx="180" cy="130" r="80" fill="rgba(34,197,94,0.06)" />
    <rect x="10" y="195" width="340" height="10" rx="5" fill="#f3f4f6" />
    <rect x="30" y="198" width="45" height="4" rx="2" fill="#e5e7eb" />
    <rect x="100" y="198" width="45" height="4" rx="2" fill="#e5e7eb" />
    <rect x="170" y="198" width="45" height="4" rx="2" fill="#e5e7eb" />
    <rect x="240" y="198" width="45" height="4" rx="2" fill="#e5e7eb" />
    <rect x="65" y="120" width="145" height="75" rx="10" fill="#22c55e" />
    <rect x="72" y="127" width="130" height="40" rx="6" fill="rgba(255,255,255,0.18)" />
    <rect x="82" y="132" width="28" height="28" rx="4" fill="rgba(255,255,255,0.3)" />
    <rect x="116" y="128" width="30" height="32" rx="4" fill="rgba(255,255,255,0.25)" />
    <rect x="152" y="134" width="26" height="26" rx="4" fill="rgba(255,255,255,0.28)" />
    <rect x="210" y="137" width="70" height="58" rx="8" fill="#16a34a" />
    <rect x="222" y="144" width="45" height="28" rx="5" fill="rgba(255,255,255,0.35)" />
    <rect x="274" y="173" width="8" height="6" rx="3" fill="#fbbf24" />
    <circle cx="115" cy="197" r="18" fill="#1f2937" />
    <circle cx="115" cy="197" r="9" fill="#374151" />
    <circle cx="115" cy="197" r="4" fill="#6b7280" />
    <circle cx="245" cy="197" r="18" fill="#1f2937" />
    <circle cx="245" cy="197" r="9" fill="#374151" />
    <circle cx="245" cy="197" r="4" fill="#6b7280" />
    <path d="M80 95 L270 95" stroke="#22c55e" strokeWidth="2.5" strokeDasharray="8 5" opacity="0.5" />
    <path d="M270 95 L258 86 M270 95 L258 104" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
    <path d="M270 108 L80 108" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="8 5" opacity="0.4" />
    <path d="M80 108 L92 99 M80 108 L92 117" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    <text x="175" y="88" textAnchor="middle" fill="#22c55e" fontSize="11" fontWeight="700" opacity="0.6">KIRIM MUATAN</text>
    <text x="175" y="122" textAnchor="middle" fill="#f59e0b" fontSize="11" fontWeight="700" opacity="0.5">BACKHAUL</text>
  </svg>
);

const BackhaulDiagram = () => (
  <svg width="320" height="200" viewBox="0 0 320 200" fill="none" style={{ maxWidth: '100%', height: 'auto' }}>
    <rect x="20" y="60" width="80" height="80" rx="12" fill="rgba(34,197,94,0.08)" stroke="rgba(34,197,94,0.2)" strokeWidth="1.5" />
    <rect x="40" y="90" width="16" height="30" rx="3" fill="rgba(34,197,94,0.2)" />
    <rect x="60" y="80" width="16" height="40" rx="3" fill="rgba(34,197,94,0.15)" />
    <text x="60" y="155" textAnchor="middle" fill="#16a34a" fontSize="12" fontWeight="700">Kota A</text>
    <rect x="220" y="60" width="80" height="80" rx="12" fill="rgba(245,158,11,0.08)" stroke="rgba(245,158,11,0.2)" strokeWidth="1.5" />
    <rect x="240" y="85" width="16" height="35" rx="3" fill="rgba(245,158,11,0.2)" />
    <rect x="260" y="75" width="16" height="45" rx="3" fill="rgba(245,158,11,0.15)" />
    <text x="260" y="155" textAnchor="middle" fill="#d97706" fontSize="12" fontWeight="700">Kota B</text>
    <path d="M105 85 L215 85" stroke="#22c55e" strokeWidth="2.5" strokeDasharray="6 4" />
    <path d="M215 85 L205 78 M215 85 L205 92" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
    <text x="160" y="78" textAnchor="middle" fill="#16a34a" fontSize="10" fontWeight="600">Muatan Kirim</text>
    <rect x="145" y="86" width="24" height="12" rx="3" fill="#22c55e" />
    <rect x="169" y="88" width="10" height="10" rx="2" fill="#16a34a" />
    <path d="M215 115 L105 115" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="6 4" />
    <path d="M105 115 L115 108 M105 115 L115 122" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
    <text x="160" y="135" textAnchor="middle" fill="#d97706" fontSize="10" fontWeight="600">Muatan Balik</text>
    <rect x="145" y="107" width="24" height="12" rx="3" fill="#f59e0b" />
    <rect x="135" y="109" width="10" height="10" rx="2" fill="#d97706" />
    <text x="160" y="185" textAnchor="middle" fill="#6b7280" fontSize="11">Truk tidak pulang kosong!</text>
  </svg>
);

/* ─── FAQ Data ─── */
const faqData = [
  {
    q: 'Bagaimana cara mendapatkan muatan?',
    a: 'Umumkan perjalanan Anda (asal, tujuan, tanggal, sisa kapasitas) lewat WhatsApp atau panel status armada. Sistem menyaring muatan menurut kapasitas, komoditas, rute, dan waktu, lalu menawarkannya satu per satu sesuai skor.'
  },
  {
    q: 'Apakah saya wajib menerima penawaran?',
    a: 'Tidak. Rekomendasi baru menjadi tugas setelah Anda setuju. Jika Anda menolak atau tidak menjawab sampai batas waktu, penawaran diteruskan ke armada lain atau ke petugas.'
  },
  {
    q: 'Bagaimana pembayaran dan ongkos angkut?',
    a: 'Ongkos angkut disepakati langsung dengan pihak terkait. PanganDali tidak memproses atau mentransfer dana; yang dicatat adalah penugasan dan status pengiriman.'
  },
  {
    q: 'Kendaraan seperti apa yang bisa ikut?',
    a: 'Akun dan kendaraan diverifikasi admin terlebih dahulu. Muatan hanya ditawarkan bila kapasitas dan kecocokan komoditasnya sesuai. Kebutuhan rantai dingin belum dilayani pada tahap purwarupa.'
  },
  {
    q: 'Apa yang perlu saya catat selama pengiriman?',
    a: 'Berat saat muat, waktu muat dan tiba, kilometer, dan BBM. Data ini dipakai untuk menghitung susut dan selisih BBM dibanding perjalanan khusus; data yang kurang akan ditandai, bukan ditebak.'
  },
];

/* ─── Benefits Data ─── */
const benefits = [
  { icon: <DollarSign size={22} />, title: 'Peluang Penghasilan', desc: 'Muatan balik membuka peluang pendapatan dari perjalanan yang tetap Anda tempuh.', color: 'rgba(34,197,94,0.1)', iconColor: '#16a34a' },
  { icon: <Route size={22} />, title: 'Isi Kapasitas Kosong', desc: 'Kapasitas yang kosong di perjalanan pulang bisa dipakai untuk hasil panen yang searah.', color: 'rgba(59,130,246,0.08)', iconColor: '#2563eb' },
  { icon: <Bell size={22} />, title: 'Rekomendasi Berbasis Aturan', desc: 'Muatan disaring menurut kapasitas, komoditas, rute, dan waktu, lalu diurutkan menurut tambahan jarak.', color: 'rgba(245,158,11,0.08)', iconColor: '#d97706' },
  { icon: <Shield size={22} />, title: 'Perjalanan Tercatat', desc: 'Status, berat, km, dan BBM tercatat sebagai bukti efisiensi.', color: 'rgba(99,102,241,0.08)', iconColor: '#6366f1' },
  { icon: <Calendar size={22} />, title: 'Anda yang Memutuskan', desc: 'Setiap penawaran boleh diterima atau ditolak sesuai jadwal dan rute Anda.', color: 'rgba(236,72,153,0.08)', iconColor: '#db2777' },
];

const timeline = [
  { num: 1, title: 'Umumkan Perjalanan', desc: 'Isi asal, tujuan, tanggal, dan sisa kapasitas lewat WhatsApp atau panel ini.', color: '#22c55e' },
  { num: 2, title: 'Terima Penawaran', desc: 'Muatan yang cocok ditawarkan satu per satu sesuai skor.', color: '#3b82f6' },
  { num: 3, title: 'Setujui atau Tolak', desc: 'Tugas baru berlaku setelah Anda setuju; penolakan diteruskan ke armada lain.', color: '#25d366' },
  { num: 4, title: 'Jemput & Muat', desc: 'Catat berat muat dan waktu muat di titik jemput.', color: '#6366f1' },
  { num: 5, title: 'Antar ke Tujuan', desc: 'Perbarui status perjalanan sampai barang diterima.', color: '#f59e0b' },
  { num: 6, title: 'Catat & Selesaikan', desc: 'Laporkan km dan BBM; ongkos angkut sesuai kesepakatan.', color: '#10b981' },
];


const LINKS = [
  ['#armada', 'Operasional'],
  ['#program', 'Program Backhaul'],
  ['#alur', 'Cara Kerja'],
  ['#faq', 'Bantuan'],
];

const FACTS = [
  { icon: <MapPin size={16} />, label: 'Area layanan', value: 'Rejang Lebong – Kota Bengkulu' },
  { icon: <Route size={16} />, label: 'Koridor pilot', value: '80–120 km' },
  { icon: <Package size={16} />, label: 'Komoditas', value: 'Hortikultura & pangan' },
  { icon: <DollarSign size={16} />, label: 'Pendapatan', value: 'Sesuai kesepakatan per trip' },
];

function DriverHome({ user, onLogout }) {
  const driverName = user?.name?.split(' ')[0] || 'Mitra';

  return (
    <div className="portal">
      <PortalBar role="Mitra Logistik" user={user} links={LINKS} onLogout={onLogout} />

      <PortalHero
        chip={<><Truck size={14} /> Mitra Logistik (Backhaul)</>}
        title={<>Halo, {driverName}. Pulang jangan kosong.</>}
        lead="Isi rute pulang dan sisa kapasitas armada Anda. Sistem mencocokkan muatan hasil panen yang searah, lalu Anda yang memutuskan mau ambil atau tidak."
        actions={
          <>
            <a href="#armada" className="p-btn p-btn--primary">
              Cari muatan balik <ArrowRight size={18} />
            </a>
            <a href="#alur" className="p-btn p-btn--ghost">Lihat cara kerja</a>
          </>
        }
        art={<TruckIllustration />}
        facts={FACTS}
      />

      {/* ═════ Operasional ═════ */}
      <section id="armada" className="portal-section">
        <div className="portal-wrap">
          <SectionHead
            icon={<Truck size={14} />}
            eyebrow="Operasional"
            title="Status armada & muatan balik"
            desc="Pencocokan memakai aturan dan skor: kapasitas, komoditas, rute, dan waktu. Rekomendasi baru menjadi tugas setelah Anda setuju."
          />

          <DriverOperasional user={user} />
        </div>
      </section>

      {/* ═════ Program ═════ */}
      <section id="program" className="portal-section portal-section--white">
        <div className="portal-wrap">
          <div className="portal-about">
            <div>
              <SectionHead icon={<Truck size={14} />} eyebrow="Program Backhaul" title="Apa itu backhaul?" />
              <p>
                Backhaul membantu supir mendapat muatan balik supaya perjalanan pulang tidak kosong. Mengangkut kiriman dengan
                perjalanan yang sudah ada berpotensi menghemat BBM dibanding perjalanan khusus; penghematannya dibuktikan lewat
                pencatatan km dan BBM, termasuk tambahan jarak untuk menjemput.
              </p>
              <p>
                PanganDali mempertemukan rute Anda dengan hasil panen petani yang sudah divalidasi petugas, sehingga proses
                pengambilan muatan lebih cepat dan tercatat.
              </p>
            </div>
            <div className="portal-about__art" aria-hidden="true">
              <BackhaulDiagram />
            </div>
          </div>
          <BenefitGrid items={benefits} />
        </div>
      </section>

      {/* ═════ Alur ═════ */}
      <section id="alur" className="portal-section">
        <div className="portal-wrap">
          <SectionHead icon={<Workflow size={14} />} eyebrow="Alur proses" title="Cara kerja" desc="Dari mengumumkan perjalanan sampai pengiriman selesai." />
          <StepList steps={timeline} />
        </div>
      </section>

      {/* ═════ FAQ ═════ */}
      <section id="faq" className="portal-section portal-section--white">
        <div className="portal-wrap">
          <SectionHead icon={<HelpCircle size={14} />} eyebrow="Bantuan" title="Pertanyaan umum" />
          <FaqList items={faqData} />
        </div>
      </section>

      <PortalFooter title="PanganDali · Mitra Logistik" desc="Platform distribusi pangan yang transparan dan responsif." />
    </div>
  );
}

export default DriverHome;

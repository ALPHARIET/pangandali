import React from 'react';
import {
  ArrowRight, Package, DollarSign, Shield, Search, Workflow, HelpCircle, Store, Truck, MapPin,
} from 'lucide-react';
import { PortalBar, PortalHero, SectionHead, BenefitGrid, StepList, FaqList, PortalFooter } from '../portal/PortalParts';
import DistributorTransaksi from './DistributorTransaksi';

/* ─── SVG Illustrations ─── */
const MarketIllustration = () => (
  <svg width="360" height="260" viewBox="0 0 360 260" fill="none" style={{ maxWidth: '100%', height: 'auto' }}>
    <circle cx="180" cy="130" r="110" fill="rgba(59,130,246,0.04)" />
    <circle cx="180" cy="130" r="80" fill="rgba(59,130,246,0.06)" />
    <rect x="20" y="200" width="320" height="8" rx="4" fill="#f3f4f6" />
    <rect x="80" y="110" width="200" height="90" rx="8" fill="#3b82f6" />
    <rect x="90" y="125" width="180" height="75" fill="#2563eb" />
    <path d="M70 110 L290 110 L270 80 L90 80 Z" fill="#1d4ed8" />
    <rect x="160" y="70" width="40" height="10" fill="#1e40af" />
    <rect x="150" y="140" width="60" height="60" fill="#1e3a8a" />
    <line x1="180" y1="140" x2="180" y2="200" stroke="#172554" strokeWidth="2" />
    <rect x="100" y="160" width="30" height="40" rx="2" fill="#fbbf24" />
    <rect x="105" y="165" width="20" height="10" fill="#f59e0b" />
    <rect x="105" y="180" width="20" height="10" fill="#f59e0b" />
    <rect x="230" y="170" width="40" height="30" rx="2" fill="#22c55e" />
    <rect x="235" y="175" width="30" height="8" fill="#16a34a" />
    <rect x="235" y="187" width="30" height="8" fill="#16a34a" />
    <rect x="30" y="160" width="40" height="25" rx="4" fill="#ef4444" />
    <rect x="55" y="150" width="15" height="10" rx="2" fill="#dc2626" />
    <circle cx="45" cy="185" r="7" fill="#1f2937" />
    <circle cx="60" cy="185" r="7" fill="#1f2937" />
    <path d="M180 50 L180 30" stroke="#3b82f6" strokeWidth="3" strokeDasharray="6 4" opacity="0.6" />
    <path d="M150 40 L210 40" stroke="#3b82f6" strokeWidth="3" strokeDasharray="6 4" opacity="0.6" />
    <circle cx="180" cy="40" r="15" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" />
    <text x="180" y="44" textAnchor="middle" fill="#1d4ed8" fontSize="12" fontWeight="bold">Rp</text>
  </svg>
);

const DistributionDiagram = () => (
  <svg width="320" height="200" viewBox="0 0 320 200" fill="none" style={{ maxWidth: '100%', height: 'auto' }}>
    <rect x="20" y="60" width="80" height="80" rx="12" fill="rgba(34,197,94,0.08)" stroke="rgba(34,197,94,0.2)" strokeWidth="1.5" />
    <path d="M40 100 Q60 80 80 100" stroke="#16a34a" strokeWidth="3" fill="none" />
    <circle cx="50" cy="115" r="8" fill="#22c55e" />
    <circle cx="70" cy="115" r="8" fill="#22c55e" />
    <text x="60" y="155" textAnchor="middle" fill="#16a34a" fontSize="12" fontWeight="700">Petani</text>
    <text x="60" y="170" textAnchor="middle" fill="#16a34a" fontSize="10">Produksi</text>

    <rect x="220" y="60" width="80" height="80" rx="12" fill="rgba(59,130,246,0.08)" stroke="rgba(59,130,246,0.2)" strokeWidth="1.5" />
    <rect x="240" y="90" width="40" height="30" rx="4" fill="#3b82f6" />
    <rect x="245" y="80" width="30" height="10" fill="#2563eb" />
    <text x="260" y="155" textAnchor="middle" fill="#1d4ed8" fontSize="12" fontWeight="700">Gudang Anda</text>
    <text x="260" y="170" textAnchor="middle" fill="#1d4ed8" fontSize="10">Distributor</text>

    <path d="M105 100 L215 100" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="6 4" />
    <path d="M215 100 L205 93 M215 100 L205 107" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
    <text x="160" y="90" textAnchor="middle" fill="#2563eb" fontSize="10" fontWeight="600">Suplai Langsung</text>

    <rect x="125" y="105" width="70" height="20" rx="10" fill="#dbeafe" />
    <text x="160" y="119" textAnchor="middle" fill="#1e40af" fontSize="9" fontWeight="bold">Sistem PanganDali</text>
  </svg>
);

/* ─── FAQ Data ─── */
const faqData = [
  {
    q: 'Dari mana asal stok yang ditampilkan?',
    a: 'Dari laporan panen petani terdaftar yang sudah dikonfirmasi petani dan divalidasi admin. Laporan yang belum lengkap, misalnya satuan lokal tanpa kesepakatan kg, belum masuk stok.'
  },
  {
    q: 'Bagaimana harga dan pembayarannya?',
    a: 'Harga di stok adalah harga harapan petani; Anda boleh mengajukan harga tawar. Harga akhir dan pembayaran disepakati serta dilakukan langsung antara Anda dan petani. PanganDali bukan penyedia layanan keuangan, hanya mencatat pesanan dan status pengiriman.'
  },
  {
    q: 'Bagaimana prosedur pemesanannya?',
    a: 'Pilih komoditas dan ajukan volume. Volume itu dikunci sementara agar tidak dipesan ganda, lalu petani menerima atau menolak. Jika petani tidak menjawab sampai batas waktu, kunci dilepas dan stok kembali tersedia.'
  },
  {
    q: 'Bagaimana pengirimannya diatur?',
    a: 'Pesanan yang diterima petani menjadi order angkutan. Sistem merekomendasikan armada yang searah sesuai kapasitas, komoditas, rute, dan waktu. Armada baru ditugaskan setelah mitra logistik setuju; ongkos angkut disepakati dengan mitra.'
  },
  {
    q: 'Apa yang dicatat saat barang tiba?',
    a: 'Berat diterima, berat yang ditolak karena mutu beserta alasannya, dan waktu terima. Data ini dipakai untuk menghitung susut distribusi.'
  },
];

/* ─── Benefits Data ─── */
const benefits = [
  { icon: <Store size={22} />, title: 'Stok Tervalidasi', desc: 'Hasil panen yang sudah dicek petugas, lengkap dengan volume, lokasi, dan tanggal panen.', color: 'rgba(59,130,246,0.1)', iconColor: '#2563eb' },
  { icon: <DollarSign size={22} />, title: 'Harga Tercatat', desc: 'Harga harapan petani dan harga tawar Anda tercatat; harga akhir disepakati antarpihak.', color: 'rgba(34,197,94,0.08)', iconColor: '#16a34a' },
  { icon: <Truck size={22} />, title: 'Angkutan Searah', desc: 'Pengiriman dicarikan dari armada yang sudah berjalan di rute yang sama.', color: 'rgba(245,158,11,0.08)', iconColor: '#d97706' },
  { icon: <Shield size={22} />, title: 'Penerimaan Tercatat', desc: 'Berat diterima dan alasan tolak mutu dicatat saat barang tiba.', color: 'rgba(99,102,241,0.08)', iconColor: '#6366f1' },
];

const timeline = [
  { num: 1, title: 'Lihat Stok Tervalidasi', desc: 'Stok berasal dari laporan panen yang sudah divalidasi admin.', color: '#3b82f6' },
  { num: 2, title: 'Ajukan Pembelian', desc: 'Volume yang Anda minta dikunci sementara agar tidak dipesan ganda.', color: '#22c55e' },
  { num: 3, title: 'Petani Menjawab', desc: 'Petani menerima atau menolak lewat WhatsApp. Tanpa jawaban, kunci dilepas.', color: '#f59e0b' },
  { num: 4, title: 'Armada Direkomendasikan', desc: 'Armada searah ditawarkan satu per satu dan baru ditugaskan setelah mitra setuju.', color: '#6366f1' },
  { num: 5, title: 'Pembayaran Antarpihak', desc: 'Pembayaran dilakukan langsung dengan petani sesuai kesepakatan.', color: '#ec4899' },
  { num: 6, title: 'Barang Diterima', desc: 'Berat terima dan tolak mutu dicatat untuk menghitung susut.', color: '#10b981' },
];

const LINKS = [
  ['#transaksi', 'Stok & Pesanan'],
  ['#program', 'Ekosistem'],
  ['#alur', 'Alur Pengadaan'],
  ['#faq', 'Bantuan'],
];

const FACTS = [
  { icon: <Search size={16} />, label: 'Komoditas uji', value: 'Hortikultura (mis. kubis, cabai besar)' },
  { icon: <MapPin size={16} />, label: 'Area layanan', value: 'Rejang Lebong – Kota Bengkulu' },
  { icon: <Package size={16} />, label: 'Volume', value: 'Mengikuti stok tervalidasi' },
  { icon: <Truck size={16} />, label: 'Pengiriman', value: 'Armada searah (muatan balik)' },
];

function DistributorHome({ user, onLogout }) {
  const distributorName = user?.nama_usaha || user?.name || 'Distributor';

  return (
    <div className="portal portal--blue">
      <PortalBar role="Mitra Distributor" user={user} links={LINKS} onLogout={onLogout} />

      <PortalHero
        chip={<><Store size={14} /> Mitra Distributor Terdaftar</>}
        title={<>Halo, {distributorName}.</>}
        lead="Lihat stok hasil panen yang sudah divalidasi, ajukan pembelian, lalu pantau sampai barang diangkut armada yang searah. Pembayaran tetap dilakukan langsung dengan petani."
        actions={
          <>
            <a href="#transaksi" className="p-btn p-btn--primary">
              Lihat stok & pesan <ArrowRight size={18} />
            </a>
            <a href="#alur" className="p-btn p-btn--ghost">Alur pengadaan</a>
          </>
        }
        art={<MarketIllustration />}
        facts={FACTS}
      />

      {/* ═════ Stok & transaksi ═════ */}
      <section id="transaksi" className="portal-section">
        <div className="portal-wrap">
          <SectionHead
            icon={<Store size={14} />}
            eyebrow="Stok & Pesanan"
            title="Stok tervalidasi dan permintaan"
            desc="Volume yang Anda ajukan dikunci sementara sampai petani menerima atau menolak pesanan."
          />

          <DistributorTransaksi />
        </div>
      </section>

      {/* ═════ Ekosistem ═════ */}
      <section id="program" className="portal-section portal-section--white">
        <div className="portal-wrap">
          <div className="portal-about">
            <div>
              <SectionHead icon={<Package size={14} />} eyebrow="Ekosistem distribusi" title="Satu aliran data dari panen ke gudang" />
              <p>
                Stok yang Anda lihat berasal dari laporan panen petani terdaftar yang sudah dikonfirmasi petani dan divalidasi admin,
                lengkap dengan volume dan tanggal panennya.
              </p>
              <p>
                Pesanan yang diterima petani diteruskan menjadi order angkutan untuk armada yang sudah berjalan di rute yang sama.
                Jarak, BBM, dan susut tiap kiriman dicatat agar efisiensinya bisa diukur.
              </p>
            </div>
            <div className="portal-about__art" aria-hidden="true">
              <DistributionDiagram />
            </div>
          </div>
          <BenefitGrid items={benefits} />
        </div>
      </section>

      {/* ═════ Alur ═════ */}
      <section id="alur" className="portal-section">
        <div className="portal-wrap">
          <SectionHead icon={<Workflow size={14} />} eyebrow="Alur pengadaan" title="Proses pengadaan komoditas" desc="Dari stok tervalidasi sampai barang diterima." />
          <StepList steps={timeline} />
        </div>
      </section>

      {/* ═════ FAQ ═════ */}
      <section id="faq" className="portal-section portal-section--white">
        <div className="portal-wrap">
          <SectionHead icon={<HelpCircle size={14} />} eyebrow="Bantuan" title="Pertanyaan seputar pasokan" />
          <FaqList items={faqData} />
        </div>
      </section>

      <PortalFooter title="PanganDali · Mitra Distributor" desc="Stok tervalidasi, pesanan, dan pengiriman searah dalam satu catatan." />
    </div>
  );
}

export default DistributorHome;

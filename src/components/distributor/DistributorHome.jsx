import React, { useState, useEffect, useRef } from 'react';
import {
  LogOut, ArrowRight, Package, DollarSign, Bell,
  Calendar, Shield, Route, MapPin, Search,
  Clock, ChevronDown, Heart, MessageCircle,
  TrendingUp, Workflow, HelpCircle, Zap, Store, Truck
} from 'lucide-react';

const WA_NUMBER = '6281234567890';
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Halo Admin TPID, saya ingin mendapatkan informasi stok dan harga grosir komoditas hari ini.')}`;

/* ─── Scroll-reveal hook ─── */
function useScrollReveal(selector) {
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );
    const items = ref.current?.querySelectorAll(selector);
    items?.forEach((item, i) => {
      item.style.animationDelay = `${i * 0.1}s`;
      observer.observe(item);
    });
    return () => observer.disconnect();
  }, [selector]);
  return ref;
}

/* ─── SVG Illustrations ─── */
const MarketIllustration = () => (
  <svg width="360" height="260" viewBox="0 0 360 260" fill="none" style={{ maxWidth: '100%', height: 'auto' }}>
    <circle cx="180" cy="130" r="110" fill="rgba(59,130,246,0.04)" />
    <circle cx="180" cy="130" r="80" fill="rgba(59,130,246,0.06)" />

    {/* Ground */}
    <rect x="20" y="200" width="320" height="8" rx="4" fill="#f3f4f6" />
    
    {/* Store / Warehouse building */}
    <rect x="80" y="110" width="200" height="90" rx="8" fill="#3b82f6" />
    <rect x="90" y="125" width="180" height="75" fill="#2563eb" />
    
    {/* Roof */}
    <path d="M70 110 L290 110 L270 80 L90 80 Z" fill="#1d4ed8" />
    <rect x="160" y="70" width="40" height="10" fill="#1e40af" />
    
    {/* Door */}
    <rect x="150" y="140" width="60" height="60" fill="#1e3a8a" />
    <line x1="180" y1="140" x2="180" y2="200" stroke="#172554" strokeWidth="2" />

    {/* Crates / Goods */}
    <rect x="100" y="160" width="30" height="40" rx="2" fill="#fbbf24" />
    <rect x="105" y="165" width="20" height="10" fill="#f59e0b" />
    <rect x="105" y="180" width="20" height="10" fill="#f59e0b" />

    <rect x="230" y="170" width="40" height="30" rx="2" fill="#22c55e" />
    <rect x="235" y="175" width="30" height="8" fill="#16a34a" />
    <rect x="235" y="187" width="30" height="8" fill="#16a34a" />

    {/* Delivery truck coming in */}
    <rect x="30" y="160" width="40" height="25" rx="4" fill="#ef4444" />
    <rect x="55" y="150" width="15" height="10" rx="2" fill="#dc2626" />
    <circle cx="45" cy="185" r="7" fill="#1f2937" />
    <circle cx="60" cy="185" r="7" fill="#1f2937" />

    {/* Connection lines */}
    <path d="M180 50 L180 30" stroke="#3b82f6" strokeWidth="3" strokeDasharray="6 4" opacity="0.6" />
    <path d="M150 40 L210 40" stroke="#3b82f6" strokeWidth="3" strokeDasharray="6 4" opacity="0.6" />
    <circle cx="180" cy="40" r="15" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" />
    <text x="180" y="44" textAnchor="middle" fill="#1d4ed8" fontSize="12" fontWeight="bold">Rp</text>

    {/* Decorative particles */}
    <circle cx="50" cy="80" r="4" fill="rgba(59,130,246,0.15)" />
    <circle cx="310" cy="70" r="3" fill="rgba(59,130,246,0.12)" />
    <circle cx="330" cy="150" r="5" fill="rgba(59,130,246,0.1)" />
  </svg>
);

const DistributionDiagram = () => (
  <svg width="320" height="200" viewBox="0 0 320 200" fill="none" style={{ maxWidth: '100%', height: 'auto' }}>
    {/* Farmers */}
    <rect x="20" y="60" width="80" height="80" rx="12" fill="rgba(34,197,94,0.08)" stroke="rgba(34,197,94,0.2)" strokeWidth="1.5" />
    <path d="M40 100 Q60 80 80 100" stroke="#16a34a" strokeWidth="3" fill="none" />
    <circle cx="50" cy="115" r="8" fill="#22c55e" />
    <circle cx="70" cy="115" r="8" fill="#22c55e" />
    <text x="60" y="155" textAnchor="middle" fill="#16a34a" fontSize="12" fontWeight="700">Petani</text>
    <text x="60" y="170" textAnchor="middle" fill="#16a34a" fontSize="10">Produksi</text>

    {/* Distributor */}
    <rect x="220" y="60" width="80" height="80" rx="12" fill="rgba(59,130,246,0.08)" stroke="rgba(59,130,246,0.2)" strokeWidth="1.5" />
    <rect x="240" y="90" width="40" height="30" rx="4" fill="#3b82f6" />
    <rect x="245" y="80" width="30" height="10" fill="#2563eb" />
    <text x="260" y="155" textAnchor="middle" fill="#1d4ed8" fontSize="12" fontWeight="700">Gudang Anda</text>
    <text x="260" y="170" textAnchor="middle" fill="#1d4ed8" fontSize="10">Distributor</text>

    {/* Flow Arrow */}
    <path d="M105 100 L215 100" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="6 4" />
    <path d="M215 100 L205 93 M215 100 L205 107" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
    <text x="160" y="90" textAnchor="middle" fill="#2563eb" fontSize="10" fontWeight="600">Suplai Langsung</text>

    {/* TPID Hub label */}
    <rect x="125" y="105" width="70" height="20" rx="10" fill="#dbeafe" />
    <text x="160" y="119" textAnchor="middle" fill="#1e40af" fontSize="9" fontWeight="bold">Sistem TPID</text>
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/* ─── FAQ Data ─── */
const faqData = [
  {
    q: 'Darimana asal pasokan komoditas yang saya dapatkan?',
    a: 'Komoditas dipasok langsung dari kelompok tani binaan pemerintah daerah yang terverifikasi, memastikan kualitas segar langsung dari lahan panen.'
  },
  {
    q: 'Apakah harga sudah termasuk biaya pengiriman?',
    a: 'Harga yang diinformasikan oleh admin TPID biasanya adalah harga di tingkat petani (farm-gate price). Biaya pengiriman via armada backhaul akan dihitungkan secara terpisah dengan tarif yang sangat kompetitif.'
  },
  {
    q: 'Bagaimana prosedur pemesanannya?',
    a: 'Cukup hubungi admin TPID via WhatsApp. Admin akan memberikan informasi stok yang sedang panen hari ini beserta harganya. Jika setuju, admin akan mengaturkan armada pengiriman (driver backhaul) ke gudang Anda.'
  },
  {
    q: 'Berapa minimal pemesanan (MOQ)?',
    a: 'Minimal pemesanan disesuaikan dengan kapasitas kendaraan backhaul terkecil, biasanya mulai dari 500 kg hingga kapasitas truk besar, tergantung komoditas dan ketersediaan armada.'
  },
];

/* ─── Benefits Data ─── */
const benefits = [
  { icon: <Store size={22} />, title: 'Pasokan Stabil', desc: 'Dapatkan prioritas pasokan pangan langsung dari sentra produksi terverifikasi.', color: 'rgba(59,130,246,0.1)', iconColor: '#2563eb' },
  { icon: <DollarSign size={22} />, title: 'Harga Kompetitif', desc: 'Memotong rantai pasok panjang, dapatkan harga tangan pertama dari petani.', color: 'rgba(34,197,94,0.08)', iconColor: '#16a34a' },
  { icon: <Truck size={22} />, title: 'Pengiriman Efisien', desc: 'Didukung oleh jaringan armada backhaul dengan biaya logistik yang lebih murah.', color: 'rgba(245,158,11,0.08)', iconColor: '#d97706' },
  { icon: <Shield size={22} />, title: 'Kualitas Terjamin', desc: 'Bekerja sama dengan petani binaan untuk menjamin standar kualitas komoditas.', color: 'rgba(99,102,241,0.08)', iconColor: '#6366f1' },
];

const timeline = [
  { num: 1, title: 'Cek Info Panen', desc: 'Lihat notifikasi atau hubungi admin untuk update panen terbaru.', color: '#3b82f6' },
  { num: 2, title: 'Kesepakatan Harga', desc: 'Deal harga grosir langsung dengan admin TPID.', color: '#22c55e' },
  { num: 3, title: 'Penjadwalan Logistik', desc: 'Admin mencarikan armada backhaul terdekat.', color: '#f59e0b' },
  { num: 4, title: 'Pengiriman', desc: 'Komoditas dikirim langsung dari lahan petani ke gudang Anda.', color: '#6366f1' },
  { num: 5, title: 'Penerimaan & Pembayaran', desc: 'Cek kualitas barang dan selesaikan pembayaran.', color: '#10b981' },
];

const infoCards = [
  { icon: <Search size={22} />, title: 'Komoditas Unggulan', value: 'Kubis, Terung, Wortel, Kembang Kol, Cabai Besar', color: 'rgba(239,68,68,0.08)', iconColor: '#dc2626' },
  { icon: <Package size={22} />, title: 'Kapasitas Suplai', value: 'Sesuai pesanan (Grosir)', color: 'rgba(34,197,94,0.08)', iconColor: '#16a34a' },
  { icon: <Route size={22} />, title: 'Area Layanan', value: 'Seluruh Provinsi', color: 'rgba(59,130,246,0.08)', iconColor: '#2563eb' },
];

function DistributorHome({ user, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const benefitsRef = useScrollReveal('.driver-benefit-card');
  const timelineRef = useScrollReveal('.driver-timeline__item');
  const infoRef = useScrollReveal('.driver-info-card');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const distributorName = user?.name || 'Distributor';

  return (
    <div style={{ '--primary': '#3b82f6', '--primary-dark': '#1d4ed8' }}>
      {/* ════════════════ NAVBAR ════════════════ */}
      <nav className={`driver-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="driver-nav__inner">
          <div className="driver-nav__brand">
            <div className="driver-nav__brand-icon" style={{ background: 'var(--primary)' }}>PD</div>
            <span>PanganDali</span>
          </div>
          <div className="driver-nav__right">
            <div className="driver-nav__user">
              <span className="driver-nav__user-name">{distributorName}</span>
              <div className="driver-nav__user-avatar" style={{ background: 'rgba(59,130,246,0.1)', color: '#1d4ed8' }}>
                {distributorName.substring(0, 2).toUpperCase()}
              </div>
            </div>
            <button className="driver-nav__logout" onClick={onLogout} title="Keluar">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* ════════════════ HERO ════════════════ */}
      <header className="driver-hero">
        <div className="driver-hero__container">
          <div className="driver-hero__content">
            <span className="driver-hero__badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#1d4ed8' }}>
              <Store size={14} />
              Mitra Distributor TPID
            </span>
            <h1 className="driver-hero__greeting">
              Halo, {distributorName} <span className="wave">👋</span>
            </h1>
            <p className="driver-hero__subtitle">
              Amankan pasokan komoditas pangan untuk usaha Anda. Dapatkan suplai langsung dari sentra produksi dengan harga terbaik.
            </p>
            <a 
              href={WA_LINK} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="driver-hero__cta"
              style={{ background: 'var(--primary)', boxShadow: '0 4px 14px rgba(59,130,246,0.3)' }}
            >
              Cek Info Panen Hari Ini
              <ArrowRight size={20} />
            </a>
          </div>
          <div className="driver-hero__illust">
            <MarketIllustration />
          </div>
        </div>
      </header>

      {/* ════════════════ TENTANG DISTRIBUTOR ════════════════ */}
      <section className="driver-section driver-section--alt">
        <div className="container">
          <div className="driver-about__grid">
            <div className="driver-about__text">
              <span className="section-label" style={{ background: 'rgba(59,130,246,0.1)', color: '#1d4ed8' }}>
                <Package size={14} />
                Ekosistem Distribusi
              </span>
              <h2>Suplai Langsung dari <em style={{ color: '#1d4ed8', fontStyle: 'italic' }}>Sumbernya</em></h2>
              <p style={{ marginTop: 16 }}>
                Sebagai mitra distributor resmi, Anda mendapatkan akses langsung ke jaringan petani binaan kami yang sedang memasuki masa panen.
              </p>
              <p style={{ marginTop: 12 }}>
                Sistem PanganDali memfasilitasi pertemuan antara pasokan (petani) dengan permintaan (gudang Anda) serta mengurus pengirimannya melalui program armada backhaul, memastikan Anda mendapatkan komoditas segar dengan biaya logistik yang ditekan seminimal mungkin.
              </p>
            </div>
            <div className="driver-about__illust">
              <DistributionDiagram />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ KEUNTUNGAN ════════════════ */}
      <section className="driver-section">
        <div className="container">
          <div className="section-title-wrapper">
            <span className="section-label" style={{ background: 'rgba(59,130,246,0.1)', color: '#1d4ed8' }}>
              <Zap size={14} />
              Keuntungan
            </span>
            <h2 className="section-title">Nilai Lebih Untuk Bisnis Anda</h2>
            <p className="section-desc">
              Kolaborasi langsung dengan sistem pengendalian pangan daerah memberikan banyak keuntungan.
            </p>
          </div>

          <div className="driver-benefits__grid" ref={benefitsRef}>
            {benefits.map((b, idx) => (
              <div className="driver-benefit-card" key={idx}>
                <div
                  className="driver-benefit-card__icon"
                  style={{ background: b.color, color: b.iconColor }}
                >
                  {b.icon}
                </div>
                <h3 className="driver-benefit-card__title">{b.title}</h3>
                <p className="driver-benefit-card__desc">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ CARA KERJA ════════════════ */}
      <section className="driver-section driver-section--alt">
        <div className="container">
          <div className="section-title-wrapper">
            <span className="section-label" style={{ background: 'rgba(59,130,246,0.1)', color: '#1d4ed8' }}>
              <Workflow size={14} />
              Alur Pengadaan
            </span>
            <h2 className="section-title">Proses Pengadaan Komoditas</h2>
            <p className="section-desc">
              Sederhana, transparan, dan efisien untuk menjaga pasokan gudang Anda.
            </p>
          </div>

          <div className="driver-timeline" ref={timelineRef}>
            <div className="driver-timeline__line" />
            {timeline.map((step) => (
              <div className="driver-timeline__item" key={step.num}>
                <div className="driver-timeline__num" style={{ borderColor: step.color }}>
                  {step.num}
                </div>
                <div className="driver-timeline__content">
                  <h3 className="driver-timeline__title">{step.title}</h3>
                  <p className="driver-timeline__desc">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ INFORMASI LAYANAN ════════════════ */}
      <section className="driver-section">
        <div className="container">
          <div className="section-title-wrapper">
            <span className="section-label" style={{ background: 'rgba(59,130,246,0.1)', color: '#1d4ed8' }}>
              <Search size={14} />
              Ringkasan
            </span>
            <h2 className="section-title">Profil Layanan Distribusi</h2>
            <p className="section-desc">
              Kapasitas dan cakupan layanan kami untuk mitra distributor.
            </p>
          </div>

          <div className="driver-info__grid" ref={infoRef} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {infoCards.map((card, idx) => (
              <div className="driver-info-card" key={idx}>
                <div
                  className="driver-info-card__icon"
                  style={{ background: card.color, color: card.iconColor }}
                >
                  {card.icon}
                </div>
                <h3 className="driver-info-card__title">{card.title}</h3>
                <p className="driver-info-card__value">{card.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ FAQ ════════════════ */}
      <section className="driver-section driver-section--alt">
        <div className="container">
          <div className="section-title-wrapper">
            <span className="section-label" style={{ background: 'rgba(59,130,246,0.1)', color: '#1d4ed8' }}>
              <HelpCircle size={14} />
              FAQ
            </span>
            <h2 className="section-title">Pertanyaan Seputar Pasokan</h2>
          </div>

          <div className="driver-faq">
            {faqData.map((item, idx) => (
              <div
                className={`driver-faq__item ${openFaq === idx ? 'open' : ''}`}
                key={idx}
              >
                <button
                  className="driver-faq__question"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  <span>{item.q}</span>
                  <ChevronDown size={18} className="driver-faq__chevron" />
                </button>
                <div className="driver-faq__answer">
                  <div className="driver-faq__answer-content">{item.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ CTA HUBUNGI ADMIN ════════════════ */}
      <section className="driver-section">
        <div className="container">
          <div className="driver-cta-banner" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)' }}>
            <div className="driver-cta__content">
              <div className="driver-cta__icon" style={{ color: '#60a5fa' }}>
                <Store size={48} />
              </div>
              <h2 className="driver-cta__title">
                Butuh pasokan segera untuk gudang Anda?
              </h2>
              <p className="driver-cta__desc">
                Hubungi admin TPID sekarang untuk mendapatkan daftar komoditas yang sedang panen hari ini beserta penawaran harganya.
              </p>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="driver-cta__btn"
              >
                <WhatsAppIcon />
                Chat Admin TPID (WhatsApp)
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer className="driver-footer">
        <div className="driver-footer__container">
          <div>
            <h3 className="driver-footer__title">PanganDali — Mitra Distributor</h3>
            <p className="driver-footer__desc">
              Menghubungkan pusat produksi dengan pusat distribusi secara efisien.
            </p>
            <p className="driver-footer__copy">
              © {new Date().getFullYear()} PanganDali. Dibangun dengan <Heart size={12} style={{ color: '#ef4444', display: 'inline-block' }} /> untuk stabilitas harga pangan.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default DistributorHome;

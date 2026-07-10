import React, { useState, useEffect, useRef } from 'react';
import {
  LogOut, ArrowRight, Truck, DollarSign, Bell,
  Calendar, Shield, Route, MapPin, Package,
  Clock, ChevronDown, Heart, MessageCircle,
  TrendingUp, Workflow, HelpCircle, Zap, Users
} from 'lucide-react';

const WA_NUMBER = '6281234567890';
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Halo Admin, saya ingin mengambil muatan backhaul hari ini.')}`;

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
const TruckIllustration = () => (
  <svg width="360" height="260" viewBox="0 0 360 260" fill="none" style={{ maxWidth: '100%', height: 'auto' }}>
    {/* Background glow */}
    <circle cx="180" cy="130" r="110" fill="rgba(34,197,94,0.04)" />
    <circle cx="180" cy="130" r="80" fill="rgba(34,197,94,0.06)" />

    {/* Road */}
    <rect x="10" y="195" width="340" height="10" rx="5" fill="#f3f4f6" />
    <rect x="30" y="198" width="45" height="4" rx="2" fill="#e5e7eb" />
    <rect x="100" y="198" width="45" height="4" rx="2" fill="#e5e7eb" />
    <rect x="170" y="198" width="45" height="4" rx="2" fill="#e5e7eb" />
    <rect x="240" y="198" width="45" height="4" rx="2" fill="#e5e7eb" />

    {/* Truck body */}
    <rect x="65" y="120" width="145" height="75" rx="10" fill="#22c55e" />
    <rect x="72" y="127" width="130" height="40" rx="6" fill="rgba(255,255,255,0.18)" />

    {/* Cargo items */}
    <rect x="82" y="132" width="28" height="28" rx="4" fill="rgba(255,255,255,0.3)" />
    <rect x="116" y="128" width="30" height="32" rx="4" fill="rgba(255,255,255,0.25)" />
    <rect x="152" y="134" width="26" height="26" rx="4" fill="rgba(255,255,255,0.28)" />

    {/* Cab */}
    <rect x="210" y="137" width="70" height="58" rx="8" fill="#16a34a" />
    <rect x="222" y="144" width="45" height="28" rx="5" fill="rgba(255,255,255,0.35)" />

    {/* Headlight */}
    <rect x="274" y="173" width="8" height="6" rx="3" fill="#fbbf24" />

    {/* Wheels */}
    <circle cx="115" cy="197" r="18" fill="#1f2937" />
    <circle cx="115" cy="197" r="9" fill="#374151" />
    <circle cx="115" cy="197" r="4" fill="#6b7280" />
    <circle cx="245" cy="197" r="18" fill="#1f2937" />
    <circle cx="245" cy="197" r="9" fill="#374151" />
    <circle cx="245" cy="197" r="4" fill="#6b7280" />

    {/* Backhaul arrows */}
    <path d="M80 95 L270 95" stroke="#22c55e" strokeWidth="2.5" strokeDasharray="8 5" opacity="0.5" />
    <path d="M270 95 L258 86 M270 95 L258 104" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
    <path d="M270 108 L80 108" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="8 5" opacity="0.4" />
    <path d="M80 108 L92 99 M80 108 L92 117" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" opacity="0.6" />

    <text x="175" y="88" textAnchor="middle" fill="#22c55e" fontSize="11" fontWeight="700" opacity="0.6">KIRIM MUATAN</text>
    <text x="175" y="122" textAnchor="middle" fill="#f59e0b" fontSize="11" fontWeight="700" opacity="0.5">BACKHAUL</text>

    {/* Decorative dots */}
    <circle cx="40" cy="80" r="4" fill="rgba(34,197,94,0.15)" />
    <circle cx="320" cy="90" r="3" fill="rgba(245,158,11,0.12)" />
    <circle cx="310" cy="140" r="5" fill="rgba(34,197,94,0.1)" />
    <circle cx="50" cy="160" r="3" fill="rgba(34,197,94,0.12)" />
  </svg>
);

const BackhaulDiagram = () => (
  <svg width="320" height="200" viewBox="0 0 320 200" fill="none" style={{ maxWidth: '100%', height: 'auto' }}>
    {/* City A */}
    <rect x="20" y="60" width="80" height="80" rx="12" fill="rgba(34,197,94,0.08)" stroke="rgba(34,197,94,0.2)" strokeWidth="1.5" />
    <rect x="40" y="90" width="16" height="30" rx="3" fill="rgba(34,197,94,0.2)" />
    <rect x="60" y="80" width="16" height="40" rx="3" fill="rgba(34,197,94,0.15)" />
    <text x="60" y="155" textAnchor="middle" fill="#16a34a" fontSize="12" fontWeight="700">Kota A</text>

    {/* City B */}
    <rect x="220" y="60" width="80" height="80" rx="12" fill="rgba(245,158,11,0.08)" stroke="rgba(245,158,11,0.2)" strokeWidth="1.5" />
    <rect x="240" y="85" width="16" height="35" rx="3" fill="rgba(245,158,11,0.2)" />
    <rect x="260" y="75" width="16" height="45" rx="3" fill="rgba(245,158,11,0.15)" />
    <text x="260" y="155" textAnchor="middle" fill="#d97706" fontSize="12" fontWeight="700">Kota B</text>

    {/* Arrow A -> B (top) */}
    <path d="M105 85 L215 85" stroke="#22c55e" strokeWidth="2.5" strokeDasharray="6 4" />
    <path d="M215 85 L205 78 M215 85 L205 92" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
    <text x="160" y="78" textAnchor="middle" fill="#16a34a" fontSize="10" fontWeight="600">Muatan Kirim</text>

    {/* Small truck icon going right */}
    <rect x="145" y="86" width="24" height="12" rx="3" fill="#22c55e" />
    <rect x="169" y="88" width="10" height="10" rx="2" fill="#16a34a" />

    {/* Arrow B -> A (bottom) */}
    <path d="M215 115 L105 115" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="6 4" />
    <path d="M105 115 L115 108 M105 115 L115 122" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
    <text x="160" y="135" textAnchor="middle" fill="#d97706" fontSize="10" fontWeight="600">Muatan Balik</text>

    {/* Small truck icon going left */}
    <rect x="145" y="107" width="24" height="12" rx="3" fill="#f59e0b" />
    <rect x="135" y="109" width="10" height="10" rx="2" fill="#d97706" />

    {/* Label */}
    <text x="160" y="185" textAnchor="middle" fill="#6b7280" fontSize="11">Truk tidak pulang kosong!</text>
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
    q: 'Bagaimana cara mendapatkan muatan?',
    a: 'Hubungi admin kami melalui WhatsApp. Admin akan memberikan informasi muatan yang tersedia sesuai rute dan jenis kendaraan Anda. Proses ini sederhana dan cepat.'
  },
  {
    q: 'Bagaimana pembayaran dilakukan?',
    a: 'Pembayaran dilakukan secara transparan setelah muatan berhasil diantar. Dana akan ditransfer langsung ke rekening bank yang Anda daftarkan, biasanya dalam 1-3 hari kerja.'
  },
  {
    q: 'Apa syarat kendaraan yang dapat digunakan?',
    a: 'Kendaraan harus memiliki STNK yang masih berlaku, kondisi layak jalan, dan sesuai dengan jenis muatan yang akan diangkut. Kami menerima berbagai jenis kendaraan mulai dari pickup, truk engkel, hingga truk tronton.'
  },
  {
    q: 'Bagaimana jika muatan dibatalkan?',
    a: 'Jika muatan dibatalkan oleh pihak pengirim, Anda tidak akan dikenakan denda. Jika Anda membatalkan setelah menerima muatan, harap hubungi admin segera agar dapat dicari solusi terbaik.'
  },
];

/* ─── Benefits Data ─── */
const benefits = [
  { icon: <DollarSign size={22} />, title: 'Menambah Penghasilan', desc: 'Dapatkan tambahan penghasilan dari setiap muatan balik yang Anda angkut.', color: 'rgba(34,197,94,0.1)', iconColor: '#16a34a' },
  { icon: <Route size={22} />, title: 'Kurangi Perjalanan Kosong', desc: 'Tidak ada lagi truk kosong saat pulang. Setiap perjalanan bernilai.', color: 'rgba(59,130,246,0.08)', iconColor: '#2563eb' },
  { icon: <Bell size={22} />, title: 'Notifikasi Muatan', desc: 'Dapatkan info muatan terbaru langsung melalui WhatsApp.', color: 'rgba(245,158,11,0.08)', iconColor: '#d97706' },
  { icon: <Shield size={22} />, title: 'Pembayaran Transparan', desc: 'Sistem pembayaran yang jelas, tercatat, dan tepat waktu.', color: 'rgba(99,102,241,0.08)', iconColor: '#6366f1' },
  { icon: <Calendar size={22} />, title: 'Jadwal Fleksibel', desc: 'Ambil muatan sesuai jadwal dan rute Anda sendiri.', color: 'rgba(236,72,153,0.08)', iconColor: '#db2777' },
];

const timeline = [
  { num: 1, title: 'Login', desc: 'Masuk ke akun driver Anda.', color: '#22c55e' },
  { num: 2, title: 'Pilih Daerah Tujuan', desc: 'Tentukan rute perjalanan Anda.', color: '#3b82f6' },
  { num: 3, title: 'Hubungi Admin via WhatsApp', desc: 'Chat admin untuk info muatan.', color: '#25d366' },
  { num: 4, title: 'Admin Informasikan Muatan', desc: 'Admin mencarikan muatan sesuai rute.', color: '#6366f1' },
  { num: 5, title: 'Terima Pekerjaan', desc: 'Konfirmasi dan ambil muatan.', color: '#f59e0b' },
  { num: 6, title: 'Angkut Barang', desc: 'Kirim barang ke tujuan.', color: '#ef4444' },
  { num: 7, title: 'Pembayaran Selesai', desc: 'Dana masuk ke rekening Anda.', color: '#10b981' },
];

const infoCards = [
  { icon: <Package size={22} />, title: 'Muatan Tersedia', value: 'Setiap hari', color: 'rgba(34,197,94,0.08)', iconColor: '#16a34a' },
  { icon: <MapPin size={22} />, title: 'Area Distribusi', value: 'Bengkulu & Sekitarnya', color: 'rgba(59,130,246,0.08)', iconColor: '#2563eb' },
  { icon: <Truck size={22} />, title: 'Jenis Komoditas', value: 'Pangan & Agrikultur', color: 'rgba(245,158,11,0.08)', iconColor: '#d97706' },
  { icon: <Route size={22} />, title: 'Estimasi Jarak', value: '50–300 km', color: 'rgba(99,102,241,0.08)', iconColor: '#6366f1' },
  { icon: <TrendingUp size={22} />, title: 'Estimasi Pendapatan', value: 'Rp 500rb – 3jt/trip', color: 'rgba(236,72,153,0.08)', iconColor: '#db2777' },
];

function DriverHome({ user, onLogout }) {
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

  const driverName = user?.name?.split(' ')[0] || 'Driver';

  return (
    <div>
      {/* ════════════════ NAVBAR ════════════════ */}
      <nav className={`driver-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="driver-nav__inner">
          <div className="driver-nav__brand">
            <div className="driver-nav__brand-icon">PD</div>
            <span>PanganDali</span>
          </div>
          <div className="driver-nav__right">
            <div className="driver-nav__user">
              <span className="driver-nav__user-name">{user?.name || 'Driver'}</span>
              <div className="driver-nav__user-avatar">
                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'DR'}
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
            <span className="driver-hero__badge">
              <Truck size={14} />
              Mitra Driver Backhaul
            </span>
            <h1 className="driver-hero__greeting">
              Halo, {driverName} <span className="wave">👋</span>
            </h1>
            <p className="driver-hero__subtitle">
              Selamat datang sebagai Mitra Driver Backhaul. Dapatkan muatan balik dan maksimalkan penghasilan setiap perjalanan.
            </p>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="driver-hero__cta">
              Mulai Ambil Muatan
              <ArrowRight size={20} />
            </a>
          </div>
          <div className="driver-hero__illust">
            <TruckIllustration />
          </div>
        </div>
      </header>

      {/* ════════════════ TENTANG BACKHAUL ════════════════ */}
      <section className="driver-section driver-section--alt">
        <div className="container">
          <div className="driver-about__grid">
            <div className="driver-about__text">
              <span className="section-label">
                <Truck size={14} />
                Program Backhaul
              </span>
              <h2>Apa itu <em style={{ color: 'var(--primary-dark)', fontStyle: 'italic' }}>Backhaul</em>?</h2>
              <p style={{ marginTop: 16 }}>
                Backhaul adalah sistem yang membantu supir memperoleh muatan balik sehingga perjalanan pulang tidak kosong.
                Dengan bergabung sebagai mitra driver, Anda dapat mengoptimalkan setiap perjalanan dan mendapatkan penghasilan tambahan
                dari muatan yang tersedia di rute pulang Anda.
              </p>
              <p style={{ marginTop: 12 }}>
                Sistem ini menghubungkan Anda langsung dengan admin melalui WhatsApp, sehingga proses pengambilan muatan
                menjadi lebih cepat, mudah, dan transparan.
              </p>
            </div>
            <div className="driver-about__illust">
              <BackhaulDiagram />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ KEUNTUNGAN ════════════════ */}
      <section className="driver-section">
        <div className="container">
          <div className="section-title-wrapper">
            <span className="section-label">
              <Zap size={14} />
              Keuntungan
            </span>
            <h2 className="section-title">Keuntungan Menjadi Driver</h2>
            <p className="section-desc">
              Bergabung sebagai mitra driver memberikan berbagai manfaat untuk meningkatkan produktivitas dan penghasilan Anda.
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
            <span className="section-label">
              <Workflow size={14} />
              Alur Proses
            </span>
            <h2 className="section-title">Cara Kerja</h2>
            <p className="section-desc">
              Proses sederhana dari login hingga pembayaran. Semua melalui WhatsApp.
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

      {/* ════════════════ INFORMASI MUATAN ════════════════ */}
      <section className="driver-section">
        <div className="container">
          <div className="section-title-wrapper">
            <span className="section-label">
              <Package size={14} />
              Informasi
            </span>
            <h2 className="section-title">Informasi Muatan</h2>
            <p className="section-desc">
              Gambaran umum muatan yang tersedia untuk Anda.
            </p>
          </div>

          <div className="driver-info__grid" ref={infoRef}>
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
            <span className="section-label">
              <HelpCircle size={14} />
              FAQ
            </span>
            <h2 className="section-title">Pertanyaan Umum</h2>
            <p className="section-desc">
              Jawaban untuk pertanyaan yang sering ditanyakan oleh mitra driver.
            </p>
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
          <div className="driver-cta-banner">
            <div className="driver-cta__content">
              <div className="driver-cta__icon">
                <WhatsAppIcon />
              </div>
              <h2 className="driver-cta__title">
                Ingin mengambil muatan hari ini?
              </h2>
              <p className="driver-cta__desc">
                Hubungi admin kami melalui WhatsApp untuk mendapatkan informasi muatan terbaru sesuai rute perjalanan Anda.
              </p>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="driver-cta__btn"
              >
                <WhatsAppIcon />
                Hubungi Admin via WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer className="driver-footer">
        <div className="driver-footer__container">
          <div>
            <h3 className="driver-footer__title">PanganDali — Mitra Driver</h3>
            <p className="driver-footer__desc">
              Platform distribusi pangan yang transparan dan responsif.
            </p>
            <p className="driver-footer__copy">
              © {new Date().getFullYear()} PanganDali. Dibangun dengan <Heart size={12} style={{ color: '#ef4444', display: 'inline-block' }} /> untuk Indonesia.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default DriverHome;

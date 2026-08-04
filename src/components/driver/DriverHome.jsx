import React, { useState, useEffect, useRef } from 'react';
import {
  LogOut, ArrowRight, Truck, DollarSign, Bell,
  Calendar, Shield, Route, MapPin, Package,
  Clock, ChevronDown, Heart, MessageCircle, CheckCircle,
  TrendingUp, Workflow, HelpCircle, Zap, Users, Search
} from 'lucide-react';

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
    a: 'Update status armada, kapasitas, rute, dan jadwal di panel Status Armada. Sistem kami akan merekomendasikan muatan yang cocok secara otomatis (rule-based matching).'
  },
  {
    q: 'Bagaimana pembayaran dilakukan?',
    a: 'Pembayaran dilakukan langsung antara pihak terkait (misal distributor dan driver) sesuai kesepakatan. Sistem PanganDali hanya mencatat dan menampilkan status pembayaran, bukan memproses atau mentransfer dana.'
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
  { icon: <Bell size={22} />, title: 'Matching Otomatis', desc: 'Sistem mencarikan muatan sesuai ketersediaan armada.', color: 'rgba(245,158,11,0.08)', iconColor: '#d97706' },
  { icon: <Shield size={22} />, title: 'Status Terpantau', desc: 'Sistem mencatat transaksi dan status pengiriman secara transparan.', color: 'rgba(99,102,241,0.08)', iconColor: '#6366f1' },
  { icon: <Calendar size={22} />, title: 'Jadwal Fleksibel', desc: 'Ambil muatan sesuai jadwal dan rute Anda sendiri.', color: 'rgba(236,72,153,0.08)', iconColor: '#db2777' },
];

const timeline = [
  { num: 1, title: 'Login', desc: 'Masuk ke akun driver Anda.', color: '#22c55e' },
  { num: 2, title: 'Update Status Armada', desc: 'Isi lokasi, rute, dan kapasitas armada.', color: '#3b82f6' },
  { num: 3, title: 'Terima Rekomendasi', desc: 'Sistem menampilkan muatan yang cocok.', color: '#25d366' },
  { num: 4, title: 'Konfirmasi Pekerjaan', desc: 'Setujui muatan yang Anda pilih.', color: '#6366f1' },
  { num: 5, title: 'Angkut Barang', desc: 'Kirim barang ke tujuan.', color: '#f59e0b' },
  { num: 6, title: 'Pembayaran', desc: 'Pembayaran diselesaikan langsung dengan pihak terkait.', color: '#10b981' },
];

const infoCards = [
  { icon: <Package size={22} />, title: 'Muatan Tersedia', value: 'Setiap hari', color: 'rgba(34,197,94,0.08)', iconColor: '#16a34a' },
  { icon: <MapPin size={22} />, title: 'Area Layanan', value: 'Rejang Lebong – Kota Bengkulu (Pilot)', color: 'rgba(59,130,246,0.08)', iconColor: '#2563eb' },
  { icon: <Truck size={22} />, title: 'Jenis Komoditas', value: 'Pangan & Agrikultur', color: 'rgba(245,158,11,0.08)', iconColor: '#d97706' },
  { icon: <Route size={22} />, title: 'Estimasi Jarak', value: '80–120 km (koridor pilot)', color: 'rgba(99,102,241,0.08)', iconColor: '#6366f1' },
  { icon: <TrendingUp size={22} />, title: 'Estimasi Pendapatan', value: 'sesuai kesepakatan per trip', color: 'rgba(236,72,153,0.08)', iconColor: '#db2777' },
];

const dummyRecommendations = [
  { id: 1, origin: 'Selupu Rejang', dest: 'Kota Bengkulu', commodity: 'Kubis', weight: '2 Ton', distance: '85 Km', match: 95 },
  { id: 2, origin: 'Bermani Ulu', dest: 'Kepahiang', commodity: 'Cabai Besar', weight: '800 Kg', distance: '40 Km', match: 88 },
];

function DriverHome({ user, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const [fleetStatus, setFleetStatus] = useState('Tidak Aktif');
  const [fleetCapacity, setFleetCapacity] = useState('');
  const [fleetRoute, setFleetRoute] = useState('');
  const [fleetSchedule, setFleetSchedule] = useState('');
  const [fleetLocation, setFleetLocation] = useState('');
  const [showRecommendations, setShowRecommendations] = useState(false);

  const benefitsRef = useScrollReveal('.driver-benefit-card');
  const timelineRef = useScrollReveal('.driver-timeline__item');
  const infoRef = useScrollReveal('.driver-info-card');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const driverName = user?.name?.split(' ')[0] || 'Mitra';

  const handleUpdateFleet = () => {
    if(!fleetCapacity || !fleetRoute || !fleetLocation) return alert("Lengkapi data armada (kapasitas, rute, dan lokasi).");
    setShowRecommendations(true);
  };

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
              <span className="driver-nav__user-name">{user?.name || 'Mitra Logistik'}</span>
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
              Mitra Logistik (Backhaul)
            </span>
            <h1 className="driver-hero__greeting">
              Halo, {driverName} <span className="wave">👋</span>
            </h1>
            <p className="driver-hero__subtitle">
              Selamat datang sebagai Mitra Logistik (Backhaul). Dapatkan muatan balik dan maksimalkan penghasilan setiap perjalanan.
            </p>
            <a href="#armada" className="driver-hero__cta" style={{ textDecoration: 'none' }}>
              Mulai Ambil Muatan
              <ArrowRight size={20} />
            </a>
          </div>
          <div className="driver-hero__illust">
            <TruckIllustration />
          </div>
        </div>
      </header>

      {/* ════════════════ UPDATE STATUS ARMADA ════════════════ */}
      <section id="armada" className="driver-section">
        <div className="container">
          <div className="section-title-wrapper">
            <span className="section-label" style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a' }}>
              <Truck size={14} />
              Operasional
            </span>
            <h2 className="section-title">Pembaruan Status & Pencarian Muatan</h2>
            <p className="section-desc">
              Sistem kami melakukan pencocokan otomatis (rule-based matching) berdasarkan profil armada Anda.
            </p>
          </div>

          <div className="driver-about__grid" style={{ alignItems: 'flex-start' }}>
            <div className="bi-card">
              <h3 className="bi-section-title"><Clock size={18} /> Update Status Armada</h3>
              <div style={{ marginTop: '16px' }}>
                <div className="form-group">
                  <label className="driver-verify__field-label">Status Saat Ini</label>
                  <select className="driver-verify__input" value={fleetStatus} onChange={(e) => setFleetStatus(e.target.value)}>
                    <option value="Tidak Aktif">Tidak Aktif</option>
                    <option value="Tersedia">Tersedia (Siap Muat)</option>
                    <option value="Dalam Perjalanan">Dalam Perjalanan</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label className="driver-verify__field-label">Lokasi Saat Ini / Check-In</label>
                  <input type="text" className="driver-verify__input" placeholder="Misal: Terminal Bengkulu" value={fleetLocation} onChange={(e) => setFleetLocation(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label className="driver-verify__field-label">Kapasitas Tersedia (Kg)</label>
                  <input type="number" className="driver-verify__input" placeholder="Misal: 2000" value={fleetCapacity} onChange={(e) => setFleetCapacity(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label className="driver-verify__field-label">Rute Tujuan (Pulang)</label>
                  <input type="text" className="driver-verify__input" placeholder="Misal: Rejang Lebong" value={fleetRoute} onChange={(e) => setFleetRoute(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label className="driver-verify__field-label">Jadwal Keberangkatan</label>
                  <input type="date" className="driver-verify__input" value={fleetSchedule} onChange={(e) => setFleetSchedule(e.target.value)} />
                </div>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} onClick={handleUpdateFleet}>Cari Muatan</button>
              </div>
            </div>

            <div className="bi-card" style={{ borderLeft: '4px solid #10b981' }}>
              <h3 className="bi-section-title"><Package size={18} /> Muatan Direkomendasikan</h3>
              {!showRecommendations ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <Search size={40} color="#cbd5e1" style={{ margin: '0 auto' }} />
                  <p style={{ marginTop: '12px', color: '#64748b' }}>Perbarui status armada Anda untuk melihat rekomendasi muatan otomatis dari sistem.</p>
                </div>
              ) : (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: '#dcfce7', padding: '12px', borderRadius: '6px', fontSize: '13px', color: '#166534', border: '1px solid #bbf7d0', marginBottom: '8px' }}>
                    <strong>Rule-Based Matching Aktif:</strong> Ditemukan 2 muatan yang sesuai dengan rute {fleetRoute || 'tujuan Anda'} dan kapasitas armada.
                  </div>
                  {dummyRecommendations.map(req => (
                    <div key={req.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="badge badge-success" style={{ background: '#ecfdf5', color: '#10b981' }}>{req.match}% Cocok</span>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>{req.weight} {req.commodity}</span>
                      </div>
                      <h4 style={{ marginTop: '12px', fontSize: '15px' }}>{req.origin} → {req.dest}</h4>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '13px', color: '#64748b' }}>
                        <span><Route size={14} style={{ verticalAlign: 'text-bottom', marginRight: '4px' }} /> {req.distance}</span>
                      </div>
                      <button className="btn btn-outline" style={{ width: '100%', marginTop: '12px', padding: '8px' }} onClick={() => alert('Pekerjaan Diterima! Silakan menuju lokasi pengambilan.')}>
                        Ambil Muatan Ini
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

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
                Dengan bergabung sebagai Mitra Logistik, Anda dapat mengoptimalkan setiap perjalanan dan mendapatkan penghasilan tambahan
                dari muatan yang tersedia di rute pulang Anda.
              </p>
              <p style={{ marginTop: 12 }}>
                Sistem ini menghubungkan Anda langsung dengan ketersediaan muatan, sehingga proses pengambilan muatan
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
            <h2 className="section-title">Keuntungan Menjadi Mitra Logistik</h2>
            <p className="section-desc">
              Bergabung sebagai Mitra Logistik memberikan berbagai manfaat untuk meningkatkan produktivitas dan penghasilan Anda.
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
              Proses sederhana dari login hingga pembayaran yang transparan.
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
              Jawaban untuk pertanyaan yang sering ditanyakan oleh Mitra Logistik.
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

      {/* ════════════════ FOOTER ════════════════ */}
      <footer className="driver-footer">
        <div className="driver-footer__container">
          <div>
            <h3 className="driver-footer__title">PanganDali — Mitra Logistik</h3>
            <p className="driver-footer__desc">
              Platform distribusi pangan yang transparan dan responsif.
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

export default DriverHome;

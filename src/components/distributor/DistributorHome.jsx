import React, { useState, useEffect, useRef } from 'react';
import {
  LogOut, ArrowRight, Package, DollarSign, Bell,
  Calendar, Shield, Route, Search, CheckCircle, Upload,
  Clock, ChevronDown, Heart, FileText,
  TrendingUp, Workflow, HelpCircle, Zap, Store, Truck
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
    q: 'Darimana asal pasokan komoditas yang saya dapatkan?',
    a: 'Komoditas dipasok langsung dari kelompok tani binaan pemerintah daerah yang terverifikasi, memastikan kualitas segar langsung dari lahan panen.'
  },
  {
    q: 'Apakah harga sudah termasuk biaya pengiriman?',
    a: 'Harga yang diinformasikan oleh sistem adalah harga di tingkat petani (farm-gate price). Biaya pengiriman via armada backhaul akan dihitungkan secara terpisah dengan tarif kompetitif pada saat Invoice terbit.'
  },
  {
    q: 'Bagaimana prosedur pemesanannya?',
    a: 'Cukup pilih komoditas di bagian Stok Tervalidasi, ajukan volume permintaan, dan sistem akan mereservasi stok untuk Anda. Setelah PO terbit, Anda dapat mengunggah bukti bayar langsung di platform.'
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
  { num: 1, title: 'Ajukan Permintaan', desc: 'Pilih komoditas dari stok tervalidasi dan ajukan volume.', color: '#3b82f6' },
  { num: 2, title: 'Reserve Volume', desc: 'Sistem me-reserve stok otomatis untuk pesanan Anda.', color: '#22c55e' },
  { num: 3, title: 'PO Digital & Invoice', desc: 'Dapatkan dokumen PO dan Invoice resmi dari sistem.', color: '#f59e0b' },
  { num: 4, title: 'Pembayaran', desc: 'Unggah bukti transfer dan tunggu verifikasi Admin.', color: '#6366f1' },
  { num: 5, title: 'Pengiriman', desc: 'Komoditas dikirim via armada backhaul setelah diverifikasi.', color: '#10b981' },
];

const infoCards = [
  { icon: <Search size={22} />, title: 'Komoditas Unggulan', value: 'Kubis, Terung, Wortel, Kembang Kol, Cabai Besar', color: 'rgba(239,68,68,0.08)', iconColor: '#dc2626' },
  { icon: <Package size={22} />, title: 'Kapasitas Suplai', value: 'Sesuai pesanan (Grosir)', color: 'rgba(34,197,94,0.08)', iconColor: '#16a34a' },
  { icon: <Route size={22} />, title: 'Area Layanan', value: 'Kabupaten Rejang Lebong - Kota Bengkulu (Pilot)', color: 'rgba(59,130,246,0.08)', iconColor: '#2563eb' },
];

const dummyStock = [
  { id: 1, name: 'Cabai Besar', stock: 1200, unit: 'Kg', price: 25000 },
  { id: 2, name: 'Kubis', stock: 4500, unit: 'Kg', price: 4000 },
  { id: 3, name: 'Wortel', stock: 800, unit: 'Kg', price: 6000 },
  { id: 4, name: 'Terung', stock: 1500, unit: 'Kg', price: 5000 },
  { id: 5, name: 'Kembang Kol', stock: 650, unit: 'Kg', price: 8000 },
];

function DistributorHome({ user, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  // Transaction States
  const [selectedStock, setSelectedStock] = useState('');
  const [requestVol, setRequestVol] = useState('');
  const [transactionState, setTransactionState] = useState('idle'); // idle, reserved, po, invoice, waiting_verify, verified

  const benefitsRef = useScrollReveal('.driver-benefit-card');
  const timelineRef = useScrollReveal('.driver-timeline__item');
  const infoRef = useScrollReveal('.driver-info-card');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const distributorName = user?.name || 'Distributor';

  const handleRequest = () => {
    if (!selectedStock || !requestVol) return alert("Pilih komoditas dan volume terlebih dahulu");
    setTransactionState('reserved');
    setTimeout(() => {
      setTransactionState('po');
    }, 1500);
  };

  const handleUpload = () => {
    setTransactionState('waiting_verify');
    setTimeout(() => {
      setTransactionState('verified');
      alert("Pembayaran berhasil diverifikasi oleh Admin (Dinas Pertanian)!");
    }, 2000);
  };

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
              Mitra Distributor Terdaftar
            </span>
            <h1 className="driver-hero__greeting">
              Halo, {distributorName} <span className="wave">👋</span>
            </h1>
            <p className="driver-hero__subtitle">
              Amankan pasokan komoditas pangan untuk usaha Anda. Dapatkan suplai langsung dari sentra produksi dengan harga terbaik.
            </p>
            <a 
              href="#transaksi" 
              className="driver-hero__cta"
              style={{ background: 'var(--primary)', boxShadow: '0 4px 14px rgba(59,130,246,0.3)', textDecoration: 'none' }}
            >
              Lihat Stok & Buat Permintaan
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

      {/* ════════════════ TRANSAKSI & STOK ════════════════ */}
      <section id="transaksi" className="driver-section">
        <div className="container">
          <div className="section-title-wrapper">
            <span className="section-label" style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a' }}>
              <Store size={14} />
              Live Dashboard
            </span>
            <h2 className="section-title">Stok Tervalidasi & Transaksi</h2>
            <p className="section-desc">
              Ajukan permintaan komoditas langsung dari stok terverifikasi.
            </p>
          </div>

          <div className="driver-about__grid" style={{ alignItems: 'flex-start' }}>
            <div className="bi-card">
              <h3 className="bi-section-title"><Package size={18} /> Stok Hari Ini (Estimasi Simulasi)</h3>
              <table className="bi-table" style={{ marginTop: '16px' }}>
                <thead>
                  <tr>
                    <th>Komoditas</th>
                    <th>Volume Tersedia</th>
                    <th>Harga (Rp/Kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {dummyStock.map(s => (
                    <tr key={s.id}>
                      <td><strong>{s.name}</strong></td>
                      <td style={{ color: '#2563eb' }}>{s.stock} {s.unit}</td>
                      <td>Rp {s.price.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bi-card" style={{ borderLeft: '4px solid #3b82f6' }}>
              <h3 className="bi-section-title"><Store size={18} /> Buat Permintaan</h3>
              
              {transactionState === 'idle' && (
                <div style={{ marginTop: '16px' }}>
                  <div className="form-group">
                    <label className="driver-verify__field-label">Pilih Komoditas</label>
                    <select className="driver-verify__input" value={selectedStock} onChange={(e) => setSelectedStock(e.target.value)}>
                      <option value="">-- Pilih --</option>
                      {dummyStock.map(s => (
                        <option key={s.id} value={s.id}>{s.name} (Tersedia: {s.stock} {s.unit})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginTop: '12px' }}>
                    <label className="driver-verify__field-label">Volume Permintaan (Kg)</label>
                    <input type="number" className="driver-verify__input" placeholder="Misal: 500" value={requestVol} onChange={(e) => setRequestVol(e.target.value)} />
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} onClick={handleRequest}>Ajukan Permintaan</button>
                </div>
              )}

              {transactionState === 'reserved' && (
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <Clock size={40} color="#f59e0b" style={{ margin: '0 auto', display: 'block', animation: 'spin 2s linear infinite' }} />
                  <h4 style={{ marginTop: '12px' }}>Sistem Sedang Me-reserve Stok...</h4>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>Mohon tunggu sebentar, kami sedang memverifikasi ketersediaan.</p>
                </div>
              )}

              {transactionState === 'po' && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ background: '#dcfce7', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '16px' }}>
                    <h4 style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={18} /> Volume Berhasil Direservasi!
                    </h4>
                    <p style={{ fontSize: '13px', color: '#14532d', marginTop: '4px' }}>
                      PO Digital & Invoice #INV-{Math.floor(Math.random() * 10000)} telah diterbitkan.
                    </p>
                  </div>
                  <div className="form-group">
                    <label className="driver-verify__field-label">Unggah Bukti Transfer Pembayaran</label>
                    <div style={{ border: '2px dashed #cbd5e1', padding: '20px', textAlign: 'center', borderRadius: '8px', background: '#f8fafc', cursor: 'pointer' }} onClick={handleUpload}>
                      <Upload size={24} color="#64748b" style={{ margin: '0 auto', display: 'block' }} />
                      <span style={{ fontSize: '13px', color: '#64748b', marginTop: '8px', display: 'block' }}>Klik untuk memilih file foto/PDF</span>
                    </div>
                  </div>
                </div>
              )}

              {transactionState === 'waiting_verify' && (
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <Clock size={40} color="#6366f1" style={{ margin: '0 auto', display: 'block' }} />
                  <h4 style={{ marginTop: '12px' }}>Menunggu Verifikasi Admin</h4>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>Bukti bayar berhasil diunggah. Admin (Dinas Pertanian) sedang memverifikasi transaksi Anda.</p>
                </div>
              )}

              {transactionState === 'verified' && (
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto', display: 'block' }} />
                  <h4 style={{ marginTop: '12px', color: '#10b981' }}>Pembayaran Terverifikasi!</h4>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>Armada logistik backhaul sedang disiapkan untuk pengiriman ke gudang Anda. Anda dapat melacak posisi via WhatsApp notifikasi.</p>
                  <button className="btn btn-outline" style={{ marginTop: '16px' }} onClick={() => { setTransactionState('idle'); setSelectedStock(''); setRequestVol(''); }}>Buat Pesanan Baru</button>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ INFORMASI LAYANAN ════════════════ */}
      <section className="driver-section driver-section--alt">
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
      <section className="driver-section">
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

      {/* ════════════════ FOOTER ════════════════ */}
      <footer className="driver-footer">
        <div className="driver-footer__container">
          <div>
            <h3 className="driver-footer__title">PanganDali — Mitra Distributor</h3>
            <p className="driver-footer__desc">
              Menghubungkan pusat produksi dengan pusat distribusi secara efisien melalui platform digital terintegrasi.
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

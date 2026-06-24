// ========================================
// PanganDali - Main Application
// Single Page Application with Hash Router
// ========================================

(function() {
  'use strict';

  // ---- State ----
  let currentPage = 'landing';
  let currentRole = null;
  let charts = {};
  let maps = {};
  let sidebarOpen = false;

  // ---- Utility Functions ----
  function formatCurrency(num) {
    return 'Rp ' + num.toLocaleString('id-ID');
  }

  function formatNumber(num) {
    return num.toLocaleString('id-ID');
  }

  function getStatusBadge(status) {
    const map = {
      'Tervalidasi': 'badge-emerald badge-dot',
      'Menunggu Validasi': 'badge-amber badge-dot',
      'Ditolak': 'badge-red badge-dot',
      'Tersedia': 'badge-emerald badge-dot',
      'Penuh': 'badge-red badge-dot',
      'Kapasitas Kosong Sebagian': 'badge-amber badge-dot',
      'Sedang Mengirim': 'badge-blue badge-dot',
      'Tidak Tersedia': 'badge-gray badge-dot',
      'Distribusi Aktif': 'badge-blue badge-dot',
      'Menunggu Pembayaran': 'badge-amber badge-dot',
      'Menunggu Persetujuan': 'badge-amber badge-dot',
      'Selesai': 'badge-emerald badge-dot',
      'Sedang Dikirim': 'badge-blue badge-dot',
      'Menunggu Pickup': 'badge-amber badge-dot',
      'Mencari Armada': 'badge-red badge-dot',
      'Aman': 'badge-emerald badge-dot',
      'Waspada': 'badge-amber badge-dot',
      'Kritis': 'badge-red badge-dot',
      'Aktif': 'badge-emerald badge-dot',
      'Tidak Aktif': 'badge-gray badge-dot',
    };
    return `<span class="badge ${map[status] || 'badge-gray'}">${status}</span>`;
  }

  function getRiskClass(status) {
    const map = { 'Aman': 'risk-aman', 'Waspada': 'risk-waspada', 'Kritis': 'risk-kritis' };
    return map[status] || '';
  }

  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    const icons = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' };
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  function showModal(content) {
    document.getElementById('modalContent').innerHTML = content;
    document.getElementById('modalOverlay').classList.add('active');
  }

  function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
  }

  // ---- Router ----
  function navigate(page, role) {
    if (role) currentRole = role;
    currentPage = page;
    window.location.hash = page;
    render();
    window.scrollTo(0, 0);
  }

  function handleRoute() {
    const hash = window.location.hash.slice(1) || 'landing';
    if (['petani', 'pembeli', 'logistik', 'tpid', 'admin'].includes(hash)) {
      currentRole = hash;
      currentPage = 'dashboard-' + hash;
    } else {
      currentPage = hash;
    }
    render();
  }

  // ---- Render Engine ----
  function render() {
    const app = document.getElementById('app');
    switch (currentPage) {
      case 'landing': app.innerHTML = renderLanding(); initLanding(); break;
      case 'login': app.innerHTML = renderLogin(); break;
      case 'dashboard-petani': currentRole = 'petani'; app.innerHTML = renderDashboard(renderPetaniDashboard()); initDashboardCharts('petani'); break;
      case 'dashboard-pembeli': currentRole = 'pembeli'; app.innerHTML = renderDashboard(renderPembeliDashboard()); break;
      case 'dashboard-logistik': currentRole = 'logistik'; app.innerHTML = renderDashboard(renderLogistikDashboard()); initLogistikMap(); break;
      case 'dashboard-tpid': currentRole = 'tpid'; app.innerHTML = renderDashboard(renderTPIDDashboard()); initTPIDCharts(); break;
      case 'dashboard-admin': currentRole = 'admin'; app.innerHTML = renderDashboard(renderAdminDashboard()); break;
      case 'backhaul': app.innerHTML = renderDashboard(renderBackhaulPage()); break;
      case 'whatsapp-nlp': app.innerHTML = renderDashboard(renderWhatsAppPage()); initWhatsAppChat(); break;
      case 'ews': app.innerHTML = renderDashboard(renderEWSPage()); initEWSCharts(); break;
      default: app.innerHTML = renderLanding(); initLanding(); break;
    }
  }

  // ========================================
  // LANDING PAGE
  // ========================================
  function renderLanding() {
    return `
    <nav class="landing-navbar" id="landingNav">
      <div class="navbar-inner">
        <a href="#landing" class="navbar-logo" onclick="event.preventDefault();">
          <span class="navbar-logo-icon">🌾</span>
          PanganDali
        </a>
        <ul class="navbar-menu">
          <li><a href="#landing" onclick="event.preventDefault();">Beranda</a></li>
          <li><a href="#fitur" onclick="event.preventDefault(); document.getElementById('solusi').scrollIntoView({behavior:'smooth'})">Fitur</a></li>
          <li><a href="#alur" onclick="event.preventDefault(); document.getElementById('alur').scrollIntoView({behavior:'smooth'})">Alur Sistem</a></li>
          <li><a href="#" onclick="event.preventDefault(); navigate('dashboard-tpid')">Dashboard</a></li>
          <li><a href="#" onclick="event.preventDefault(); navigate('backhaul')">Smart Backhaul</a></li>
          <li><a href="#" onclick="event.preventDefault(); navigate('ews')">EWS</a></li>
          <li><a href="#" class="btn-masuk" onclick="event.preventDefault(); navigate('login')">Masuk</a></li>
        </ul>
        <button class="mobile-menu-btn" onclick="toggleMobileMenu()">☰</button>
      </div>
    </nav>

    <!-- HERO -->
    <section class="hero">
      <div class="hero-grid"></div>
      <div class="hero-particles">
        ${Array.from({length: 20}, (_, i) => `<div class="hero-particle" style="left:${Math.random()*100}%;top:${Math.random()*100}%;--duration:${10+Math.random()*15}s;--delay:${Math.random()*5}s;width:${2+Math.random()*4}px;height:${2+Math.random()*4}px;background:${['rgba(16,185,129,0.4)','rgba(59,130,246,0.3)','rgba(245,158,11,0.3)'][i%3]}"></div>`).join('')}
      </div>
      <div class="hero-content">
        <div class="hero-text">
          <div style="margin-bottom:16px">
            <span class="badge badge-emerald" style="background:rgba(16,185,129,0.15);color:#34d399;border:1px solid rgba(16,185,129,0.3)">🚀 Smart City × AgriTech × Logistics Intelligence</span>
          </div>
          <h1>
            <span class="highlight">Distribution Intelligence</span><br>
            untuk Pengendalian<br>Inflasi Pangan Daerah
          </h1>
          <p class="hero-desc">
            PanganDali menghubungkan petani, pembeli, mitra logistik, dan TPID melalui data panen real-time, optimasi armada kosong, dan dashboard peringatan dini.
          </p>
          <div class="hero-cta">
            <button class="btn btn-primary btn-lg" onclick="navigate('dashboard-tpid')">
              📊 Lihat Dashboard
            </button>
            <button class="btn btn-secondary btn-lg" onclick="navigate('whatsapp-nlp')">
              ▶ Simulasikan Alur
            </button>
          </div>
          <div class="hero-stats">
            <div class="hero-stat-item">
              <div class="hero-stat-value" data-count="1750">0</div>
              <div class="hero-stat-label">Kg Panen / Hari</div>
            </div>
            <div class="hero-stat-item">
              <div class="hero-stat-value" data-count="5">0</div>
              <div class="hero-stat-label">Mitra Logistik</div>
            </div>
            <div class="hero-stat-item">
              <div class="hero-stat-value" data-count="7">0</div>
              <div class="hero-stat-label">Wilayah Terhubung</div>
            </div>
          </div>
        </div>
        <div class="hero-visual">
          <div class="dashboard-preview">
            <div class="preview-header">
              <div class="preview-dot"></div><div class="preview-dot"></div><div class="preview-dot"></div>
            </div>
            <div class="preview-grid">
              <div class="preview-stat">
                <div class="preview-stat-label">Pasokan Hari Ini</div>
                <div class="preview-stat-value">1,750 <span style="font-size:0.75rem;color:rgba(255,255,255,0.5)">kg</span></div>
              </div>
              <div class="preview-stat">
                <div class="preview-stat-label">Distribusi Aktif</div>
                <div class="preview-stat-value" style="color:#34d399">3</div>
              </div>
              <div class="preview-stat">
                <div class="preview-stat-label">Risiko Inflasi</div>
                <div class="preview-stat-value" style="color:#fbbf24">Waspada</div>
              </div>
            </div>
            <div class="preview-chart">
              ${['#10b981','#3b82f6','#f59e0b','#10b981','#3b82f6','#f59e0b','#10b981'].map((c,i) => `<div class="preview-bar" style="background:${c};height:${30+Math.random()*70}%;animation-delay:${i*0.1}s"></div>`).join('')}
            </div>
            <div class="floating-card card-1">🌶️ Cabai Merah — <span style="color:#f87171">+6.7%</span></div>
            <div class="floating-card card-2">🚛 Armada Tersedia: 3 unit</div>
            <div class="floating-card card-3">⚠️ Alert: Defisit pasokan</div>
          </div>
        </div>
      </div>
    </section>

    <!-- MASALAH -->
    <section class="section problem-section">
      <div class="container text-center">
        <span class="badge badge-red" style="margin-bottom:16px">Tantangan Saat Ini</span>
        <h2 class="section-title">Mengapa Distribusi Pangan <span class="text-gradient">Perlu Revolusi?</span></h2>
        <p class="section-subtitle">Empat masalah kritis rantai pasok pangan daerah yang menyebabkan inflasi tidak terkendali.</p>
        <div class="problem-grid">
          <div class="problem-card animate-fadeIn animate-delay-1">
            <div class="problem-icon">🔗</div>
            <h3>Rantai Distribusi Panjang</h3>
            <p>Banyaknya perantara membuat harga naik 40-60% dari petani ke konsumen akhir.</p>
          </div>
          <div class="problem-card animate-fadeIn animate-delay-2">
            <div class="problem-icon">📈</div>
            <h3>Harga Pangan Fluktuatif</h3>
            <p>Tanpa data real-time, TPID kesulitan mendeteksi dan mencegah lonjakan harga.</p>
          </div>
          <div class="problem-card animate-fadeIn animate-delay-3">
            <div class="problem-icon">🚛</div>
            <h3>Empty Backhaul</h3>
            <p>30-40% armada logistik kembali kosong, pemborosan biaya dan emisi karbon.</p>
          </div>
          <div class="problem-card animate-fadeIn animate-delay-4">
            <div class="problem-icon">📊</div>
            <h3>Keterbatasan Data Real-time</h3>
            <p>Data pasokan dan permintaan tidak sinkron, menghambat pengambilan keputusan.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- SOLUSI -->
    <section class="section" id="solusi">
      <div class="container text-center">
        <span class="badge badge-emerald" style="margin-bottom:16px">Solusi PanganDali</span>
        <h2 class="section-title">Tiga Inovasi Utama <span class="text-gradient">yang Mengubah Segalanya</span></h2>
        <p class="section-subtitle">Teknologi cerdas untuk memperkuat rantai pasok pangan daerah.</p>
        <div class="solution-grid">
          <div class="solution-card">
            <div class="solution-icon">💬</div>
            <h3>WhatsApp NLP Parser</h3>
            <p>Petani cukup mengirim pesan WhatsApp biasa. Sistem secara otomatis mengekstrak data komoditas, jumlah, lokasi, dan waktu panen menggunakan Natural Language Processing.</p>
            <button class="btn btn-sm btn-outline-emerald" style="margin-top:16px" onclick="navigate('whatsapp-nlp')">Lihat Simulasi →</button>
          </div>
          <div class="solution-card">
            <div class="solution-icon">🔄</div>
            <h3>Smart Backhaul Matching</h3>
            <p>Memanfaatkan armada kosong mitra logistik terdaftar untuk pengiriman komoditas. Matching berdasarkan kapasitas, rute, jadwal, dan lokasi terakhir.</p>
            <button class="btn btn-sm btn-outline-emerald" style="margin-top:16px" onclick="navigate('backhaul')">Lihat Simulasi →</button>
          </div>
          <div class="solution-card">
            <div class="solution-icon">🛡️</div>
            <h3>Early Warning System TPID</h3>
            <p>Dashboard peringatan dini memantau pasokan, permintaan, harga, dan distribusi. Deteksi risiko inflasi pangan sebelum terjadi lonjakan harga.</p>
            <button class="btn btn-sm btn-outline-emerald" style="margin-top:16px" onclick="navigate('ews')">Lihat Dashboard →</button>
          </div>
        </div>
      </div>
    </section>

    <!-- AKTOR EKOSISTEM -->
    <section class="section actor-section">
      <div class="container text-center">
        <span class="badge" style="background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);border:1px solid rgba(255,255,255,0.2);margin-bottom:16px">Ekosistem Terintegrasi</span>
        <h2 class="section-title" style="color:white">Satu Ekosistem untuk <span style="background:linear-gradient(135deg,#34d399,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Semua Aktor</span></h2>
        <p class="section-subtitle" style="color:rgba(255,255,255,0.6)">Petani, pembeli, logistik, dan pemerintah daerah terhubung dalam satu platform.</p>
        <div class="actor-grid">
          <div class="actor-card">
            <div class="actor-avatar">👨‍🌾</div>
            <h3>Petani</h3>
            <p>Melaporkan panen via WhatsApp. Data otomatis masuk ke sistem distribusi.</p>
          </div>
          <div class="actor-card">
            <div class="actor-avatar">🏢</div>
            <h3>Pembeli / Distributor</h3>
            <p>Melihat ketersediaan komoditas dan membuat Purchase Order secara langsung.</p>
          </div>
          <div class="actor-card">
            <div class="actor-avatar">🚛</div>
            <h3>Mitra Logistik</h3>
            <p>Mendaftarkan armada, melaporkan kapasitas kosong, dan menerima tugas pengiriman.</p>
          </div>
          <div class="actor-card">
            <div class="actor-avatar">🏛️</div>
            <h3>TPID / Pemda</h3>
            <p>Memantau dashboard EWS untuk mendeteksi dan mencegah risiko inflasi pangan.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ALUR KERJA -->
    <section class="section" id="alur">
      <div class="container">
        <div class="text-center">
          <span class="badge badge-blue" style="margin-bottom:16px">Alur Sistem</span>
          <h2 class="section-title">Dari Laporan Panen <span class="text-gradient">ke Keputusan TPID</span></h2>
          <p class="section-subtitle">Enam langkah cerdas yang menghubungkan data pangan, logistik, dan kebijakan.</p>
        </div>
        <div class="workflow-timeline">
          <div class="workflow-line"></div>
          <div class="workflow-step">
            <div class="workflow-number">1</div>
            <div class="workflow-content">
              <h3>💬 Petani Lapor Panen via WhatsApp</h3>
              <p>Petani mengirim pesan natural language ke chatbot WhatsApp. Contoh: "Saya panen cabai 300 kg hari ini di Selupu Rejang".</p>
            </div>
          </div>
          <div class="workflow-step">
            <div class="workflow-number">2</div>
            <div class="workflow-content">
              <h3>🤖 Data Divalidasi oleh NLP Parser</h3>
              <p>Sistem mengekstrak komoditas, jumlah, lokasi, dan waktu panen dari pesan. Admin memvalidasi data.</p>
            </div>
          </div>
          <div class="workflow-step">
            <div class="workflow-number">3</div>
            <div class="workflow-content">
              <h3>🛒 Pembeli Membuat Permintaan</h3>
              <p>Distributor melihat ketersediaan komoditas dan membuat Purchase Order untuk pembelian.</p>
            </div>
          </div>
          <div class="workflow-step">
            <div class="workflow-number">4</div>
            <div class="workflow-content">
              <h3>🔄 Sistem Mencari Armada Kosong Terdekat</h3>
              <p>Smart Backhaul Matching mencocokkan kebutuhan pengiriman dengan armada yang memiliki kapasitas kosong.</p>
            </div>
          </div>
          <div class="workflow-step">
            <div class="workflow-number">5</div>
            <div class="workflow-content">
              <h3>🚛 Distribusi Berjalan</h3>
              <p>Armada terpilih mengambil komoditas dari titik pickup dan mengirim ke tujuan pembeli.</p>
            </div>
          </div>
          <div class="workflow-step">
            <div class="workflow-number">6</div>
            <div class="workflow-content">
              <h3>📊 TPID Memantau Potensi Inflasi</h3>
              <p>Dashboard EWS memperlihatkan kondisi pasokan, harga, dan risiko inflasi. TPID mengambil keputusan intervensi dini.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- DAMPAK -->
    <section class="section impact-section">
      <div class="container text-center">
        <span class="badge badge-amber" style="margin-bottom:16px">Dampak yang Diharapkan</span>
        <h2 class="section-title">Data Pangan Real-time untuk <span class="text-gradient">Distribusi yang Lebih Adil</span></h2>
        <p class="section-subtitle">Empat dampak utama PanganDali terhadap rantai pasok pangan daerah.</p>
        <div class="impact-grid">
          <div class="impact-card">
            <div class="impact-value">↑ 35%</div>
            <div class="impact-label">Akses Pasar Petani</div>
            <div class="impact-desc">Petani terhubung langsung dengan pembeli tanpa perantara berlebih</div>
          </div>
          <div class="impact-card">
            <div class="impact-value">↓ 40%</div>
            <div class="impact-label">Efisiensi Logistik</div>
            <div class="impact-desc">Pengurangan empty backhaul melalui optimasi armada kosong</div>
          </div>
          <div class="impact-card">
            <div class="impact-value">↓ 25%</div>
            <div class="impact-label">Pengurangan Food Loss</div>
            <div class="impact-desc">Distribusi lebih cepat mengurangi kerusakan komoditas segar</div>
          </div>
          <div class="impact-card">
            <div class="impact-value">↓ 15%</div>
            <div class="impact-label">Pengendalian Inflasi</div>
            <div class="impact-desc">Deteksi dini dan intervensi cepat mencegah lonjakan harga</div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section" style="background:var(--gradient-hero);text-align:center;color:white;">
      <div class="container">
        <h2 style="font-size:2.5rem;font-weight:800;margin-bottom:16px;">Smart Economy Bertemu<br><span style="background:linear-gradient(135deg,#34d399,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Smart Governance</span></h2>
        <p style="color:rgba(255,255,255,0.6);font-size:1.125rem;max-width:600px;margin:0 auto 36px;">Pantau pasokan. Optimalkan distribusi. Kendalikan inflasi. Satu ekosistem untuk petani, pembeli, logistik, dan pemerintah daerah.</p>
        <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary btn-lg" onclick="navigate('login')">🚀 Mulai Sekarang</button>
          <button class="btn btn-lg" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:white;" onclick="navigate('dashboard-tpid')">📊 Lihat Dashboard TPID</button>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <h3><span class="navbar-logo-icon" style="width:32px;height:32px;font-size:1rem;display:inline-flex;">🌾</span> PanganDali</h3>
            <p>Platform Distribution Intelligence B2B2G untuk pengendalian inflasi pangan daerah. Menghubungkan petani, pembeli, mitra logistik, dan TPID dalam satu ekosistem data terintegrasi.</p>
            <p style="color:var(--emerald-400);font-weight:600;font-size:0.8125rem;">"Distribusi Pangan Lebih Cerdas, Inflasi Lebih Terkendali"</p>
          </div>
          <div class="footer-column">
            <h4>Platform</h4>
            <a href="#" onclick="event.preventDefault(); navigate('dashboard-petani')">Dashboard Petani</a>
            <a href="#" onclick="event.preventDefault(); navigate('dashboard-pembeli')">Dashboard Pembeli</a>
            <a href="#" onclick="event.preventDefault(); navigate('dashboard-logistik')">Dashboard Logistik</a>
            <a href="#" onclick="event.preventDefault(); navigate('dashboard-tpid')">Dashboard TPID</a>
          </div>
          <div class="footer-column">
            <h4>Fitur Unggulan</h4>
            <a href="#" onclick="event.preventDefault(); navigate('whatsapp-nlp')">WhatsApp NLP Parser</a>
            <a href="#" onclick="event.preventDefault(); navigate('backhaul')">Smart Backhaul</a>
            <a href="#" onclick="event.preventDefault(); navigate('ews')">Early Warning System</a>
          </div>
          <div class="footer-column">
            <h4>Informasi</h4>
            <a href="#">Tentang PanganDali</a>
            <a href="#">Kontak</a>
            <a href="#">Dokumentasi API</a>
            <a href="#">Kebijakan Privasi</a>
          </div>
        </div>
        <div class="footer-bottom">
          <div>
            <p>Pilot Project: <strong>Kabupaten Rejang Lebong, Provinsi Bengkulu</strong></p>
            <p style="margin-top:4px">© 2026 PanganDali — GEMASTIK Smart City</p>
          </div>
          <div class="footer-sdg">
            <span class="sdg-badge" style="background:var(--amber-100);color:var(--amber-700)">SDG 2</span>
            <span class="sdg-badge" style="background:var(--emerald-100);color:var(--emerald-700)">SDG 11</span>
            <span class="sdg-badge" style="background:var(--blue-100);color:var(--blue-700)">SDG 12</span>
          </div>
        </div>
      </div>
    </footer>
    `;
  }

  function initLanding() {
    // Navbar scroll effect
    const nav = document.getElementById('landingNav');
    if (nav) {
      const handleScroll = () => {
        nav.classList.toggle('scrolled', window.scrollY > 50);
      };
      window.addEventListener('scroll', handleScroll);
      handleScroll();
    }
    // Animated counters
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = parseInt(el.dataset.count);
      let current = 0;
      const step = Math.max(1, Math.floor(target / 60));
      const interval = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = formatNumber(current);
        if (current >= target) clearInterval(interval);
      }, 30);
    });
    // Intersection observer for animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = 'running';
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.animate-fadeIn').forEach(el => observer.observe(el));
  }

  // ========================================
  // LOGIN PAGE
  // ========================================
  function renderLogin() {
    return `
    <div class="login-page">
      <div class="hero-grid" style="position:absolute;inset:0;"></div>
      <div class="login-container">
        <div class="login-header">
          <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:16px;">
            <span class="navbar-logo-icon" style="font-size:1.5rem;width:48px;height:48px;">🌾</span>
          </div>
          <h1>Masuk ke PanganDali</h1>
          <p>Pilih peran Anda untuk mengakses dashboard</p>
        </div>
        <div class="role-grid">
          <div class="role-card" onclick="navigate('dashboard-petani', 'petani')">
            <div class="role-icon">👨‍🌾</div>
            <h3>Petani</h3>
            <p>Lapor panen & pantau distribusi</p>
          </div>
          <div class="role-card" onclick="navigate('dashboard-pembeli', 'pembeli')">
            <div class="role-icon">🏢</div>
            <h3>Pembeli / Distributor</h3>
            <p>Beli komoditas & buat PO</p>
          </div>
          <div class="role-card" onclick="navigate('dashboard-logistik', 'logistik')">
            <div class="role-icon">🚛</div>
            <h3>Mitra Logistik</h3>
            <p>Kelola armada & terima tugas</p>
          </div>
          <div class="role-card" onclick="navigate('dashboard-tpid', 'tpid')">
            <div class="role-icon">🏛️</div>
            <h3>TPID / Pemda</h3>
            <p>Pantau EWS & risiko inflasi</p>
          </div>
          <div class="role-card" onclick="navigate('dashboard-admin', 'admin')">
            <div class="role-icon">⚙️</div>
            <h3>Admin Sistem</h3>
            <p>Kelola pengguna & validasi data</p>
          </div>
        </div>
        <div style="text-align:center;margin-top:32px;">
          <a href="#" onclick="event.preventDefault(); navigate('landing')" style="color:rgba(255,255,255,0.5);font-size:0.875rem;">← Kembali ke Beranda</a>
        </div>
      </div>
    </div>
    `;
  }

  // ========================================
  // DASHBOARD LAYOUT
  // ========================================
  function renderDashboard(content) {
    const role = currentRole || 'tpid';
    const roleNames = { petani: 'Petani', pembeli: 'Pembeli', logistik: 'Mitra Logistik', tpid: 'TPID', admin: 'Admin' };
    const roleIcons = { petani: '👨‍🌾', pembeli: '🏢', logistik: '🚛', tpid: '🏛️', admin: '⚙️' };
    const pageTitle = getPageTitle();

    return `
    <div class="dashboard-layout">
      <aside class="sidebar ${sidebarOpen ? 'open' : ''}" id="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">🌾</div>
          <div class="sidebar-brand">
            PanganDali
            <span>Distribution Intelligence</span>
          </div>
        </div>
        <nav class="sidebar-nav">
          <div class="sidebar-section">
            <div class="sidebar-section-title">Menu Utama</div>
            ${getSidebarLinks(role)}
          </div>
          <div class="sidebar-section">
            <div class="sidebar-section-title">Fitur Unggulan</div>
            <button class="sidebar-link ${currentPage === 'whatsapp-nlp' ? 'active' : ''}" onclick="navigate('whatsapp-nlp')">
              <span class="sidebar-link-icon">💬</span> WhatsApp NLP Parser
            </button>
            <button class="sidebar-link ${currentPage === 'backhaul' ? 'active' : ''}" onclick="navigate('backhaul')">
              <span class="sidebar-link-icon">🔄</span> Smart Backhaul
            </button>
            <button class="sidebar-link ${currentPage === 'ews' ? 'active' : ''}" onclick="navigate('ews')">
              <span class="sidebar-link-icon">🛡️</span> Early Warning System
            </button>
          </div>
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="sidebar-user-avatar">${roleIcons[role]}</div>
            <div class="sidebar-user-info">
              <div class="sidebar-user-name">${role === 'petani' ? 'Pak Andi' : role === 'pembeli' ? 'CV Segar Jaya' : role === 'logistik' ? 'Budi Trans' : role === 'tpid' ? 'TPID Rejang Lebong' : 'Administrator'}</div>
              <div class="sidebar-user-role">${roleNames[role]}</div>
            </div>
          </div>
        </div>
      </aside>

      <main class="dashboard-main">
        <header class="dashboard-navbar">
          <div class="dashboard-navbar-left">
            <button class="navbar-icon-btn" onclick="document.getElementById('sidebar').classList.toggle('open')" style="display:none" id="sidebarToggle">☰</button>
            <div>
              <div class="dashboard-page-title">${pageTitle}</div>
              <div class="dashboard-breadcrumb">PanganDali / ${pageTitle}</div>
            </div>
          </div>
          <div class="dashboard-navbar-right">
            <div class="navbar-search">
              <span>🔍</span>
              <input type="text" placeholder="Cari komoditas, petani, armada...">
            </div>
            <button class="navbar-icon-btn" onclick="showToast('Tidak ada notifikasi baru', 'info')">
              🔔
              <span class="notification-dot"></span>
            </button>
            <button class="navbar-icon-btn" onclick="navigate('login')">🚪</button>
          </div>
        </header>
        <div class="dashboard-content">
          ${content}
        </div>
      </main>
    </div>
    `;
  }

  function getSidebarLinks(role) {
    const links = {
      petani: [
        { page: 'dashboard-petani', icon: '📊', label: 'Dashboard' },
        { page: 'dashboard-petani', icon: '🌾', label: 'Laporan Panen' },
        { page: 'dashboard-petani', icon: '📦', label: 'Pesanan' },
        { page: 'dashboard-petani', icon: '💰', label: 'Riwayat Transaksi' },
      ],
      pembeli: [
        { page: 'dashboard-pembeli', icon: '📊', label: 'Dashboard' },
        { page: 'dashboard-pembeli', icon: '🛒', label: 'Marketplace' },
        { page: 'dashboard-pembeli', icon: '📋', label: 'Purchase Order' },
        { page: 'dashboard-pembeli', icon: '🚛', label: 'Tracking' },
      ],
      logistik: [
        { page: 'dashboard-logistik', icon: '📊', label: 'Dashboard' },
        { page: 'dashboard-logistik', icon: '🚛', label: 'Armada Saya' },
        { page: 'dashboard-logistik', icon: '📋', label: 'Tugas Pengiriman' },
        { page: 'dashboard-logistik', icon: '📍', label: 'Peta Lokasi' },
      ],
      tpid: [
        { page: 'dashboard-tpid', icon: '📊', label: 'Command Center' },
        { page: 'dashboard-tpid', icon: '📈', label: 'Monitoring Harga' },
        { page: 'dashboard-tpid', icon: '📦', label: 'Pasokan & Permintaan' },
        { page: 'dashboard-tpid', icon: '🚛', label: 'Distribusi' },
        { page: 'ews', icon: '⚠️', label: 'Peringatan Dini' },
      ],
      admin: [
        { page: 'dashboard-admin', icon: '📊', label: 'Dashboard' },
        { page: 'dashboard-admin', icon: '👥', label: 'Kelola Pengguna' },
        { page: 'dashboard-admin', icon: '✅', label: 'Validasi Data' },
        { page: 'dashboard-admin', icon: '📋', label: 'Komoditas' },
        { page: 'dashboard-admin', icon: '⚙️', label: 'Pengaturan' },
      ],
    };
    return (links[role] || links.tpid).map(l =>
      `<button class="sidebar-link ${currentPage === l.page ? 'active' : ''}" onclick="navigate('${l.page}')">
        <span class="sidebar-link-icon">${l.icon}</span> ${l.label}
      </button>`
    ).join('');
  }

  function getPageTitle() {
    const titles = {
      'dashboard-petani': 'Dashboard Petani',
      'dashboard-pembeli': 'Dashboard Pembeli',
      'dashboard-logistik': 'Dashboard Mitra Logistik',
      'dashboard-tpid': 'Command Center TPID',
      'dashboard-admin': 'Dashboard Admin',
      'backhaul': 'Smart Backhaul Matching',
      'whatsapp-nlp': 'WhatsApp NLP Parser',
      'ews': 'Early Warning System',
    };
    return titles[currentPage] || 'Dashboard';
  }

  // ========================================
  // DASHBOARD: PETANI
  // ========================================
  function renderPetaniDashboard() {
    const myLaporan = LAPORAN_PANEN.filter(l => l.petaniId === 'P001');
    const totalPanen = myLaporan.reduce((a, l) => a + l.jumlah, 0);
    const myOrders = PURCHASE_ORDERS.filter(po => po.petani === 'Pak Andi');

    return `
    <div class="dashboard-greeting">
      <h1>Selamat Pagi, Pak Andi 👨‍🌾</h1>
      <p>Berikut ringkasan aktivitas panen dan distribusi Anda.</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card emerald">
        <div class="stat-icon emerald">🌾</div>
        <div class="stat-content">
          <div class="stat-label">Total Panen Bulan Ini</div>
          <div class="stat-value">${formatNumber(totalPanen)} <span style="font-size:0.875rem;font-weight:500;color:var(--gray-500)">kg</span></div>
          <div class="stat-trend up">↑ 12% dari bulan lalu</div>
        </div>
      </div>
      <div class="stat-card blue">
        <div class="stat-icon blue">📦</div>
        <div class="stat-content">
          <div class="stat-label">Komoditas Tersedia</div>
          <div class="stat-value">2</div>
          <div class="stat-trend neutral">Cabai Merah, Wortel</div>
        </div>
      </div>
      <div class="stat-card amber">
        <div class="stat-icon amber">🛒</div>
        <div class="stat-content">
          <div class="stat-label">Pesanan Aktif</div>
          <div class="stat-value">${myOrders.filter(o => o.status !== 'Selesai').length}</div>
          <div class="stat-trend up">Perlu tindakan</div>
        </div>
      </div>
      <div class="stat-card emerald">
        <div class="stat-icon emerald">💰</div>
        <div class="stat-content">
          <div class="stat-label">Pendapatan Estimasi</div>
          <div class="stat-value">${formatCurrency(myOrders.reduce((a, o) => a + o.total, 0))}</div>
          <div class="stat-trend up">↑ Bulan ini</div>
        </div>
      </div>
    </div>

    <div class="chart-grid">
      <!-- WhatsApp Simulator Mini -->
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title">💬 Simulasi Lapor Panen via WhatsApp</div>
          <button class="btn btn-sm btn-outline-emerald" onclick="navigate('whatsapp-nlp')">Buka Penuh</button>
        </div>
        <div style="background:#e5ddd5;border-radius:var(--radius-md);padding:16px;max-height:240px;overflow-y:auto;">
          <div class="wa-message sent">
            Saya panen cabai 300 kg hari ini di Selupu Rejang
            <div class="wa-time">08:30</div>
          </div>
          <div class="wa-message received parsed">
            📋 <strong>Hasil Parsing:</strong><br>
            • Komoditas: Cabai Merah<br>
            • Jumlah: 300 kg<br>
            • Lokasi: Selupu Rejang<br>
            • Waktu: Hari ini<br>
            • Status: ✅ Tervalidasi
            <div class="wa-time">08:30</div>
          </div>
        </div>
      </div>

      <!-- Form Laporan Panen -->
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title">📝 Form Laporan Panen Manual</div>
        </div>
        <div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group" style="margin-bottom:12px;">
              <label class="form-label">Komoditas</label>
              <select class="form-select" id="petaniKomoditas">
                ${KOMODITAS.map(k => `<option value="${k.nama}">${k.icon} ${k.nama}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="margin-bottom:12px;">
              <label class="form-label">Jumlah (kg)</label>
              <input type="number" class="form-input" placeholder="300" value="300">
            </div>
            <div class="form-group" style="margin-bottom:12px;">
              <label class="form-label">Lokasi</label>
              <select class="form-select">
                ${LOKASI.filter(l => l.tipe === 'kecamatan').map(l => `<option>${l.nama}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="margin-bottom:12px;">
              <label class="form-label">Tanggal Panen</label>
              <input type="date" class="form-input" value="2026-06-21">
            </div>
          </div>
          <div class="form-group" style="margin-bottom:12px;">
            <label class="form-label">Estimasi Harga per kg</label>
            <input type="number" class="form-input" placeholder="45000" value="45000">
          </div>
          <button class="btn btn-primary" style="width:100%" onclick="showToast('Laporan panen berhasil dikirim!', 'success')">📤 Kirim Laporan Panen</button>
        </div>
      </div>
    </div>

    <!-- Tabel Laporan Panen -->
    <div class="card" style="margin-bottom:20px;">
      <div class="chart-header">
        <div class="chart-title">📋 Riwayat Laporan Panen</div>
        <div class="pill-nav">
          <button class="active">Semua</button>
          <button>Tervalidasi</button>
          <button>Menunggu</button>
        </div>
      </div>
      <div class="table-wrapper" style="border:none;">
        <table class="data-table">
          <thead>
            <tr><th>Tanggal</th><th>Komoditas</th><th>Jumlah</th><th>Lokasi</th><th>Harga/kg</th><th>Sumber</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${LAPORAN_PANEN.map(l => `
              <tr>
                <td>${l.tanggal}</td>
                <td><strong>${l.komoditas}</strong></td>
                <td>${formatNumber(l.jumlah)} kg</td>
                <td>${l.lokasi}</td>
                <td>${formatCurrency(l.harga)}</td>
                <td><span class="badge ${l.sumber === 'WhatsApp NLP' ? 'badge-emerald' : 'badge-gray'}">${l.sumber}</span></td>
                <td>${getStatusBadge(l.status)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pesanan dari Pembeli -->
    <div class="card">
      <div class="chart-header">
        <div class="chart-title">🛒 Pesanan dari Pembeli</div>
      </div>
      <div class="table-wrapper" style="border:none;">
        <table class="data-table">
          <thead>
            <tr><th>ID</th><th>Pembeli</th><th>Komoditas</th><th>Jumlah</th><th>Tujuan</th><th>Total</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${myOrders.map(po => `
              <tr>
                <td><code style="font-family:var(--font-mono);font-size:0.8125rem;color:var(--blue-600)">${po.id}</code></td>
                <td>${po.pembeli}</td>
                <td>${po.komoditas}</td>
                <td>${formatNumber(po.jumlah)} kg</td>
                <td>${po.tujuan}</td>
                <td><strong>${formatCurrency(po.total)}</strong></td>
                <td>${getStatusBadge(po.status)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    `;
  }

  function initDashboardCharts(role) {
    // Simple chart for petani could be added here
  }

  // ========================================
  // DASHBOARD: PEMBELI
  // ========================================
  function renderPembeliDashboard() {
    return `
    <div class="dashboard-greeting">
      <h1>Dashboard Pembeli — CV Segar Jaya 🏢</h1>
      <p>Temukan komoditas terbaik dari petani Rejang Lebong.</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card emerald">
        <div class="stat-icon emerald">📦</div>
        <div class="stat-content">
          <div class="stat-label">Komoditas Tersedia</div>
          <div class="stat-value">5</div>
          <div class="stat-trend up">Dari ${LAPORAN_PANEN.filter(l=>l.status==='Tervalidasi').length} laporan</div>
        </div>
      </div>
      <div class="stat-card blue">
        <div class="stat-icon blue">🛒</div>
        <div class="stat-content">
          <div class="stat-label">PO Aktif</div>
          <div class="stat-value">${PURCHASE_ORDERS.filter(p=>p.pembeli==='CV Segar Jaya' && p.status!=='Selesai').length}</div>
          <div class="stat-trend neutral">Sedang diproses</div>
        </div>
      </div>
      <div class="stat-card amber">
        <div class="stat-icon amber">🚛</div>
        <div class="stat-content">
          <div class="stat-label">Distribusi Aktif</div>
          <div class="stat-value">1</div>
          <div class="stat-trend up">Sedang dikirim</div>
        </div>
      </div>
      <div class="stat-card emerald">
        <div class="stat-icon emerald">💰</div>
        <div class="stat-content">
          <div class="stat-label">Total Pembelian</div>
          <div class="stat-value">${formatCurrency(14700000)}</div>
          <div class="stat-trend up">Bulan ini</div>
        </div>
      </div>
    </div>

    <!-- Marketplace Komoditas -->
    <div class="card" style="margin-bottom:20px;">
      <div class="chart-header">
        <div class="chart-title">🛒 Marketplace Komoditas Tersedia</div>
        <div style="display:flex;gap:8px;">
          <select class="form-select" style="width:auto;padding:6px 12px;font-size:0.8125rem;">
            <option>Semua Komoditas</option>
            ${KOMODITAS.map(k => `<option>${k.nama}</option>`).join('')}
          </select>
          <select class="form-select" style="width:auto;padding:6px 12px;font-size:0.8125rem;">
            <option>Semua Lokasi</option>
            ${LOKASI.filter(l=>l.tipe==='kecamatan').map(l => `<option>${l.nama}</option>`).join('')}
          </select>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin-top:16px;">
        ${LAPORAN_PANEN.filter(l => l.status === 'Tervalidasi').map(l => `
          <div class="card" style="padding:20px;">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
              <div>
                <div style="font-size:2rem;margin-bottom:4px;">${KOMODITAS.find(k=>k.nama===l.komoditas)?.icon || '🌿'}</div>
                <h3 style="font-size:1.0625rem;font-weight:700;">${l.komoditas}</h3>
              </div>
              ${getStatusBadge('Tersedia')}
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.8125rem;margin-bottom:12px;">
              <div><span style="color:var(--gray-500)">Jumlah:</span> <strong>${formatNumber(l.jumlah)} kg</strong></div>
              <div><span style="color:var(--gray-500)">Harga:</span> <strong>${formatCurrency(l.harga)}/kg</strong></div>
              <div><span style="color:var(--gray-500)">Petani:</span> ${l.petani}</div>
              <div><span style="color:var(--gray-500)">Lokasi:</span> ${l.lokasi}</div>
            </div>
            <button class="btn btn-primary btn-sm" style="width:100%;" onclick="showPurchaseOrderModal('${l.komoditas}', ${l.jumlah}, '${l.petani}', '${l.lokasi}', ${l.harga})">
              🛒 Buat Purchase Order
            </button>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Tabel PO -->
    <div class="card">
      <div class="chart-header">
        <div class="chart-title">📋 Daftar Purchase Order</div>
      </div>
      <div class="table-wrapper" style="border:none;">
        <table class="data-table">
          <thead>
            <tr><th>ID</th><th>Komoditas</th><th>Jumlah</th><th>Petani</th><th>Asal</th><th>Tujuan</th><th>Total</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${PURCHASE_ORDERS.map(po => `
              <tr>
                <td><code style="font-family:var(--font-mono);font-size:0.8125rem;color:var(--blue-600)">${po.id}</code></td>
                <td><strong>${po.komoditas}</strong></td>
                <td>${formatNumber(po.jumlah)} kg</td>
                <td>${po.petani}</td>
                <td>${po.lokasiAsal}</td>
                <td>${po.tujuan}</td>
                <td><strong>${formatCurrency(po.total)}</strong></td>
                <td>${getStatusBadge(po.status)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    `;
  }

  // ========================================
  // DASHBOARD: MITRA LOGISTIK
  // ========================================
  function renderLogistikDashboard() {
    return `
    <div class="dashboard-greeting">
      <h1>Dashboard Mitra Logistik — Budi Trans 🚛</h1>
      <p>Kelola armada, kapasitas, dan tugas pengiriman Anda.</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card emerald">
        <div class="stat-icon emerald">🚛</div>
        <div class="stat-content">
          <div class="stat-label">Total Armada</div>
          <div class="stat-value">${ARMADA.length}</div>
          <div class="stat-trend neutral">${ARMADA.filter(a=>a.status==='Tersedia').length} tersedia</div>
        </div>
      </div>
      <div class="stat-card blue">
        <div class="stat-icon blue">📦</div>
        <div class="stat-content">
          <div class="stat-label">Kapasitas Kosong Total</div>
          <div class="stat-value">${formatNumber(ARMADA.reduce((a,f)=>a+f.kapasitasKosong,0))} <span style="font-size:0.875rem;color:var(--gray-500)">kg</span></div>
          <div class="stat-trend up">Tersedia untuk matching</div>
        </div>
      </div>
      <div class="stat-card amber">
        <div class="stat-icon amber">📋</div>
        <div class="stat-content">
          <div class="stat-label">Tugas Aktif</div>
          <div class="stat-value">${TUGAS_PENGIRIMAN.filter(t=>t.status !== 'Mencari Armada').length}</div>
          <div class="stat-trend neutral">Sedang berjalan</div>
        </div>
      </div>
      <div class="stat-card emerald">
        <div class="stat-icon emerald">✅</div>
        <div class="stat-content">
          <div class="stat-label">Pengiriman Selesai</div>
          <div class="stat-value">12</div>
          <div class="stat-trend up">Bulan ini</div>
        </div>
      </div>
    </div>

    <div class="chart-grid">
      <!-- Status Armada -->
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title">🚛 Status Armada</div>
          <button class="btn btn-sm btn-primary" onclick="showToast('Status armada berhasil diperbarui!', 'success')">🔄 Update Status</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${ARMADA.map(a => `
            <div class="fleet-card">
              <div class="fleet-icon">🚛</div>
              <div class="fleet-info">
                <div class="fleet-name">${a.jenis} — <span style="color:var(--gray-500);font-weight:400">${a.plat}</span></div>
                <div class="fleet-detail">Pengemudi: ${a.pengemudi} • Rute: ${a.rute}</div>
                <div class="fleet-meta">
                  ${getStatusBadge(a.status)}
                  <span class="badge badge-blue">Kapasitas kosong: ${formatNumber(a.kapasitasKosong)} kg</span>
                  <span class="badge badge-gray">📍 ${a.lokasiTerakhir}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Form Update & Map -->
      <div style="display:flex;flex-direction:column;gap:20px;">
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title">📍 Check-in & Update</div>
          </div>
          <div class="form-group">
            <label class="form-label">Kendaraan</label>
            <select class="form-select">
              ${ARMADA.map(a => `<option>${a.jenis} — ${a.plat}</option>`).join('')}
            </select>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label class="form-label">Kapasitas Kosong (kg)</label>
              <input type="number" class="form-input" value="600">
            </div>
            <div class="form-group">
              <label class="form-label">Lokasi Terakhir</label>
              <select class="form-select">
                ${LOKASI.map(l => `<option>${l.nama}</option>`).join('')}
              </select>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label class="form-label">Rute Tujuan</label>
              <select class="form-select">
                ${LOKASI.filter(l=>l.tipe==='kota').map(l => `<option>${l.nama}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Jadwal Berangkat</label>
              <input type="datetime-local" class="form-input" value="2026-06-22T06:00">
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-primary btn-sm" style="flex:1" onclick="showToast('Lokasi berhasil di-check-in!', 'success')">📍 Check-in Lokasi</button>
            <button class="btn btn-success btn-sm" style="flex:1" onclick="showToast('Status armada berhasil diperbarui!', 'success')">🔄 Update Status</button>
          </div>
        </div>

        <!-- Peta -->
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title">🗺️ Peta Lokasi Armada</div>
          </div>
          <div id="logistikMap" class="map-container" style="height:260px;"></div>
        </div>
      </div>
    </div>

    <!-- Tugas Pengiriman -->
    <div class="card" style="margin-top:20px;">
      <div class="chart-header">
        <div class="chart-title">📋 Tugas Pengiriman</div>
        <button class="btn btn-sm btn-outline-emerald" onclick="navigate('backhaul')">🔄 Smart Backhaul Matching</button>
      </div>
      <div class="table-wrapper" style="border:none;">
        <table class="data-table">
          <thead>
            <tr><th>ID</th><th>Komoditas</th><th>Jumlah</th><th>Titik Ambil</th><th>Tujuan</th><th>Jarak</th><th>Armada</th><th>Status</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            ${TUGAS_PENGIRIMAN.map(t => `
              <tr>
                <td><code style="font-family:var(--font-mono);font-size:0.8125rem;color:var(--blue-600)">${t.id}</code></td>
                <td><strong>${t.komoditas}</strong></td>
                <td>${t.jumlah} kg</td>
                <td>${t.titikAmbil}</td>
                <td>${t.tujuan}</td>
                <td>${t.jarak}</td>
                <td>${t.armada}</td>
                <td>${getStatusBadge(t.status)}</td>
                <td>
                  ${t.status === 'Mencari Armada' ?
                    `<button class="btn btn-sm btn-success" onclick="showToast('Tugas pengiriman diterima!','success')">Terima</button>` :
                    `<button class="btn btn-sm btn-ghost">Detail</button>`
                  }
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    `;
  }

  function initLogistikMap() {
    setTimeout(() => {
      const mapEl = document.getElementById('logistikMap');
      if (!mapEl || mapEl._leaflet_id) return;
      try {
        const map = L.map('logistikMap').setView([-3.46, 102.60], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(map);
        ARMADA.forEach(a => {
          const color = a.status === 'Tersedia' ? '#10b981' : a.status === 'Penuh' ? '#ef4444' : '#f59e0b';
          const icon = L.divIcon({
            html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🚛</div>`,
            iconSize: [28, 28],
            className: ''
          });
          L.marker([a.lat, a.lng], { icon }).addTo(map)
            .bindPopup(`<strong>${a.jenis}</strong><br>${a.pengemudi}<br>Status: ${a.status}<br>Kapasitas kosong: ${a.kapasitasKosong} kg`);
        });
        // Add pickup points
        LAPORAN_PANEN.filter(l => l.status === 'Tervalidasi').forEach(l => {
          const lok = LOKASI.find(loc => loc.nama === l.lokasi);
          if (lok) {
            const icon = L.divIcon({
              html: `<div style="background:#3b82f6;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.2);">📦</div>`,
              iconSize: [24, 24],
              className: ''
            });
            L.marker([lok.lat, lok.lng], { icon }).addTo(map)
              .bindPopup(`<strong>Titik Pickup</strong><br>${l.komoditas}: ${l.jumlah} kg<br>${l.lokasi}`);
          }
        });
        maps.logistik = map;
      } catch(e) { console.warn('Map init failed:', e); }
    }, 200);
  }

  // ========================================
  // DASHBOARD: TPID (COMMAND CENTER)
  // ========================================
  function renderTPIDDashboard() {
    const totalPasokan = PASOKAN_VS_PERMINTAAN.reduce((a, p) => a + p.pasokan, 0);
    const risikoTinggi = RISIKO_KOMODITAS.filter(r => r.status === 'Kritis' || r.status === 'Waspada').length;

    return `
    <div class="cc-header" style="background:linear-gradient(135deg,rgba(16,185,129,0.08),rgba(59,130,246,0.08));border:1px solid var(--border-color);">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
        <div>
          <h1 style="color:var(--text-primary);">🏛️ Command Center TPID — Rejang Lebong</h1>
          <p style="color:var(--text-secondary);">Pantau pasokan. Optimalkan distribusi. Kendalikan inflasi.</p>
        </div>
        <div style="display:flex;gap:8px;">
          <span class="badge badge-emerald badge-dot">LIVE</span>
          <span class="badge badge-gray">Update: ${new Date().toLocaleTimeString('id-ID', {hour:'2-digit',minute:'2-digit'})}</span>
        </div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card emerald">
        <div class="stat-icon emerald">📦</div>
        <div class="stat-content">
          <div class="stat-label">Total Pasokan Hari Ini</div>
          <div class="stat-value">${formatNumber(totalPasokan)} <span style="font-size:0.875rem;color:var(--gray-500)">kg</span></div>
          <div class="stat-trend up">↑ 8% dari kemarin</div>
        </div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon red">⚠️</div>
        <div class="stat-content">
          <div class="stat-label">Komoditas Risiko Tinggi</div>
          <div class="stat-value">${risikoTinggi}</div>
          <div class="stat-trend down">Perlu perhatian</div>
        </div>
      </div>
      <div class="stat-card blue">
        <div class="stat-icon blue">🚛</div>
        <div class="stat-content">
          <div class="stat-label">Distribusi Aktif</div>
          <div class="stat-value">3</div>
          <div class="stat-trend neutral">2 armada sedang mengirim</div>
        </div>
      </div>
      <div class="stat-card amber">
        <div class="stat-icon amber">📈</div>
        <div class="stat-content">
          <div class="stat-label">Indeks Risiko Inflasi</div>
          <div class="stat-value" style="color:var(--amber-600);">Waspada</div>
          <div class="stat-trend down">Cabai & bawang naik</div>
        </div>
      </div>
    </div>

    <div class="chart-grid">
      <!-- Grafik Harga -->
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title">📈 Tren Harga Komoditas (7 Hari Terakhir)</div>
          <div class="pill-nav">
            <button class="active">7 Hari</button>
            <button>30 Hari</button>
          </div>
        </div>
        <div class="chart-container">
          <canvas id="chartHarga"></canvas>
        </div>
      </div>

      <!-- Grafik Pasokan vs Permintaan -->
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title">📊 Pasokan vs Permintaan</div>
        </div>
        <div class="chart-container">
          <canvas id="chartPasokan"></canvas>
        </div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:20px;">
      <!-- Tabel Risiko Komoditas -->
      <div class="card">
        <div class="chart-header">
          <div class="chart-title">📋 Status Risiko Komoditas</div>
        </div>
        <div class="table-wrapper" style="border:none;">
          <table class="data-table">
            <thead>
              <tr><th>Komoditas</th><th>Pasokan</th><th>Permintaan</th><th>Harga Rata-rata</th><th>Perubahan</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${RISIKO_KOMODITAS.map(r => `
                <tr>
                  <td><strong>${KOMODITAS.find(k=>k.nama===r.komoditas)?.icon || ''} ${r.komoditas}</strong></td>
                  <td>${formatNumber(r.pasokan)} kg</td>
                  <td>${formatNumber(r.permintaan)} kg</td>
                  <td>${formatCurrency(r.hargaRataRata)}</td>
                  <td><span style="color:${r.perubahanHarga.startsWith('+') ? 'var(--red-500)' : r.perubahanHarga.startsWith('-') ? 'var(--emerald-500)' : 'var(--gray-500)'};font-weight:600">${r.perubahanHarga}</span></td>
                  <td><span class="risk-indicator ${getRiskClass(r.status)}">${r.status === 'Kritis' ? '🔴' : r.status === 'Waspada' ? '🟡' : '🟢'} ${r.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Alert & Rekomendasi -->
      <div style="display:flex;flex-direction:column;gap:20px;">
        <div class="card">
          <div class="chart-header">
            <div class="chart-title">⚠️ Alert EWS</div>
            <button class="btn btn-sm btn-outline-emerald" onclick="navigate('ews')">Lihat Semua</button>
          </div>
          ${EWS_ALERTS.slice(0, 3).map(a => `
            <div class="alert-card ${a.level.toLowerCase()}">
              <div class="alert-icon">${a.level === 'Kritis' ? '🔴' : a.level === 'Waspada' ? '🟡' : '🟢'}</div>
              <div class="alert-content">
                <h4>${a.komoditas}</h4>
                <p>${a.pesan}</p>
                <div class="alert-time">${a.waktu}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="card">
          <div class="chart-header">
            <div class="chart-title">💡 Rekomendasi Intervensi</div>
          </div>
          ${REKOMENDASI_INTERVENSI.map(r => `
            <div style="padding:12px;background:var(--gray-50);border-radius:var(--radius-md);margin-bottom:8px;display:flex;gap:10px;align-items:flex-start;">
              <span style="font-size:1.25rem;">${r.ikon}</span>
              <div>
                <span class="badge ${r.prioritas === 'Tinggi' ? 'badge-red' : 'badge-amber'}" style="font-size:0.6875rem;margin-bottom:4px;">${r.prioritas}</span>
                <p style="font-size:0.8125rem;color:var(--text-secondary);margin-top:4px;">${r.pesan}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Peta Distribusi -->
    <div class="card">
      <div class="chart-header">
        <div class="chart-title">🗺️ Peta Distribusi Rejang Lebong</div>
      </div>
      <div id="tpidMap" class="map-container"></div>
    </div>
    `;
  }

  function initTPIDCharts() {
    // Destroy existing charts
    Object.values(charts).forEach(c => { if (c && c.destroy) c.destroy(); });
    charts = {};

    setTimeout(() => {
      // Price trend chart
      const hargaCtx = document.getElementById('chartHarga');
      if (hargaCtx) {
        charts.harga = new Chart(hargaCtx, {
          type: 'line',
          data: {
            labels: HARGA_HISTORIS.labels,
            datasets: [
              { label: 'Cabai Merah', data: HARGA_HISTORIS.cabaiMerah, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', tension: 0.4, fill: false, borderWidth: 2.5 },
              { label: 'Bawang Merah', data: HARGA_HISTORIS.bawangMerah, borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', tension: 0.4, fill: false, borderWidth: 2.5 },
              { label: 'Wortel', data: HARGA_HISTORIS.wortel, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', tension: 0.4, fill: false, borderWidth: 2 },
              { label: 'Kubis', data: HARGA_HISTORIS.kubis, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', tension: 0.4, fill: false, borderWidth: 2 },
              { label: 'Kembang Kol', data: HARGA_HISTORIS.kembangKol, borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.1)', tension: 0.4, fill: false, borderWidth: 2 },
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16, font: { family: "'Plus Jakarta Sans'" } } },
            },
            scales: {
              y: {
                beginAtZero: false,
                ticks: { callback: v => 'Rp ' + (v/1000) + 'k', font: { family: "'Plus Jakarta Sans'" } },
                grid: { color: 'rgba(0,0,0,0.04)' }
              },
              x: { grid: { display: false }, ticks: { font: { family: "'Plus Jakarta Sans'" } } }
            },
            interaction: { intersect: false, mode: 'index' },
          }
        });
      }

      // Supply vs demand chart
      const pasokanCtx = document.getElementById('chartPasokan');
      if (pasokanCtx) {
        charts.pasokan = new Chart(pasokanCtx, {
          type: 'bar',
          data: {
            labels: PASOKAN_VS_PERMINTAAN.map(p => p.komoditas),
            datasets: [
              { label: 'Pasokan', data: PASOKAN_VS_PERMINTAAN.map(p => p.pasokan), backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 6 },
              { label: 'Permintaan', data: PASOKAN_VS_PERMINTAAN.map(p => p.permintaan), backgroundColor: 'rgba(59,130,246,0.7)', borderRadius: 6 },
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16, font: { family: "'Plus Jakarta Sans'" } } },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { callback: v => v + ' kg', font: { family: "'Plus Jakarta Sans'" } },
                grid: { color: 'rgba(0,0,0,0.04)' }
              },
              x: { grid: { display: false }, ticks: { font: { family: "'Plus Jakarta Sans'", size: 11 } } }
            },
          }
        });
      }

      // TPID Map
      const tpidMapEl = document.getElementById('tpidMap');
      if (tpidMapEl && !tpidMapEl._leaflet_id) {
        try {
          const map = L.map('tpidMap').setView([-3.46, 102.65], 9);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
          }).addTo(map);

          LOKASI.forEach(lok => {
            const isSource = lok.tipe === 'kecamatan';
            const icon = L.divIcon({
              html: `<div style="background:${isSource ? '#10b981' : '#3b82f6'};width:${isSource ? 32 : 28}px;height:${isSource ? 32 : 28}px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:${isSource ? 14 : 12}px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${isSource ? '🌾' : '🏢'}</div>`,
              iconSize: [isSource ? 32 : 28, isSource ? 32 : 28],
              className: ''
            });
            L.marker([lok.lat, lok.lng], { icon }).addTo(map)
              .bindPopup(`<strong>${lok.nama}</strong><br>Tipe: ${isSource ? 'Sumber Pasokan' : 'Tujuan Distribusi'}`);
          });

          // Draw distribution lines
          const routes = [
            [LOKASI[0], LOKASI[4]], // Selupu → Bengkulu
            [LOKASI[1], LOKASI[5]], // Curup Utara → Lubuklinggau
            [LOKASI[0], LOKASI[6]], // Selupu → Palembang
          ];
          routes.forEach(([from, to]) => {
            L.polyline([[from.lat, from.lng], [to.lat, to.lng]], {
              color: '#3b82f6',
              weight: 2,
              opacity: 0.5,
              dashArray: '8 4'
            }).addTo(map);
          });

          maps.tpid = map;
        } catch(e) { console.warn('TPID Map init failed:', e); }
      }
    }, 200);
  }

  // ========================================
  // DASHBOARD: ADMIN
  // ========================================
  function renderAdminDashboard() {
    return `
    <div class="dashboard-greeting">
      <h1>Dashboard Administrator ⚙️</h1>
      <p>Kelola pengguna, validasi data, dan pantau performa sistem.</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card emerald">
        <div class="stat-icon emerald">👥</div>
        <div class="stat-content">
          <div class="stat-label">Total Pengguna</div>
          <div class="stat-value">${ADMIN_USERS.length}</div>
          <div class="stat-trend up">${ADMIN_USERS.filter(u=>u.status==='Aktif').length} aktif</div>
        </div>
      </div>
      <div class="stat-card blue">
        <div class="stat-icon blue">📋</div>
        <div class="stat-content">
          <div class="stat-label">Laporan Menunggu Validasi</div>
          <div class="stat-value">${LAPORAN_PANEN.filter(l=>l.status==='Menunggu Validasi').length}</div>
          <div class="stat-trend down">Perlu tindakan</div>
        </div>
      </div>
      <div class="stat-card amber">
        <div class="stat-icon amber">🚛</div>
        <div class="stat-content">
          <div class="stat-label">Mitra Logistik</div>
          <div class="stat-value">${MITRA_LOGISTIK.length}</div>
          <div class="stat-trend neutral">Terdaftar</div>
        </div>
      </div>
      <div class="stat-card emerald">
        <div class="stat-icon emerald">✅</div>
        <div class="stat-content">
          <div class="stat-label">Uptime Sistem</div>
          <div class="stat-value">99.8%</div>
          <div class="stat-trend up">Stabil</div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="card" style="margin-bottom:20px;">
      <div class="tabs" id="adminTabs">
        <button class="tab active" onclick="switchAdminTab('pengguna')">👥 Kelola Pengguna</button>
        <button class="tab" onclick="switchAdminTab('validasi')">✅ Validasi Laporan</button>
        <button class="tab" onclick="switchAdminTab('komoditas')">🌾 Data Komoditas</button>
        <button class="tab" onclick="switchAdminTab('logistik')">🚛 Mitra Logistik</button>
      </div>

      <!-- Pengguna Tab -->
      <div id="tabPengguna">
        <div style="display:flex;justify-content:space-between;margin-bottom:16px;">
          <input class="form-input" style="max-width:300px" placeholder="🔍 Cari pengguna...">
          <button class="btn btn-primary btn-sm" onclick="showToast('Fitur tambah pengguna (demo)', 'info')">+ Tambah Pengguna</button>
        </div>
        <div class="table-wrapper" style="border:none;">
          <table class="data-table">
            <thead>
              <tr><th>ID</th><th>Nama</th><th>Role</th><th>Email</th><th>Bergabung</th><th>Status</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              ${ADMIN_USERS.map(u => `
                <tr>
                  <td><code style="font-family:var(--font-mono);font-size:0.8125rem;color:var(--blue-600)">${u.id}</code></td>
                  <td><strong>${u.nama}</strong></td>
                  <td><span class="badge ${u.role==='Petani'?'badge-emerald':u.role==='Pembeli'?'badge-blue':u.role==='Mitra Logistik'?'badge-amber':'badge-gray'}">${u.role}</span></td>
                  <td>${u.email}</td>
                  <td>${u.bergabung}</td>
                  <td>${getStatusBadge(u.status)}</td>
                  <td>
                    <button class="btn btn-sm btn-ghost" onclick="showToast('Detail pengguna (demo)','info')">Detail</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Validasi Tab (hidden by default) -->
      <div id="tabValidasi" style="display:none;">
        <div class="table-wrapper" style="border:none;">
          <table class="data-table">
            <thead>
              <tr><th>Tanggal</th><th>Petani</th><th>Komoditas</th><th>Jumlah</th><th>Lokasi</th><th>Sumber</th><th>Status</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              ${LAPORAN_PANEN.map(l => `
                <tr>
                  <td>${l.tanggal}</td>
                  <td>${l.petani}</td>
                  <td>${l.komoditas}</td>
                  <td>${l.jumlah} kg</td>
                  <td>${l.lokasi}</td>
                  <td><span class="badge ${l.sumber === 'WhatsApp NLP' ? 'badge-emerald' : 'badge-gray'}">${l.sumber}</span></td>
                  <td>${getStatusBadge(l.status)}</td>
                  <td>
                    ${l.status === 'Menunggu Validasi' ?
                      `<div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-success" onclick="showToast('Laporan divalidasi!','success')">✅</button>
                        <button class="btn btn-sm btn-danger" onclick="showToast('Laporan ditolak','error')">❌</button>
                      </div>` :
                      `<span class="badge badge-emerald">Sudah validasi</span>`
                    }
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Komoditas Tab (hidden by default) -->
      <div id="tabKomoditas" style="display:none;">
        <div class="table-wrapper" style="border:none;">
          <table class="data-table">
            <thead>
              <tr><th>ID</th><th>Ikon</th><th>Nama</th><th>Satuan</th><th>Harga Rata-rata</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${KOMODITAS.map(k => `
                <tr>
                  <td><code style="font-family:var(--font-mono);font-size:0.8125rem;color:var(--blue-600)">${k.id}</code></td>
                  <td style="font-size:1.5rem">${k.icon}</td>
                  <td><strong>${k.nama}</strong></td>
                  <td>${k.satuan}</td>
                  <td>${formatCurrency(k.hargaRataRata)}</td>
                  <td>${getStatusBadge('Aktif')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Logistik Tab (hidden by default) -->
      <div id="tabLogistik" style="display:none;">
        <div class="table-wrapper" style="border:none;">
          <table class="data-table">
            <thead>
              <tr><th>ID</th><th>Nama Mitra</th><th>Pemilik</th><th>Telepon</th><th>Armada</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${MITRA_LOGISTIK.map(m => `
                <tr>
                  <td><code style="font-family:var(--font-mono);font-size:0.8125rem;color:var(--blue-600)">${m.id}</code></td>
                  <td><strong>${m.nama}</strong></td>
                  <td>${m.pemilik}</td>
                  <td>${m.telepon}</td>
                  <td>${ARMADA.filter(a=>a.mitraId===m.id).length} unit</td>
                  <td>${getStatusBadge('Aktif')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    `;
  }

  // ========================================
  // SMART BACKHAUL MATCHING
  // ========================================
  function renderBackhaulPage() {
    return `
    <div class="backhaul-page">
      <div class="dashboard-greeting">
        <h1>🔄 Smart Backhaul Matching</h1>
        <p>Mencocokkan kebutuhan pengiriman komoditas dengan armada mitra logistik yang memiliki kapasitas kosong, rute relevan, jadwal sesuai, dan lokasi terakhir terdekat.</p>
      </div>

      <!-- Input Simulasi -->
      <div class="card" style="margin-bottom:24px;">
        <div class="chart-header">
          <div class="chart-title">📦 Simulasi Kebutuhan Pengiriman</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;">
          <div class="form-group">
            <label class="form-label">Komoditas</label>
            <select class="form-select">
              ${KOMODITAS.map(k => `<option>${k.icon} ${k.nama}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Jumlah (kg)</label>
            <input type="number" class="form-input" value="400" placeholder="400">
          </div>
          <div class="form-group">
            <label class="form-label">Lokasi Pickup</label>
            <select class="form-select">
              <option>Selupu Rejang</option>
              ${LOKASI.filter(l=>l.tipe==='kecamatan').map(l => `<option>${l.nama}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tujuan</label>
            <select class="form-select">
              <option>Palembang</option>
              ${LOKASI.filter(l=>l.tipe==='kota').map(l => `<option>${l.nama}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Deadline Pengiriman</label>
            <input type="datetime-local" class="form-input" value="2026-06-22T18:00">
          </div>
        </div>
        <button class="btn btn-primary" style="margin-top:8px;" onclick="showToast('Matching ulang berhasil!', 'success')">🔄 Cari Armada yang Cocok</button>
      </div>

      <!-- Hasil Matching -->
      <div class="card">
        <div class="chart-header">
          <div class="chart-title">🚛 Kandidat Armada — Ditemukan ${BACKHAUL_KANDIDAT.length} armada</div>
          <span class="badge badge-emerald badge-dot">Match berhasil</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:16px;margin-top:8px;">
          ${BACKHAUL_KANDIDAT.map((k, i) => {
            const scoreClass = k.skor >= 80 ? 'high' : k.skor >= 60 ? 'medium' : 'low';
            const scoreLabel = k.skor >= 80 ? 'Sangat Sesuai' : k.skor >= 60 ? 'Cukup Sesuai' : 'Kurang Sesuai';
            return `
            <div class="card" style="padding:20px;border:${i===0 ? '2px solid var(--emerald-400)' : '1px solid var(--border-color)'};${i===0?'background:var(--emerald-50);':''}">
              <div style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap;">
                <div style="flex:1;min-width:240px;">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                    ${i===0 ? '<span class="badge badge-emerald">⭐ Rekomendasi Terbaik</span>' : ''}
                    <span class="badge badge-blue">${k.jenis}</span>
                  </div>
                  <h3 style="font-size:1.125rem;font-weight:700;margin-bottom:4px;">${k.pengemudi}</h3>
                  <p style="font-size:0.8125rem;color:var(--text-secondary);margin-bottom:8px;">${k.mitra}</p>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.8125rem;">
                    <div>📦 Kapasitas kosong: <strong>${formatNumber(k.kapasitasKosong)} kg</strong></div>
                    <div>📍 Lokasi: <strong>${k.lokasiTerakhir}</strong></div>
                    <div>🛣️ Rute: <strong>${k.rute}</strong></div>
                    <div>📏 Jarak: <strong>${k.jarak}</strong></div>
                  </div>
                  <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;">
                    ${k.alasan.map(a => `<span class="match-reason">✓ ${a}</span>`).join('')}
                  </div>
                </div>
                <div style="text-align:center;min-width:140px;">
                  <div class="match-score-value ${scoreClass}" style="font-size:2.5rem;">${k.skor}%</div>
                  <div style="font-size:0.75rem;font-weight:600;color:var(--gray-500);margin-bottom:8px;">${scoreLabel}</div>
                  <div class="match-score-bar" style="margin-bottom:16px;">
                    <div class="match-score-fill ${scoreClass}" style="width:${k.skor}%"></div>
                  </div>
                  <div style="display:flex;flex-direction:column;gap:6px;">
                    <button class="btn btn-sm btn-primary" onclick="showToast('Armada dipilih! Tugas pengiriman dikirim ke ${k.pengemudi}', 'success')">✅ Pilih Armada</button>
                    <button class="btn btn-sm btn-ghost">Detail</button>
                  </div>
                </div>
              </div>
            </div>
          `}).join('')}
        </div>
      </div>
    </div>
    `;
  }

  // ========================================
  // WHATSAPP NLP PARSER
  // ========================================
  function renderWhatsAppPage() {
    return `
    <div class="whatsapp-page">
      <div class="dashboard-greeting">
        <h1>💬 WhatsApp NLP Parser</h1>
        <p>Simulasi chatbot WhatsApp yang mengekstrak data panen dari pesan natural language petani.</p>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
        <!-- WhatsApp Chat -->
        <div>
          <div class="whatsapp-container">
            <div class="whatsapp-header">
              <div class="whatsapp-avatar">🌾</div>
              <div class="whatsapp-contact">
                <h4>PanganDali Bot</h4>
                <p>Online — NLP Parser aktif</p>
              </div>
            </div>
            <div class="whatsapp-body" id="waChat">
              <div class="wa-message received">
                Selamat datang di PanganDali! 🌾<br>
                Kirim laporan panen Anda dalam bahasa sehari-hari. Contoh: <em>"Saya panen kubis 500 kg di Curup Utara"</em>
                <div class="wa-time">08:00</div>
              </div>
            </div>
            <div class="whatsapp-input">
              <input type="text" id="waInput" placeholder="Ketik pesan laporan panen..." onkeydown="if(event.key==='Enter')sendWhatsAppMessage()">
              <button onclick="sendWhatsAppMessage()">➤</button>
            </div>
          </div>
          <div style="margin-top:12px;">
            <p style="font-size:0.8125rem;color:var(--text-secondary);margin-bottom:8px;">Coba kirim salah satu pesan contoh:</p>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              <button class="btn btn-sm btn-secondary" onclick="document.getElementById('waInput').value='Saya panen cabai 300 kg hari ini di Selupu Rejang';sendWhatsAppMessage();">Cabai 300 kg</button>
              <button class="btn btn-sm btn-secondary" onclick="document.getElementById('waInput').value='Pak, hari ini saya panen kubis 500 kg di Curup Utara, siap dikirim besok pagi';sendWhatsAppMessage();">Kubis 500 kg</button>
              <button class="btn btn-sm btn-secondary" onclick="document.getElementById('waInput').value='Bawang merah 200 kg dari Bermani Ulu';sendWhatsAppMessage();">Bawang 200 kg</button>
              <button class="btn btn-sm btn-secondary" onclick="sendVoiceNote()">🎤 Voice Note</button>
            </div>
          </div>
        </div>

        <!-- Parsing Results -->
        <div>
          <div class="card" style="margin-bottom:16px;">
            <div class="chart-header">
              <div class="chart-title">🤖 Cara Kerja NLP Parser</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:12px;">
              <div style="display:flex;gap:12px;align-items:center;padding:12px;background:var(--gray-50);border-radius:var(--radius-md);">
                <div style="width:36px;height:36px;border-radius:50%;background:var(--emerald-100);display:flex;align-items:center;justify-content:center;">1</div>
                <div style="font-size:0.875rem;"><strong>Terima Pesan</strong><br><span style="color:var(--text-secondary)">WhatsApp chatbot menerima pesan teks / voice note</span></div>
              </div>
              <div style="display:flex;gap:12px;align-items:center;padding:12px;background:var(--gray-50);border-radius:var(--radius-md);">
                <div style="width:36px;height:36px;border-radius:50%;background:var(--blue-100);display:flex;align-items:center;justify-content:center;">2</div>
                <div style="font-size:0.875rem;"><strong>Parsing NLP</strong><br><span style="color:var(--text-secondary)">Ekstraksi entitas: komoditas, jumlah, lokasi, waktu</span></div>
              </div>
              <div style="display:flex;gap:12px;align-items:center;padding:12px;background:var(--gray-50);border-radius:var(--radius-md);">
                <div style="width:36px;height:36px;border-radius:50%;background:var(--amber-100);display:flex;align-items:center;justify-content:center;">3</div>
                <div style="font-size:0.875rem;"><strong>Validasi Data</strong><br><span style="color:var(--text-secondary)">Admin memverifikasi data sebelum masuk ke sistem</span></div>
              </div>
              <div style="display:flex;gap:12px;align-items:center;padding:12px;background:var(--gray-50);border-radius:var(--radius-md);">
                <div style="width:36px;height:36px;border-radius:50%;background:var(--emerald-100);display:flex;align-items:center;justify-content:center;">4</div>
                <div style="font-size:0.875rem;"><strong>Data Siap</strong><br><span style="color:var(--text-secondary)">Data panen tersedia untuk pembeli dan sistem distribusi</span></div>
              </div>
            </div>
          </div>

          <div class="card" id="parsingResults">
            <div class="chart-header">
              <div class="chart-title">📋 Hasil Parsing Terakhir</div>
            </div>
            <div class="empty-state">
              <div class="empty-state-icon">💬</div>
              <h3>Belum Ada Data</h3>
              <p style="font-size:0.875rem;">Kirim pesan di chat WhatsApp untuk melihat hasil parsing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    `;
  }

  function initWhatsAppChat() {
    // Preload a conversation
    setTimeout(() => {
      const conv = WHATSAPP_CONVERSATIONS[0];
      const chat = document.getElementById('waChat');
      if (!chat) return;
      conv.messages.forEach((msg, i) => {
        setTimeout(() => {
          addWAMessage(msg);
        }, i * 800);
      });
    }, 500);
  }

  function addWAMessage(msg) {
    const chat = document.getElementById('waChat');
    if (!chat) return;
    const div = document.createElement('div');
    const isVoice = msg.isVoice;
    div.className = `wa-message ${msg.from === 'petani' ? 'sent' : 'received'} ${msg.parsed ? 'parsed' : ''}`;

    let content = msg.text.replace(/\n/g, '<br>');
    if (isVoice) {
      content = `
        <div class="wa-voice">
          <span>▶</span>
          <div class="wa-voice-wave">
            ${Array.from({length:20}, (_,i) => `<div class="wa-voice-bar" style="animation-delay:${i*0.05}s;height:${4+Math.random()*12}px"></div>`).join('')}
          </div>
          <span style="font-size:0.75rem;color:#999">0:12</span>
        </div>
        <div style="margin-top:4px;font-size:0.8125rem;">${msg.text}</div>
      `;
    }

    div.innerHTML = `${content}<div class="wa-time">${msg.time}</div>`;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }

  // ========================================
  // EARLY WARNING SYSTEM
  // ========================================
  function renderEWSPage() {
    return `
    <div class="ews-page" style="min-height:calc(100vh - var(--navbar-height));">
      <div class="dashboard-content" style="padding:28px;">
        <div class="cc-header" style="background:linear-gradient(135deg,rgba(239,68,68,0.1),rgba(245,158,11,0.1));border:1px solid rgba(255,255,255,0.08);">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
            <div>
              <h1 style="color:white;">🛡️ Early Warning System — TPID Rejang Lebong</h1>
              <p style="color:var(--gray-400);">Pantau risiko inflasi pangan. Deteksi dini. Intervensi cepat.</p>
            </div>
            <div style="display:flex;gap:8px;">
              <span class="risk-indicator risk-waspada">⚠️ Status: WASPADA</span>
              <span class="badge" style="background:rgba(255,255,255,0.1);color:var(--gray-400);">Update: ${new Date().toLocaleTimeString('id-ID', {hour:'2-digit',minute:'2-digit'})}</span>
            </div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card" style="background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.08);">
            <div class="stat-icon red">🔴</div>
            <div class="stat-content">
              <div class="stat-label" style="color:var(--gray-400);">Komoditas Kritis</div>
              <div class="stat-value" style="color:white;">1</div>
              <div class="stat-trend down">Cabai Merah</div>
            </div>
          </div>
          <div class="stat-card" style="background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.08);">
            <div class="stat-icon amber">🟡</div>
            <div class="stat-content">
              <div class="stat-label" style="color:var(--gray-400);">Komoditas Waspada</div>
              <div class="stat-value" style="color:white;">1</div>
              <div class="stat-trend down">Bawang Merah</div>
            </div>
          </div>
          <div class="stat-card" style="background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.08);">
            <div class="stat-icon emerald">🟢</div>
            <div class="stat-content">
              <div class="stat-label" style="color:var(--gray-400);">Komoditas Aman</div>
              <div class="stat-value" style="color:white;">3</div>
              <div class="stat-trend up">Stabil</div>
            </div>
          </div>
          <div class="stat-card" style="background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.08);">
            <div class="stat-icon amber">📈</div>
            <div class="stat-content">
              <div class="stat-label" style="color:var(--gray-400);">Rata-rata Kenaikan Harga</div>
              <div class="stat-value" style="color:var(--amber-400);">+3.2%</div>
              <div class="stat-trend down">Minggu ini</div>
            </div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:20px;">
          <!-- Chart Tren Harga EWS -->
          <div class="card" style="background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.08);">
            <div class="chart-header">
              <div class="chart-title" style="color:white;">📈 Tren Harga & Threshold Risiko</div>
            </div>
            <div class="chart-container">
              <canvas id="ewsChartHarga"></canvas>
            </div>
          </div>

          <!-- Alert List -->
          <div class="card" style="background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.08);">
            <div class="chart-header">
              <div class="chart-title" style="color:white;">⚠️ Daftar Alert</div>
            </div>
            ${EWS_ALERTS.map(a => `
              <div class="alert-card ${a.level.toLowerCase()}" style="background:rgba(255,255,255,0.03);">
                <div class="alert-icon">${a.level === 'Kritis' ? '🔴' : a.level === 'Waspada' ? '🟡' : '🟢'}</div>
                <div class="alert-content">
                  <h4 style="color:white;">${a.komoditas} — <span class="risk-indicator ${getRiskClass(a.level)}" style="font-size:0.75rem;">${a.level}</span></h4>
                  <p style="color:var(--gray-400);">${a.pesan}</p>
                  <div class="alert-time">${a.waktu}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
          <!-- Pasokan vs Permintaan EWS -->
          <div class="card" style="background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.08);">
            <div class="chart-header">
              <div class="chart-title" style="color:white;">📊 Pasokan vs Permintaan (Defisit/Surplus)</div>
            </div>
            <div class="chart-container">
              <canvas id="ewsChartPasokan"></canvas>
            </div>
          </div>

          <!-- Rekomendasi Intervensi -->
          <div class="card" style="background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.08);">
            <div class="chart-header">
              <div class="chart-title" style="color:white;">💡 Rekomendasi Intervensi</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:12px;">
              <div class="recommendation-card">
                <div class="recommendation-icon">🚛</div>
                <div class="recommendation-content">
                  <div class="priority high">PRIORITAS TINGGI</div>
                  <p>Prioritaskan distribusi cabai dari Selupu Rejang ke Kota Bengkulu</p>
                </div>
              </div>
              <div class="recommendation-card">
                <div class="recommendation-icon">🚚</div>
                <div class="recommendation-content">
                  <div class="priority high">PRIORITAS TINGGI</div>
                  <p>Aktifkan armada kosong terdekat untuk pengiriman ke Kota Bengkulu</p>
                </div>
              </div>
              <div class="recommendation-card">
                <div class="recommendation-icon">🤝</div>
                <div class="recommendation-content">
                  <div class="priority medium">PRIORITAS SEDANG</div>
                  <p>Koordinasi dengan petani/Gapoktan Bermani Ulu untuk percepatan panen bawang merah</p>
                </div>
              </div>
              <div class="recommendation-card">
                <div class="recommendation-icon">📊</div>
                <div class="recommendation-content">
                  <div class="priority medium">PRIORITAS SEDANG</div>
                  <p>Pantau kenaikan harga bawang merah dalam 48 jam ke depan</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Risk Map -->
        <div class="card" style="background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.08);">
          <div class="chart-header">
            <div class="chart-title" style="color:white;">🗺️ Risk Map — Distribusi & Pasokan</div>
          </div>
          <div id="ewsMap" class="map-container"></div>
        </div>

        <!-- Tabel Status Komoditas -->
        <div class="card" style="margin-top:20px;background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.08);">
          <div class="chart-header">
            <div class="chart-title" style="color:white;">📋 Status Risiko Komoditas</div>
          </div>
          <div class="table-wrapper" style="border:none;">
            <table class="data-table" style="color:white;">
              <thead>
                <tr style="background:rgba(255,255,255,0.05);"><th style="color:var(--gray-400);background:rgba(255,255,255,0.05);">Komoditas</th><th style="color:var(--gray-400);background:rgba(255,255,255,0.05);">Pasokan</th><th style="color:var(--gray-400);background:rgba(255,255,255,0.05);">Permintaan</th><th style="color:var(--gray-400);background:rgba(255,255,255,0.05);">Gap</th><th style="color:var(--gray-400);background:rgba(255,255,255,0.05);">Harga</th><th style="color:var(--gray-400);background:rgba(255,255,255,0.05);">Tren</th><th style="color:var(--gray-400);background:rgba(255,255,255,0.05);">Status</th></tr>
              </thead>
              <tbody>
                ${RISIKO_KOMODITAS.map(r => {
                  const gap = r.pasokan - r.permintaan;
                  return `
                  <tr style="border-color:rgba(255,255,255,0.06);">
                    <td style="border-color:rgba(255,255,255,0.06);"><strong>${KOMODITAS.find(k=>k.nama===r.komoditas)?.icon} ${r.komoditas}</strong></td>
                    <td style="border-color:rgba(255,255,255,0.06);">${formatNumber(r.pasokan)} kg</td>
                    <td style="border-color:rgba(255,255,255,0.06);">${formatNumber(r.permintaan)} kg</td>
                    <td style="border-color:rgba(255,255,255,0.06);color:${gap<0?'var(--red-400)':'var(--emerald-400)'}"><strong>${gap>0?'+':''}${gap} kg</strong></td>
                    <td style="border-color:rgba(255,255,255,0.06);">${formatCurrency(r.hargaRataRata)}</td>
                    <td style="border-color:rgba(255,255,255,0.06);"><span style="color:${r.perubahanHarga.startsWith('+')?'var(--red-400)':'var(--emerald-400)'};">${r.perubahanHarga}</span></td>
                    <td style="border-color:rgba(255,255,255,0.06);"><span class="risk-indicator ${getRiskClass(r.status)}">${r.status === 'Kritis' ? '🔴' : r.status === 'Waspada' ? '🟡' : '🟢'} ${r.status}</span></td>
                  </tr>
                `}).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    `;
  }

  function initEWSCharts() {
    Object.values(charts).forEach(c => { if (c && c.destroy) c.destroy(); });
    charts = {};

    setTimeout(() => {
      // EWS Harga Chart
      const ewsHargaCtx = document.getElementById('ewsChartHarga');
      if (ewsHargaCtx) {
        charts.ewsHarga = new Chart(ewsHargaCtx, {
          type: 'line',
          data: {
            labels: HARGA_HISTORIS.labels,
            datasets: [
              { label: 'Cabai Merah', data: HARGA_HISTORIS.cabaiMerah, borderColor: '#ef4444', tension: 0.4, fill: false, borderWidth: 3, pointRadius: 4 },
              { label: 'Bawang Merah', data: HARGA_HISTORIS.bawangMerah, borderColor: '#f59e0b', tension: 0.4, fill: false, borderWidth: 2.5 },
              { label: 'Wortel', data: HARGA_HISTORIS.wortel, borderColor: '#10b981', tension: 0.4, fill: false, borderWidth: 2 },
              { label: 'Kubis', data: HARGA_HISTORIS.kubis, borderColor: '#3b82f6', tension: 0.4, fill: false, borderWidth: 2 },
              { label: 'Kembang Kol', data: HARGA_HISTORIS.kembangKol, borderColor: '#8b5cf6', tension: 0.4, fill: false, borderWidth: 2 },
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', labels: { usePointStyle: true, padding: 12, color: '#94a3b8', font: { family: "'Plus Jakarta Sans'", size: 11 } } },
            },
            scales: {
              y: {
                beginAtZero: false,
                ticks: { callback: v => 'Rp ' + (v/1000) + 'k', color: '#64748b', font: { family: "'Plus Jakarta Sans'" } },
                grid: { color: 'rgba(255,255,255,0.06)' }
              },
              x: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#64748b', font: { family: "'Plus Jakarta Sans'" } } }
            },
          }
        });
      }

      // EWS Pasokan Chart
      const ewsPasokanCtx = document.getElementById('ewsChartPasokan');
      if (ewsPasokanCtx) {
        const gaps = PASOKAN_VS_PERMINTAAN.map(p => p.pasokan - p.permintaan);
        charts.ewsPasokan = new Chart(ewsPasokanCtx, {
          type: 'bar',
          data: {
            labels: PASOKAN_VS_PERMINTAAN.map(p => p.komoditas),
            datasets: [{
              label: 'Surplus / Defisit (kg)',
              data: gaps,
              backgroundColor: gaps.map(g => g >= 0 ? 'rgba(16,185,129,0.7)' : 'rgba(239,68,68,0.7)'),
              borderRadius: 6,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
            },
            scales: {
              y: {
                ticks: { callback: v => v + ' kg', color: '#64748b', font: { family: "'Plus Jakarta Sans'" } },
                grid: { color: 'rgba(255,255,255,0.06)' }
              },
              x: { grid: { display: false }, ticks: { color: '#64748b', font: { family: "'Plus Jakarta Sans'", size: 11 } } }
            },
          }
        });
      }

      // EWS Map
      const ewsMapEl = document.getElementById('ewsMap');
      if (ewsMapEl && !ewsMapEl._leaflet_id) {
        try {
          const map = L.map('ewsMap').setView([-3.46, 102.65], 9);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© CARTO'
          }).addTo(map);

          LOKASI.forEach(lok => {
            const risk = lok.tipe === 'kecamatan' ? '#10b981' : '#3b82f6';
            const icon = L.divIcon({
              html: `<div style="background:${risk};width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:3px solid rgba(255,255,255,0.3);box-shadow:0 0 12px ${risk}40;">${lok.tipe==='kecamatan'?'🌾':'🏢'}</div>`,
              iconSize: [30, 30],
              className: ''
            });
            L.marker([lok.lat, lok.lng], { icon }).addTo(map)
              .bindPopup(`<strong>${lok.nama}</strong><br>Tipe: ${lok.tipe === 'kecamatan' ? 'Sumber Pasokan' : 'Tujuan Distribusi'}`);
          });

          // Distribution lines with risk colors
          const routes = [
            { from: LOKASI[0], to: LOKASI[4], color: '#ef4444', label: 'Tertunda' },
            { from: LOKASI[1], to: LOKASI[5], color: '#f59e0b', label: 'Berjalan' },
            { from: LOKASI[0], to: LOKASI[6], color: '#10b981', label: 'Lancar' },
          ];
          routes.forEach(r => {
            L.polyline([[r.from.lat, r.from.lng], [r.to.lat, r.to.lng]], {
              color: r.color,
              weight: 3,
              opacity: 0.6,
              dashArray: r.color === '#ef4444' ? '8 4' : null
            }).addTo(map).bindPopup(`${r.from.nama} → ${r.to.nama}<br>Status: ${r.label}`);
          });

          maps.ews = map;
        } catch(e) { console.warn('EWS Map init failed:', e); }
      }
    }, 300);
  }

  // ========================================
  // GLOBAL FUNCTIONS (exposed to window)
  // ========================================

  // WhatsApp message sending
  window.sendWhatsAppMessage = function() {
    const input = document.getElementById('waInput');
    if (!input || !input.value.trim()) return;
    const text = input.value.trim();
    input.value = '';

    // Send user message
    addWAMessage({ from: 'petani', text: text, time: new Date().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) });

    // Show typing
    const chat = document.getElementById('waChat');
    const typing = document.createElement('div');
    typing.className = 'wa-message received';
    typing.id = 'typingIndicator';
    typing.innerHTML = '<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
    chat.appendChild(typing);
    chat.scrollTop = chat.scrollHeight;

    // Parse the message
    setTimeout(() => {
      const typingEl = document.getElementById('typingIndicator');
      if (typingEl) typingEl.remove();

      const parsed = parseNLP(text);

      addWAMessage({ from: 'system', text: '✅ Data panen berhasil diekstraksi!', time: new Date().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) });

      setTimeout(() => {
        addWAMessage({
          from: 'system',
          text: `📋 Hasil Parsing:\n• Komoditas: ${parsed.komoditas}\n• Jumlah: ${parsed.jumlah}\n• Lokasi: ${parsed.lokasi}\n• Waktu: ${parsed.waktu}\n• Status: Menunggu validasi`,
          time: new Date().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}),
          parsed: true
        });
        updateParsingResult(parsed);
      }, 500);

      setTimeout(() => {
        addWAMessage({ from: 'system', text: 'Terima kasih! Data panen Anda telah diterima dan akan divalidasi oleh admin. 🌾', time: new Date().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) });
      }, 1000);
    }, 1500);
  };

  window.sendVoiceNote = function() {
    const chat = document.getElementById('waChat');
    const time = new Date().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'});

    // Voice note message
    const voiceDiv = document.createElement('div');
    voiceDiv.className = 'wa-message sent';
    voiceDiv.innerHTML = `
      <div class="wa-voice">
        <span>▶</span>
        <div class="wa-voice-wave">
          ${Array.from({length:20}, (_,i) => `<div class="wa-voice-bar" style="animation-delay:${i*0.05}s;height:${4+Math.random()*12}px"></div>`).join('')}
        </div>
        <span style="font-size:0.75rem;color:#999">0:12</span>
      </div>
      <div style="font-size:0.75rem;color:#999;margin-top:4px;">🎤 Voice Note (00:12)</div>
      <div class="wa-time">${time}</div>
    `;
    chat.appendChild(voiceDiv);
    chat.scrollTop = chat.scrollHeight;

    setTimeout(() => {
      addWAMessage({ from: 'system', text: '🔊 Voice note diterima\n📝 Transkripsi berhasil', time });
      setTimeout(() => {
        addWAMessage({ from: 'system', text: '✅ Data panen berhasil diekstraksi dari voice note!', time });
        setTimeout(() => {
          const parsed = { komoditas: 'Bawang Merah', jumlah: '200 kg', lokasi: 'Bermani Ulu', waktu: 'Hari ini' };
          addWAMessage({ from: 'system', text: `📋 Hasil Parsing:\n• Komoditas: ${parsed.komoditas}\n• Jumlah: ${parsed.jumlah}\n• Lokasi: ${parsed.lokasi}\n• Waktu: ${parsed.waktu}\n• Status: Menunggu validasi`, time, parsed: true });
          updateParsingResult(parsed);
        }, 500);
      }, 600);
    }, 1200);
  };

  function parseNLP(text) {
    const lower = text.toLowerCase();
    let komoditas = 'Tidak dikenali';
    let jumlah = 'Tidak dikenali';
    let lokasi = 'Tidak dikenali';
    let waktu = 'Hari ini';

    // Parse komoditas
    if (lower.includes('cabai')) komoditas = 'Cabai Merah';
    else if (lower.includes('kubis')) komoditas = 'Kubis';
    else if (lower.includes('wortel')) komoditas = 'Wortel';
    else if (lower.includes('bawang')) komoditas = 'Bawang Merah';
    else if (lower.includes('kembang kol') || lower.includes('bunga kol')) komoditas = 'Kembang Kol';

    // Parse jumlah
    const jumlahMatch = text.match(/(\d+)\s*(kg|kilo|kilogram|ton)/i);
    if (jumlahMatch) {
      let val = parseInt(jumlahMatch[1]);
      if (jumlahMatch[2].toLowerCase().includes('ton')) val *= 1000;
      jumlah = val + ' kg';
    }

    // Parse lokasi
    LOKASI.forEach(l => {
      if (lower.includes(l.nama.toLowerCase())) lokasi = l.nama;
    });

    // Parse waktu
    if (lower.includes('besok')) waktu = 'Besok';
    if (lower.includes('besok pagi')) waktu = 'Besok pagi';
    if (lower.includes('hari ini')) waktu = 'Hari ini';
    if (lower.includes('lusa')) waktu = 'Lusa';

    return { komoditas, jumlah, lokasi, waktu };
  }

  function updateParsingResult(parsed) {
    const el = document.getElementById('parsingResults');
    if (!el) return;
    el.innerHTML = `
      <div class="chart-header">
        <div class="chart-title">📋 Hasil Parsing Terakhir</div>
        <span class="badge badge-emerald badge-dot">Berhasil</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;justify-content:space-between;padding:12px;background:var(--emerald-50);border-radius:var(--radius-md);border:1px solid var(--emerald-200);">
          <span style="font-weight:600;color:var(--text-secondary);">Komoditas</span>
          <span style="font-weight:700;color:var(--emerald-700);">${parsed.komoditas}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:12px;background:var(--blue-50);border-radius:var(--radius-md);border:1px solid var(--blue-200);">
          <span style="font-weight:600;color:var(--text-secondary);">Jumlah</span>
          <span style="font-weight:700;color:var(--blue-700);">${parsed.jumlah}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:12px;background:var(--gray-50);border-radius:var(--radius-md);border:1px solid var(--gray-200);">
          <span style="font-weight:600;color:var(--text-secondary);">Lokasi</span>
          <span style="font-weight:700;">${parsed.lokasi}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:12px;background:var(--gray-50);border-radius:var(--radius-md);border:1px solid var(--gray-200);">
          <span style="font-weight:600;color:var(--text-secondary);">Waktu</span>
          <span style="font-weight:700;">${parsed.waktu}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:12px;background:var(--amber-50);border-radius:var(--radius-md);border:1px solid var(--amber-200);">
          <span style="font-weight:600;color:var(--text-secondary);">Status</span>
          <span class="badge badge-amber badge-dot">Menunggu Validasi</span>
        </div>
      </div>
    `;
  }

  // Purchase Order Modal
  window.showPurchaseOrderModal = function(komoditas, jumlah, petani, lokasi, harga) {
    showModal(`
      <div class="modal-header">
        <div class="modal-title">🛒 Buat Purchase Order</div>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
          <div style="padding:12px;background:var(--gray-50);border-radius:var(--radius-md);">
            <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:2px;">Komoditas</div>
            <div style="font-weight:700;">${komoditas}</div>
          </div>
          <div style="padding:12px;background:var(--gray-50);border-radius:var(--radius-md);">
            <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:2px;">Petani</div>
            <div style="font-weight:700;">${petani}</div>
          </div>
          <div style="padding:12px;background:var(--gray-50);border-radius:var(--radius-md);">
            <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:2px;">Lokasi Asal</div>
            <div style="font-weight:700;">${lokasi}</div>
          </div>
          <div style="padding:12px;background:var(--gray-50);border-radius:var(--radius-md);">
            <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:2px;">Harga Estimasi</div>
            <div style="font-weight:700;">${formatCurrency(harga)}/kg</div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Jumlah Pesanan (kg)</label>
          <input type="number" class="form-input" id="poJumlah" value="${jumlah}" max="${jumlah}">
        </div>
        <div class="form-group">
          <label class="form-label">Tujuan Pengiriman</label>
          <select class="form-select">
            ${LOKASI.filter(l=>l.tipe==='kota').map(l => `<option>${l.nama}</option>`).join('')}
          </select>
        </div>
        <div style="padding:16px;background:var(--emerald-50);border-radius:var(--radius-md);border:1px solid var(--emerald-200);margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="color:var(--text-secondary);">Subtotal</span>
            <span style="font-weight:700;" id="poSubtotal">${formatCurrency(jumlah * harga)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:var(--text-secondary);">Status</span>
            <span class="badge badge-amber badge-dot">Menunggu Persetujuan</span>
          </div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-primary" style="flex:1" onclick="closeModal(); showToast('Purchase Order berhasil dibuat!', 'success')">✅ Buat PO</button>
          <button class="btn btn-secondary" style="flex:1" onclick="closeModal()">Batal</button>
        </div>
      </div>
    `);
  };

  // Admin tab switching
  window.switchAdminTab = function(tab) {
    document.querySelectorAll('#adminTabs .tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    ['Pengguna', 'Validasi', 'Komoditas', 'Logistik'].forEach(t => {
      const el = document.getElementById('tab' + t);
      if (el) el.style.display = 'none';
    });
    const tabMap = { pengguna: 'Pengguna', validasi: 'Validasi', komoditas: 'Komoditas', logistik: 'Logistik' };
    const activeTab = document.getElementById('tab' + tabMap[tab]);
    if (activeTab) activeTab.style.display = 'block';
  };

  // Mobile menu
  window.toggleMobileMenu = function() {
    const menu = document.querySelector('.navbar-menu');
    if (menu) menu.classList.toggle('hidden');
  };

  // Expose navigate globally
  window.navigate = navigate;
  window.showToast = showToast;
  window.closeModal = closeModal;

  // Modal close on overlay click
  document.getElementById('modalOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });

  // ---- Initialize ----
  window.addEventListener('hashchange', handleRoute);
  handleRoute();

  // Responsive sidebar
  function checkResponsive() {
    const toggle = document.getElementById('sidebarToggle');
    if (toggle) {
      toggle.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
    }
  }
  window.addEventListener('resize', checkResponsive);
  setTimeout(checkResponsive, 100);

})();

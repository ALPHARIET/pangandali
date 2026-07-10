import React, { useState } from 'react';
import { 
  LayoutDashboard, AlertTriangle, MessageSquare, Truck, 
  BarChart3, LogOut, Bell, Search, MapPin, CheckCircle, 
  TrendingUp, Compass, ArrowRight, ShieldAlert, Award, Map, UserCheck, XCircle
} from 'lucide-react';
import './AdminDashboard.css';

function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'ews', 'harvest', 'logistics', 'evaluation', 'verification'
  const [selectedRegion, setSelectedRegion] = useState('Rejang Lebong');
  const [selectedCommodity, setSelectedCommodity] = useState('Cabai Merah');
  const [exportCount, setExportCount] = useState(0);
  const [interventions, setInterventions] = useState([
    { id: 1, title: 'Intervensi distribusi cabai', region: 'Curup Timur', commodity: 'Cabai Merah', action: 'Kirim 1.2 ton dari surplus Selupu Rejang', impact: 'Harga turun 8% dalam 48 jam', status: 'Terealisasi' },
    { id: 2, title: 'Playbook pasar siaga', region: 'Kota Bengkulu', commodity: 'Bawang Merah', action: 'Fasilitasi pembelian langsung ke distributor', impact: 'Ketersediaan meningkat 12%', status: 'Dalam proses' }
  ]);
  const [nlpReports, setNlpReports] = useState([
    { id: 1, wa: '+62 812-****-3392', raw: 'lapor panen cabai merah 350 kg di kelurahan selupu rejang harga jual 22 ribu rupiah', crop: 'Cabai Merah', qty: '350 Kg', loc: 'Selupu Rejang', status: 'Terverifikasi otomatis', autoCheck: 'Profil petani sesuai', anomaly: false, evidence: 'Foto terkirim', reviewQueue: 'Tidak', time: '10 Mins Ago' },
    { id: 2, wa: '+62 853-****-9121', raw: 'panen kubis 1.2 ton daerah bermani ulu siap angkut harga nego tipis', crop: 'Kubis', qty: '1,200 Kg', loc: 'Bermani Ulu', status: 'Anomali - review', autoCheck: 'Pola pelaporan tidak wajar', anomaly: true, evidence: 'Foto belum dikirim', reviewQueue: 'Ya', time: '34 Mins Ago' },
    { id: 3, wa: '+62 813-****-5541', raw: 'panen raya tomat merah melimpah 800 kilo harga petani 4000 saja per kilo curup timur', crop: 'Tomat', qty: '800 Kg', loc: 'Curup Timur', status: 'Terverifikasi otomatis', autoCheck: 'Profil petani sesuai', anomaly: false, evidence: 'Foto terkirim', reviewQueue: 'Tidak', time: '1 Hour Ago' },
    { id: 4, wa: '+62 878-****-1004', raw: 'harga bawang merah melonjak drastis di pasar atas curup mencapai 45 ribu per kilo pasokan tipis', crop: 'Bawang Merah', qty: 'N/A (Pantauan)', loc: 'Pasar Atas Curup', status: 'Anomali - review', autoCheck: 'Lonjakan ekstrem vs historis', anomaly: true, evidence: 'Foto belum dikirim', reviewQueue: 'Ya', time: '3 Hours Ago' },
    { id: 5, wa: '+62 821-****-8842', raw: 'lapor wortel bersih 500kg sindang kelangi siap didistribusikan harga 6rb', crop: 'Wortel', qty: '500 Kg', loc: 'Sindang Kelangi', status: 'Terverifikasi otomatis', autoCheck: 'Profil petani sesuai', anomaly: false, evidence: 'Foto terkirim', reviewQueue: 'Tidak', time: '1 Day Ago' }
  ]);
  const [verifications, setVerifications] = useState(() => {
    return JSON.parse(localStorage.getItem('pangandali_verifications') || '[]');
  });
  const adminInitials = user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD';
  const adminDisplayName = user?.name || 'TPID Rejang Lebong';
  const adminRole = user?.role ? `${user.role} Pemerintah` : 'Admin Pemerintah';

  const handleApproveReport = (id) => {
    setNlpReports((prev) => prev.map((r) => r.id === id ? { ...r, status: 'Terverifikasi otomatis', reviewQueue: 'Selesai', autoCheck: 'Disetujui manual oleh admin' } : r));
  };

  const handleRejectReport = (id) => {
    setNlpReports((prev) => prev.map((r) => r.id === id ? { ...r, status: 'Ditolak manual', reviewQueue: 'Selesai', autoCheck: 'Ditolak setelah tinjauan' } : r));
  };

  const handleExportReport = () => {
    setExportCount((prev) => prev + 1);
    alert('Laporan TPID siap diekspor untuk rapat rutin dan pelaporan Kemendagri.');
  };

  const handleAddIntervention = () => {
    const newEntry = {
      id: Date.now(),
      title: 'Intervensi baru',
      region: selectedRegion,
      commodity: selectedCommodity,
      action: 'Catatan operasional TPID ditambahkan dari dashboard',
      impact: 'Menunggu evaluasi dampak 7 hari',
      status: 'Baru'
    };
    setInterventions([newEntry, ...interventions]);
  };

  const handleVerifyAccount = (email, type, newStatus, reason = '') => {
    // Update global verifications list
    const updatedVerifications = verifications.map(v => 
      v.email === email ? { ...v, status: newStatus } : v
    );
    setVerifications(updatedVerifications);
    localStorage.setItem('pangandali_verifications', JSON.stringify(updatedVerifications));

    // Update specific document
    const storageKey = type === 'Driver' ? `pangandali_driver_docs_${email}` : `pangandali_distributor_docs_${email}`;
    const docStr = localStorage.getItem(storageKey);
    if (docStr) {
      const docData = JSON.parse(docStr);
      docData.status = newStatus;
      docData.rejectionReason = reason;
      localStorage.setItem(storageKey, JSON.stringify(docData));
    }
  };

  // Dynamic Contextual Breadcrumb
  const renderBreadcrumbs = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <span>Dashboard</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-active">Overview</span>
          </>
        );
      case 'ews':
        return (
          <>
            <span>Dashboard</span>
            <span className="breadcrumb-sep">/</span>
            <span>TPID</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-active">Early Warning System</span>
          </>
        );
      case 'harvest':
        return (
          <>
            <span>Laporan</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-active">WhatsApp NLP Data Hub</span>
          </>
        );
      case 'logistics':
        return (
          <>
            <span>Logistik</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-active">Empty Backhaul Matching</span>
          </>
        );
      case 'map':
        return (
          <>
            <span>Distribusi</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-active">Distribution Map</span>
          </>
        );
      case 'evaluation':
        return (
          <>
            <span>Evaluasi</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-active">Dampak & SDGs</span>
          </>
        );
      case 'verification':
        return (
          <>
            <span>Pengaturan</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-active">Verifikasi Akun</span>
          </>
        );
      default:
        return <span className="breadcrumb-active">Dashboard</span>;
    }
  };

  return (
    <div className="admin-layout">
      {/* SECTION 1: Global Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <div className="logo-icon">PD</div>
          <span>PanganDali</span>
        </div>

        <div className="sidebar-heading">Menu Utama</div>
        <nav className="sidebar-menu">
          <button 
            className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <div className="sidebar-item-content">
              <LayoutDashboard size={18} />
              <span>Overview</span>
            </div>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'ews' ? 'active' : ''}`}
            onClick={() => setActiveTab('ews')}
          >
            <div className="sidebar-item-content">
              <AlertTriangle size={18} />
              <span>TPID Dashboard (EWS)</span>
            </div>
            <span className="menu-badge">3</span>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'harvest' ? 'active' : ''}`}
            onClick={() => setActiveTab('harvest')}
          >
            <div className="sidebar-item-content">
              <MessageSquare size={18} />
              <span>Harvest Reports (NLP)</span>
            </div>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'logistics' ? 'active' : ''}`}
            onClick={() => setActiveTab('logistics')}
          >
            <div className="sidebar-item-content">
              <Truck size={18} />
              <span>Logistics Matching</span>
            </div>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            <div className="sidebar-item-content">
              <Map size={18} />
              <span>Distribution Map</span>
            </div>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'evaluation' ? 'active' : ''}`}
            onClick={() => setActiveTab('evaluation')}
          >
            <div className="sidebar-item-content">
              <BarChart3 size={18} />
              <span>Impact Evaluation</span>
            </div>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'verification' ? 'active' : ''}`}
            onClick={() => setActiveTab('verification')}
          >
            <div className="sidebar-item-content">
              <UserCheck size={18} />
              <span>Verifikasi Akun</span>
            </div>
          </button>
        </nav>

        <div className="sidebar-heading">Quick Actions</div>
        <nav className="sidebar-menu">
          <button className="sidebar-item" onClick={() => alert('Fitur Ekspor Satu Data Indonesia diaktifkan!')}>
            <div className="sidebar-item-content">
              <Compass size={18} />
              <span>Ekspor Data SDI</span>
            </div>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-profile-card">
            <div className="avatar-circle">{adminInitials}</div>
            <div className="admin-profile-info">
              <div className="admin-profile-name">{adminDisplayName}</div>
              <div className="admin-profile-role">{adminRole}</div>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={onLogout}>
            <LogOut size={14} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        {/* SECTION 2: Global Top Navigation Bar */}
        <header className="admin-topbar">
          <div className="breadcrumb">
            {renderBreadcrumbs()}
          </div>

          <div className="topbar-actions">
            <div className="admin-search-box">
              <Search size={14} className="text-muted" />
              <input type="text" placeholder="Cari data wilayah, komoditas..." />
            </div>

            <button className="icon-btn" title="Notifikasi Real-time" style={{ position: 'relative' }}>
              <Bell size={18} />
              <span style={{ 
                position: 'absolute', top: '4px', right: '4px', 
                width: '6px', height: '6px', backgroundColor: '#ef4444', 
                borderRadius: '50%' 
              }}></span>
            </button>

            <div className="instansi-badge">
              <div className="instansi-logo">RL</div>
              <div>
                <div className="instansi-text">Dinas Pertanian</div>
                <div className="instansi-sub">Rejang Lebong</div>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content">
          {/* SECTION 3: Overview Dashboard View */}
          {activeTab === 'overview' && (
            <>
              {/* Glanceable Metrics */}
              <div className="overview-grid">
                <div className="metric-card primary">
                  <div className="metric-header">
                    <span className="metric-title">Total Produksi Tervalidasi</span>
                    <div className="metric-icon-box"><TrendingUp size={16} /></div>
                  </div>
                  <div className="metric-value">1,240 Ton</div>
                  <div className="metric-footer">
                    <span className="badge badge-success">+12.4%</span>
                    <span>dari bulan lalu</span>
                  </div>
                </div>

                <div className="metric-card accent">
                  <div className="metric-header">
                    <span className="metric-title">Wilayah Surplus Utama</span>
                    <div className="metric-icon-box"><MapPin size={16} /></div>
                  </div>
                  <div className="metric-value">Selupu Rejang</div>
                  <div className="metric-footer">
                    <span>Hortikultura dominan: Kubis & Cabai</span>
                  </div>
                </div>

                <div className="metric-card danger">
                  <div className="metric-header">
                    <span className="metric-title">Titik Risiko Defisit/Inflasi</span>
                    <div className="metric-icon-box"><ShieldAlert size={16} /></div>
                  </div>
                  <div className="metric-value">Kota Bengkulu</div>
                  <div className="metric-footer">
                    <span className="badge badge-danger">3 Komoditas</span>
                    <span>mengalami defisit pasokan</span>
                  </div>
                </div>

                <div className="metric-card info">
                  <div className="metric-header">
                    <span className="metric-title">Rata-rata Harga Aktual</span>
                    <div className="metric-icon-box"><CheckCircle size={16} /></div>
                  </div>
                  <div className="metric-value">Rp 14,200/kg</div>
                  <div className="metric-footer">
                    <span className="badge badge-info">Stabil</span>
                    <span>Tingkat petani-distributor</span>
                  </div>
                </div>
              </div>

              {/* Early Warning System Alerts */}
              <div className="alert-section-title">
                <AlertTriangle size={18} className="text-warning" />
                <span>Sistem Deteksi Dini (Alert Cards)</span>
              </div>
              
              <div className="alert-cards-grid">
                <div className="alert-card info">
                  <div className="alert-icon-box"><Compass size={18} /></div>
                  <div className="alert-body">
                    <div className="alert-title">INFO: Panen Raya Kubis</div>
                    <div className="alert-desc">Kecamatan Selupu Rejang mencatat surplus pasokan kubis sebesar 60% minggu ini. Potensi pasokan ekspor aman.</div>
                  </div>
                </div>

                <div className="alert-card warning">
                  <div className="alert-icon-box"><AlertTriangle size={18} /></div>
                  <div className="alert-body">
                    <div className="alert-title">WARNING: Pasokan Cabai Merah</div>
                    <div className="alert-desc">Terjadi penurunan volume panen Cabai Merah sebesar 25% akibat cuaca buruk di Sindang Keriang.</div>
                  </div>
                </div>

                <div className="alert-card danger">
                  <div className="alert-icon-box"><ShieldAlert size={18} /></div>
                  <div className="alert-body">
                    <div className="alert-title">DANGER: Harga Bawang Merah</div>
                    <div className="alert-desc">Harga Bawang Merah di pasar konsumen melonjak melampaui batas aman atas sebesar 35% akibat kendala distribusi.</div>
                  </div>
                </div>
              </div>

              {/* Interactive SVG Chart and Distribution Flow Table */}
              <div className="dashboard-details-grid">
                {/* Visualisasi Line Chart */}
                <div className="dashboard-panel">
                  <div className="panel-header">
                    <span className="panel-title">Tren Harga Riil Komoditas (1 Bulan Terakhir)</span>
                    <div className="chart-legends">
                      <div className="legend-item">
                        <div className="legend-color" style={{ backgroundColor: '#008744' }}></div>
                        <span>Cabai Merah</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-color" style={{ backgroundColor: '#f2994a' }}></div>
                        <span>Kubis</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-color" style={{ backgroundColor: '#ef4444' }}></div>
                        <span>Bawang Merah</span>
                      </div>
                    </div>
                  </div>

                  <div className="chart-container">
                    <svg viewBox="0 0 500 200" width="100%" height="100%" preserveAspectRatio="none">
                      {/* Grid Lines */}
                      <line x1="0" y1="40" x2="500" y2="40" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="90" x2="500" y2="90" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="140" x2="500" y2="140" stroke="#f1f5f9" strokeWidth="1" />
                      
                      {/* Cabai Merah Line (Green) */}
                      <path 
                        d="M0,130 C80,140 160,80 240,90 C320,100 400,60 500,45" 
                        fill="none" 
                        stroke="#008744" 
                        strokeWidth="3" 
                      />
                      {/* Kubis Line (Orange) */}
                      <path 
                        d="M0,170 C80,165 160,168 240,150 C320,130 400,140 500,120" 
                        fill="none" 
                        stroke="#f2994a" 
                        strokeWidth="3" 
                      />
                      {/* Bawang Merah Line (Red) */}
                      <path 
                        d="M0,100 C80,95 160,110 240,105 C320,80 400,60 500,30" 
                        fill="none" 
                        stroke="#ef4444" 
                        strokeWidth="3" 
                      />
                    </svg>
                  </div>
                </div>

                {/* Flow Distribusi Table */}
                <div className="dashboard-panel">
                  <div className="panel-header">
                    <span className="panel-title">Rasio Pemenuhan Distribusi Regional</span>
                  </div>

                  <div className="dense-table-wrapper">
                    <table className="dense-table">
                      <thead>
                        <tr>
                          <th>Wilayah Tujuan</th>
                          <th>Komoditas</th>
                          <th>Rasio Pasokan</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Kota Bengkulu</td>
                          <td>Kubis</td>
                          <td>
                            <div className="progress-container">
                              <span style={{ minWidth: '35px' }}>92%</span>
                              <div className="progress-bar-bg">
                                <div className="progress-bar-fill" style={{ width: '92%' }}></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>Palembang</td>
                          <td>Cabai Merah</td>
                          <td>
                            <div className="progress-container">
                              <span style={{ minWidth: '35px' }}>64%</span>
                              <div className="progress-bar-bg">
                                <div className="progress-bar-fill warning" style={{ width: '64%' }}></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>Jakarta</td>
                          <td>Tomat</td>
                          <td>
                            <div className="progress-container">
                              <span style={{ minWidth: '35px' }}>85%</span>
                              <div className="progress-bar-bg">
                                <div className="progress-bar-fill" style={{ width: '85%' }}></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>Kepahiang</td>
                          <td>Bawang Merah</td>
                          <td>
                            <div className="progress-container">
                              <span style={{ minWidth: '35px' }}>38%</span>
                              <div className="progress-bar-bg">
                                <div className="progress-bar-fill danger" style={{ width: '38%' }}></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* SECTION 4: TPID Predictive Supply & Risk Ranking */}
          {activeTab === 'ews' && (
            <div className="ews-stack">
              <div className="dashboard-panel ews-panel">
                <div className="panel-header">
                  <span className="panel-title">Early Warning System Operasional</span>
                  <button className="btn-action-table" onClick={handleExportReport}>Ekspor Laporan</button>
                </div>

                <div className="ews-controls">
                  <label className="control-group">
                    <span>Wilayah</span>
                    <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}>
                      <option>Rejang Lebong</option>
                      <option>Curup Timur</option>
                      <option>Kota Bengkulu</option>
                    </select>
                  </label>
                  <label className="control-group">
                    <span>Komoditas</span>
                    <select value={selectedCommodity} onChange={(e) => setSelectedCommodity(e.target.value)}>
                      <option>Cabai Merah</option>
                      <option>Bawang Merah</option>
                      <option>Kubis</option>
                      <option>Tomat</option>
                    </select>
                  </label>
                  <div className="status-pill">Ekspor ke TPID: {exportCount}</div>
                </div>

                <div className="alert-level-grid">
                  <div className="alert-level-card green">
                    <div className="alert-level-head">
                      <span className="alert-level-title">Hijau</span>
                      <span className="badge badge-success">Aman</span>
                    </div>
                    <p>Pasokan kubis di Selupu Rejang diperkirakan surplus 7 hari ke depan.</p>
                  </div>
                  <div className="alert-level-card yellow">
                    <div className="alert-level-head">
                      <span className="alert-level-title">Kuning</span>
                      <span className="badge badge-warning">Siaga</span>
                    </div>
                    <p>Cabai merah di Curup Timur menurun 18% karena cuaca dan distribusi belum optimal.</p>
                  </div>
                  <div className="alert-level-card red">
                    <div className="alert-level-head">
                      <span className="alert-level-title">Merah</span>
                      <span className="badge badge-danger">Kritis</span>
                    </div>
                    <p>Bawang merah di Kota Bengkulu berisiko defisit 14 hari ke depan, harga naik 25% lebih tinggi.</p>
                  </div>
                </div>
              </div>

              <div className="risk-matrix-grid">
                <div className="dashboard-panel">
                  <div className="panel-header">
                    <span className="panel-title">Proyeksi Pasokan 7-14 Hari</span>
                  </div>
                  <div className="dense-table-wrapper">
                    <table className="dense-table">
                      <thead>
                        <tr>
                          <th>Komoditas</th>
                          <th>Wilayah</th>
                          <th>Proyeksi 7 Hari</th>
                          <th>Proyeksi 14 Hari</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Cabai Merah</td>
                          <td>Curup Timur</td>
                          <td>Turun 12%</td>
                          <td>Turun 18%</td>
                          <td><span className="badge badge-warning">Siaga</span></td>
                        </tr>
                        <tr>
                          <td>Kubis</td>
                          <td>Selupu Rejang</td>
                          <td>Naik 16%</td>
                          <td>Naik 9%</td>
                          <td><span className="badge badge-success">Aman</span></td>
                        </tr>
                        <tr>
                          <td>Bawang Merah</td>
                          <td>Kota Bengkulu</td>
                          <td>Defisit 8%</td>
                          <td>Defisit 14%</td>
                          <td><span className="badge badge-danger">Kritis</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="recommendation-card">
                  <div className="rec-header">
                    <span className="rec-title">Playbook Aksi & Rekomendasi</span>
                    <span className="rec-match-badge">Decision Support</span>
                  </div>
                  <div className="rec-content">
                    <div className="rec-block source">
                      <span className="rec-block-label">Aksi prioritas</span>
                      <span className="rec-block-title">Fasilitasi distribusi antardaerah</span>
                      <p className="rec-block-desc">Gunakan surplus dari Selupu Rejang untuk mengisi defisit Kota Bengkulu dan wilayah yang terdampak.</p>
                    </div>
                    <div className="rec-block destination">
                      <span className="rec-block-label">Koordinasi TPID</span>
                      <span className="rec-block-title">Kerja sama antar daerah (KAD)</span>
                      <p className="rec-block-desc">Keputusan operasional tetap berada di tangan TPID, sementara dashboard memberikan opsi playbook yang siap dijalankan.</p>
                    </div>
                  </div>
                  <div className="rec-action-box">
                    <button className="btn btn-primary" onClick={() => alert('Playbook aksi dikirim ke tim TPID dan operator distribusi.')}>Terapkan Playbook</button>
                  </div>
                </div>
              </div>

              <div className="dashboard-panel">
                <div className="panel-header">
                  <span className="panel-title">Log Intervensi & Evaluasi Dampak</span>
                  <button className="btn-action-table" onClick={handleAddIntervention}>Tambah Catatan</button>
                </div>
                <div className="dense-table-wrapper">
                  <table className="dense-table">
                    <thead>
                      <tr>
                        <th>Judul</th>
                        <th>Wilayah</th>
                        <th>Komoditas</th>
                        <th>Aksi</th>
                        <th>Dampak</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interventions.map((item) => (
                        <tr key={item.id}>
                          <td>{item.title}</td>
                          <td>{item.region}</td>
                          <td>{item.commodity}</td>
                          <td>{item.action}</td>
                          <td>{item.impact}</td>
                          <td><span className="badge badge-info">{item.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: Harvest & WhatsApp NLP Data Ledger */}
          {activeTab === 'harvest' && (
            <div className="harvest-verification-stack">
              <div className="dashboard-panel">
                <div className="panel-header">
                  <span className="panel-title">Verification by Exception — Laporan Panen WhatsApp</span>
                </div>

                <div className="verification-summary-grid">
                  <div className="verification-summary-card">
                    <strong>{nlpReports.filter((r) => r.status === 'Terverifikasi otomatis').length}</strong>
                    <span>Laporan tervalidasi otomatis</span>
                  </div>
                  <div className="verification-summary-card warning">
                    <strong>{nlpReports.filter((r) => r.anomaly).length}</strong>
                    <span>Anomali masuk antrean review</span>
                  </div>
                  <div className="verification-summary-card info">
                    <strong>{nlpReports.filter((r) => r.evidence === 'Foto terkirim').length}/5</strong>
                    <span>Foto pendukung terkirim</span>
                  </div>
                </div>

                <div className="verification-note-box">
                  <div>
                    <strong>Alur kerja</strong>
                    <p>Semua laporan masuk sistem langsung dengan status <em>Terverifikasi otomatis</em>. Hanya laporan yang terdeteksi anomali yang masuk antrean tinjauan oleh admin/Dinas Pertanian atau pendamping lapangan melalui dashboard web.</p>
                  </div>
                  <div>
                    <strong>Foto panen</strong>
                    <p>Chatbot dapat meminta 1 foto hasil panen di percakapan WhatsApp yang sama sebagai bukti pendukung, tanpa menambah langkah administratif.</p>
                  </div>
                </div>
              </div>

              <div className="dashboard-panel">
                <div className="panel-header">
                  <span className="panel-title">Ledger Laporan Petani & Antrean Review</span>
                </div>

                <div className="dense-table-wrapper">
                  <table className="dense-table">
                    <thead>
                      <tr>
                        <th>No. WhatsApp</th>
                        <th>Pesan Teks Asli</th>
                        <th>Komoditas</th>
                        <th>Volume</th>
                        <th>Lokasi</th>
                        <th>Pemeriksaan Otomatis</th>
                        <th>Bukti Foto</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nlpReports.map((report) => (
                        <tr key={report.id}>
                          <td style={{ fontWeight: '600' }}>{report.wa}</td>
                          <td>
                            <div className="raw-message-cell" title={report.raw}>
                              "{report.raw}"
                            </div>
                          </td>
                          <td><strong>{report.crop}</strong></td>
                          <td>{report.qty}</td>
                          <td>{report.loc}</td>
                          <td>
                            <div className="verification-cell">
                              <span className="verification-chip">{report.autoCheck}</span>
                              <span className="verification-sub">{report.anomaly ? 'Profil / pola memicu review' : 'Profil petani dan pola wajar'}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${report.evidence === 'Foto terkirim' ? 'badge-success' : 'badge-warning'}`}>
                              {report.evidence}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${report.anomaly ? 'badge-warning' : 'badge-success'}`}>
                              {report.status}
                            </span>
                          </td>
                          <td>
                            {report.anomaly ? (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button className="btn-action-table" onClick={() => handleApproveReport(report.id)}>Setujui</button>
                                <button className="btn-action-table" style={{ backgroundColor: '#ef4444' }} onClick={() => handleRejectReport(report.id)}>Tolak</button>
                              </div>
                            ) : (
                              <span className="text-muted" style={{ fontSize: '11px' }}>Terverifikasi otomatis</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Distribution Map View */}
          {activeTab === 'map' && (
            <div className="distribution-map-grid">
              <div className="distribution-map-panel">
                <div className="panel-header">
                  <span className="panel-title">Distribution Map Koridor Rejang Lebong</span>
                  <span className="badge badge-info">Sinkron SDI 09:45 WIB</span>
                </div>

                <div className="map-canvas" aria-label="Peta distribusi komoditas PanganDali">
                  <div className="map-region supply region-selupu">
                    <span className="map-pin-label">Selupu Rejang</span>
                    <strong>+5.2 Ton Kubis</strong>
                  </div>
                  <div className="map-region supply region-bermani">
                    <span className="map-pin-label">Bermani Ulu</span>
                    <strong>+1.8 Ton Cabai</strong>
                  </div>
                  <div className="map-region deficit region-bengkulu">
                    <span className="map-pin-label">Kota Bengkulu</span>
                    <strong>-4.8 Ton Kubis</strong>
                  </div>
                  <div className="map-region deficit region-palembang">
                    <span className="map-pin-label">Palembang</span>
                    <strong>-2.1 Ton Cabai</strong>
                  </div>
                  <div className="map-route route-main"></div>
                  <div className="map-route route-secondary"></div>
                </div>
              </div>

              <div className="dashboard-panel">
                <div className="panel-header">
                  <span className="panel-title">Rute Prioritas Hari Ini</span>
                </div>

                <div className="route-list">
                  <div className="route-card">
                    <div>
                      <span className="route-label">Kubis</span>
                      <strong>Selupu Rejang ke Kota Bengkulu</strong>
                    </div>
                    <span className="badge badge-success">92% siap</span>
                  </div>
                  <div className="route-card">
                    <div>
                      <span className="route-label">Cabai Merah</span>
                      <strong>Bermani Ulu ke Palembang</strong>
                    </div>
                    <span className="badge badge-warning">64% siap</span>
                  </div>
                  <div className="route-card">
                    <div>
                      <span className="route-label">Bawang Merah</span>
                      <strong>Curup Tengah ke Kepahiang</strong>
                    </div>
                    <span className="badge badge-danger">38% kritis</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: Logistics & Empty Backhaul Node Network */}
          {activeTab === 'logistics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="overview-grid">
                <div className="metric-card primary">
                  <div className="metric-header">
                    <span className="metric-title">Live Empty Trucks Counter</span>
                    <div className="metric-icon-box"><Truck size={16} /></div>
                  </div>
                  <div className="metric-value">42 Truk</div>
                  <div className="metric-footer">
                    <span>Truk logistik kosong terpantau di sekitar Rejang Lebong</span>
                  </div>
                </div>

                <div className="metric-card info">
                  <div className="metric-header">
                    <span className="metric-title">Utilisasi Muatan Balik</span>
                    <div className="metric-icon-box"><TrendingUp size={16} /></div>
                  </div>
                  <div className="metric-value">67.8%</div>
                  <div className="metric-footer">
                    <span className="badge badge-success">+7.8%</span>
                    <span>Melebihi target minimal 60%</span>
                  </div>
                </div>

                <div className="metric-card accent">
                  <div className="metric-header">
                    <span className="metric-title">Biaya Logistik Dihemat</span>
                    <div className="metric-icon-box"><Award size={16} /></div>
                  </div>
                  <div className="metric-value">Rp 128.5 Jt</div>
                  <div className="metric-footer">
                    <span>Kumulatif penghematan efisiensi backhaul</span>
                  </div>
                </div>
              </div>

              {/* Interactive logical node map diagram */}
              <div className="node-map-panel">
                <div className="panel-header">
                  <span className="panel-title">Logical Node Map (Diagram Topologi Koridor Sumatra - Jawa)</span>
                  <span className="text-muted" style={{ fontSize: '12px' }}>Garis animasi mewakili truk logistik backhaul aktif berjalan</span>
                </div>

                <div className="node-map-svg-container">
                  <svg width="100%" height="100%" viewBox="0 0 800 350">
                    {/* Background grid dots */}
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1" fill="#1e293b" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />

                    {/* Nodes Connector Lines */}
                    {/* Rejang Lebong to Bengkulu */}
                    <line x1="200" y1="180" x2="100" y2="280" stroke="#00ff66" strokeWidth="2" className="active-edge cargo-glow" />
                    {/* Rejang Lebong to Palembang */}
                    <line x1="200" y1="180" x2="350" y2="100" stroke="#00ff66" strokeWidth="2" className="active-edge cargo-glow" />
                    {/* Palembang to Lampung */}
                    <line x1="350" y1="100" x2="500" y2="180" stroke="#475569" strokeWidth="2" />
                    {/* Lampung to Jakarta */}
                    <line x1="500" y1="180" x2="680" y2="220" stroke="#00ff66" strokeWidth="2" className="active-edge cargo-glow" />
                    {/* Rejang Lebong to Lampung */}
                    <line x1="200" y1="180" x2="500" y2="180" stroke="#475569" strokeWidth="2" />

                    {/* Nodes Circle Details */}
                    {/* Consumer Node: Kota Bengkulu */}
                    <circle cx="100" cy="280" r="14" fill="#ef4444" stroke="#fca5a5" strokeWidth="3" />
                    <text x="100" y="315" textAnchor="middle" className="node-label">Kota Bengkulu</text>
                    <text x="100" y="284" textAnchor="middle" className="node-title-label">KB</text>

                    {/* Main Supply Node: Rejang Lebong */}
                    <circle cx="200" cy="180" r="22" fill="#008744" stroke="#86efac" strokeWidth="4" />
                    <text x="200" y="225" textAnchor="middle" className="node-label" style={{ fill: '#4ade80', fontWeight: 'bold' }}>Rejang Lebong (STA)</text>
                    <text x="200" y="184" textAnchor="middle" className="node-title-label">RL</text>

                    {/* Intermediate Consumer Node: Palembang */}
                    <circle cx="350" cy="100" r="14" fill="#3b82f6" stroke="#93c5fd" strokeWidth="3" />
                    <text x="350" y="135" textAnchor="middle" className="node-label">Palembang</text>
                    <text x="350" y="104" textAnchor="middle" className="node-title-label">PL</text>

                    {/* Transit Node: Lampung */}
                    <circle cx="500" cy="180" r="14" fill="#64748b" stroke="#cbd5e1" strokeWidth="3" />
                    <text x="500" y="215" textAnchor="middle" className="node-label">Lampung</text>
                    <text x="500" y="184" textAnchor="middle" className="node-title-label">LP</text>

                    {/* Major Consumer Node: Jakarta */}
                    <circle cx="680" cy="220" r="18" fill="#ef4444" stroke="#fca5a5" strokeWidth="3" />
                    <text x="680" y="260" textAnchor="middle" className="node-label">DKI Jakarta</text>
                    <text x="680" y="224" textAnchor="middle" className="node-title-label">JKT</text>
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: Impact & SDG Evaluation Dashboard */}
          {activeTab === 'evaluation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Hero Metric Banner */}
              <div className="hero-impact-banner">
                <div className="hero-impact-grid">
                  <div className="hero-impact-item">
                    <div className="hero-impact-num">520 Ton</div>
                    <div className="hero-impact-label">Food Loss Prevented</div>
                    <div className="hero-impact-desc">Melalui efisiensi rantai distribusi logistik hortikultura (SDG 12.3)</div>
                  </div>

                  <div className="hero-impact-item">
                    <div className="hero-impact-num">Rp 2.09 Miliar</div>
                    <div className="hero-impact-label">Nilai Ekonomi Diselamatkan</div>
                    <div className="hero-impact-desc">Kerugian pasca-panen petani Rejang Lebong berhasil direduksi</div>
                  </div>

                  <div className="hero-impact-item">
                    <div className="hero-impact-num">Min. 55%</div>
                    <div className="hero-impact-label">Price Share Petani Kecil</div>
                    <div className="hero-impact-desc">Peningkatan pendapatan langsung bagi petani produsen (SDG 2.3)</div>
                  </div>
                </div>
              </div>

              {/* Annual Comparison Chart with Purple and Cyan color styles */}
              <div className="dashboard-details-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="dashboard-panel">
                  <div className="panel-header">
                    <span className="panel-title">Perbandingan Volume Distribusi Tahunan (Ribuan Ton)</span>
                    <div className="chart-legends">
                      <div className="legend-item">
                        <div className="legend-color" style={{ backgroundColor: '#8b5cf6' }}></div>
                        <span>Distribusi Terkontrol (PanganDali)</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-color" style={{ backgroundColor: '#06b6d4' }}></div>
                        <span>Distribusi Non-Kontrol (Konvensional)</span>
                      </div>
                    </div>
                  </div>

                  {/* SVG Bar Chart with Purple & Cyan overrides */}
                  <div className="chart-container" style={{ height: '260px' }}>
                    <svg viewBox="0 0 600 240" width="100%" height="100%" preserveAspectRatio="none">
                      {/* Grid Y Lines */}
                      <line x1="0" y1="40" x2="600" y2="40" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="100" x2="600" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="160" x2="600" y2="160" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="210" x2="600" y2="210" stroke="#cbd5e1" strokeWidth="2" />

                      {/* Bar Group 2024 */}
                      {/* PanganDali (Purple) */}
                      <rect x="70" y="80" width="35" height="130" rx="4" fill="#8b5cf6" />
                      {/* Konvensional (Cyan) */}
                      <rect x="110" y="110" width="35" height="100" rx="4" fill="#06b6d4" />
                      <text x="107" y="230" textAnchor="middle" fill="#64748b" style={{ fontSize: '11px', fontWeight: 'bold' }}>Tahun 2024</text>

                      {/* Bar Group 2025 */}
                      {/* PanganDali (Purple) */}
                      <rect x="250" y="50" width="35" height="160" rx="4" fill="#8b5cf6" />
                      {/* Konvensional (Cyan) */}
                      <rect x="290" y="120" width="35" height="90" rx="4" fill="#06b6d4" />
                      <text x="287" y="230" textAnchor="middle" fill="#64748b" style={{ fontSize: '11px', fontWeight: 'bold' }}>Tahun 2025</text>

                      {/* Bar Group 2026 (Proyeksi) */}
                      {/* PanganDali (Purple) */}
                      <rect x="430" y="30" width="35" height="180" rx="4" fill="#8b5cf6" />
                      {/* Konvensional (Cyan) */}
                      <rect x="470" y="130" width="35" height="80" rx="4" fill="#06b6d4" />
                      <text x="467" y="230" textAnchor="middle" fill="#64748b" style={{ fontSize: '11px', fontWeight: 'bold' }}>Tahun 2026 (Proyeksi)</text>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 8: Account Verification View */}
          {activeTab === 'verification' && (
            <div className="section-container">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Verifikasi Akun Mitra</h2>
                  <p className="section-desc">Tinjau dan setujui pendaftaran akun Driver Backhaul dan Distributor.</p>
                </div>
              </div>

              <div className="card full-width">
                <div className="card-header">
                  <h3 className="card-title">Daftar Pengajuan Menunggu</h3>
                </div>
                <div className="card-body" style={{ padding: '0', overflowX: 'auto' }}>
                  <table className="dense-table">
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Nama / Perusahaan</th>
                        <th>Email / Kontak</th>
                        <th>Tipe Mitra</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verifications.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                            Belum ada pengajuan verifikasi.
                          </td>
                        </tr>
                      ) : (
                        verifications.map((v) => (
                          <tr key={v.id}>
                            <td>{new Date(v.date).toLocaleDateString('id-ID')}</td>
                            <td style={{ fontWeight: '500' }}>{v.name}</td>
                            <td>{v.email}</td>
                            <td>
                              <span className={`badge ${v.type === 'Driver' ? 'success' : 'primary'}`}>
                                {v.type}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${
                                v.status === 'approved' ? 'success' : 
                                v.status === 'rejected' ? 'danger' : 'warning'
                              }`}>
                                {v.status === 'approved' ? 'Disetujui' : 
                                 v.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                              </span>
                            </td>
                            <td>
                              {v.status === 'pending' && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button 
                                    className="btn btn-sm btn-primary" 
                                    onClick={() => handleVerifyAccount(v.email, v.type, 'approved')}
                                    style={{ padding: '6px 10px', fontSize: '12px' }}
                                  >
                                    <CheckCircle size={14} style={{ marginRight: '4px' }} /> Setujui
                                  </button>
                                  <button 
                                    className="btn btn-sm" 
                                    onClick={() => {
                                      const reason = prompt('Alasan penolakan:');
                                      if (reason) handleVerifyAccount(v.email, v.type, 'rejected', reason);
                                    }}
                                    style={{ padding: '6px 10px', fontSize: '12px', background: '#fee2e2', color: '#dc2626', border: 'none' }}
                                  >
                                    <XCircle size={14} style={{ marginRight: '4px' }} /> Tolak
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;

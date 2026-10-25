import React, { useEffect, useState } from 'react';
import {
  LogOut, Truck, ClipboardCheck, Users, Route, Gauge, Leaf, Menu, X, ShoppingCart, UserCheck,
} from 'lucide-react';
import LaporanValidasi from './admin/LaporanValidasi';
import PesananPage from './admin/PesananPage';
import PetaniPage from './admin/PetaniPage';
import AkunMitra from './admin/AkunMitra';
import PengirimanPage from './admin/PengirimanPage';
import LokasiJarak from './admin/LokasiJarak';
import PasokanPage from './admin/PasokanPage';
import EvaluasiDistribusi from './admin/EvaluasiDistribusi';
import './AdminDashboard.css';

// Menu mengikuti alur proposal: pantau → laporan → pesanan → armada → evaluasi.
// tpid: true = boleh dilihat pengguna TPID (hanya tampilan agregat, sesuai prinsip minimisasi data).
const MENU = [
  {
    judul: 'Pantauan',
    item: [
      { key: 'pasokan', icon: Gauge, label: 'Pasokan & Peringatan', tpid: true, page: PasokanPage },
      { key: 'dampak', icon: Leaf, label: 'Evaluasi Distribusi', tpid: true, page: EvaluasiDistribusi },
    ],
  },
  {
    judul: 'Alur distribusi',
    item: [
      { key: 'validasi', icon: ClipboardCheck, label: 'Validasi Laporan', page: LaporanValidasi },
      { key: 'pesanan', icon: ShoppingCart, label: 'Pesanan', page: PesananPage },
      { key: 'pengiriman', icon: Truck, label: 'Pengiriman & Armada', page: PengirimanPage },
    ],
  },
  {
    judul: 'Data mitra',
    item: [
      { key: 'petani', icon: Users, label: 'Petani Terdaftar', page: PetaniPage },
      { key: 'akun', icon: UserCheck, label: 'Akun Mitra', page: AkunMitra },
      { key: 'lokasi', icon: Route, label: 'Lokasi & Jarak', page: LokasiJarak },
    ],
  },
];

const SEMUA = MENU.flatMap((g) => g.item.map((i) => ({ ...i, grup: g.judul })));

function AdminDashboard({ user, onLogout, isTPID }) {
  const [menuOpen, setMenuOpen] = useState(false); // laci menu di HP/tablet
  const [activeTab, setActiveTab] = useState('pasokan');

  useEffect(() => {
    if (!menuOpen) return undefined;
    const tutup = (e) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', tutup);
    return () => window.removeEventListener('keydown', tutup);
  }, [menuOpen]);

  const boleh = (item) => item.tpid || !isTPID;
  const aktif = SEMUA.find((i) => i.key === activeTab && boleh(i)) || SEMUA[0];
  const Halaman = aktif.page;

  const pilih = (key) => {
    setActiveTab(key);
    setMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const nama = user?.name || (isTPID ? 'Pengguna TPID' : 'Admin');
  const inisial = nama.slice(0, 2).toUpperCase();
  const peran = isTPID ? 'TPID · tampilan agregat' : 'Admin verifikasi';

  return (
    <div className={`admin-layout ${menuOpen ? 'menu-open' : ''}`}>
      <div className="admin-sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />
      <aside className="admin-sidebar" id="admin-sidebar">
        <div className="admin-sidebar-logo">
          <img src="/logo.png" alt="" className="logo-icon" />
          <span>PanganDali</span>
          <button className="admin-sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Tutup menu">
            <X size={20} />
          </button>
        </div>

        {MENU.map((grup) => {
          const item = grup.item.filter(boleh);
          if (!item.length) return null;
          return (
            <React.Fragment key={grup.judul}>
              <div className="sidebar-heading">{grup.judul}</div>
              <nav className="sidebar-menu">
                {item.map(({ key, icon: Icon, label }) => (
                  <button
                    key={key}
                    className={`sidebar-item ${aktif.key === key ? 'active' : ''}`}
                    onClick={() => pilih(key)}
                    aria-current={aktif.key === key ? 'page' : undefined}
                  >
                    <div className="sidebar-item-content">
                      <Icon size={18} />
                      <span>{label}</span>
                    </div>
                  </button>
                ))}
              </nav>
            </React.Fragment>
          );
        })}

        <div className="sidebar-footer">
          <div className="admin-profile-card">
            <div className="avatar-circle">{inisial}</div>
            <div className="admin-profile-info">
              <div className="admin-profile-name">{nama}</div>
              <div className="admin-profile-role">{peran}</div>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={onLogout}>
            <LogOut size={14} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              className="admin-menu-btn"
              onClick={() => setMenuOpen(true)}
              aria-label="Buka menu"
              aria-controls="admin-sidebar"
              aria-expanded={menuOpen}
            >
              <Menu size={20} />
            </button>
            <div className="breadcrumb">
              <span>{aktif.grup}</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-active">{aktif.label}</span>
            </div>
          </div>
          <div className="topbar-actions">
            <span className="instansi-badge">
              <span className="instansi-text">Pilot Rejang Lebong – Kota Bengkulu</span>
            </span>
          </div>
        </header>

        <div className="admin-content">
          <Halaman />
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;

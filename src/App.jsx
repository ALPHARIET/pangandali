import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Tantangan from './components/Tantangan';
import Solusi from './components/Solusi';
import CaraKerja from './components/CaraKerja';
import Dampak from './components/Dampak';
import Footer from './components/Footer';
import InfoPublik from './components/InfoPublik';
import AuthModal from './components/AuthModal';
import AdminDashboard from './components/AdminDashboard';
import DriverHome from './components/driver/DriverHome';
import DistributorHome from './components/distributor/DistributorHome';
import VerifikasiMitra from './components/portal/VerifikasiMitra';
import { getToken, logout as apiLogout, me } from './api';

// Sesi per peran disimpan untuk komponen lama; sumber kebenarannya token + /api/auth/me.
const SESSION_KEY = { Driver: 'pangandali_driver_session', Distributor: 'pangandali_distributor_session' };
const SEMUA_SESI = ['pangandali_session', ...Object.values(SESSION_KEY)];

function bacaSesi() {
  for (const key of SEMUA_SESI) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {
      localStorage.removeItem(key);
    }
  }
  return null;
}

function simpanSesi(u) {
  SEMUA_SESI.forEach((k) => localStorage.removeItem(k));
  if (u) localStorage.setItem(SESSION_KEY[u.role] || 'pangandali_session', JSON.stringify(u));
}

function App() {
  const [user, setUser] = useState(() => (getToken() ? bacaSesi() : null));
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Segarkan status akun dari server (mis. setelah admin menyetujui akun mitra).
  useEffect(() => {
    if (!getToken()) {
      simpanSesi(null);
      return;
    }
    me()
      .then((u) => {
        setUser(u);
        simpanSesi(u);
      })
      .catch(() => {
        apiLogout();
        simpanSesi(null);
        setUser(null);
      });
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    simpanSesi(loggedInUser);
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    apiLogout();
    simpanSesi(null);
    setUser(null);
  };

  const handleUserUpdate = (u) => {
    simpanSesi(u);
    setUser(u);
  };

  const handleCTA = () => setIsAuthModalOpen(true);

  // ─── MITRA LOGISTIK & DISTRIBUTOR ───
  if (user && (user.role === 'Driver' || user.role === 'Distributor')) {
    if (user.verification_status !== 'disetujui') {
      return <VerifikasiMitra user={user} onLogout={handleLogout} onUpdate={handleUserUpdate} />;
    }
    return user.role === 'Driver'
      ? <DriverHome user={user} onLogout={handleLogout} />
      : <DistributorHome user={user} onLogout={handleLogout} />;
  }

  // ─── ADMIN & TPID ───
  if (user && (user.role === 'Admin' || user.role === 'TPID')) {
    return <AdminDashboard user={user} onLogout={handleLogout} isTPID={user.role === 'TPID'} />;
  }

  // ─── LANDING PAGE ───
  return (
    <>
      <Navbar user={user} onLogout={handleLogout} onOpenAuth={() => setIsAuthModalOpen(true)} />
      <Hero onCTA={handleCTA} />
      <Tantangan />
      <Solusi />
      <CaraKerja />
      <Dampak />
      <InfoPublik />
      <Footer />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}

export default App;

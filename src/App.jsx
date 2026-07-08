import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Tantangan from './components/Tantangan';
import Solusi from './components/Solusi';
import CaraKerja from './components/CaraKerja';
import Dampak from './components/Dampak';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Check if user session exists on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('pangandali_session');
    if (savedSession) {
      try {
        setUser(JSON.parse(savedSession));
      } catch (e) {
        console.error('Gagal memuat sesi:', e);
        localStorage.removeItem('pangandali_session');
      }
    }
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('pangandali_session');
    setUser(null);
  };

  const handleCTA = () => {
    if (user) {
      alert(`Anda telah masuk sebagai ${user.name} (${user.role}). Selamat datang di Dashboard PanganDali!`);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  // If logged in as admin, show the admin dashboard directly
  if (user && user.role === 'Admin') {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <>
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        onOpenAuth={() => setIsAuthModalOpen(true)} 
      />
      
      <Hero onCTA={handleCTA} />
      
      <Tantangan />
      
      <Solusi />
      
      <CaraKerja />
      
      <Dampak />
      
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

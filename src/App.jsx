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
import DriverVerification from './components/driver/DriverVerification';
import DriverHome from './components/driver/DriverHome';
import './components/driver/DriverStyles.css';

function App() {
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Driver state
  const [driverUser, setDriverUser] = useState(null);

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

    // Check driver session
    const driverSession = localStorage.getItem('pangandali_driver_session');
    if (driverSession) {
      try {
        setDriverUser(JSON.parse(driverSession));
      } catch (e) {
        console.error('Gagal memuat sesi driver:', e);
        localStorage.removeItem('pangandali_driver_session');
      }
    }
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    // If login is a driver, route to driver flow
    if (loggedInUser.role === 'Driver') {
      setDriverUser(loggedInUser);
    } else {
      setUser(loggedInUser);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pangandali_session');
    setUser(null);
  };

  // Driver handlers
  const handleDriverLogout = () => {
    localStorage.removeItem('pangandali_driver_session');
    setDriverUser(null);
  };

  const handleDriverStatusChange = (status) => {
    if (status === 'approved') {
      const updatedDriver = { ...driverUser, verificationStatus: 'approved', isFirstLogin: false };
      setDriverUser(updatedDriver);
      localStorage.setItem('pangandali_driver_session', JSON.stringify(updatedDriver));
    }
  };

  const handleCTA = () => {
    if (user) {
      alert(`Anda telah masuk sebagai ${user.name} (${user.role}). Selamat datang di Dashboard PanganDali!`);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  // ─── DRIVER FLOW ───
  if (driverUser) {
    // Check verification status
    const docData = localStorage.getItem(`pangandali_driver_docs_${driverUser.email}`);
    const isVerified = docData ? JSON.parse(docData).status === 'approved' : false;
    const isFirstLogin = driverUser.isFirstLogin !== false && !isVerified;

    if (isFirstLogin || (docData && JSON.parse(docData).status !== 'approved')) {
      return (
        <DriverVerification
          user={driverUser}
          onLogout={handleDriverLogout}
          onStatusChange={handleDriverStatusChange}
        />
      );
    }

    // Verified driver -> show home
    return <DriverHome user={driverUser} onLogout={handleDriverLogout} />;
  }

  // ─── ADMIN FLOW ───
  if (user && user.role === 'Admin') {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  // ─── DEFAULT LANDING PAGE ───
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

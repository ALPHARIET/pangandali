import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Briefcase, CheckCircle, AlertTriangle } from 'lucide-react';

function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'signup'
  
  // Login fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupRole, setSignupRole] = useState('Petani');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  
  // Status states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Clear messages and forms when tab changes or modal closes
  useEffect(() => {
    setErrorMsg('');
    setSuccessMsg('');
    // Clear forms
    if (!isOpen) {
      setLoginIdentifier('');
      setLoginPassword('');
      setSignupName('');
      setSignupEmail('');
      setSignupRole('Petani');
      setSignupPassword('');
      setSignupConfirmPassword('');
    }
  }, [activeTab, isOpen]);

  if (!isOpen) return null;

  // Handle Login
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginIdentifier || !loginPassword) {
      setErrorMsg('Semua kolom login harus diisi.');
      return;
    }

    let foundUser = null;
    let isDriverLogin = false;
    let isDistributorLogin = false;

    // Support admin credentials
    if (loginIdentifier.toLowerCase() === 'admin' && loginPassword === 'admin') {
      foundUser = {
        name: 'Admin TPID Rejang Lebong',
        email: 'admin@pangandali.id',
        password: 'admin',
        role: 'Admin'
      };
    } else {
      // Check driver accounts
      const defaultDrivers = [
        {
          name: 'Andi Pratama',
          email: 'driver',
          phone: '081234567890',
          password: 'driver123',
          role: 'Driver',
          isFirstLogin: true,
          verificationStatus: 'none'
        }
      ];
      const storedDrivers = JSON.parse(localStorage.getItem('pangandali_drivers') || '[]');
      const allDrivers = [...defaultDrivers, ...storedDrivers];

      const driverMatch = allDrivers.find(
        (u) =>
          (u.email?.toLowerCase() === loginIdentifier.toLowerCase() ||
            u.phone === loginIdentifier) &&
          u.password === loginPassword
      );

      // Check distributor accounts
      const defaultDistributors = [
        {
          name: 'Budi (Grosir)',
          email: 'distributor',
          phone: '081299998888',
          password: 'distributor123',
          role: 'Distributor',
          isFirstLogin: true,
          verificationStatus: 'none'
        }
      ];
      const storedDistributors = JSON.parse(localStorage.getItem('pangandali_distributors') || '[]');
      const allDistributors = [...defaultDistributors, ...storedDistributors];

      const distributorMatch = allDistributors.find(
        (u) =>
          (u.email?.toLowerCase() === loginIdentifier.toLowerCase() ||
            u.phone === loginIdentifier) &&
          u.password === loginPassword
      );

      if (driverMatch) {
        foundUser = driverMatch;
        isDriverLogin = true;
      } else if (distributorMatch) {
        foundUser = distributorMatch;
        isDistributorLogin = true;
      } else {
        // Get registered users from localStorage
        const users = JSON.parse(localStorage.getItem('pangandali_users') || '[]');
        
        // Default normal user account for easy testing
        const defaultUser = {
          name: 'Budi Santoso',
          email: 'budi@pangandali.id',
          password: 'password123',
          role: 'TPID'
        };
        
        const allUsers = [defaultUser, ...users];

        foundUser = allUsers.find(
          (u) => u.email.toLowerCase() === loginIdentifier.toLowerCase() && u.password === loginPassword
        );
      }
    }

    if (foundUser) {
      setSuccessMsg('Login berhasil! Mengalihkan...');
      setTimeout(() => {
        if (isDriverLogin) {
          // Save driver session separately
          localStorage.setItem('pangandali_driver_session', JSON.stringify(foundUser));
        } else if (isDistributorLogin) {
          // Save distributor session separately
          localStorage.setItem('pangandali_distributor_session', JSON.stringify(foundUser));
        } else {
          localStorage.setItem('pangandali_session', JSON.stringify(foundUser));
        }
        onLoginSuccess(foundUser);
        onClose();
      }, 1200);
    } else {
      setErrorMsg('Email atau password salah.');
    }
  };

  // Handle Register (Sign Up)
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!signupName || !signupEmail || !signupPassword || !signupConfirmPassword) {
      setErrorMsg('Semua kolom pendaftaran harus diisi.');
      return;
    }

    // Email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail)) {
      setErrorMsg('Format email tidak valid.');
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMsg('Password harus minimal 6 karakter.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok.');
      return;
    }

    // Check if email already registered
    const users = JSON.parse(localStorage.getItem('pangandali_users') || '[]');
    const emailExists = users.some(
      (u) => u.email.toLowerCase() === signupEmail.toLowerCase() || signupEmail.toLowerCase() === 'budi@pangandali.id'
    );

    if (emailExists) {
      setErrorMsg('Email sudah terdaftar.');
      return;
    }

    // Register user
    const newUser = {
      name: signupName,
      email: signupEmail,
      role: signupRole,
      password: signupPassword
    };

    users.push(newUser);
    localStorage.setItem('pangandali_users', JSON.stringify(users));

    setSuccessMsg('Pendaftaran berhasil! Silakan masuk.');
    setTimeout(() => {
      // Auto-switch to login tab
      setActiveTab('login');
      setLoginIdentifier(signupEmail);
    }, 1500);
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Tutup">
          <X size={20} />
        </button>

        <div className="auth-header">
          <div className="auth-logo">
            <div className="logo-icon">PD</div>
            <span>PanganDali</span>
          </div>
          <p className="text-muted">Akses Platform Intelijen Distribusi Pangan</p>
        </div>

        <div className="auth-tabs">
          <button 
            className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Masuk
          </button>
          <button 
            className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => setActiveTab('signup')}
          >
            Daftar Akun
          </button>
        </div>

        {errorMsg && (
          <div className="alert-message alert-error" style={{ marginBottom: '16px' }}>
            <AlertTriangle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert-message alert-success" style={{ marginBottom: '16px' }}>
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {activeTab === 'login' ? (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">Username atau Email</label>
              <div className="input-wrapper">
                <User className="input-icon" size={16} />
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="admin atau nama@email.com"
                  autoComplete="username"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={16} />
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="login-hint" style={{ fontSize: '11px', textAlign: 'center' }}>
              <strong>Admin:</strong> admin / admin<br/>
              <strong>Driver:</strong> driver / driver123<br/>
              <strong>Distributor:</strong> distributor / distributor123
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
              Masuk ke Dashboard
            </button>
            
            <div className="auth-footer">
              Belum punya akun?{' '}
              <span className="auth-link" onClick={() => setActiveTab('signup')}>
                Daftar Sekarang
              </span>
            </div>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label className="form-label">Nama Lengkap</label>
              <div className="input-wrapper">
                <User className="input-icon" size={16} />
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Masukkan nama lengkap"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={16} />
                <input 
                  type="email" 
                  className="input-field" 
                  placeholder="nama@email.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Peran (Role)</label>
              <div className="input-wrapper">
                <Briefcase className="input-icon" size={16} />
                <select 
                  className="select-field"
                  value={signupRole}
                  onChange={(e) => setSignupRole(e.target.value)}
                >
                  <option value="Petani">Petani</option>
                  <option value="Distributor">Distributor</option>
                  <option value="Mitra Logistik">Mitra Logistik/Driver</option>
                  <option value="TPID">TPID (Pemerintah)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={16} />
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="Minimal 6 karakter"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Konfirmasi Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={16} />
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="Ulangi password"
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
              Daftar Sebagai {signupRole}
            </button>
            
            <div className="auth-footer">
              Sudah punya akun?{' '}
              <span className="auth-link" onClick={() => setActiveTab('login')}>
                Masuk
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default AuthModal;

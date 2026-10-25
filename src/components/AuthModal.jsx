import React, { useState, useEffect } from 'react';
import { api, login } from '../api';
import { X, Mail, Lock, User, Briefcase, CheckCircle, AlertTriangle } from 'lucide-react';

function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'signup'
  
  // Login fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupRole, setSignupRole] = useState('Distributor');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  
  // Status states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      setSignupRole('Distributor');
      setSignupPassword('');
      setSignupConfirmPassword('');
    }
  }, [activeTab, isOpen]);

  if (!isOpen) return null;

  // Handle Login (lewat backend: password di-hash di server, sesi memakai JWT)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginIdentifier || !loginPassword) {
      setErrorMsg('Semua kolom login harus diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const foundUser = await login(loginIdentifier.trim(), loginPassword);
      setSuccessMsg('Login berhasil! Mengalihkan...');
      // Sesi per peran masih dipakai komponen Driver/Distributor yang belum dimigrasi ke API.
      const sessionKey =
        foundUser.role === 'Driver'
          ? 'pangandali_driver_session'
          : foundUser.role === 'Distributor'
            ? 'pangandali_distributor_session'
            : 'pangandali_session';
      localStorage.setItem(sessionKey, JSON.stringify(foundUser));
      setTimeout(() => {
        onLoginSuccess(foundUser);
        onClose();
      }, 600);
    } catch (err) {
      setErrorMsg(err.message || 'Email atau password salah.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Register (Sign Up) untuk Mitra Logistik / Distributor
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!signupName || !signupEmail || !signupPassword || !signupConfirmPassword) {
      setErrorMsg('Semua kolom pendaftaran harus diisi.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail)) {
      setErrorMsg('Format email tidak valid.');
      return;
    }

    if (signupPassword.length < 8) {
      setErrorMsg('Password harus minimal 8 karakter.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok.');
      return;
    }

    setSubmitting(true);
    try {
      await api('/api/auth/register', {
        method: 'POST',
        body: {
          name: signupName,
          email: signupEmail,
          password: signupPassword,
          role: signupRole === 'Distributor' ? 'distributor' : 'driver',
        },
      });
      setSuccessMsg('Pendaftaran berhasil! Silakan masuk.');
      setTimeout(() => {
        setActiveTab('login');
        setLoginIdentifier(signupEmail);
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
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
          <p className="text-muted">Masuk ke platform koordinasi distribusi pangan</p>
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
                  placeholder="nama@email.com atau nomor HP"
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


            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }} disabled={submitting}>
              {submitting ? 'Memproses...' : 'Masuk ke Dashboard'}
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
                  <option value="Distributor">Distributor</option>
                  <option value="Mitra Logistik">Mitra Logistik</option>
                </select>
              </div>
            </div>

            <div className="alert-message alert-info" style={{ marginTop: '12px', fontSize: '12px', background: '#eff6ff', color: '#1e40af', padding: '10px', borderRadius: '6px' }}>
              <strong>Info:</strong> Akun Petani dan instansi TPID didaftarkan secara kolektif melalui PPL, Gapoktan, atau BUMDes (tidak melalui pendaftaran mandiri).
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={16} />
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="Minimal 8 karakter"
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

            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }} disabled={submitting}>
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

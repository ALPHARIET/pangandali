import React, { useState } from 'react';
import { Phone, Lock, ArrowRight, Truck, Info } from 'lucide-react';

function DriverLogin({ onLoginSuccess }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!identifier || !password) {
      setError('Semua kolom harus diisi.');
      return;
    }

    setLoading(true);

    // Simulate auth delay
    setTimeout(() => {
      let foundUser = null;

      // Default driver account for demo
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

      // Get registered drivers from localStorage
      const storedDrivers = JSON.parse(localStorage.getItem('pangandali_drivers') || '[]');
      const allDrivers = [...defaultDrivers, ...storedDrivers];

      foundUser = allDrivers.find(
        (u) =>
          (u.email?.toLowerCase() === identifier.toLowerCase() ||
            u.phone === identifier) &&
          u.password === password
      );

      if (foundUser) {
        setSuccess('Login berhasil! Mengalihkan...');
        setTimeout(() => {
          // Save driver session
          localStorage.setItem('pangandali_driver_session', JSON.stringify(foundUser));
          onLoginSuccess(foundUser);
        }, 800);
      } else {
        setError('Nomor WhatsApp/Email atau password salah.');
      }

      setLoading(false);
    }, 600);
  };

  return (
    <div className="driver-login">
      {/* Left: Form */}
      <div className="driver-login__form-side">
        <div className="driver-login__brand">
          <div className="driver-login__brand-icon">PD</div>
          <div className="driver-login__brand-text">
            PanganDali
            <span>Mitra Logistik (Backhaul)</span>
          </div>
        </div>

        <h1 className="driver-login__heading">
          Masuk ke akun Mitra Logistik Anda
        </h1>
        <p className="driver-login__sub">
          Gunakan akun yang telah didaftarkan oleh admin untuk mengakses layanan Backhaul.
        </p>

        {error && (
          <div className="alert-message alert-error" style={{ marginBottom: 16, maxWidth: 400 }}>
            <Info size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert-message alert-success" style={{ marginBottom: 16, maxWidth: 400 }}>
            <Info size={16} />
            <span>{success}</span>
          </div>
        )}

        <form className="driver-login__form" onSubmit={handleSubmit}>
          <div className="driver-login__input-group">
            <label className="driver-login__label">Nomor WhatsApp atau Email</label>
            <div className="driver-login__input-wrap">
              <Phone size={16} className="driver-login__input-icon" />
              <input
                type="text"
                className="driver-login__input"
                placeholder="08xxxxxxxxxx atau email@contoh.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="driver-login__input-group">
            <label className="driver-login__label">Password</label>
            <div className="driver-login__input-wrap">
              <Lock size={16} className="driver-login__input-icon" />
              <input
                type="password"
                className="driver-login__input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="button" className="driver-login__forgot">
            Lupa Password?
          </button>

          <button type="submit" className="driver-login__submit" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
            {!loading && <ArrowRight size={18} />}
          </button>

          <div className="driver-login__hint">
            <Info size={14} />
            <span>Akun demo: <strong>driver</strong> / <strong>driver123</strong></span>
          </div>
        </form>
      </div>

      {/* Right: Illustration */}
      <div className="driver-login__illust-side">
        <div className="driver-login__illust-content">
          <div className="driver-login__illust-svg">
            <svg width="280" height="200" viewBox="0 0 280 200" fill="none">
              {/* Road */}
              <rect x="0" y="150" width="280" height="8" rx="4" fill="rgba(255,255,255,0.08)" />
              <rect x="20" y="152" width="40" height="4" rx="2" fill="rgba(255,255,255,0.15)" />
              <rect x="80" y="152" width="40" height="4" rx="2" fill="rgba(255,255,255,0.15)" />
              <rect x="140" y="152" width="40" height="4" rx="2" fill="rgba(255,255,255,0.15)" />
              <rect x="200" y="152" width="40" height="4" rx="2" fill="rgba(255,255,255,0.15)" />

              {/* Truck body */}
              <rect x="50" y="95" width="120" height="55" rx="8" fill="#22c55e" />
              <rect x="55" y="100" width="110" height="30" rx="4" fill="rgba(255,255,255,0.15)" />
              {/* Cab */}
              <rect x="170" y="108" width="55" height="42" rx="6" fill="#16a34a" />
              {/* Windshield */}
              <rect x="180" y="113" width="35" height="22" rx="4" fill="rgba(255,255,255,0.3)" />
              {/* Wheels */}
              <circle cx="90" cy="152" r="14" fill="#1f2937" />
              <circle cx="90" cy="152" r="7" fill="#374151" />
              <circle cx="90" cy="152" r="3" fill="#6b7280" />
              <circle cx="195" cy="152" r="14" fill="#1f2937" />
              <circle cx="195" cy="152" r="7" fill="#374151" />
              <circle cx="195" cy="152" r="3" fill="#6b7280" />

              {/* Boxes on truck */}
              <rect x="65" y="105" width="20" height="18" rx="3" fill="rgba(255,255,255,0.25)" />
              <rect x="90" y="102" width="22" height="21" rx="3" fill="rgba(255,255,255,0.2)" />
              <rect x="117" y="107" width="18" height="16" rx="3" fill="rgba(255,255,255,0.22)" />

              {/* Arrow backhaul */}
              <path d="M60 70 L220 70" stroke="rgba(34,197,94,0.4)" strokeWidth="2" strokeDasharray="6 4" />
              <path d="M220 70 L210 62 M220 70 L210 78" stroke="rgba(34,197,94,0.6)" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M220 82 L60 82" stroke="rgba(245,158,11,0.3)" strokeWidth="2" strokeDasharray="6 4" />
              <path d="M60 82 L70 74 M60 82 L70 90" stroke="rgba(245,158,11,0.5)" strokeWidth="2.5" strokeLinecap="round" />

              <text x="140" y="62" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontWeight="600">KIRIM</text>
              <text x="140" y="95" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="10" fontWeight="600">BACKHAUL</text>
            </svg>
          </div>

          <h2 className="driver-login__illust-title">
             Mitra Logistik (Backhaul)
          </h2>
          <p className="driver-login__illust-desc">
            Jangan biarkan truk Anda pulang kosong. Dapatkan muatan balik dan tambah penghasilan setiap perjalanan.
          </p>

          <div className="driver-login__illust-stats">
            <div className="driver-login__illust-stat">
              <div className="driver-login__illust-stat-num">500+</div>
              <div className="driver-login__illust-stat-label">Mitra Aktif</div>
            </div>
            <div className="driver-login__illust-stat">
              <div className="driver-login__illust-stat-num">60%</div>
              <div className="driver-login__illust-stat-label">Backhaul Rate</div>
            </div>
            <div className="driver-login__illust-stat">
              <div className="driver-login__illust-stat-num">24/7</div>
              <div className="driver-login__illust-stat-label">Muatan Tersedia</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DriverLogin;

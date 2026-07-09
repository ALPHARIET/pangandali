import React from 'react';
import { ArrowRight, Sprout } from 'lucide-react';

function Hero({ onCTA }) {
  return (
    <header className="hero-section">
      {/* Full-width background image */}
      <div className="hero-bg">
        <img 
          src="/rice_fields_hero.png" 
          alt="Lanskap pertanian sawah PanganDali" 
          className="hero-bg-img" 
        />
        <div className="hero-bg-overlay" />
      </div>

      <div className="container hero-content-wrapper">
        <div className="hero-content">
          <span className="hero-badge">
            <Sprout size={14} />
            Smart City Ecosystem
          </span>
          <h1 className="hero-title">
            Platform Distribution Intelligence untuk <span>Pengendalian</span> Inflasi Pangan Daerah
          </h1>
          <p className="hero-desc">
            Menghubungkan Petani, Distributor, Mitra Logistik, dan TPID dalam satu ekosistem digital berbasis Smart City untuk rantai pasok yang transparan dan efisien.
          </p>
          <div className="hero-cta-group">
            <button className="btn btn-primary btn-hero" onClick={onCTA}>
              <span>Mulai Sekarang</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Hero;

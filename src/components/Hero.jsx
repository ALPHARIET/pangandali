import React from 'react';
import { ArrowRight } from 'lucide-react';

function Hero({ onCTA }) {
  return (
    <header className="hero-section">
      <div className="container hero-grid">
        <div className="hero-content">
          <span className="hero-badge">Smart City Ecosystem</span>
          <h1 className="hero-title">
            Platform Distribution Intelligence untuk <span>Pengendalian</span> Inflasi Pangan Daerah
          </h1>
          <p className="hero-desc">
            Menghubungkan Petani, Distributor, Mitra Logistik, dan TPID dalam satu ekosistem digital berbasis Smart City untuk rantai pasok yang transparan dan efisien.
          </p>
          <button className="btn btn-primary" onClick={onCTA}>
            <span>Mulai Sekarang</span>
            <ArrowRight size={18} />
          </button>
        </div>
        <div className="hero-image-wrapper">
          <img 
            src="/rice_fields_hero.png" 
            alt="Lanskap pertanian sawah PanganDali" 
            className="hero-image" 
          />
        </div>
      </div>
    </header>
  );
}

export default Hero;

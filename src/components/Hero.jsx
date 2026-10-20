import React from 'react';
import { ArrowRight, Sprout } from 'lucide-react';

function Hero({ onCTA }) {
  return (
    <header id="hero" className="hero-section">
      {/* Full-width background image */}
      <div className="hero-bg">
        <img 
          src="/horticulture_hero.png" 
          alt="Lanskap pertanian hortikultura PanganDali" 
          className="hero-bg-img" 
        />
        <div className="hero-bg-overlay" />
      </div>

      <div className="container hero-content-wrapper">
        <div className="hero-content">
          <span className="hero-badge">
            <Sprout size={14} />
            Teknologi Hijau · Distribusi Hortikultura
          </span>
          <h1 className="hero-title">
            Koordinasi distribusi hortikultura dengan <span>muatan balik</span>
          </h1>
          <p className="hero-desc">
            PanganDali menghubungkan laporan panen petani, permintaan distributor, dan kapasitas armada yang sudah berjalan di koridor Rejang Lebong–Kota Bengkulu. Setiap kiriman mencatat jarak, BBM, dan susut supaya efisiensinya bisa diukur, bukan diasumsikan.
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

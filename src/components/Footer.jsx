import React from 'react';
import { Heart } from 'lucide-react';

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer-section">
      <div className="container footer-container">
        <div>
          <h3 className="footer-title">PanganDali</h3>
          <p className="footer-desc">
            Koordinasi distribusi hortikultura dan pengukuran efisiensi muatan balik.
          </p>
          <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', padding: '6px 12px', background: 'rgba(99,102,241,0.1)', borderRadius: '6px', display: 'inline-block', border: '1px solid rgba(99,102,241,0.2)' }}>
            Purwarupa: React + FastAPI + PostgreSQL. Data bertanda contoh adalah ilustrasi, bukan hasil uji lapangan.
          </p>
          <p className="footer-copy">
            © {year} PanganDali. Dibangun dengan <Heart size={12} className="footer-heart" /> untuk Indonesia.
          </p>
        </div>
        <div className="footer-links">
          <a href="#hero">Beranda</a>
          <a href="#tantangan">Tantangan</a>
          <a href="#solusi">Solusi</a>
          <a href="#infopublik">Info Publik</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

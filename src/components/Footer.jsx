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
            Platform distribusi pangan yang transparan dan responsif.
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

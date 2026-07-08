import React from 'react';

function Footer() {
  return (
    <footer className="footer-section">
      <div className="container footer-container">
        <div>
          <h3 className="footer-title">PanganDali</h3>
          <p className="footer-desc">Platform distribusi pangan yang transparan dan responsif.</p>
        </div>
        <div className="footer-links">
          <a href="#hero">Beranda</a>
          <a href="#tantangan">Tantangan</a>
          <a href="#solusi">Solusi</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

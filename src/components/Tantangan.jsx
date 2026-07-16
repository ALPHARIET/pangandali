import React, { useEffect, useRef } from 'react';
import { Network, Truck, TrendingDown, AlertTriangle } from 'lucide-react';

function Tantangan() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    const cards = sectionRef.current?.querySelectorAll('.tantangan-card');
    cards?.forEach((card, i) => {
      card.style.animationDelay = `${i * 0.15}s`;
      observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className="section" ref={sectionRef}>
      <div className="container">
        <div className="section-title-wrapper">
          <span className="section-label">
            <AlertTriangle size={14} />
            Masalah Utama
          </span>
          <h2 className="section-title">Tantangan Distribusi Pangan</h2>
          <p className="section-desc">
            Ketidakefisienan dalam rantai pasok menyebabkan lonjakan harga dan kerugian di tingkat akar rumput.
          </p>
        </div>

        <div className="tantangan-grid">
          {/* Card 1 */}
          <div className="tantangan-card">
            <div className="tantangan-icon-box">
              <Network size={24} />
            </div>
            <div className="tantangan-card-badge">
              <TrendingDown size={12} />
              <span>Margin Petani Rendah</span>
            </div>
            <h3 className="tantangan-card-title">Rantai Distribusi Panjang</h3>
            <p className="tantangan-card-desc">
              Rantai pemasaran berlapis menggerus margin petani hingga farmer price share hanya 43% (Fitria, 2022). Transparansi harga hampir tidak ada.
            </p>
            <div className="tantangan-card-img">
              <img src="/market_trading.png" alt="Rantai Pemasaran berlapis" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="tantangan-card">
            <div className="tantangan-icon-box">
              <Truck size={24} />
            </div>
            <div className="tantangan-card-badge tantangan-card-badge-green">
              <AlertTriangle size={12} />
              <span>Pemborosan Logistik</span>
            </div>
            <h3 className="tantangan-card-title">Empty Backhaul</h3>
            <p className="tantangan-card-desc">
              Truk kembali kosong setelah mengantar barang. Pemborosan bahan bakar dan waktu yang secara langsung meningkatkan biaya logistik keseluruhan.
            </p>
            <div className="tantangan-card-img">
              <img src="/empty_backhaul.png" alt="Empty Backhaul Logistik" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Tantangan;

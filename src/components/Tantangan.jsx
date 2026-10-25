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
    <section id="tantangan" className="section" ref={sectionRef}>
      <div className="container">
        <div className="section-title-wrapper">
          <span className="section-label">
            <AlertTriangle size={14} />
            Masalah Utama
          </span>
          <h2 className="section-title">Tantangan Distribusi Pangan</h2>
          <p className="section-desc">
            Panen, permintaan pembeli, dan kapasitas angkut belum terhubung. Perjalanan kosong dan keterlambatan distribusi berpotensi memboroskan BBM serta meningkatkan susut pangan.
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
              <span>Belum Tertelusur</span>
            </div>
            <h3 className="tantangan-card-title">Panen dan Permintaan Belum Terhubung</h3>
            <p className="tantangan-card-desc">
              Fitria (2022) menelaah saluran pemasaran kubis di Desa Air Duku, Selupu Rejang, dan kaitannya dengan penerimaan petani. Harga, permintaan, dan kesepakatan jual perlu dicatat lebih tertelusur agar petani dan pembeli bisa bertemu lebih awal.
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
              <span>Kapasitas Angkut Terbuang</span>
            </div>
            <h3 className="tantangan-card-title">Armada Pulang Kosong</h3>
            <p className="tantangan-card-desc">
              Kendaraan sering kembali tanpa muatan setelah mengantar barang, sementara hasil panen menunggu angkutan. Kapasitas kosong ini berpotensi memboroskan BBM dan waktu.
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

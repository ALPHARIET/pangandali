import React, { useEffect, useRef, useState } from 'react';
import { Users, Gauge, BarChart3 } from 'lucide-react';

function AnimatedNumber({ value, suffix = '' }) {
  const [display, setDisplay] = useState('0');
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const numericValue = parseInt(value.replace(/\D/g, ''), 10);
          const duration = 1600;
          const startTime = performance.now();

          const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(numericValue * eased);
            setDisplay(currentValue.toLocaleString() + suffix);

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, suffix]);

  return <div className="stat-num" ref={ref}>{display}</div>;
}

function Dampak() {
  return (
    <section id="dampak" className="section">
      <div className="container">
        <div className="dampak-banner">
          <div className="dampak-grid">
            <div className="dampak-title-box">
              <h3>Dampak Nyata PanganDali</h3>
              <p>
                Membangun ketahanan pangan melalui efisiensi operasional dan pemberdayaan komunitas akar rumput.
              </p>
            </div>
            
            <div className="dampak-stat">
              <Users size={20} className="dampak-stat-icon" />
              <AnimatedNumber value="300" suffix="+" />
              <div className="stat-label">Petani Terlibat (Target Pilot)</div>
            </div>
            
            <div className="dampak-stat">
              <Gauge size={20} className="dampak-stat-icon" />
              <AnimatedNumber value="60" suffix="%" />
              <div className="stat-label">Utilisasi Backhaul (Target ≥60%)</div>
            </div>
          </div>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '16px', textAlign: 'center', fontStyle: 'italic' }}>
              Angka di atas merupakan target indikator pilot, bukan capaian yang sudah terjadi.
            </p>
        </div>
      </div>
    </section>
  );
}

export default Dampak;

import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Gauge } from 'lucide-react';

function AnimatedNumber({ value, prefix = '', suffix = '' }) {
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
            setDisplay(prefix + currentValue.toLocaleString() + suffix);

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
  }, [value, prefix, suffix]);

  return <div className="stat-num" ref={ref}>{display}</div>;
}

function Dampak() {
  return (
    <section id="dampak" className="section">
      <div className="container">
        <div className="dampak-banner">
          <div className="dampak-grid">
            <div className="dampak-title-box">
              <h3>Target Uji Pilot</h3>
              <p>
                Uji awal diusulkan pada 10–20 petani, 2–3 pembeli, dan 2–3 armada untuk satu sampai dua komoditas, atas persetujuan mitra.
              </p>
            </div>
            
            <div className="dampak-stat">
              <MessageSquare size={20} className="dampak-stat-icon" />
              <AnimatedNumber value="85" prefix="≥" suffix="%" />
              <div className="stat-label">Ketepatan Ekstraksi Pesan (Target)</div>
            </div>
            
            <div className="dampak-stat">
              <Gauge size={20} className="dampak-stat-icon" />
              <AnimatedNumber value="60" prefix="≥" suffix="%" />
              <div className="stat-label">Perjalanan Balik Berisi Muatan (Target)</div>
            </div>
          </div>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '16px', textAlign: 'center', fontStyle: 'italic' }}>
              Angka di atas adalah target uji yang diusulkan, bukan capaian. Penghematan BBM dan susut dilaporkan setelah diukur, termasuk bila hasilnya negatif.
            </p>
        </div>
      </div>
    </section>
  );
}

export default Dampak;

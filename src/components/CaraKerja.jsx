import React, { useEffect, useRef } from 'react';
import { Workflow } from 'lucide-react';

function CaraKerja() {
  const stepsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );

    const steps = stepsRef.current?.querySelectorAll('.ekosistem-step');
    steps?.forEach((step, i) => {
      step.style.animationDelay = `${i * 0.1}s`;
      observer.observe(step);
    });

    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      num: 1,
      title: 'Lapor Panen',
      desc: 'Petani terdaftar melapor lewat WhatsApp dan mengonfirmasi ringkasannya.',
      color: '#10b981'
    },
    {
      num: 2,
      title: 'Validasi',
      desc: 'Admin memeriksa kelengkapan dan kewajaran sebelum stok tersedia.',
      color: '#3b82f6'
    },
    {
      num: 3,
      title: 'Pesanan',
      desc: 'Distributor mengajukan pembelian; volume dikunci sementara, petani menerima atau menolak.',
      color: '#6366f1'
    },
    {
      num: 4,
      title: 'Muatan Balik',
      desc: 'Armada searah direkomendasikan dan baru ditugaskan setelah mitra setuju.',
      color: '#f59e0b'
    },
    {
      num: 5,
      title: 'Pemantauan',
      desc: 'Status, berat, km, dan BBM dicatat; dashboard menampilkan pasokan dan efisiensi.',
      color: '#10b981'
    }
  ];

  return (
    <section id="carakerja" className="section">
      <div className="container">
        <div className="section-title-wrapper">
          <span className="section-label">
            <Workflow size={14} />
            Alur Proses
          </span>
          <h2 className="section-title">Cara Kerja Ekosistem</h2>
          <p className="section-desc">
            Data yang sama dipakai untuk niaga, koordinasi pengiriman, dan informasi kebijakan.
          </p>
        </div>

        <div className="ekosistem-steps" ref={stepsRef}>
          <div className="ekosistem-connector" />
          
          {steps.map((step) => (
            <div className="ekosistem-step" key={step.num}>
              <div 
                className="step-number"
                style={{ 
                  '--step-color': step.color,
                  borderColor: `${step.color}30`
                }}
              >
                {step.num}
              </div>
              <div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CaraKerja;

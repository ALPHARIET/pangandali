import React, { useEffect, useRef } from 'react';
import { MessageSquare, Cpu, AlertTriangle, ArrowRight, Zap } from 'lucide-react';

function Solusi() {
  const gridRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const cards = gridRef.current?.querySelectorAll('.solusi-card');
    cards?.forEach((card, i) => {
      card.style.animationDelay = `${i * 0.12}s`;
      observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  const solutions = [
    {
      icon: MessageSquare,
      title: 'WhatsApp NLP',
      desc: 'Petani dapat melaporkan panen dan harga langsung melalui antarmuka chat WhatsApp yang familier, diproses otomatis oleh Natural Language Processing.',
      tag: 'Input Cerdas'
    },
    {
      icon: Cpu,
      title: 'Smart Matching',
      desc: 'Algoritma cerdas mencocokkan pasokan petani dengan permintaan distributor terdekat dan mengoptimalkan rute armada untuk meminimalkan empty backhaul.',
      tag: 'Optimasi AI'
    },
    {
      icon: AlertTriangle,
      title: 'EWS (Early Warning System)',
      desc: 'Dashboard real-time untuk TPID mendeteksi anomali pasokan atau lonjakan harga, memungkinkan intervensi pasar yang cepat dan tepat sasaran.',
      tag: 'Monitoring'
    }
  ];

  return (
    <section id="solusi" className="section solusi-section">
      <div className="container">
        <div className="solusi-header">
          <div className="section-title-wrapper">
            <span className="section-label">
              <Zap size={14} />
              Solusi Kami
            </span>
            <h2 className="section-title">Teknologi Presisi untuk Pertanian</h2>
          </div>
          <a href="#carakerja" className="solusi-link">
            <span>Pelajari Fitur Lengkap</span>
            <ArrowRight size={16} />
          </a>
        </div>

        <div className="solusi-grid" ref={gridRef}>
          {solutions.map((sol, idx) => (
            <div className="solusi-card" key={idx}>
              <div className="solusi-icon-box">
                <sol.icon size={22} />
              </div>
              <div className="solusi-card-tag">{sol.tag}</div>
              <h3 className="solusi-card-title">{sol.title}</h3>
              <p className="solusi-card-desc">{sol.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Solusi;

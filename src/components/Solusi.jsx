import React, { useEffect, useRef } from 'react';
import { MessageSquare, Route, AlertTriangle, Gauge, ArrowRight, Zap } from 'lucide-react';

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
      title: 'Laporan Panen via WhatsApp',
      desc: 'Petani terdaftar melapor dengan bahasa sehari-hari. Komoditas, jumlah, lokasi, waktu, dan harga harapan diekstraksi dengan aturan, kamus, dan model bahasa. Petani mengonfirmasi ringkasan, lalu admin memvalidasi.',
      tag: 'Ekstraksi + Konfirmasi'
    },
    {
      icon: Route,
      title: 'Pencocokan Muatan Balik',
      desc: 'Armada disaring berdasarkan kapasitas, komoditas, rute, dan waktu, lalu diurutkan menurut tambahan jarak, tingkat isian, dan keandalan. Rekomendasi baru menjadi tugas setelah mitra setuju.',
      tag: 'Aturan & Skor'
    },
    {
      icon: AlertTriangle,
      title: 'Peringatan Pasokan',
      desc: 'Dashboard menampilkan pasokan, transaksi, dan distribusi dengan peringatan berbasis ambang yang disepakati. Dashboard tidak menggantikan survei harga resmi atau kewenangan TPID.',
      tag: 'Berbasis Ambang'
    },
    {
      icon: Gauge,
      title: 'Pengukuran Efisiensi',
      desc: 'Setiap kiriman mencatat berat muat dan terima, km rute dan deviasi, BBM, serta waktu. Susut dan BBM bersih dihitung terhadap skenario pembanding; data yang kurang ditandai.',
      tag: 'Dampak Terukur'
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
            <h2 className="section-title">Satu Aliran Data, dari Panen sampai Pengiriman</h2>
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

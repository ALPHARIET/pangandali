import React from 'react';
import { MessageSquare, Cpu, AlertTriangle, ArrowRight } from 'lucide-react';

function Solusi() {
  return (
    <section className="section solusi-section">
      <div className="container">
        <div className="solusi-header">
          <div className="section-title-wrapper">
            <span className="section-label">Solusi Kami</span>
            <h2 className="section-title">Teknologi Presisi untuk Pertanian</h2>
          </div>
          <a href="#fitur" className="solusi-link">
            <span>Pelajari Fitur Lengkap</span>
            <ArrowRight size={16} />
          </a>
        </div>

        <div className="solusi-grid">
          {/* Card 1 */}
          <div className="solusi-card">
            <div className="solusi-icon-box">
              <MessageSquare size={20} />
            </div>
            <h3 className="solusi-card-title">WhatsApp NLP</h3>
            <p className="solusi-card-desc">
              Petani dapat melaporkan panen dan harga langsung melalui antarmuka chat WhatsApp yang familier, diproses otomatis oleh Natural Language Processing.
            </p>
          </div>

          {/* Card 2 */}
          <div className="solusi-card">
            <div className="solusi-icon-box">
              <Cpu size={20} />
            </div>
            <h3 className="solusi-card-title">Smart Matching</h3>
            <p className="solusi-card-desc">
              Algoritma cerdas mencocokkan pasokan petani dengan permintaan distributor terdekat dan mengoptimalkan rute armada untuk meminimalkan empty backhaul.
            </p>
          </div>

          {/* Card 3 */}
          <div className="solusi-card">
            <div className="solusi-icon-box">
              <AlertTriangle size={20} />
            </div>
            <h3 className="solusi-card-title">EWS (Early Warning System)</h3>
            <p className="solusi-card-desc">
              Dashboard real-time untuk TPID mendeteksi anomali pasokan atau lonjakan harga, memungkinkan intervensi pasar yang cepat dan tepat sasaran.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Solusi;

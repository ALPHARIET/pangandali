import React from 'react';
import { Network, Truck } from 'lucide-react';

function Tantangan() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-title-wrapper">
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
            <h3 className="tantangan-card-title">Rantai Pemasaran 4 Lapis</h3>
            <p className="tantangan-card-desc">
              Tengkulak berlapis menggerus margin petani dan melambungkan harga di tingkat konsumen. Transparansi harga hampir tidak ada.
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

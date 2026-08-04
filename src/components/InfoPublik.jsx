import React from 'react';
import { Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const komoditasData = [
  {
    nama: 'Cabai Besar',
    harga: 'Rp 35.000 – 50.000/kg',
    status: 'Perlu Dipantau',
    statusColor: '#f59e0b',
    tren: 'naik',
  },
  {
    nama: 'Kubis',
    harga: 'Rp 6.000 – 10.000/kg',
    status: 'Aman',
    statusColor: '#16a34a',
    tren: 'stabil',
  },
  {
    nama: 'Terung',
    harga: 'Rp 8.000 – 14.000/kg',
    status: 'Aman',
    statusColor: '#16a34a',
    tren: 'turun',
  },
  {
    nama: 'Wortel',
    harga: 'Rp 12.000 – 18.000/kg',
    status: 'Aman',
    statusColor: '#16a34a',
    tren: 'stabil',
  },
  {
    nama: 'Kembang Kol',
    harga: 'Rp 10.000 – 16.000/kg',
    status: 'Perlu Dipantau',
    statusColor: '#f59e0b',
    tren: 'naik',
  },
];

function TrenIcon({ tren }) {
  if (tren === 'naik') return <TrendingUp size={14} style={{ color: '#ef4444' }} />;
  if (tren === 'turun') return <TrendingDown size={14} style={{ color: '#16a34a' }} />;
  return <Minus size={14} style={{ color: '#6b7280' }} />;
}

function InfoPublik() {
  return (
    <section id="infopublik" className="section">
      <div className="container">
        <div className="section-title-wrapper">
          <span className="section-label">
            <Info size={14} />
            Kanal Publik
          </span>
          <h2 className="section-title">Informasi Pangan untuk Warga</h2>
          <p className="section-desc">
            Ringkasan mingguan harga dan pasokan komoditas hortikultura yang dapat diakses warga Kota Bengkulu tanpa perlu login.
          </p>
        </div>

        <div className="info-publik-card">
          <table className="info-publik-table">
            <thead>
              <tr>
                <th>Komoditas</th>
                <th>Kisaran Harga Konsumen</th>
                <th>Status Pasokan</th>
                <th>Tren Pekan Ini</th>
              </tr>
            </thead>
            <tbody>
              {komoditasData.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 500 }}>{item.nama}</td>
                  <td>{item.harga}</td>
                  <td>
                    <span
                      className="info-publik-status"
                      style={{
                        background: `${item.statusColor}15`,
                        color: item.statusColor,
                        border: `1px solid ${item.statusColor}30`,
                      }}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <span className="info-publik-tren">
                      <TrenIcon tren={item.tren} />
                      {item.tren.charAt(0).toUpperCase() + item.tren.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="info-publik-sumber">
            Ringkasan disusun dari laporan panen tervalidasi dan harga acuan PIHPS, diterbitkan mingguan oleh Dinas Pertanian bersama TPID Kabupaten Rejang Lebong.
          </p>

          <div className="info-publik-badge">
            <Info size={12} />
            Halaman ini bagian dari mockup PanganDali. Data yang ditampilkan adalah contoh ilustrasi.
          </div>
        </div>
      </div>
    </section>
  );
}

export default InfoPublik;

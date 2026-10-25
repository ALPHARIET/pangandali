import React from 'react';
import { AlertTriangle, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApi, fmtKg, fmtRp, fmtNum, fmtDate } from './helpers';
import { StatusBadge, Notice, PageHead, Empty } from './ui';
import './AdminTools.css';

// Palet kategorikal tervalidasi (urutan tetap, warna mengikuti komoditas, bukan peringkat).
const WARNA = {
  'Cabai Besar': '#2a78d6',
  Kubis: '#eb6834',
  Terung: '#1baf7a',
  Wortel: '#eda100',
  'Kembang Kol': '#e87ba4',
  Tomat: '#008300',
};
const LEVEL = {
  tinggi: { icon: AlertTriangle, label: 'Tinggi', cls: 'lv-high' },
  sedang: { icon: AlertCircle, label: 'Sedang', cls: 'lv-mid' },
  rendah: { icon: Info, label: 'Rendah', cls: 'lv-low' },
};

function TooltipTren({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const isi = payload.filter((p) => p.value > 0);
  return (
    <div className="chart-tip">
      <div className="chart-tip-title">{fmtDate(label)}</div>
      {isi.length === 0 ? <div>Tidak ada laporan</div> : isi.map((p) => (
        <div key={p.dataKey} className="chart-tip-row">
          <span className="chart-dot" style={{ background: p.color }} /> {p.dataKey}: <b>{fmtKg(p.value)}</b>
        </div>
      ))}
    </div>
  );
}

function StatusCount({ title, data }) {
  const rows = Object.entries(data || {});
  return (
    <div className="tool-card mini-card">
      <div className="sub-title">{title}</div>
      {rows.length === 0 ? <div className="text-muted">Belum ada data</div> : rows.map(([s, n]) => (
        <div key={s} className="count-row"><StatusBadge status={s} /><b>{n}</b></div>
      ))}
    </div>
  );
}

function PasokanPage() {
  const { data, error, reload, loading } = useApi('/api/dashboard/pasokan');
  const komoditas = Object.keys(WARNA);

  return (
    <div className="tool-page">
      <PageHead title="Pasokan & Peringatan" desc={data?.catatan}>
        <button type="button" className="btn btn-secondary" onClick={reload} disabled={loading}><RefreshCw size={16} /> Muat ulang</button>
      </PageHead>
      <Notice>{error}</Notice>
      {data && (
        <>
          <div className="tool-card">
            <div className="sub-title">Peringatan aktif ({data.peringatan.length})</div>
            {data.peringatan.length === 0 ? <Empty>Tidak ada peringatan pada ambang saat ini.</Empty> : (
              <ul className="alert-list">
                {data.peringatan.map((p, i) => {
                  const L = LEVEL[p.level] || LEVEL.rendah;
                  const Icon = L.icon;
                  return (
                    <li key={i} className={L.cls}>
                      <Icon size={16} /> <span className="lv-label">{L.label}</span> <span>{p.pesan}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="split">
            <div className="tool-card">
              <div className="sub-title">Laporan panen masuk 14 hari terakhir (kg diketahui)</div>
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={data.tren_laporan_kg} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#eef0f2" />
                    <XAxis dataKey="tanggal" tickFormatter={(v) => v.slice(8, 10) + '/' + v.slice(5, 7)} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={48} />
                    <Tooltip content={<TooltipTren />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                    {komoditas.map((k, i) => (
                      <Bar key={k} dataKey={k} stackId="a" fill={WARNA[k]} stroke="#fff" strokeWidth={2}
                        radius={i === komoditas.length - 1 ? [4, 4, 0, 0] : 0} maxBarSize={22} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="tool-card">
              <div className="sub-title">Stok tervalidasi tersedia</div>
              <div className="tbl-scroll">
                <table className="tbl compact">
                  <tbody>
                    {komoditas.map((k) => (
                      <tr key={k}>
                        <td><span className="chart-dot" style={{ background: WARNA[k] }} /> {k}</td>
                        <td className="num">{fmtKg(data.stok_tersedia_kg[k])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="tbl-sub">Hanya mencakup petani yang melapor lewat PanganDali.</div>
            </div>
          </div>

          <div className="tool-card">
            <div className="sub-title">Harga terbaru vs rata-rata 7 hari sebelumnya</div>
            {data.harga.length === 0 ? <Empty>Belum ada data harga.</Empty> : (
              <div className="tbl-scroll">
                <table className="tbl compact">
                  <thead><tr><th>Komoditas</th><th>Terbaru</th><th>Rata-rata 7 hari</th><th>Perubahan</th><th>Pasar / sumber</th></tr></thead>
                  <tbody>
                    {data.harga.map((h) => (
                      <tr key={h.komoditas}>
                        <td>{h.komoditas}</td>
                        <td>{fmtRp(h.terbaru)}<div className="tbl-sub">{fmtDate(h.tanggal)}</div></td>
                        <td>{fmtRp(h.rata_7_hari_sebelumnya)}</td>
                        <td>{h.perubahan_persen === null ? '—' : `${h.perubahan_persen > 0 ? '+' : ''}${fmtNum(h.perubahan_persen, '%')}`}</td>
                        <td>{h.pasar}<div className={`tbl-sub ${/contoh/i.test(h.sumber || '') ? 'warn-text' : ''}`}>{h.sumber || '—'}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid3">
            <StatusCount title="Laporan" data={data.status_laporan} />
            <StatusCount title="Pesanan" data={data.status_pesanan} />
            <StatusCount title="Pengiriman" data={data.status_pengiriman} />
          </div>
        </>
      )}
    </div>
  );
}

export default PasokanPage;

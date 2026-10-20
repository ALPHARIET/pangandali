import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useApi, fmtKg, fmtRp, fmtDate } from './helpers';
import { StatusBadge, Notice, PageHead, Empty } from './ui';
import './AdminTools.css';

const FILTER = [
  ['', 'Semua'],
  ['menunggu_petani', 'Menunggu petani'],
  ['menunggu_angkutan,dalam_pengiriman', 'Berjalan'],
  ['selesai', 'Selesai'],
  ['ditolak_petani,dibatalkan,kedaluwarsa', 'Gagal / batal'],
];

// Permintaan distributor atas stok tervalidasi (proposal: volume dikunci sementara, petani menerima/menolak).
function PesananPage() {
  const [filter, setFilter] = useState('');
  const { data, error, reload, loading } = useApi('/api/pesanan', { status: filter || undefined });

  return (
    <div className="tool-page">
      <PageHead
        title="Pesanan Distributor"
        desc="Permintaan pembelian atas stok tervalidasi. Volume dikunci sementara sampai petani menerima atau menolak; pesanan yang diterima diteruskan menjadi order angkutan. Pembayaran dilakukan antarpihak."
      >
        <button type="button" className="btn btn-secondary" onClick={reload} disabled={loading}><RefreshCw size={16} /> Muat ulang</button>
      </PageHead>
      <Notice>{error}</Notice>
      <div className="tool-chips">
        {FILTER.map(([v, l]) => (
          <button key={l} type="button" className={`tool-chip ${filter === v ? 'active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Pesanan</th><th>Komoditas</th><th>Distributor</th><th>Volume</th><th>Harga tawar</th><th>Status</th></tr>
          </thead>
          <tbody>
            {(data || []).map((p) => (
              <tr key={p.id}>
                <td>
                  <b>#{p.id}</b>
                  <div className="tbl-sub">{fmtDate(p.created_at, true)}</div>
                </td>
                <td>{p.komoditas || '—'}<div className="tbl-sub">Laporan #{p.laporan_id}</div></td>
                <td>{p.distributor_nama || '—'}<div className="tbl-sub">{p.tujuan}</div></td>
                <td>{fmtKg(p.jumlah_kg)}</td>
                <td>{p.harga_tawar_per_kg ? `${fmtRp(p.harga_tawar_per_kg)}/kg` : '—'}</td>
                <td>
                  <StatusBadge status={p.status} />
                  {p.status === 'menunggu_petani' && p.kunci_sampai && <div className="tbl-sub">Kunci sampai {fmtDate(p.kunci_sampai, true)}</div>}
                  {p.pengiriman_kode && <div className="tbl-sub">Order angkutan {p.pengiriman_kode}</div>}
                  {p.alasan_tolak && <div className="tbl-sub">Alasan: {p.alasan_tolak}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.length === 0 && <Empty>Belum ada pesanan{filter ? ' dengan status ini' : ''}. Distributor memesan lewat WhatsApp.</Empty>}
      </div>
    </div>
  );
}

export default PesananPage;

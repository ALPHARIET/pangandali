import React, { useState } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useApi, fmtKg, fmtNum } from './helpers';
import { StatusBadge, Notice, PageHead, Empty } from './ui';
import './AdminTools.css';

function Tile({ label, value, sub, n, target }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">
        {n !== undefined && <span>{n} data</span>}
        {target && <span> · target {target}</span>}
        {sub && <div>{sub}</div>}
      </div>
    </div>
  );
}

function EvaluasiDistribusi() {
  const [dari, setDari] = useState('');
  const [sampai, setSampai] = useState('');
  const { data, error, reload, loading } = useApi('/api/dampak/ringkasan', { dari: dari || undefined, sampai: sampai || undefined });

  return (
    <div className="tool-page">
      <PageHead
        title="Evaluasi Distribusi"
        desc="Pengukuran efisiensi dan susut dari data kiriman yang tercatat. Angka hanya dihitung dari data yang ada; data kurang ditandai. Semua angka adalah hasil uji, bukan klaim dampak."
      >
        <div className="tool-inline">
          <input type="date" value={dari} onChange={(e) => setDari(e.target.value)} aria-label="Dari tanggal" />
          <input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} aria-label="Sampai tanggal" />
          <button type="button" className="btn btn-secondary" onClick={reload} disabled={loading}><RefreshCw size={16} /></button>
        </div>
      </PageHead>
      <Notice>{error}</Notice>
      {data && (
        <>
          <div className="kpi-grid">
            <Tile label="Pengiriman selesai" value={fmtNum(data.pengiriman.selesai, '', 0)} sub={`${data.pengiriman.dalam_proses} dalam proses`} />
            <Tile
              label="Utilisasi muatan balik"
              value={data.utilisasi_muatan_balik.persen === null ? '—' : fmtNum(data.utilisasi_muatan_balik.persen, '%')}
              sub={`${data.utilisasi_muatan_balik.berisi_muatan} dari ${data.utilisasi_muatan_balik.perjalanan_balik} perjalanan balik`}
              target={`≥${data.utilisasi_muatan_balik.target_pilot_persen}%`}
            />
            <Tile label="Susut distribusi" value={data.susut.persen === null ? '—' : fmtNum(data.susut.persen, '%', 2)} n={data.susut.n_data}
              sub={`Ditolak mutu: ${fmtKg(data.susut.ditolak_mutu_kg)}`} />
            <Tile label="BBM bersih dihemat" value={data.bbm.hemat_bersih_liter === null ? '—' : fmtNum(data.bbm.hemat_bersih_liter, ' L')} n={data.bbm.n_data}
              sub={`Km dihemat: ${fmtNum(data.bbm.km_hemat, ' km')}`} />
            <Tile label="Rata-rata waktu tunggu" value={data.waktu.rata_tunggu_jam === null ? '—' : fmtNum(data.waktu.rata_tunggu_jam, ' jam')} n={data.waktu.n_tunggu} />
            <Tile label="Rata-rata waktu distribusi" value={data.waktu.rata_distribusi_jam === null ? '—' : fmtNum(data.waktu.rata_distribusi_jam, ' jam')} n={data.waktu.n_distribusi} />
          </div>
          <div className="tool-card note-card">
            <div><b>Skenario pembanding BBM:</b> {data.bbm.asumsi}</div>
            <div><b>Emisi:</b> belum dihitung. {data.emisi.alasan}</div>
            <div><b>Utilisasi:</b> {data.utilisasi_muatan_balik.catatan}</div>
            {data.data_belum_lengkap > 0 && (
              <div className="warn-text"><AlertTriangle size={14} /> {data.data_belum_lengkap} pengiriman selesai belum lengkap datanya dan tidak ikut di sebagian angka.</div>
            )}
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Kode</th><th>Status</th><th>Muat → diterima (+ditolak)</th><th>Susut</th><th>Km aktual / pembanding</th><th>BBM aktual / pembanding</th><th>Data kurang</th>
                </tr>
              </thead>
              <tbody>
                {data.rincian.map((r) => (
                  <tr key={r.kode}>
                    <td><b>{r.kode}</b><div className="tbl-sub">{r.komoditas} · {r.jenis_kendaraan || '—'}</div></td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>{fmtKg(r.berat_muat_kg)} → {fmtKg(r.berat_terima_kg)}{r.berat_ditolak_kg ? <div className="tbl-sub">ditolak {fmtKg(r.berat_ditolak_kg)} ({r.alasan_tolak_mutu || '-'})</div> : null}</td>
                    <td>{r.susut_persen === null ? '—' : fmtNum(r.susut_persen, '%', 2)}</td>
                    <td>{fmtNum(r.km_aktual, ' km')} / {fmtNum(r.km_pembanding, ' km')}<div className="tbl-sub">{r.km_aktual_sumber || ''}</div></td>
                    <td>{fmtNum(r.bbm_aktual_liter, ' L', 2)} / {fmtNum(r.bbm_pembanding_liter, ' L', 2)}<div className="tbl-sub">{r.bbm_aktual_sumber || ''}</div></td>
                    <td>{r.data_belum_lengkap.length ? <span className="warn-text">{r.data_belum_lengkap.join(', ')}</span> : <span className="ok-text">lengkap</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.rincian.length === 0 && <Empty>Belum ada pengiriman dengan armada pada periode ini.</Empty>}
          </div>
        </>
      )}
    </div>
  );
}

export default EvaluasiDistribusi;

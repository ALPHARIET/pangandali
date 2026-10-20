import React, { useEffect, useState } from 'react';
import { RefreshCw, Send, Save } from 'lucide-react';
import { api } from '../../api';
import { useApi, fmtKg, fmtNum, fmtDate } from './helpers';
import { StatusBadge, Notice, PageHead, Empty } from './ui';
import './AdminTools.css';

const FIELD_DAMPAK = [
  ['jenis_kendaraan', 'Jenis kendaraan', 'text'],
  ['berat_muat_kg', 'Berat muat (kg, bersih)', 'number'],
  ['berat_terima_kg', 'Berat diterima / lolos mutu (kg, bersih)', 'number'],
  ['berat_ditolak_kg', 'Ditolak mutu (kg)', 'number'],
  ['alasan_tolak_mutu', 'Alasan tolak mutu', 'text'],
  ['km_aktual', 'Km aktual (odometer)', 'number'],
  ['bbm_liter', 'BBM aktual (liter)', 'number'],
  ['waktu_muat', 'Waktu muat', 'datetime-local'],
  ['waktu_terima', 'Waktu terima', 'datetime-local'],
];

const toLocal = (iso) => {
  if (!iso) return '';
  const d = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

function Detail({ id, onChanged, setMsg }) {
  const { data, reload } = useApi(`/api/pengiriman/${id}`);
  const [f, setF] = useState({});
  useEffect(() => {
    if (!data) return;
    const k = data.pengiriman;
    setF(Object.fromEntries(FIELD_DAMPAK.map(([key, , type]) => [key, type === 'datetime-local' ? toLocal(k[key]) : k[key] ?? ''])));
  }, [data]);
  if (!data) return <div className="tool-card">Memuat...</div>;
  const k = data.pengiriman;
  const terbuka = ['menunggu_driver', 'perlu_admin'].includes(k.status);
  const adaAktif = data.penawaran.some((p) => p.status === 'ditawarkan');

  const aksi = async (path, body, pesan) => {
    try {
      await api(path, { method: 'POST', body });
      setMsg({ type: 'ok', text: pesan });
      reload();
      onChanged();
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    }
  };

  const simpanDampak = async (e) => {
    e.preventDefault();
    const body = {};
    FIELD_DAMPAK.forEach(([key, , type]) => {
      const v = f[key];
      if (v === '' || v === null) return;
      body[key] = type === 'number' ? Number(v) : type === 'datetime-local' ? new Date(v).toISOString() : v;
    });
    try {
      await api(`/api/pengiriman/${id}/dampak`, { method: 'PATCH', body });
      setMsg({ type: 'ok', text: `Data pengukuran ${k.kode} tersimpan (tercatat di audit log).` });
      reload();
      onChanged();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="tool-card detail-card">
      <div className="detail-head">
        <div>
          <div className="form-title">{k.kode} · {k.komoditas} {fmtKg(k.jumlah_kg)}</div>
          <div className="tbl-sub">{k.asal} → {k.tujuan} · jemput {fmtDate(k.jemput_mulai)} s.d. {fmtDate(k.jemput_sampai)}</div>
        </div>
        <StatusBadge status={k.status} />
      </div>

      <div className="sub-title">Riwayat penawaran ke armada</div>
      {data.penawaran.length === 0 ? <Empty>Belum ada penawaran.</Empty> : (
        <ol className="timeline">
          {data.penawaran.map((p) => (
            <li key={p.id}>
              <b>#{p.urutan}</b> {p.driver_nama || `driver ${p.driver_id}`} · skor {fmtNum(p.skor)} · tambahan {fmtNum(p.detail?.km_deviasi, ' km')}{' '}
              <StatusBadge status={p.status} /> {p.alasan && <span className="tbl-sub">"{p.alasan}"</span>}
              {p.detail?.ditawarkan_admin && <span className="tbl-sub"> (oleh petugas)</span>}
              {p.detail?.diambil_sendiri && <span className="tbl-sub"> (diambil sendiri oleh mitra)</span>}
            </li>
          ))}
        </ol>
      )}

      {terbuka && (
        <>
          <div className="sub-title">Kandidat layak (urut skor)</div>
          {data.kandidat.length === 0 ? <Empty>Tidak ada kandidat yang lolos syarat wajib.</Empty> : (
            <div className="tbl-scroll">
              <table className="tbl compact">
                <thead><tr><th>Mitra</th><th>Skor</th><th>Tambahan km</th><th>Isian</th><th>Keandalan</th><th /></tr></thead>
                <tbody>
                  {data.kandidat.map((c) => (
                    <tr key={`${c.driver_id}-${c.perjalanan_id}`}>
                      <td>{c.driver}</td>
                      <td>{fmtNum(c.skor)}</td>
                      <td>{c.km_deviasi === null ? <span className="text-muted">jarak belum diisi</span> : fmtNum(c.km_deviasi, ' km')}</td>
                      <td>{fmtNum(c.tingkat_isian * 100, '%', 0)}</td>
                      <td>{fmtNum(c.keandalan * 100, '%', 0)}</td>
                      <td>
                        <button type="button" className="mini-btn" disabled={adaAktif}
                          onClick={() => aksi(`/api/pengiriman/${id}/tawarkan`, { driver_id: c.driver_id, perjalanan_id: c.perjalanan_id }, `Order ditawarkan ke ${c.driver}.`)}>
                          <Send size={12} /> Tawarkan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {data.tersaring.length > 0 && (
            <details className="tbl-sub">
              <summary>{data.tersaring.length} kandidat tersaring</summary>
              <ul>{data.tersaring.map((t, i) => <li key={i}>driver {t.driver_id}: {t.alasan}</li>)}</ul>
            </details>
          )}
          <div className="tool-actions">
            <button type="button" className="btn btn-secondary" disabled={adaAktif}
              onClick={() => aksi(`/api/pengiriman/${id}/cocokkan`, undefined, 'Pencocokan ulang dijalankan.')}>
              <RefreshCw size={16} /> Cocokkan ulang otomatis
            </button>
          </div>
        </>
      )}

      <form className="form-grid" onSubmit={simpanDampak}>
        <div className="sub-title span2">Data pengukuran dampak (isi/koreksi manual)</div>
        {FIELD_DAMPAK.map(([key, label, type]) => (
          <label key={key}>{label}
            <input type={type} step={type === 'number' ? 'any' : undefined} min={type === 'number' ? 0 : undefined}
              value={f[key] ?? ''} onChange={(e) => setF({ ...f, [key]: e.target.value })} />
          </label>
        ))}
        <div className="tool-actions span2">
          <button type="submit" className="btn btn-primary"><Save size={16} /> Simpan data pengukuran</button>
        </div>
      </form>
    </div>
  );
}

function PengirimanPage() {
  const [filter, setFilter] = useState('');
  const [sel, setSel] = useState(null);
  const [msg, setMsg] = useState(null);
  const { data, error, reload } = useApi('/api/pengiriman', { status: filter || undefined });

  return (
    <div className="tool-page">
      <PageHead
        title="Pengiriman & Armada"
        desc="Order angkutan ditawarkan ke kandidat armada satu per satu sesuai skor (tambahan jarak, tingkat isian, keandalan). Rekomendasi baru menjadi penugasan setelah mitra menyetujui; order tanpa kandidat masuk ke petugas."
      />
      <Notice type={msg?.type}>{msg?.text}</Notice>
      <Notice>{error}</Notice>
      <div className="tool-chips">
        {[['', 'Semua'], ['perlu_admin', 'Perlu petugas'], ['menunggu_driver', 'Menunggu armada'], ['diambil,menuju_jemput,sampai_jemput,dimuat,dalam_perjalanan', 'Berjalan'], ['selesai', 'Selesai']].map(([v, l]) => (
          <button key={l} type="button" className={`tool-chip ${filter === v ? 'active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>
      <div className="split">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Kode</th><th>Komoditas</th><th>Rute</th><th>Armada</th><th>Status</th></tr></thead>
            <tbody>
              {(data || []).map((k) => (
                <tr key={k.id} className={`clickable ${sel === k.id ? 'selected' : ''}`} onClick={() => setSel(k.id)}>
                  <td><b>{k.kode}</b><div className="tbl-sub">{fmtDate(k.created_at, true)}</div></td>
                  <td>{k.komoditas}<div className="tbl-sub">{fmtKg(k.jumlah_kg)}</div></td>
                  <td>{k.asal}<div className="tbl-sub">→ {k.tujuan}</div></td>
                  <td>{k.driver_nama || '—'}<div className="tbl-sub">{k.km_deviasi !== null ? `+${fmtNum(k.km_deviasi, ' km')}` : ''}</div></td>
                  <td><StatusBadge status={k.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && data.length === 0 && <Empty>Belum ada pengiriman.</Empty>}
        </div>
        {sel && <Detail key={sel} id={sel} onChanged={reload} setMsg={setMsg} />}
      </div>
    </div>
  );
}

export default PengirimanPage;

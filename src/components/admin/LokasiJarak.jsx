import React, { useMemo, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { api } from '../../api';
import { useApi, fmtNum } from './helpers';
import { Notice, PageHead, Empty } from './ui';
import './AdminTools.css';

function LokasiJarak() {
  const lokasi = useApi('/api/admin/lokasi');
  const jarak = useApi('/api/admin/jarak');
  const [msg, setMsg] = useState(null);
  const [lok, setLok] = useState({ nama: '', jenis: 'desa', kecamatan: '', alias: '' });
  const [jr, setJr] = useState({ asal_id: '', tujuan_id: '', km: '', sumber: '' });
  const nama = useMemo(() => Object.fromEntries((lokasi.data || []).map((l) => [l.id, l.nama])), [lokasi.data]);

  const run = async (fn, ok) => {
    try {
      await fn();
      setMsg({ type: 'ok', text: ok });
      lokasi.reload();
      jarak.reload();
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    }
  };

  const tambahLokasi = (e) => {
    e.preventDefault();
    run(
      () => api('/api/admin/lokasi', {
        method: 'POST',
        body: { ...lok, kecamatan: lok.kecamatan || null, alias: lok.alias ? lok.alias.split(',').map((s) => s.trim()) : null },
      }),
      `Lokasi ${lok.nama} ditambahkan.`,
    ).then(() => setLok({ nama: '', jenis: 'desa', kecamatan: '', alias: '' }));
  };

  const simpanJarak = (e) => {
    e.preventDefault();
    run(
      () => api('/api/admin/jarak', { method: 'PUT', body: { asal_id: Number(jr.asal_id), tujuan_id: Number(jr.tujuan_id), km: Number(jr.km), sumber: jr.sumber || null } }),
      'Jarak tersimpan (berlaku dua arah).',
    );
  };

  return (
    <div className="tool-page">
      <PageHead
        title="Lokasi & Tabel Jarak"
        desc="Jarak jalan antar-lokasi (km) dipakai untuk menghitung tambahan jarak kandidat armada dan skenario pembanding BBM. Isi dari sumber yang bisa diverifikasi (odometer mitra, peta), dan catat sumbernya. Jarak yang belum diisi ditandai, bukan ditebak."
      />
      <Notice type={msg?.type}>{msg?.text}</Notice>
      <Notice>{lokasi.error || jarak.error}</Notice>
      <div className="split even">
        <form className="tool-card form-grid" onSubmit={tambahLokasi}>
          <div className="form-title span2">Tambah lokasi</div>
          <label>Nama<input required value={lok.nama} onChange={(e) => setLok({ ...lok, nama: e.target.value })} /></label>
          <label>Jenis
            <select value={lok.jenis} onChange={(e) => setLok({ ...lok, jenis: e.target.value })}>
              {['desa', 'kota', 'pasar', 'pangkalan'].map((j) => <option key={j}>{j}</option>)}
            </select>
          </label>
          <label>Kecamatan<input value={lok.kecamatan} onChange={(e) => setLok({ ...lok, kecamatan: e.target.value })} /></label>
          <label>Ejaan lain (pisah koma)<input value={lok.alias} onChange={(e) => setLok({ ...lok, alias: e.target.value })} /></label>
          <div className="tool-actions span2"><button type="submit" className="btn btn-primary"><Plus size={16} /> Tambah</button></div>
        </form>
        <form className="tool-card form-grid" onSubmit={simpanJarak}>
          <div className="form-title span2">Isi / ubah jarak</div>
          {['asal_id', 'tujuan_id'].map((k) => (
            <label key={k}>{k === 'asal_id' ? 'Dari' : 'Ke'}
              <select required value={jr[k]} onChange={(e) => setJr({ ...jr, [k]: e.target.value })}>
                <option value="">Pilih</option>
                {(lokasi.data || []).map((l) => <option key={l.id} value={l.id}>{l.nama}</option>)}
              </select>
            </label>
          ))}
          <label>Km<input required type="number" min="0.1" step="0.1" value={jr.km} onChange={(e) => setJr({ ...jr, km: e.target.value })} /></label>
          <label>Sumber<input value={jr.sumber} onChange={(e) => setJr({ ...jr, sumber: e.target.value })} placeholder="mis. odometer mitra" /></label>
          <div className="tool-actions span2"><button type="submit" className="btn btn-primary"><Save size={16} /> Simpan jarak</button></div>
        </form>
      </div>
      <div className="split even">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Lokasi</th><th>Jenis</th><th>Kecamatan</th><th /></tr></thead>
            <tbody>
              {(lokasi.data || []).map((l) => (
                <tr key={l.id}>
                  <td><b>{l.nama}</b>{l.alias && <div className="tbl-sub">{l.alias.join(', ')}</div>}</td>
                  <td>{l.jenis}</td>
                  <td>{l.kecamatan || '—'}</td>
                  <td>
                    <button type="button" className="mini-btn bad" title="Hapus"
                      onClick={() => window.confirm(`Hapus lokasi ${l.nama} beserta jaraknya?`) && run(() => api(`/api/admin/lokasi/${l.id}`, { method: 'DELETE' }), 'Lokasi dihapus.')}>
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {lokasi.data && lokasi.data.length === 0 && <Empty>Belum ada lokasi.</Empty>}
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Dari ↔ Ke</th><th>Km</th><th>Sumber</th><th /></tr></thead>
            <tbody>
              {(jarak.data || []).map((j) => (
                <tr key={j.id}>
                  <td>{nama[j.asal_id]} ↔ {nama[j.tujuan_id]}</td>
                  <td>{fmtNum(j.km)}</td>
                  <td className={/CONTOH/.test(j.sumber || '') ? 'warn-text' : ''}>{j.sumber || '—'}</td>
                  <td>
                    <button type="button" className="mini-btn bad" title="Hapus"
                      onClick={() => run(() => api(`/api/admin/jarak/${j.id}`, { method: 'DELETE' }), 'Jarak dihapus.')}>
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {jarak.data && jarak.data.length === 0 && <Empty>Belum ada jarak.</Empty>}
        </div>
      </div>
    </div>
  );
}

export default LokasiJarak;

import React, { useState } from 'react';
import { Check, X, Plus } from 'lucide-react';
import { api } from '../../api';
import { useApi, fmtKg, fmtRp, fmtDate } from './helpers';
import { StatusBadge, Notice, PageHead, Empty } from './ui';
import './AdminTools.css';

const KOMODITAS = ['Cabai Besar', 'Kubis', 'Terung', 'Wortel', 'Kembang Kol', 'Tomat'];
const SATUAN = ['kg', 'kwintal', 'ton', 'karung', 'pikul', 'ikat'];
const LOKAL = ['karung', 'pikul', 'ikat'];

function BarisValidasi({ lap, onDone, setMsg }) {
  const [kgPer, setKgPer] = useState('');
  const [catatan, setCatatan] = useState('');
  const [busy, setBusy] = useState(false);
  const butuhKg = lap.jumlah_kg === null && LOKAL.includes(lap.satuan);

  const kirim = async (setujui) => {
    if (!setujui && !catatan.trim()) {
      setMsg({ type: 'error', text: 'Isi catatan alasan penolakan; catatan dikirim ke petani.' });
      return;
    }
    setBusy(true);
    try {
      const body = { setujui, catatan: catatan || null };
      if (setujui && kgPer) body.kg_per_satuan = Number(kgPer);
      await api(`/api/laporan/${lap.id}/validasi`, { method: 'POST', body });
      setMsg({ type: 'ok', text: `Laporan #${lap.id} ${setujui ? 'disetujui dan petani dikabari' : 'ditolak'}.` });
      onDone();
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr>
      <td>#{lap.id}<div className="tbl-sub">{fmtDate(lap.created_at, true)}</div></td>
      <td>{lap.petani_nama || '—'}<div className="tbl-sub">{lap.petani_phone_masked}</div></td>
      <td>
        <b>{lap.komoditas}</b>
        <div className="tbl-sub">
          {lap.jumlah} {lap.satuan} · {lap.jumlah_kg !== null ? fmtKg(lap.jumlah_kg) : 'kg belum diketahui'}
        </div>
      </td>
      <td>{lap.desa || '—'}<div className="tbl-sub">panen {fmtDate(lap.tanggal_panen)}</div></td>
      <td>{fmtRp(lap.harga_harapan_per_kg)}</td>
      <td className="tbl-raw">{lap.teks_asli || <span className="text-muted">via agent</span>}</td>
      <td>
        <StatusBadge status={lap.status} />
        {['menunggu_validasi', 'perlu_review'].includes(lap.status) && (
          <div className="tbl-actions">
            {butuhKg && (
              <input
                type="number"
                min="0.1"
                step="0.1"
                placeholder={`kg per ${lap.satuan}`}
                value={kgPer}
                onChange={(e) => setKgPer(e.target.value)}
                title="Berat per satuan yang sudah dikonfirmasi dengan petani"
              />
            )}
            <input placeholder="Catatan (wajib bila tolak)" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
            <div className="tbl-btns">
              <button type="button" className="mini-btn ok" disabled={busy || (butuhKg && !kgPer)} onClick={() => kirim(true)}>
                <Check size={13} /> Setujui
              </button>
              <button type="button" className="mini-btn bad" disabled={busy} onClick={() => kirim(false)}>
                <X size={13} /> Tolak
              </button>
            </div>
          </div>
        )}
        {lap.catatan_validasi && <div className="tbl-sub">Catatan: {lap.catatan_validasi}</div>}
      </td>
    </tr>
  );
}

function InputManual({ onDone, setMsg }) {
  const petani = useApi('/api/admin/petani');
  const kosong = { petani_id: '', komoditas: 'Kubis', jumlah: '', satuan: 'kg', kg_per_satuan: '', desa: '', tanggal_panen: '', harga_harapan_per_kg: '', catatan: '' };
  const [f, setF] = useState(kosong);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const simpan = async (e) => {
    e.preventDefault();
    try {
      const body = { ...f, petani_id: Number(f.petani_id), jumlah: Number(f.jumlah) };
      ['kg_per_satuan', 'harga_harapan_per_kg'].forEach((k) => (body[k] = f[k] ? Number(f[k]) : null));
      ['desa', 'tanggal_panen', 'catatan'].forEach((k) => (body[k] = f[k] || null));
      const r = await api('/api/laporan', { method: 'POST', body });
      setMsg({ type: 'ok', text: `Laporan manual #${r.id} tersimpan dan masuk antrean validasi.` });
      setF(kosong);
      onDone();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  return (
    <form className="tool-card form-grid" onSubmit={simpan}>
      <div className="form-title">Input manual (kunjungan lapangan / telepon)</div>
      <label>Petani
        <select required value={f.petani_id} onChange={set('petani_id')}>
          <option value="">Pilih petani terdaftar</option>
          {(petani.data || []).filter((p) => p.is_active).map((p) => (
            <option key={p.id} value={p.id}>{p.name} · {p.desa || '-'}</option>
          ))}
        </select>
      </label>
      <label>Komoditas
        <select value={f.komoditas} onChange={set('komoditas')}>{KOMODITAS.map((k) => <option key={k}>{k}</option>)}</select>
      </label>
      <label>Jumlah<input required type="number" min="0.1" step="0.1" value={f.jumlah} onChange={set('jumlah')} /></label>
      <label>Satuan
        <select value={f.satuan} onChange={set('satuan')}>{SATUAN.map((s) => <option key={s}>{s}</option>)}</select>
      </label>
      {LOKAL.includes(f.satuan) && (
        <label>Kg per {f.satuan} (dari petani)<input type="number" min="0.1" step="0.1" value={f.kg_per_satuan} onChange={set('kg_per_satuan')} /></label>
      )}
      <label>Desa<input value={f.desa} onChange={set('desa')} placeholder="kosongkan = desa petani" /></label>
      <label>Tanggal panen<input type="date" value={f.tanggal_panen} onChange={set('tanggal_panen')} /></label>
      <label>Harga harapan (Rp/kg)<input type="number" min="100" value={f.harga_harapan_per_kg} onChange={set('harga_harapan_per_kg')} /></label>
      <label className="span2">Catatan<input value={f.catatan} onChange={set('catatan')} /></label>
      <div className="tool-actions span2">
        <button type="submit" className="btn btn-primary"><Plus size={16} /> Simpan laporan</button>
      </div>
    </form>
  );
}

function LaporanValidasi() {
  const [filter, setFilter] = useState('menunggu_validasi,perlu_review');
  const [msg, setMsg] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { data, error, reload } = useApi('/api/laporan', { status: filter || undefined });

  return (
    <div className="tool-page">
      <PageHead
        title="Validasi Laporan Panen"
        desc="Laporan yang sudah dikonfirmasi petani diperiksa kelengkapan dan kewajarannya di sini sebelum ditawarkan ke pembeli. Satuan lokal baru dihitung ke kg setelah beratnya dipastikan dengan petani."
      >
        <button type="button" className="btn btn-secondary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Input manual
        </button>
      </PageHead>
      <Notice type={msg?.type}>{msg?.text}</Notice>
      <Notice>{error}</Notice>
      {showForm && <InputManual onDone={reload} setMsg={setMsg} />}
      <div className="tool-chips">
        {[
          ['menunggu_validasi,perlu_review', 'Perlu diperiksa'],
          ['tersedia', 'Tersedia'],
          ['ditolak', 'Ditolak'],
          ['', 'Semua'],
        ].map(([v, l]) => (
          <button key={l} type="button" className={`tool-chip ${filter === v ? 'active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>ID</th><th>Petani</th><th>Komoditas & jumlah</th><th>Lokasi</th><th>Harga harapan</th><th>Pesan asli</th><th>Status / aksi</th></tr>
          </thead>
          <tbody>
            {(data || []).map((lap) => <BarisValidasi key={lap.id} lap={lap} onDone={reload} setMsg={setMsg} />)}
          </tbody>
        </table>
        {data && data.length === 0 && <Empty>Tidak ada laporan pada filter ini.</Empty>}
      </div>
    </div>
  );
}

export default LaporanValidasi;

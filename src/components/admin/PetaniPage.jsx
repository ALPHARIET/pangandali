import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { api } from '../../api';
import { useApi, fmtDate } from './helpers';
import { Notice, PageHead, Empty } from './ui';
import './AdminTools.css';

function PetaniPage() {
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState(null);
  const { data, error, reload } = useApi('/api/admin/petani', { q: q || undefined });
  const kosong = { phone: '', name: '', desa: '', kelompok_tani: '' };
  const [f, setF] = useState(kosong);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const daftar = async (e) => {
    e.preventDefault();
    try {
      const r = await api('/api/admin/petani', { method: 'POST', body: { ...f, desa: f.desa || null, kelompok_tani: f.kelompok_tani || null } });
      setMsg({ type: 'ok', text: `${r.name} terdaftar (+${r.phone}). Saat pertama chat, petani diminta menyetujui pemrosesan data.` });
      setF(kosong);
      reload();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const toggle = async (p) => {
    try {
      await api(`/api/admin/petani/${p.id}`, { method: 'PATCH', body: { is_active: !p.is_active } });
      reload();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="tool-page">
      <PageHead
        title="Petani Terdaftar"
        desc="Hanya nomor yang didaftarkan petugas, PPL, atau kelompok tani yang dilayani agent WhatsApp. Nomor lain dibalas sopan dan diarahkan ke petugas."
      />
      <Notice type={msg?.type}>{msg?.text}</Notice>
      <Notice>{error}</Notice>
      <form className="tool-card form-grid" onSubmit={daftar}>
        <div className="form-title">Daftarkan petani</div>
        <label>Nomor WhatsApp<input required value={f.phone} onChange={set('phone')} placeholder="0812..." /></label>
        <label>Nama<input required minLength={2} value={f.name} onChange={set('name')} /></label>
        <label>Desa<input value={f.desa} onChange={set('desa')} placeholder="mis. Lubuk Ubar" /></label>
        <label>Kelompok tani<input value={f.kelompok_tani} onChange={set('kelompok_tani')} /></label>
        <div className="tool-actions span2">
          <button type="submit" className="btn btn-primary"><UserPlus size={16} /> Daftarkan</button>
        </div>
      </form>
      <input className="tbl-search" placeholder="Cari nama, nomor, atau desa" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Nama</th><th>Nomor</th><th>Desa</th><th>Kelompok</th><th>Persetujuan data</th><th>Status</th></tr></thead>
          <tbody>
            {(data || []).map((p) => (
              <tr key={p.id}>
                <td><b>{p.name || '—'}</b></td>
                <td>+{p.phone}</td>
                <td>{p.desa || '—'}</td>
                <td>{p.kelompok_tani || '—'}</td>
                <td>{p.consent_at ? `Setuju ${fmtDate(p.consent_at)}` : <span className="text-muted">Belum</span>}</td>
                <td>
                  <button type="button" className={`mini-btn ${p.is_active ? 'ok' : ''}`} onClick={() => toggle(p)}>
                    {p.is_active ? 'Aktif' : 'Nonaktif'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.length === 0 && <Empty>Belum ada petani.</Empty>}
      </div>
    </div>
  );
}

export default PetaniPage;

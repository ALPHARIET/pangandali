import React, { useState } from 'react';
import { Check, RefreshCw, X } from 'lucide-react';
import { api } from '../../api';
import { useApi, fmtNum } from './helpers';
import { Notice, PageHead, Empty } from './ui';
import './AdminTools.css';

const PERAN = [
  ['', 'Semua'],
  ['driver', 'Mitra logistik'],
  ['distributor', 'Distributor'],
];
const STATUS = {
  belum: ['Belum diajukan', 'muted'],
  menunggu: ['Menunggu', 'warn'],
  disetujui: ['Disetujui', 'ok'],
  ditolak: ['Ditolak', 'bad'],
};

// Verifikasi akun mitra. Hanya akun "disetujui" yang dilayani agent WhatsApp dan ikut pencocokan armada.
function AkunMitra() {
  const [peran, setPeran] = useState('');
  const [msg, setMsg] = useState(null);
  const [sibuk, setSibuk] = useState(null);
  const { data, error, reload, loading } = useApi('/api/admin/users', { role: peran || undefined });
  const mitra = (data || []).filter((u) => u.role === 'driver' || u.role === 'distributor');
  const urut = [...mitra].sort((a, b) => (a.verification_status === 'disetujui') - (b.verification_status === 'disetujui'));

  const ubah = async (u, status) => {
    setSibuk(u.id);
    try {
      await api(`/api/admin/users/${u.id}/verification`, { method: 'PATCH', params: { status } });
      setMsg({ type: 'ok', text: `${u.name}: ${STATUS[status][0].toLowerCase()}.` });
      reload();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSibuk(null);
    }
  };

  return (
    <div className="tool-page">
      <PageHead
        title="Akun Mitra"
        desc="Setujui akun mitra logistik dan distributor setelah data dicek. Hanya akun yang disetujui yang bisa memakai agent WhatsApp dan masuk daftar kandidat armada."
      >
        <button type="button" className="btn btn-secondary" onClick={reload} disabled={loading}><RefreshCw size={16} /> Muat ulang</button>
      </PageHead>
      <Notice type={msg?.type}>{msg?.text}</Notice>
      <Notice>{error}</Notice>
      <div className="tool-chips">
        {PERAN.map(([v, l]) => (
          <button key={l} type="button" className={`tool-chip ${peran === v ? 'active' : ''}`} onClick={() => setPeran(v)}>{l}</button>
        ))}
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Nama</th><th>Peran</th><th>Kontak</th><th>Kendaraan / usaha</th><th>Status</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            {urut.map((u) => {
              const [label, tone] = STATUS[u.verification_status] || [u.verification_status, 'info'];
              return (
                <tr key={u.id}>
                  <td><b>{u.name}</b><div className="tbl-sub">{u.email}</div></td>
                  <td>{u.role === 'driver' ? 'Mitra logistik' : 'Distributor'}</td>
                  <td>{u.phone ? `+${u.phone}` : <span className="warn-text">Nomor WA belum diisi</span>}</td>
                  <td>
                    {u.role === 'driver' ? (
                      <>
                        {u.jenis_kendaraan || '—'}
                        <div className="tbl-sub">
                          {[u.plat_nomor, u.kapasitas_kg && `${fmtNum(u.kapasitas_kg, ' kg', 0)}`, u.lokasi].filter(Boolean).join(' · ') || 'Data kendaraan belum lengkap'}
                        </div>
                      </>
                    ) : (
                      u.nama_usaha || '—'
                    )}
                  </td>
                  <td><span className={`st-badge st-${tone}`}>{label}</span></td>
                  <td>
                    <div className="row-actions">
                      {u.verification_status !== 'disetujui' && (
                        <button type="button" className="mini-btn ok" disabled={sibuk === u.id} onClick={() => ubah(u, 'disetujui')}>
                          <Check size={14} /> Setujui
                        </button>
                      )}
                      {u.verification_status !== 'ditolak' && (
                        <button type="button" className="mini-btn bad" disabled={sibuk === u.id} onClick={() => ubah(u, 'ditolak')}>
                          <X size={14} /> {u.verification_status === 'disetujui' ? 'Cabut' : 'Tolak'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {data && urut.length === 0 && <Empty>Belum ada akun mitra. Mitra mendaftar lewat tombol Masuk → Daftar Akun.</Empty>}
      </div>
    </div>
  );
}

export default AkunMitra;

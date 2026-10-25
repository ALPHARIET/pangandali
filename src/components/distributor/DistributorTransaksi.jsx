// Panel kerja Distributor: stok tervalidasi, ajukan pembelian, pesanan saya, dan catat penerimaan.
// Semua aksi memakai /api/distributor/* yang menjalankan tools agent yang sama dengan WhatsApp.
import React, { useState } from 'react';
import { CheckCircle, Info, Package, RefreshCw, Store, Truck } from 'lucide-react';
import { api } from '../../api';
import { useApi, fmtKg, fmtRp, fmtDate } from '../admin/helpers';
import { ConfirmButton } from '../portal/PortalParts';

const STATUS = {
  menunggu_petani: ['Menunggu jawaban petani', 'warn'],
  menunggu_angkutan: ['Diterima petani, menunggu armada', 'warn'],
  dalam_pengiriman: ['Dalam pengiriman', 'warn'],
  selesai: ['Selesai', ''],
  ditolak_petani: ['Ditolak petani', 'bad'],
  dibatalkan: ['Dibatalkan', 'muted'],
  kedaluwarsa: ['Kedaluwarsa (petani tidak menjawab)', 'muted'],
};
const STATUS_KIRIM = {
  menunggu_driver: 'mencari armada',
  perlu_admin: 'ditangani petugas',
  diambil: 'armada ditetapkan',
  menuju_jemput: 'armada menuju jemput',
  sampai_jemput: 'armada di titik jemput',
  dimuat: 'sudah dimuat',
  dalam_perjalanan: 'dalam perjalanan',
  selesai: 'tiba',
};

function Pesan({ msg }) {
  if (!msg) return null;
  return msg.type === 'ok'
    ? <div className="p-note p-note--ok"><CheckCircle size={16} /><span>{msg.text}</span></div>
    : <div className="p-error" role="alert">{msg.text}</div>;
}

function Penerimaan({ kirim, onDone }) {
  const [f, setF] = useState({ berat_terima_kg: '', berat_ditolak_kg: '', alasan_tolak_mutu: '' });
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const simpan = async () => {
    try {
      const r = await api(`/api/distributor/pengiriman/${kirim.kode}/penerimaan`, {
        method: 'POST',
        body: {
          berat_terima_kg: Number(f.berat_terima_kg),
          berat_ditolak_kg: f.berat_ditolak_kg === '' ? null : Number(f.berat_ditolak_kg),
          alasan_tolak_mutu: f.alasan_tolak_mutu || null,
        },
      });
      setMsg({ type: 'ok', text: `Penerimaan tercatat. Susut ${r.susut_persen ?? '—'}%.` });
      onDone();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };
  return (
    <div className="p-form" style={{ marginTop: 4 }}>
      <div className="p-subtitle" style={{ marginTop: 0 }}>Catat penerimaan barang (berat bersih)</div>
      <div className="p-inline">
        <div className="p-field">
          <label className="p-label" htmlFor={`bt-${kirim.kode}`}>Diterima (kg)</label>
          <input id={`bt-${kirim.kode}`} type="number" inputMode="decimal" min="0" className="p-input" value={f.berat_terima_kg} onChange={set('berat_terima_kg')} />
        </div>
        <div className="p-field">
          <label className="p-label" htmlFor={`bd-${kirim.kode}`}>Ditolak mutu (kg)</label>
          <input id={`bd-${kirim.kode}`} type="number" inputMode="decimal" min="0" className="p-input" value={f.berat_ditolak_kg} onChange={set('berat_ditolak_kg')} />
        </div>
      </div>
      <div className="p-field">
        <label className="p-label" htmlFor={`al-${kirim.kode}`}>Alasan tolak mutu (bila ada)</label>
        <input id={`al-${kirim.kode}`} className="p-input" placeholder="mis. busuk, memar" value={f.alasan_tolak_mutu} onChange={set('alasan_tolak_mutu')} />
      </div>
      <Pesan msg={msg} />
      <ConfirmButton
        label="Simpan penerimaan"
        confirm={`Catat diterima ${f.berat_terima_kg || 0} kg?`}
        disabled={f.berat_terima_kg === ''}
        onConfirm={simpan}
      />
    </div>
  );
}

function DistributorTransaksi() {
  const [versi, setVersi] = useState(0);
  const segarkan = () => setVersi((v) => v + 1);
  const stok = useApi('/api/distributor/stok', { v: versi });
  const pesanan = useApi('/api/distributor/pesanan', { v: versi });
  const [f, setF] = useState({ laporan_id: '', jumlah_kg: '', harga_tawar_per_kg: '' });
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const pilihan = (stok.data || []).find((s) => String(s.laporan_id) === String(f.laporan_id));

  const ajukan = async () => {
    if (!pilihan || !Number(f.jumlah_kg)) {
      setMsg({ type: 'error', text: 'Pilih stok dan isi volume permintaan dulu.' });
      return;
    }
    try {
      const r = await api('/api/distributor/pesanan', {
        method: 'POST',
        body: { laporan_id: pilihan.laporan_id, jumlah_kg: Number(f.jumlah_kg), harga_tawar_per_kg: Number(f.harga_tawar_per_kg) || null },
      });
      setMsg({ type: 'ok', text: `Pesanan #${r.pesanan_id} terkirim. Volume dikunci sementara; petani diminta menjawab dalam ${r.menunggu_jawaban_petani_jam} jam.` });
      setF({ laporan_id: '', jumlah_kg: '', harga_tawar_per_kg: '' });
      segarkan();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const batal = async (p) => {
    try {
      await api(`/api/distributor/pesanan/${p.pesanan_id}/batal`, { method: 'POST' });
      segarkan();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const rowsStok = stok.data || [];
  const rowsPesanan = pesanan.data || [];
  return (
    <>
      <div className="portal-work portal-work--even">
        <div className="p-card">
          <div className="p-item__top">
            <h3 className="p-card__title"><Package size={18} /> Stok tervalidasi</h3>
            <button type="button" className="p-btn p-btn--ghost p-btn--sm" onClick={segarkan} aria-label="Muat ulang stok"><RefreshCw size={16} /></button>
          </div>
          <p className="p-card__sub">Dari laporan panen yang sudah divalidasi admin. Identitas petani tidak ditampilkan.</p>
          <Pesan msg={stok.error ? { type: 'error', text: stok.error } : null} />
          {rowsStok.length === 0 ? (
            <p className="p-hint" style={{ marginTop: 12 }}>Belum ada stok tervalidasi saat ini.</p>
          ) : (
            <table className="p-table">
              <thead>
                <tr><th>Komoditas</th><th>Sisa · desa</th><th className="num">Harga harapan</th></tr>
              </thead>
              <tbody>
                {rowsStok.map((s) => (
                  <tr key={s.laporan_id}>
                    <td>{s.komoditas}</td>
                    <td>{fmtKg(s.sisa_kg)} · {s.desa || '—'}{s.tanggal_panen ? `, panen ${fmtDate(s.tanggal_panen)}` : ''}</td>
                    <td className="num">{s.harga_harapan_petani_per_kg ? `${fmtRp(s.harga_harapan_petani_per_kg)}/kg` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-card p-card--accent" aria-live="polite">
          <h3 className="p-card__title"><Store size={18} /> Ajukan pembelian</h3>
          <div className="p-form">
            <div className="p-field">
              <label className="p-label" htmlFor="dst-stok">Stok</label>
              <select id="dst-stok" className="p-input" value={f.laporan_id} onChange={set('laporan_id')}>
                <option value="">Pilih stok</option>
                {rowsStok.map((s) => (
                  <option key={s.laporan_id} value={s.laporan_id}>{s.komoditas} · {s.desa || 'desa ?'} · sisa {fmtKg(s.sisa_kg)}</option>
                ))}
              </select>
            </div>
            <div className="p-form__row">
              <div className="p-field">
                <label className="p-label" htmlFor="dst-volume">Volume (kg)</label>
                <input id="dst-volume" type="number" inputMode="numeric" min="1" max={pilihan?.sisa_kg} className="p-input" value={f.jumlah_kg} onChange={set('jumlah_kg')} />
              </div>
              <div className="p-field">
                <label className="p-label" htmlFor="dst-harga">Harga tawar/kg (opsional)</label>
                <input id="dst-harga" type="number" inputMode="numeric" min="1" className="p-input" placeholder={pilihan?.harga_harapan_petani_per_kg || ''} value={f.harga_tawar_per_kg} onChange={set('harga_tawar_per_kg')} />
              </div>
            </div>
            <Pesan msg={msg} />
            <ConfirmButton
              label="Ajukan pembelian"
              confirm={pilihan ? `Pesan ${f.jumlah_kg || 0} kg ${pilihan.komoditas}?` : 'Ajukan pembelian?'}
              onConfirm={ajukan}
            />
            <div className="p-note p-note--info">
              <Info size={16} />
              <span>Pembayaran disepakati dan dilakukan langsung dengan petani. PanganDali hanya mencatat pesanan dan pengiriman.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-work-stack">
        <div className="p-card">
          <h3 className="p-card__title"><Truck size={18} /> Pesanan saya</h3>
          <Pesan msg={pesanan.error ? { type: 'error', text: pesanan.error } : null} />
          {rowsPesanan.length === 0 ? (
            <p className="p-hint" style={{ marginTop: 10 }}>Belum ada pesanan.</p>
          ) : (
            <div className="p-list">
              {rowsPesanan.map((p) => {
                const [label, tone] = STATUS[p.status] || [p.status, 'muted'];
                const k = p.pengiriman;
                return (
                  <div className="p-item" key={p.pesanan_id}>
                    <div className="p-item__top">
                      <strong>#{p.pesanan_id} · {fmtKg(p.jumlah_kg)} {p.komoditas}</strong>
                      <span className={`p-badge ${tone ? `p-badge--${tone}` : ''}`}>{label}</span>
                    </div>
                    <div className="p-item__meta">
                      <span>{p.desa || 'desa ?'} → {p.tujuan}</span>
                      {p.harga_tawar_per_kg && <span>tawar {fmtRp(p.harga_tawar_per_kg)}/kg</span>}
                      {p.status === 'menunggu_petani' && p.kunci_sampai && <span>dikunci s.d. {fmtDate(p.kunci_sampai, true)}</span>}
                      {p.alasan_tolak && <span>alasan: {p.alasan_tolak}</span>}
                    </div>
                    {k && (
                      <div className="p-item__meta">
                        <span><Truck size={14} /> {k.kode}: {STATUS_KIRIM[k.status] || k.status}{k.driver_nama ? ` · ${k.driver_nama}${k.plat_nomor ? ` (${k.plat_nomor})` : ''}` : ''}</span>
                        {k.berat_muat_kg != null && <span>muat {fmtKg(k.berat_muat_kg)}</span>}
                        {k.berat_terima_kg != null && <span>diterima {fmtKg(k.berat_terima_kg)}{k.berat_ditolak_kg ? `, ditolak ${fmtKg(k.berat_ditolak_kg)}` : ''}</span>}
                      </div>
                    )}
                    {p.bisa_batal && (
                      <div className="p-actions">
                        <ConfirmButton label="Batalkan pesanan" variant="ghost" confirm="Batalkan dan lepas kunci volume?" onConfirm={() => batal(p)} />
                      </div>
                    )}
                    {k?.bisa_catat_terima && <Penerimaan kirim={k} onDone={segarkan} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default DistributorTransaksi;

// Panel kerja Mitra Logistik: perjalanan, penawaran muatan, tugas pengiriman, dan muatan tanpa armada.
// Semua aksi memakai /api/driver/* yang menjalankan tools agent yang sama dengan WhatsApp.
import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle, Clock, Info, Package, RefreshCw, Route, Search, Truck } from 'lucide-react';
import { api } from '../../api';
import { useApi, fmtKg, fmtNum, fmtDate } from '../admin/helpers';
import { ConfirmButton } from '../portal/PortalParts';

const STATUS = {
  diambil: 'Armada ditetapkan',
  menuju_jemput: 'Menuju titik jemput',
  sampai_jemput: 'Di titik jemput',
  dimuat: 'Sudah dimuat',
  dalam_perjalanan: 'Dalam perjalanan',
  selesai: 'Selesai',
  aktif: 'Aktif',
  dibatalkan: 'Dibatalkan',
  penuh: 'Penuh',
};
const ALASAN = ['Kapasitas penuh', 'Jadwal tidak cocok', 'Kendaraan tidak sesuai komoditas', 'Lainnya'];

function Pesan({ msg }) {
  if (!msg) return null;
  return msg.type === 'ok'
    ? <div className="p-note p-note--ok"><CheckCircle size={16} /><span>{msg.text}</span></div>
    : <div className="p-error" role="alert">{msg.text}</div>;
}

function Perjalanan({ user, onChange, versi }) {
  const { data: lokasi } = useApi('/api/akun/lokasi');
  const { data, reload } = useApi('/api/driver/perjalanan', { v: versi });
  const besok = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
  const [f, setF] = useState({ asal: '', tujuan: '', tanggal: besok, kapasitas_kg: user.kapasitas_kg || '' });
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const umumkan = async () => {
    if (!f.asal || !f.tujuan) {
      setMsg({ type: 'error', text: 'Pilih asal dan tujuan perjalanan.' });
      return;
    }
    try {
      const r = await api('/api/driver/perjalanan', { method: 'POST', body: { ...f, kapasitas_kg: Number(f.kapasitas_kg) || null } });
      setMsg({ type: 'ok', text: r.order_dicocokkan_ulang ? `Perjalanan diumumkan. ${r.order_dicocokkan_ulang} order dicocokkan ulang dengan perjalanan ini.` : 'Perjalanan diumumkan. Penawaran muatan yang cocok akan muncul di sini dan di WhatsApp.' });
      reload();
      onChange();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const batal = async (p) => {
    try {
      await api(`/api/driver/perjalanan/${p.perjalanan_id}/batal`, { method: 'POST' });
      reload();
      onChange();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const aktif = (data || []).filter((p) => p.status === 'aktif');
  return (
    <div className="p-card">
      <h3 className="p-card__title"><Route size={18} /> Umumkan perjalanan</h3>
      <p className="p-card__sub">Biasanya perjalanan pulang yang masih punya ruang kosong.</p>
      <div className="p-form">
        <div className="p-form__row">
          <div className="p-field">
            <label className="p-label" htmlFor="pj-asal">Berangkat dari</label>
            <select id="pj-asal" className="p-input" value={f.asal} onChange={set('asal')}>
              <option value="">Pilih</option>
              {(lokasi || []).map((l) => <option key={l.id} value={l.nama}>{l.nama}</option>)}
            </select>
          </div>
          <div className="p-field">
            <label className="p-label" htmlFor="pj-tujuan">Tujuan</label>
            <select id="pj-tujuan" className="p-input" value={f.tujuan} onChange={set('tujuan')}>
              <option value="">Pilih</option>
              {(lokasi || []).map((l) => <option key={l.id} value={l.nama}>{l.nama}</option>)}
            </select>
          </div>
        </div>
        <div className="p-form__row">
          <div className="p-field">
            <label className="p-label" htmlFor="pj-tgl">Tanggal berangkat</label>
            <input id="pj-tgl" type="date" className="p-input" min={new Date().toISOString().slice(0, 10)} value={f.tanggal} onChange={set('tanggal')} />
          </div>
          <div className="p-field">
            <label className="p-label" htmlFor="pj-kap">Sisa kapasitas (kg)</label>
            <input id="pj-kap" type="number" inputMode="numeric" min="1" className="p-input" value={f.kapasitas_kg} onChange={set('kapasitas_kg')} />
          </div>
        </div>
        <Pesan msg={msg} />
        <ConfirmButton
          label="Umumkan perjalanan"
          confirm={`Umumkan ${f.asal || '…'} → ${f.tujuan || '…'}, ${f.tanggal}?`}
          onConfirm={umumkan}
        />
      </div>

      <div className="p-subtitle">Perjalanan aktif</div>
      {aktif.length === 0 ? (
        <p className="p-hint" style={{ marginTop: 6 }}>Belum ada perjalanan aktif.</p>
      ) : (
        <div className="p-list">
          {aktif.map((p) => (
            <div className="p-item" key={p.perjalanan_id}>
              <div className="p-item__top">
                <span className="p-item__route">{p.asal} → {p.tujuan}</span>
                <span className="p-badge">{STATUS[p.status] || p.status}</span>
              </div>
              <div className="p-item__meta">
                <span><Calendar size={14} /> {fmtDate(p.tanggal)}</span>
                <span><Package size={14} /> sisa {fmtKg(p.sisa_kapasitas_kg)}</span>
              </div>
              <div className="p-actions">
                <ConfirmButton label="Batalkan" variant="ghost" confirm="Batalkan perjalanan ini?" onConfirm={() => batal(p)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Penawaran({ versi, onChange }) {
  const { data, reload, loading, error } = useApi('/api/driver/penawaran', { v: versi });
  const [msg, setMsg] = useState(null);
  const [alasan, setAlasan] = useState({});

  useEffect(() => {
    const t = setInterval(reload, 30000);
    return () => clearInterval(t);
  }, [reload]);

  const aksi = async (p, jenis) => {
    try {
      const r = await api(`/api/driver/penawaran/${p.penawaran_id}/${jenis}`, {
        method: 'POST',
        body: jenis === 'tolak' ? { alasan: alasan[p.penawaran_id] || null } : undefined,
      });
      setMsg({ type: 'ok', text: jenis === 'terima' ? `Order ${r.kode || p.kode} sekarang jadi tugas Anda.` : 'Penawaran ditolak dan diteruskan ke armada lain.' });
      reload();
      onChange();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="p-card p-card--accent" aria-live="polite">
      <div className="p-item__top">
        <h3 className="p-card__title"><Package size={18} /> Penawaran muatan</h3>
        <button type="button" className="p-btn p-btn--ghost p-btn--sm" onClick={reload} disabled={loading} aria-label="Muat ulang penawaran">
          <RefreshCw size={16} />
        </button>
      </div>
      <p className="p-card__sub">Ditawarkan satu per satu sesuai skor. Belum jadi tugas sampai Anda menerima.</p>
      <Pesan msg={msg || (error ? { type: 'error', text: error } : null)} />
      {(data || []).length === 0 ? (
        <div className="p-empty">
          <div className="p-empty__icon"><Search size={24} /></div>
          <p>Belum ada penawaran. Umumkan perjalanan agar muatan yang searah bisa dicocokkan.</p>
        </div>
      ) : (
        <div className="p-list">
          {data.map((p) => (
            <div className="p-item" key={p.penawaran_id}>
              <div className="p-item__top">
                <span className="p-badge">Skor {fmtNum(p.skor, '', 2)}</span>
                <strong style={{ fontSize: 14 }}>{fmtKg(p.jumlah_kg)} {p.komoditas}</strong>
              </div>
              <div className="p-item__route">{p.jemput} → {p.antar}</div>
              <div className="p-item__meta">
                <span><Route size={14} /> tambahan {p.tambahan_km == null ? 'jarak belum tercatat' : fmtNum(p.tambahan_km, ' km')}</span>
                {p.jemput_sampai && <span><Calendar size={14} /> jemput s.d. {fmtDate(p.jemput_sampai)}</span>}
                {p.berlaku_sampai && <span><Clock size={14} /> jawab sebelum {fmtDate(p.berlaku_sampai, true)}</span>}
              </div>
              <div className="p-actions">
                <ConfirmButton label="Terima" confirm={`Terima ${p.kode}?`} onConfirm={() => aksi(p, 'terima')} />
                <select
                  className="p-input"
                  style={{ width: 'auto', minHeight: 38, fontSize: 14 }}
                  aria-label="Alasan menolak"
                  value={alasan[p.penawaran_id] || ''}
                  onChange={(e) => setAlasan({ ...alasan, [p.penawaran_id]: e.target.value })}
                >
                  <option value="">Alasan tolak (opsional)</option>
                  {ALASAN.map((a) => <option key={a}>{a}</option>)}
                </select>
                <ConfirmButton label="Tolak" variant="ghost" confirm="Tolak penawaran ini?" onConfirm={() => aksi(p, 'tolak')} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Tugas({ versi, onChange }) {
  const { data, reload } = useApi('/api/driver/tugas', { v: versi });
  const [isian, setIsian] = useState({});
  const [msg, setMsg] = useState(null);
  const ubah = (kode, k) => (e) => setIsian({ ...isian, [kode]: { ...(isian[kode] || {}), [k]: e.target.value } });

  const majukan = async (t) => {
    const berat = Number(isian[t.kode]?.berat_muat_kg) || null;
    try {
      const r = await api(`/api/driver/tugas/${t.kode}/status`, { method: 'POST', body: { status: t.status_berikut, berat_muat_kg: berat } });
      const kurang = r.data_dampak_belum_lengkap || [];
      setMsg({ type: 'ok', text: `${t.kode}: ${STATUS[r.status] || r.status}.${kurang.length ? ` Data belum lengkap: ${kurang.join(', ').replaceAll('_', ' ')}.` : ''}` });
      reload();
      onChange();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const simpanData = async (t) => {
    const v = isian[t.kode] || {};
    try {
      await api(`/api/driver/tugas/${t.kode}/data`, {
        method: 'POST',
        body: { km_aktual: Number(v.km_aktual) || null, bbm_liter: Number(v.bbm_liter) || null, berat_muat_kg: Number(v.berat_muat_kg) || null },
      });
      setMsg({ type: 'ok', text: `Data perjalanan ${t.kode} tersimpan.` });
      reload();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const rows = data || [];
  return (
    <div className="p-card">
      <h3 className="p-card__title"><Truck size={18} /> Tugas pengiriman</h3>
      <p className="p-card__sub">Perbarui status sesuai urutan. Berat, km, dan BBM dipakai untuk menghitung susut dan BBM bersih.</p>
      <Pesan msg={msg} />
      {rows.length === 0 ? (
        <p className="p-hint" style={{ marginTop: 10 }}>Belum ada tugas. Tugas muncul setelah Anda menerima penawaran atau mengambil muatan.</p>
      ) : (
        <div className="p-list">
          {rows.map((t) => {
            const perluBerat = t.status_berikut === 'dimuat';
            const bolehData = ['dimuat', 'dalam_perjalanan', 'selesai'].includes(t.status);
            return (
              <div className="p-item" key={t.kode}>
                <div className="p-item__top">
                  <strong>{t.kode} · {fmtKg(t.jumlah_kg)} {t.komoditas}</strong>
                  <span className={`p-badge ${t.status === 'selesai' ? '' : 'p-badge--warn'}`}>{STATUS[t.status] || t.status}</span>
                </div>
                <div className="p-item__route">{t.asal} → {t.tujuan}</div>
                <div className="p-item__meta">
                  {t.jemput_sampai && <span><Calendar size={14} /> jemput s.d. {fmtDate(t.jemput_sampai)}</span>}
                  <span><Package size={14} /> muat {fmtKg(t.berat_muat_kg)}</span>
                  <span><Route size={14} /> {t.km_aktual ? fmtNum(t.km_aktual, ' km') : 'km belum dicatat'}</span>
                  <span>BBM {t.bbm_liter ? fmtNum(t.bbm_liter, ' L') : 'belum dicatat'}</span>
                </div>
                {t.status_berikut && (
                  <div className="p-inline">
                    {perluBerat && (
                      <div className="p-field">
                        <label className="p-label" htmlFor={`bm-${t.kode}`}>Berat muat (kg)</label>
                        <input id={`bm-${t.kode}`} type="number" inputMode="decimal" className="p-input" value={isian[t.kode]?.berat_muat_kg || ''} onChange={ubah(t.kode, 'berat_muat_kg')} />
                      </div>
                    )}
                    <ConfirmButton label={`Tandai: ${STATUS[t.status_berikut]}`} confirm={`Ubah status ke "${STATUS[t.status_berikut]}"?`} onConfirm={() => majukan(t)} />
                  </div>
                )}
                {bolehData && (
                  <div className="p-inline">
                    <div className="p-field">
                      <label className="p-label" htmlFor={`km-${t.kode}`}>Km aktual</label>
                      <input id={`km-${t.kode}`} type="number" inputMode="decimal" className="p-input" placeholder={t.km_aktual || ''} value={isian[t.kode]?.km_aktual || ''} onChange={ubah(t.kode, 'km_aktual')} />
                    </div>
                    <div className="p-field">
                      <label className="p-label" htmlFor={`bbm-${t.kode}`}>BBM (liter)</label>
                      <input id={`bbm-${t.kode}`} type="number" inputMode="decimal" className="p-input" placeholder={t.bbm_liter || ''} value={isian[t.kode]?.bbm_liter || ''} onChange={ubah(t.kode, 'bbm_liter')} />
                    </div>
                    <ConfirmButton label="Simpan data" variant="ghost" confirm="Simpan km dan BBM?" onConfirm={() => simpanData(t)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MuatanTersedia({ versi, onChange }) {
  const { data, reload } = useApi('/api/driver/muatan', { v: versi });
  const [msg, setMsg] = useState(null);
  const ambil = async (m) => {
    try {
      await api(`/api/driver/muatan/${m.kode}/ambil`, { method: 'POST', params: { perjalanan_id: m.perjalanan_id } });
      setMsg({ type: 'ok', text: `${m.kode} sekarang jadi tugas Anda.` });
      reload();
      onChange();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };
  const rows = data?.muatan || [];
  return (
    <div className="p-card">
      <h3 className="p-card__title"><Search size={18} /> Muatan yang belum dapat armada</h3>
      <p className="p-card__sub">Order yang tidak sedang ditawarkan ke armada lain dan bisa Anda ambil sendiri.</p>
      <Pesan msg={msg} />
      {data?.catatan && <div className="p-note p-note--info" style={{ marginTop: 10 }}><Info size={16} /><span>{data.catatan}</span></div>}
      {rows.length === 0 ? (
        <p className="p-hint" style={{ marginTop: 10 }}>Tidak ada muatan terbuka saat ini.</p>
      ) : (
        <div className="p-list">
          {rows.map((m) => (
            <div className="p-item" key={m.kode}>
              <div className="p-item__top">
                <strong>{m.kode} · {fmtKg(m.jumlah_kg)} {m.komoditas}</strong>
                {m.skor_kecocokan != null && <span className="p-badge">Skor {fmtNum(m.skor_kecocokan, '', 2)}</span>}
              </div>
              <div className="p-item__route">{m.asal} → {m.tujuan}</div>
              <div className="p-item__meta">
                {m.jemput_paling_lambat && <span><Calendar size={14} /> jemput s.d. {fmtDate(m.jemput_paling_lambat)}</span>}
                <span><Route size={14} /> tambahan {m.tambahan_km == null ? 'jarak belum tercatat' : fmtNum(m.tambahan_km, ' km')}</span>
              </div>
              <div className="p-actions">
                <ConfirmButton label="Ambil muatan" confirm={`Ambil ${m.kode}?`} onConfirm={() => ambil(m)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DriverOperasional({ user }) {
  // Naikkan versi setelah aksi supaya panel lain ikut memuat ulang.
  const [versi, setVersi] = useState(0);
  const segarkan = () => setVersi((v) => v + 1);
  return (
    <>
      <div className="portal-work">
        <Perjalanan user={user} versi={versi} onChange={segarkan} />
        <Penawaran versi={versi} onChange={segarkan} />
      </div>
      <div className="p-work-stack">
        <Tugas versi={versi} onChange={segarkan} />
        <MuatanTersedia versi={versi} onChange={segarkan} />
      </div>
    </>
  );
}

export default DriverOperasional;

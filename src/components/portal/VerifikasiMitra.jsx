// Profil & status verifikasi mitra (supir/distributor) sebelum akun disetujui admin.
// Hanya data untuk kontak dan pencocokan armada yang diminta (minimisasi data, tanpa rekening/NPWP/foto dokumen).
import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, Info, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { api, me, sesiDari } from '../../api';
import { PortalBar } from './PortalParts';

const KOMODITAS = ['Cabai Besar', 'Kubis', 'Terung', 'Wortel', 'Kembang Kol', 'Tomat'];
const KENDARAAN = ['Pikap', 'Truk engkel', 'Truk engkel bak terbuka', 'Truk engkel boks', 'Truk tronton'];

function awal(user) {
  return {
    phone: user.phone ? `0${user.phone.slice(2)}` : '',
    jenis_kendaraan: user.jenis_kendaraan || '',
    plat_nomor: user.plat_nomor || '',
    kapasitas_kg: user.kapasitas_kg || '',
    km_per_liter: user.km_per_liter || '',
    lokasi: user.lokasi || '',
    komoditas_cocok: user.komoditas_cocok || [],
    nama_usaha: user.nama_usaha || '',
  };
}

function VerifikasiMitra({ user, onLogout, onUpdate }) {
  const driver = user.role === 'Driver';
  const [f, setF] = useState(() => awal(user));
  const [lokasi, setLokasi] = useState([]);
  const [ubah, setUbah] = useState(user.verification_status === 'belum');
  const [sibuk, setSibuk] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const status = user.verification_status;

  useEffect(() => {
    if (!driver) return;
    api('/api/akun/lokasi').then(setLokasi).catch(() => setLokasi([]));
  }, [driver]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggleKom = (k) =>
    setF({ ...f, komoditas_cocok: f.komoditas_cocok.includes(k) ? f.komoditas_cocok.filter((x) => x !== k) : [...f.komoditas_cocok, k] });

  const kirim = async (e) => {
    e.preventDefault();
    setError('');
    setSibuk(true);
    try {
      const body = driver
        ? {
            phone: f.phone,
            jenis_kendaraan: f.jenis_kendaraan,
            plat_nomor: f.plat_nomor,
            kapasitas_kg: Number(f.kapasitas_kg) || null,
            km_per_liter: Number(f.km_per_liter) || null,
            lokasi: f.lokasi || null,
            komoditas_cocok: f.komoditas_cocok,
          }
        : { phone: f.phone, nama_usaha: f.nama_usaha };
      const u = await api('/api/akun/profil', { method: 'POST', body });
      onUpdate(sesiDari(u));
      setUbah(false);
      setInfo('Data terkirim. Admin akan memeriksa dan menyetujui akun Anda.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSibuk(false);
    }
  };

  const cekStatus = async () => {
    setSibuk(true);
    setInfo('');
    try {
      const u = await me();
      onUpdate(u);
      if (u.verification_status === 'menunggu') setInfo('Masih menunggu pemeriksaan admin.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSibuk(false);
    }
  };

  return (
    <div className={`portal ${driver ? '' : 'portal--blue'}`}>
      <PortalBar role={driver ? 'Mitra Logistik' : 'Mitra Distributor'} user={user} links={[]} onLogout={onLogout} />
      <section className="portal-section">
        <div className="portal-wrap" style={{ maxWidth: 760 }}>
          <div className="portal-head">
            <span className="portal-eyebrow"><ShieldCheck size={14} /> Verifikasi akun</span>
            <h2>Lengkapi profil {driver ? 'mitra logistik' : 'distributor'}</h2>
            <p>
              Akun baru bisa dipakai setelah diperiksa admin. Data di bawah dipakai untuk menghubungi Anda lewat WhatsApp
              {driver ? ' dan mencocokkan muatan dengan kendaraan Anda' : ' dan mencatat pesanan Anda'}.
            </p>
          </div>

          {status === 'menunggu' && !ubah && (
            <div className="p-card p-card--accent">
              <div className="p-state">
                <Clock size={36} color="#d97706" />
                <h4>Menunggu pemeriksaan admin</h4>
                <p>Data Anda sudah terkirim. Halaman utama terbuka setelah akun disetujui.</p>
                <div className="portal-hero__actions" style={{ justifyContent: 'center' }}>
                  <button className="p-btn p-btn--primary p-btn--sm" onClick={cekStatus} disabled={sibuk}>
                    <RefreshCw size={16} /> Cek status
                  </button>
                  <button className="p-btn p-btn--ghost p-btn--sm" onClick={() => setUbah(true)}>Ubah data</button>
                </div>
              </div>
            </div>
          )}

          {status === 'ditolak' && !ubah && (
            <div className="p-card p-card--accent">
              <div className="p-state">
                <XCircle size={36} color="#dc2626" />
                <h4>Verifikasi belum disetujui</h4>
                <p>Periksa kembali data Anda atau hubungi petugas, lalu kirim ulang.</p>
                <button className="p-btn p-btn--primary p-btn--sm" onClick={() => setUbah(true)}>Perbaiki data</button>
              </div>
            </div>
          )}

          {info && <div className="p-note p-note--ok" style={{ marginTop: 12 }}><CheckCircle size={16} /><span>{info}</span></div>}

          {ubah && (
            <form className="p-card" onSubmit={kirim} noValidate>
              <div className="p-form" style={{ marginTop: 0 }}>
                <div className="p-field">
                  <label className="p-label" htmlFor="vm-phone">Nomor WhatsApp</label>
                  <input id="vm-phone" className="p-input" inputMode="tel" placeholder="0812..." value={f.phone} onChange={set('phone')} />
                  <span className="p-hint">Penawaran muatan dan kabar pesanan dikirim ke nomor ini.</span>
                </div>

                {driver ? (
                  <>
                    <div className="p-form__row">
                      <div className="p-field">
                        <label className="p-label" htmlFor="vm-jenis">Jenis kendaraan</label>
                        <select id="vm-jenis" className="p-input" value={f.jenis_kendaraan} onChange={set('jenis_kendaraan')}>
                          <option value="">Pilih</option>
                          {KENDARAAN.map((k) => <option key={k} value={k}>{k}</option>)}
                        </select>
                      </div>
                      <div className="p-field">
                        <label className="p-label" htmlFor="vm-plat">Plat nomor</label>
                        <input id="vm-plat" className="p-input" placeholder="BD 1234 XY" value={f.plat_nomor} onChange={set('plat_nomor')} />
                      </div>
                    </div>
                    <div className="p-form__row">
                      <div className="p-field">
                        <label className="p-label" htmlFor="vm-kap">Kapasitas angkut (kg)</label>
                        <input id="vm-kap" type="number" inputMode="numeric" min="1" className="p-input" placeholder="2000" value={f.kapasitas_kg} onChange={set('kapasitas_kg')} />
                      </div>
                      <div className="p-field">
                        <label className="p-label" htmlFor="vm-kml">Konsumsi BBM (km/liter, opsional)</label>
                        <input id="vm-kml" type="number" inputMode="decimal" min="1" className="p-input" placeholder="8" value={f.km_per_liter} onChange={set('km_per_liter')} />
                      </div>
                    </div>
                    <div className="p-field">
                      <label className="p-label" htmlFor="vm-lokasi">Lokasi pangkal</label>
                      <select id="vm-lokasi" className="p-input" value={f.lokasi} onChange={set('lokasi')}>
                        <option value="">Pilih</option>
                        {lokasi.map((l) => <option key={l.id} value={l.nama}>{l.nama}{l.kecamatan ? `, ${l.kecamatan}` : ''}</option>)}
                      </select>
                    </div>
                    <fieldset className="p-field">
                      <legend className="p-label">Komoditas yang layak diangkut kendaraan ini</legend>
                      <div className="p-checks">
                        {KOMODITAS.map((k) => (
                          <label key={k} className={`p-check ${f.komoditas_cocok.includes(k) ? 'on' : ''}`}>
                            <input type="checkbox" checked={f.komoditas_cocok.includes(k)} onChange={() => toggleKom(k)} /> {k}
                          </label>
                        ))}
                      </div>
                      <span className="p-hint">Kosongkan bila semua komoditas hortikultura bisa diangkut.</span>
                    </fieldset>
                  </>
                ) : (
                  <div className="p-field">
                    <label className="p-label" htmlFor="vm-usaha">Nama usaha</label>
                    <input id="vm-usaha" className="p-input" placeholder="UD / CV / toko" value={f.nama_usaha} onChange={set('nama_usaha')} />
                  </div>
                )}

                <div className="p-note p-note--info">
                  <Info size={16} />
                  <span>
                    Dokumen asli ({driver ? 'KTP, SIM, dan STNK' : 'KTP penanggung jawab dan NIB bila ada'}) cukup ditunjukkan ke petugas saat
                    verifikasi; tidak diunggah ke sistem. Data rekening atau NPWP tidak diminta.
                  </span>
                </div>
                {error && <div className="p-error" role="alert">{error}</div>}
                <button type="submit" className="p-btn p-btn--primary p-btn--block" disabled={sibuk}>Kirim untuk diverifikasi</button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

export default VerifikasiMitra;

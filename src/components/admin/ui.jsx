import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const STATUS_LABEL = {
  menunggu_validasi: 'Menunggu validasi',
  perlu_review: 'Perlu review (fallback)',
  tersedia: 'Tersedia',
  dipesan: 'Dipesan',
  diangkut: 'Diangkut',
  selesai: 'Selesai',
  dibatalkan: 'Dibatalkan',
  ditolak: 'Ditolak',
  menunggu_driver: 'Menunggu armada',
  perlu_admin: 'Perlu petugas',
  diambil: 'Armada ditetapkan',
  menuju_jemput: 'Menuju jemput',
  sampai_jemput: 'Di titik jemput',
  dimuat: 'Dimuat',
  dalam_perjalanan: 'Dalam perjalanan',
  ditawarkan: 'Ditawarkan',
  diterima: 'Diterima',
  kedaluwarsa: 'Kedaluwarsa',
  menunggu_petani: 'Menunggu petani',
  ditolak_petani: 'Ditolak petani',
  menunggu_angkutan: 'Menunggu angkutan',
  dalam_pengiriman: 'Dalam pengiriman',
  aktif: 'Aktif',
};
const STATUS_TONE = {
  tersedia: 'ok', selesai: 'ok', diterima: 'ok', diambil: 'ok', aktif: 'ok',
  menunggu_validasi: 'warn', menunggu_driver: 'warn', ditawarkan: 'warn', menunggu_petani: 'warn', menunggu_angkutan: 'warn',
  perlu_review: 'bad', perlu_admin: 'bad', ditolak: 'bad', ditolak_petani: 'bad', dibatalkan: 'muted', kedaluwarsa: 'muted',
};

export function StatusBadge({ status }) {
  return <span className={`st-badge st-${STATUS_TONE[status] || 'info'}`}>{STATUS_LABEL[status] || status}</span>;
}

export function Notice({ type = 'error', children }) {
  if (!children) return null;
  return (
    <div className={`tool-alert ${type === 'ok' ? 'tool-alert-ok' : 'tool-alert-error'}`}>
      {type === 'ok' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
      <span>{children}</span>
    </div>
  );
}

export function PageHead({ title, desc, children }) {
  return (
    <div className="tool-page-head">
      <div>
        <h2 className="tool-page-title">{title}</h2>
        {desc && <p className="tool-page-desc">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

export function Empty({ children }) {
  return <div className="tbl-empty">{children}</div>;
}

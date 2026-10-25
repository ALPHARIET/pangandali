import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api';

// Data dari API; reload() untuk memuat ulang setelah aksi.
export function useApi(path, params) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(params || {});
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api(path, { params: JSON.parse(key) }));
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [path, key]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { data, error, loading, reload, setError };
}

export const fmtKg = (v) => (v === null || v === undefined ? '—' : `${Number(v).toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg`);
export const fmtNum = (v, unit = '', digits = 1) =>
  v === null || v === undefined ? '—' : `${Number(v).toLocaleString('id-ID', { maximumFractionDigits: digits })}${unit}`;
export const fmtRp = (v) => (v ? `Rp${Number(v).toLocaleString('id-ID')}` : '—');

export function fmtDate(iso, withTime = false) {
  if (!iso) return '—';
  const d = new Date(/T/.test(iso) && !/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? `${iso}Z` : iso);
  return withTime
    ? d.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Wrapper fetch ke backend FastAPI + JWT.
// Saat dev, Vite mem-proxy /api ke http://localhost:8000 (lihat vite.config.js).
// Untuk build terpisah dari API, set VITE_API_BASE_URL.
const BASE = import.meta.env.VITE_API_BASE_URL || '';
const TOKEN_KEY = 'pangandali_token';

export const getToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage diblokir: token hanya hidup di memori tab ini */
  }
};

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = 'GET', body, params } = {}) {
  const url = new URL(`${BASE}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });
  }
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(0, 'Tidak bisa terhubung ke server PanganDali. Pastikan backend berjalan.');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = data?.detail;
    const msg = Array.isArray(detail) ? detail.map((d) => d.msg).join(', ') : detail || `HTTP ${res.status}`;
    throw new ApiError(res.status, msg);
  }
  return data;
}

// Peran dari API → label peran yang dipakai komponen lama.
export const ROLE_LABEL = { admin: 'Admin', tpid: 'TPID', driver: 'Driver', distributor: 'Distributor' };

// Pengguna dalam bentuk yang dipakai komponen (role berlabel, apiRole asli dari server).
export const sesiDari = (u) => ({ ...u, apiRole: u.role, role: ROLE_LABEL[u.role] || u.role });

export async function login(email, password) {
  const data = await api('/api/auth/login', { method: 'POST', body: { email, password } });
  setToken(data.access_token);
  return sesiDari(data.user);
}

export async function me() {
  return sesiDari(await api('/api/auth/me'));
}

export function logout() {
  setToken(null);
}

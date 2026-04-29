const API_BASE = import.meta.env.VITE_API_URL || 'https://vanigan-whatsapp-n2c1.onrender.com';

export const API = `${API_BASE}/api/admin`;
export const API_BASE_URL = API_BASE;

export function getToken() {
  return localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
}

export function setToken(token) {
  localStorage.setItem('admin_token', token);
}

export function clearToken() {
  localStorage.removeItem('admin_token');
  sessionStorage.removeItem('admin_token');
}

export function isLoggedIn() {
  return !!getToken();
}

export async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    window.location.href = '/admin/login';
    throw new Error('Unauthorized');
  }
  return res;
}

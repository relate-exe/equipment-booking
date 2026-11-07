const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'equipment_booking_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.fields = data.errors || [];
    throw err;
  }
  return data;
}

export const api = {
  register: (b) => request('/auth/register', { method: 'POST', body: b }),
  login: (b) => request('/auth/login', { method: 'POST', body: b }),
  me: () => request('/auth/me'),
  listEquipment: () => request('/equipment'),
  createEquipment: (b) => request('/equipment', { method: 'POST', body: b }),
  updateEquipment: (id, b) => request(`/equipment/${id}`, { method: 'PUT', body: b }),
  removeEquipment: (id) => request(`/equipment/${id}`, { method: 'DELETE' }),
  listBookings: (q = '') => request(`/bookings${q}`),
  createBooking: (b) => request('/bookings', { method: 'POST', body: b }),
  cancelBooking: (id) => request(`/bookings/${id}/cancel`, { method: 'PATCH', body: {} }),
  returnBooking: (id, b) => request(`/bookings/${id}/return`, { method: 'PATCH', body: b }),
};

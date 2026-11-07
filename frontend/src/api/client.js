const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const token = localStorage.getItem('token');
  const headers = {
    ...(options.headers || {})
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Do not set Content-Type if sending FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || `Terjadi kesalahan (HTTP ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Public
  submitIllegalReport: (formData) => request('/public/reports', { method: 'POST', body: formData }),
  lookupTicket: (code) => request(`/public/reports/ticket/${encodeURIComponent(code)}`),
  getMapReports: (kota) => request(`/public/reports/map${kota ? `?kota=${encodeURIComponent(kota)}` : ''}`),

  // Waste Bank (Warga)
  getCategories: () => request('/warga/categories'),
  getKatalog: () => request('/warga/katalog'),
  redeemReward: (id_katalog) => request('/warga/katalog/redeem', { method: 'POST', body: JSON.stringify({ id_katalog }) }),
  submitWasteTransaction: (formData) => request('/warga/transactions', { method: 'POST', body: formData }),
  getMyTransactions: () => request('/warga/transactions'),
  getPointsHistory: () => request('/warga/points'),

  // Partner (Mitra)
  getMitraReports: (params = '') => request(`/mitra/reports${params}`),
  submitCleanupAction: (id, formData) => request(`/mitra/reports/${id}/action`, { method: 'POST', body: formData }),
  getWastePickups: (params = '') => request(`/mitra/pickups${params}`),
  completePickup: (id, payload) => request(`/mitra/transactions/${id}/complete`, { method: 'PUT', body: JSON.stringify(payload) }),

  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/auth/me'),

  // Admin
  getUsers: (params = '') => request(`/admin/users${params}`),
  updateUserStatus: (id, status) => request(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getStats: () => request('/admin/stats'),
  getAdminKatalog: () => request('/admin/katalog'),
  createAdminKatalog: (payload) => request('/admin/katalog', { method: 'POST', body: JSON.stringify(payload) }),
  updateAdminKatalog: (id, payload) => request(`/admin/katalog/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  toggleAdminKatalogStatus: (id) => request(`/admin/katalog/${id}/toggle`, { method: 'PATCH' }),
  deleteAdminKatalog: (id) => request(`/admin/katalog/${id}`, { method: 'DELETE' })
};

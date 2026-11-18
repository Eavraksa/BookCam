import { auth } from '../firebase';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Sends the signed-in user's Firebase ID token so the Express API can verify identity and role.
async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const user = auth.currentUser;
  if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?');
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const booksApi = {
  list: (params = '') => request(`/books${params}`),
  get: (id) => request(`/books/${id}`),
  create: (data) => request('/books', { method: 'POST', body: data }),
  update: (id, data) => request(`/books/${id}`, { method: 'PUT', body: data }),
  remove: (id) => request(`/books/${id}`, { method: 'DELETE' }),
};

export const categoriesApi = {
  list: () => request('/categories'),
  create: (data) => request('/categories', { method: 'POST', body: data }),
  update: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: data }),
  remove: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
};

export const ordersApi = {
  create: (data) => request('/orders', { method: 'POST', body: data }),
  mine: () => request('/orders'),
  all: () => request('/orders/admin/all'),
  cancel: (id) => request(`/orders/${id}/cancel`, { method: 'POST' }),
  setStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PATCH', body: { status } }),
  remove: (id) => request(`/orders/${id}`, { method: 'DELETE' }),
};

export const usersApi = {
  list: () => request('/users'),
  setRole: (uid, role) => request(`/users/${uid}/role`, { method: 'PATCH', body: { role } }),
  remove: (uid) => request(`/users/${uid}`, { method: 'DELETE' }),
};

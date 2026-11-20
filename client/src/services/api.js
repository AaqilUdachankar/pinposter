import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pinposter_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        localStorage.removeItem('pinposter_token');
        localStorage.removeItem('pinposter_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  deleteAccount: (data) => api.delete('/auth/delete-account', { data }),
};

// Products API
export const productsApi = {
  extract: (url) => api.post('/products/extract', { url }),
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  update: (id, data) => api.put(`/products/${id}`, data),
};

// Campaigns API
export const campaignsApi = {
  create: (data) => api.post('/campaigns', data),
  getAll: (params) => api.get('/campaigns', { params }),
  getById: (id) => api.get(`/campaigns/${id}`),
  getJob: (id) => api.get(`/campaigns/${id}/job`),
  delete: (id) => api.delete(`/campaigns/${id}`),
};

// Pins API
export const pinsApi = {
  getAll: (params) => api.get('/pins', { params }),
  getById: (id) => api.get(`/pins/${id}`),
  update: (id, data) => api.put(`/pins/${id}`, data),
  publish: (id, data) => api.post(`/pins/${id}/publish`, data),
  logMetrics: (id, data) => api.post(`/pins/${id}/metrics`, data),
  reschedule: (id, scheduledAt) => api.post(`/pins/${id}/reschedule`, { scheduledAt }),
  pause: (id) => api.post(`/pins/${id}/pause`),
  resume: (id) => api.post(`/pins/${id}/resume`),
  cancel: (id) => api.post(`/pins/${id}/cancel`),
  regenerateImage: (id) => api.post(`/pins/${id}/regenerate-image`),
  duplicate: (id) => api.post(`/pins/${id}/duplicate`),
  bulk: (data) => api.post('/pins/bulk', data),
};

// Boards API
export const boardsApi = {
  getAll: () => api.get('/boards'),
  create: (data) => api.post('/boards', data),
  update: (id, data) => api.put(`/boards/${id}`, data),
  delete: (id) => api.delete(`/boards/${id}`),
};

// Queue & Schedules API
export const queueApi = {
  getQueue: (params) => api.get('/queue', { params }),
  getNextSlot: () => api.get('/queue/next-slot'),
  getScheduleSlots: (params) => api.get('/schedules', { params }),
  triggerCheck: () => api.post('/schedules/check'),
};

// Analytics API
export const analyticsApi = {
  getDashboard: (params) => api.get('/analytics', { params }),
};

// API Configurations API
export const apiConfigApi = {
  getAll: () => api.get('/api-configurations'),
  save: (data) => api.post('/api-configurations', data),
  test: (data) => api.post('/api-configurations/test', data),
  delete: (id) => api.delete(`/api-configurations/${id}`),
};

// Notifications API
export const notificationsApi = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  clearAll: () => api.delete('/notifications/clear-all'),
};

// Activity API
export const activityApi = {
  getAll: (params) => api.get('/activity', { params }),
};

// Auto-Publish API (Pinterest RSS Feed & Make.com Automation)
export const feedApi = {
  getSettings: () => api.get('/feed/settings'),
  saveSettings: (data) => api.put('/feed/settings', data),
  regenerateToken: () => api.post('/feed/regenerate-token'),
  testWebhook: (data) => api.post('/feed/test-webhook', data),
  dispatchPinToMake: (pinId) => api.post(`/feed/dispatch/${pinId}`),
};

export default api;

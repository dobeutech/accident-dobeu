import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true, // Enable cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

let csrfToken = null;

// Fetch CSRF token on app init
export const initCsrfToken = async () => {
  try {
    const response = await api.get('/csrf-token');
    csrfToken = response.data.csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
  }
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add CSRF token for state-changing operations
    if (csrfToken && ['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase())) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Store current path for redirect after login
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        sessionStorage.setItem('redirect_after_login', currentPath);
      }
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    // Refresh CSRF token after login
    await initCsrfToken();
    return response;
  },
  logout: async () => {
    await api.post('/auth/logout');
    csrfToken = null;
  },
  getCurrentUser: () => api.get('/auth/me')
};

export const reportService = {
  getAll: (params) => api.get('/reports', { params }),
  getById: (id) => api.get(`/reports/${id}`),
  update: (id, data) => api.put(`/reports/${id}`, data),
  delete: (id) => api.delete(`/reports/${id}`)
};

export const formConfigService = {
  getAll: () => api.get('/form-configs'),
  create: (data) => api.post('/form-configs', data),
  update: (id, data) => api.put(`/form-configs/${id}`, data),
  delete: (id) => api.delete(`/form-configs/${id}`)
};

export const userService = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`)
};

export const exportService = {
  exportReports: (format, reportIds) => {
    const params = new URLSearchParams({ format });
    if (reportIds && reportIds.length > 0) {
      params.append('report_ids', reportIds.join(','));
    }
    return api.get(`/exports/reports?${params.toString()}`, {
      responseType: 'blob'
    });
  }
};

export default api;


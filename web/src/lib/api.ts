import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Functions
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  me: () => api.get('/auth/me'),
};

export const reportsApi = {
  getAll: (params?: Record<string, any>) =>
    api.get('/reports', { params }),
  
  getById: (id: string) =>
    api.get(`/reports/${id}`),
  
  create: (data: any) =>
    api.post('/reports', data),
  
  update: (id: string, data: any) =>
    api.put(`/reports/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/reports/${id}`),
};

export const usersApi = {
  getAll: () => api.get('/users'),
  
  getById: (id: string) => api.get(`/users/${id}`),
  
  create: (data: any) => api.post('/users', data),
  
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const formConfigsApi = {
  getAll: () => api.get('/form-configs'),
  
  create: (data: any) => api.post('/form-configs', data),
  
  update: (id: string, data: any) => api.put(`/form-configs/${id}`, data),
  
  delete: (id: string) => api.delete(`/form-configs/${id}`),
};

export const exportsApi = {
  exportReports: (format: string, reportIds?: string[]) =>
    api.get('/exports/reports', {
      params: { format, report_ids: reportIds?.join(',') },
      responseType: 'blob',
    }),
};

export const fleetsApi = {
  getAll: () => api.get('/fleets'),
  
  getById: (id: string) => api.get(`/fleets/${id}`),
  
  create: (data: any) => api.post('/fleets', data),
  
  update: (id: string, data: any) => api.put(`/fleets/${id}`, data),
};

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  
  getUsers: () => api.get('/admin/users'),
  
  getAuditLogs: (params?: Record<string, any>) =>
    api.get('/admin/audit-logs', { params }),
};

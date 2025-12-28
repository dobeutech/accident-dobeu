import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
    }
    return Promise.reject(error);
  }
);

export const authService = {
  setToken: (token) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  },
  
  login: (email, password) => {
    return api.post('/auth/login', { email, password });
  },
  
  register: (userData) => {
    return api.post('/auth/register', userData);
  },
  
  getCurrentUser: () => {
    return api.get('/auth/me');
  }
};

export const reportService = {
  getAll: (params = {}) => {
    return api.get('/reports', { params });
  },
  
  getById: (id) => {
    return api.get(`/reports/${id}`);
  },
  
  create: (reportData) => {
    return api.post('/reports', reportData);
  },
  
  update: (id, reportData) => {
    return api.put(`/reports/${id}`, reportData);
  },
  
  delete: (id) => {
    return api.delete(`/reports/${id}`);
  }
};

export const formConfigService = {
  getAll: () => {
    return api.get('/form-configs');
  }
};

export const uploadService = {
  uploadPhoto: (reportId, photoUri, onProgress) => {
    const formData = new FormData();
    formData.append('photo', {
      uri: photoUri,
      type: 'image/jpeg',
      name: `photo-${Date.now()}.jpg`
    });
    
    return api.post(`/uploads/photos/${reportId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      }
    });
  },
  
  uploadAudio: (reportId, audioUri) => {
    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      type: 'audio/m4a',
      name: `audio-${Date.now()}.m4a`
    });
    
    return api.post(`/uploads/audio/${reportId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

export default api;


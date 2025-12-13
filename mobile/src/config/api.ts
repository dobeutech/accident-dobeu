// API Configuration
// In production, this would come from environment variables or a config file

export const API_CONFIG = {
  // Base URL for the backend API
  // Change this to your actual backend URL
  BASE_URL: __DEV__ 
    ? 'http://localhost:3000/api' 
    : 'https://api.yourfleetapp.com/api',
  
  // WebSocket URL for real-time features
  WS_URL: __DEV__
    ? 'http://localhost:3000'
    : 'https://api.yourfleetapp.com',
  
  // Request timeout in milliseconds
  TIMEOUT: 30000,
  
  // Maximum file size for uploads (10MB)
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  
  // Supported image formats
  SUPPORTED_IMAGE_FORMATS: ['image/jpeg', 'image/png', 'image/heic', 'image/heif'],
  
  // Supported audio formats
  SUPPORTED_AUDIO_FORMATS: ['audio/m4a', 'audio/mp3', 'audio/wav', 'audio/aac'],
};

// API Endpoints
export const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  ME: '/auth/me',
  REFRESH: '/auth/refresh',
  
  // Reports
  REPORTS: '/reports',
  REPORT: (id: string) => `/reports/${id}`,
  
  // Form Configs
  FORM_CONFIGS: '/form-configs',
  
  // Uploads
  UPLOAD_PHOTO: (reportId: string) => `/uploads/photos/${reportId}`,
  UPLOAD_AUDIO: (reportId: string) => `/uploads/audio/${reportId}`,
  SIGNED_URL: (fileKey: string) => `/uploads/signed-url/${encodeURIComponent(fileKey)}`,
  
  // Fleets
  FLEETS: '/fleets',
  FLEET: (id: string) => `/fleets/${id}`,
  
  // Users
  USERS: '/users',
  USER: (id: string) => `/users/${id}`,
  
  // Exports
  EXPORTS: '/exports/reports',
};

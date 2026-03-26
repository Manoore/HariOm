import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('divine_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      // Only clear auth on explicit auth endpoints, NOT on data endpoints
      // New users may hit 401 on data endpoints briefly during auth setup
      if (url.includes('/auth/me') || url.includes('/auth/login')) {
        console.log('Auth error on auth route, clearing session');
        localStorage.removeItem('divine_token');
        localStorage.removeItem('divine_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

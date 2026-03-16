import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// API Base URL - Production Cloud Run backend
const API_BASE_URL = 'https://divine-backend-149993395431.asia-south1.run.app';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let authToken = null;

export const setAuthToken = async (token) => {
  authToken = token;
  if (token) {
    await SecureStore.setItemAsync('authToken', token);
  } else {
    await SecureStore.deleteItemAsync('authToken');
  }
};

export const getAuthToken = async () => {
  if (!authToken) {
    authToken = await SecureStore.getItemAsync('authToken');
  }
  return authToken;
};

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
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
      // Token expired, clear token
      await setAuthToken(null);
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (userData) => api.post('/api/auth/register', userData),
  firebaseSync: (userData) => api.post('/api/auth/firebase-sync', userData),
  getProfile: () => api.get('/api/users/profile'),
  updateProfile: (data) => api.put('/api/users/profile', data),
};

// Priest APIs
export const priestAPI = {
  getAll: (params) => api.get('/api/priests', { params }),
  getById: (id) => api.get(`/api/priests/${id}`),
  getAvailability: (id) => api.get(`/api/priests/${id}/availability`),
  book: (priestId, data) => api.post(`/api/priests/${priestId}/book`, data),
};

// Product APIs
export const productAPI = {
  getAll: (params) => api.get('/api/products', { params }),
  getById: (id) => api.get(`/api/products/${id}`),
  getCategories: () => api.get('/api/products/categories'),
  getReviews: (id) => api.get(`/api/products/${id}/reviews`),
};

// Cart APIs
export const cartAPI = {
  get: () => api.get('/api/cart'),
  add: (productId, quantity) => api.post('/api/cart/add', { product_id: productId, quantity }),
  update: (productId, quantity) => api.put('/api/cart/update', { product_id: productId, quantity }),
  remove: (productId) => api.delete(`/api/cart/remove/${productId}`),
  clear: () => api.delete('/api/cart/clear'),
};

// Order APIs
export const orderAPI = {
  create: (data) => api.post('/api/orders', data),
  getAll: () => api.get('/api/orders'),
  getById: (id) => api.get(`/api/orders/${id}`),
  createPayment: (data) => api.post('/api/payments/create-checkout', data),
};

// Astrology APIs
export const astrologyAPI = {
  getDailyHoroscope: (sign) => api.get(`/api/horoscope/daily/${sign}`),
  getZodiacSigns: () => api.get('/api/horoscope/zodiac-signs'),
  getBirthKundali: (data) => api.post('/api/astrology/birth-kundali', data),
  getKundaliMatching: (data) => api.post('/api/astrology/kundali-matching', data),
  getPanchang: (data) => api.get('/api/panchang/today', { params: data }),
  getAstrologers: () => api.get('/api/astrologers'),
};

// Festival APIs
export const festivalAPI = {
  getAll: () => api.get('/api/festivals'),
  getUpcoming: () => api.get('/api/festivals/upcoming'),
};

// Feed APIs
export const feedAPI = {
  getAll: () => api.get('/api/feed'),
  getById: (id) => api.get(`/api/feed/${id}`),
};

// Video Consultation APIs
export const consultationAPI = {
  start: (astrologerId) => api.post(`/api/consultation/start/${astrologerId}`),
  end: (consultationId) => api.post(`/api/consultation/end/${consultationId}`),
  getHistory: () => api.get('/api/consultation/history'),
};

// Fees & Taxes
export const settingsAPI = {
  getFeesTaxes: () => api.get('/api/fees-taxes'),
  getPincode: (pincode) => api.get(`/api/pincode/${pincode}`),
};

// Chat APIs
export const chatAPI = {
  getConversations: () => api.get('/api/chat/conversations'),
  getMessages: (conversationId) => api.get(`/api/chat/messages/${conversationId}`),
  sendMessage: (conversationId, message) => api.post(`/api/chat/send`, { conversation_id: conversationId, message }),
};

export default api;

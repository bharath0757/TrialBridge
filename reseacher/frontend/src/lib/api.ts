import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location.hostname) {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return '/api';
    }
  }
  return 'http://localhost:8000/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// JWT interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('trialbridge_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 interceptor — redirect to login ONLY on genuine session expiry, not auth checks or demo accounts
api.interceptors.response.use(
  (response) => {
    if (response.data?.service_unavailable === true) {
      throw new Error('The API is not connected. Please try again after the service is restored.');
    }
    const contentType = String(response.headers['content-type'] || '');
    if (contentType.includes('text/html') ||
        (typeof response.data === 'string' && /^\s*(<!doctype|<html)/i.test(response.data))) {
      throw new Error('The API is not connected. Please try again after the service is restored.');
    }
    return response;
  },
  (error) => {
    const isAuthPath = error.config?.url?.includes('/auth/');
    if (error.response?.status === 401 && !isAuthPath) {
      localStorage.removeItem('trialbridge_token');
      localStorage.removeItem('trialbridge_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;

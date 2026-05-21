import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api',
  timeout: 60000, // 60s - PDF parsing and AI operations take longer
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Don't set Content-Type for FormData - let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError) => {
    console.error('API Error:', error.response?.data || error.message);
    
    // Auto-logout on invalid or expired token
    if (error.response?.status === 401 || error.response?.status === 403) {
      const data = error.response.data as any;
      if (data?.error?.includes('token') || data?.error?.includes('Token')) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          document.cookie = 'token=; path=/; max-age=0';
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
export { api };

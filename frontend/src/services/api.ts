import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to attach access token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor to handle authentication failures
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle session expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // In a production app, we would refresh the token here using the refreshToken.
      // For simplicity in this tracking app, we will clear tokens and redirect.
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');

      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    const message = error.response?.data?.message || 'An unexpected error occurred';
    const err = new Error(message) as any;
    err.status = error.response?.status;
    err.data = error.response?.data;

    return Promise.reject(err);
  }
);

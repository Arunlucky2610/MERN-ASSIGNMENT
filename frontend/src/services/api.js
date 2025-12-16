import axios from 'axios';

/**
 * Axios instance configured for API calls
 * 
 * Features:
 * - Automatically attaches JWT token to requests
 * - Handles 401 responses (token expired/invalid)
 * - Base URL configured from environment variable
 * - Falls back to production URL if env var not set
 */

// Use environment variable, fallback to production Render URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://mern-assignment-umlo.onrender.com/api';

console.log('🔧 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Request interceptor - attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      
      // Only redirect if not already on login/signup page
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/signup')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

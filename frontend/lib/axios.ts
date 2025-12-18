import axios from 'axios';

// Create axios instance with default config
// Frontend runs on 3001, Backend API runs on 3000
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Required for httpOnly cookies (JWT auth)
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

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
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;

      // Handle specific error codes
      switch (status) {
        case 401:
          // Unauthorized - DO NOT auto-redirect, let the component handle it
          // This prevents redirect loops when API calls fail due to missing backend endpoints
          if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            const errorMsg = error.response?.data?.message || '';
            const errorMsgLower = typeof errorMsg === 'string' ? errorMsg.toLowerCase() : '';

            console.warn('401 Error received:', errorMsg);
            console.warn('Token exists in localStorage:', !!token);

            // Only clear token if it's explicitly invalid/expired
            const isTokenInvalid =
              errorMsgLower.includes('invalid') ||
              errorMsgLower.includes('expired') ||
              errorMsgLower.includes('malformed');

            if (isTokenInvalid) {
              console.warn('Token is invalid/expired - clearing');
              localStorage.removeItem('token');
              localStorage.removeItem('user');
            }
            // Don't auto-redirect - let RouteGuard and AuthContext handle navigation
          }
          break;
        case 403:
          // Forbidden - user is authenticated but lacks permission
          console.warn('Access forbidden - insufficient permissions for this resource');
          break;
        case 404:
          // Suppress 404 logging for checklist existence checks to avoid console noise
          if (!error.config?.url?.includes('/checklist/termination/')) {
            console.error('Resource not found');
          }
          break;
        case 500:
          console.error('Server error');
          break;
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response from server - please check if backend is running');
    } else {
      // Something else happened
      console.error('Request error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Helper to get base URL (used in checkBackendConnection)
function getBaseURL(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
}

// Helper function to check if backend is accessible
export const checkBackendConnection = async (): Promise<{ connected: boolean; message: string }> => {
  try {
    const baseURL = getBaseURL();
    // Health endpoint is at /api/health (with global prefix)
    const healthURL = `${baseURL}/health`;

    const response = await axios.get(healthURL, {
      timeout: 5000,
      withCredentials: true,
    });

    if (response.status === 200) {
      return { connected: true, message: 'Backend is accessible' };
    }
    return { connected: false, message: 'Backend responded but with unexpected status' };
  } catch (error: any) {
    const baseURL = getBaseURL();
    if (error.code === 'ECONNREFUSED') {
      return {
        connected: false,
        message: `Cannot connect to backend at ${baseURL.replace('/api', '')}. Make sure the backend server is running. Start it with: cd Milestone2/HR-System-main && npm run start:dev`
      };
    } else if (error.code === 'ETIMEDOUT') {
      return {
        connected: false,
        message: `Backend connection timed out. The server may be slow or unresponsive.`
      };
    } else if (error.response?.status === 404) {
      return {
        connected: false,
        message: `Backend route not found (404). Make sure the backend is running and the global API prefix is configured correctly. Start backend with: cd Milestone2/HR-System-main && npm run start:dev`
      };
    } else {
      return {
        connected: false,
        message: `Backend connection error: ${error.response?.status ? `Status ${error.response.status}` : error.message || 'Unknown error'}`
      };
    }
  }
};

export default axiosInstance;

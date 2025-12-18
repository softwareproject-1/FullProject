import axios from 'axios';

// Get base URL from environment or use default
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    // Check if we're in browser
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For cookie-based authentication
  timeout: 10000, // 10 second timeout
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      console.log('API Request:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    if (typeof window !== 'undefined') {
      console.log('API Response:', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    // Log detailed error information
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.code === 'ETIMEDOUT' || !error.response) {
      const baseURL = error.config?.baseURL || getBaseURL();
      console.error('Network Error - Cannot connect to backend:', {
        url: error.config?.url,
        baseURL: baseURL,
        message: error.message,
        code: error.code,
        fullError: error
      });
      
      // Provide helpful error message
      if (error.code === 'ECONNREFUSED') {
        console.error('❌ Backend server is not running or not accessible');
        console.error(`💡 Make sure the backend is running on: ${baseURL.replace('/api', '')}`);
        console.error('💡 Start the backend with: cd Milestone2/HR-System-main && npm run start:dev');
      } else if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
        console.error('❌ Request timed out - backend may be slow or unresponsive');
      } else {
        console.error('❌ Network error - check your internet connection and backend status');
      }
    } else {
      const status = error.response?.status;
      const url = error.config?.url;
      const fullUrl = error.config?.baseURL + url;
      console.error('API Error:', status, error.response?.data, url);
      console.error('Full URL:', fullUrl);
      
      if (status === 404) {
        console.error('❌ 404 Not Found - Route does not exist');
        console.error(`💡 Check if the backend route exists: ${fullUrl}`);
        console.error('💡 Verify the backend is running and the route is registered');
      } else if (status === 500) {
        console.error('❌ 500 Internal Server Error');
        console.error(`💡 Backend error details:`, error.response?.data);
        console.error(`💡 URL: ${fullUrl}`);
        console.error('💡 This could be due to:');
        console.error('   - Validation errors in request data');
        console.error('   - Database connection issues');
        console.error('   - Missing required fields');
        console.error('   - Server-side processing error');
      }
    }
    
    if (error.response?.status === 401) {
      console.error('❌ 401 Unauthorized - Authentication required');
      console.error('💡 You need to be logged in to access this resource');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login';
        }
      }
    } else if (error.response?.status === 403) {
      console.error('❌ 403 Forbidden - Insufficient permissions');
      console.error('💡 You do not have permission to access this resource');
    }
    return Promise.reject(error);
  }
);

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

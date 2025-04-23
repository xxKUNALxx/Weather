import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1', // Replace with your backend's base URL
  withCredentials: true, // To allow cookies (e.g., for refresh tokens)
});

// Request interceptor - add auth token to requests
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 (unauthorized) and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Get refresh token from storage
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          // If no refresh token, redirect to login
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // Call the refresh token endpoint
        const response = await axios.post(
          'http://localhost:5000/api/v1/users/refresh-token',
          { refreshToken },
          { withCredentials: true }
        );
        
        // Update tokens in storage
        if (response.data?.data) {
          localStorage.setItem('accessToken', response.data.data.accessToken);
          localStorage.setItem('refreshToken', response.data.data.refreshToken);
          
          // Update authorization header and retry the original request
          originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('weatherSphereUser');
        
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
import axios, { AxiosError } from 'axios';
import { tokenStorage } from '@/utils/tokenStorage';
import type { ApiError } from '@/types';

const api = axios.create({
  // In production/K8s, API calls go through Ingress which routes /api/* to backend services
  // Service endpoints already include /api prefix (e.g., /api/auth/login)
  // So baseURL should be empty to avoid double /api prefix
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token and service API keys
api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add X-Service-API-Key header for audit service requests
  if (config.url?.includes('/api/audit')) {
    const auditApiKey = import.meta.env.VITE_AUDIT_API_KEY;
    if (auditApiKey) {
      config.headers['X-Service-API-Key'] = auditApiKey;
    }
  }
  
  return config;
});

// Response interceptor - Handle 401 and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as any;

    // Don't attempt token refresh for certain endpoints that return 401 as part of their normal flow
    const skipRefreshEndpoints = [
      '/api/auth/2fa/totp/verify-login', // 2FA verification returns 401 for invalid codes
      '/api/auth/login', // Login endpoint handles its own auth flow
      '/api/auth/refresh', // Refresh endpoint itself
    ];
    
    const shouldSkipRefresh = skipRefreshEndpoints.some(endpoint => 
      originalRequest.url?.includes(endpoint)
    );

    // Handle 401 errors (but skip refresh for specific endpoints)
    if (error.response?.status === 401 && !originalRequest._retry && !shouldSkipRefresh) {
      originalRequest._retry = true;

      try {
        // Attempt token refresh
        const refreshToken = tokenStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const { data } = await axios.post(
          '/api/auth/refresh',
          { refreshToken }
        );

        tokenStorage.setAccessToken(data.accessToken);
        if (data.refreshToken) {
          tokenStorage.setRefreshToken(data.refreshToken);
        }

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear storage and redirect
        tokenStorage.clearAll();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Helper to handle API errors with user-friendly messages
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const apiError = error.response?.data as ApiError;

    // Handle specific HTTP status codes
    if (status === 401) {
      return 'Your session has expired. Please log in again.';
    }
    if (status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (status === 404) {
      return 'The requested resource was not found.';
    }
    if (status === 409) {
      return 'This action conflicts with the current state. Please refresh and try again.';
    }
    if (status === 422) {
      return apiError?.message || 'The provided data is invalid. Please check your input.';
    }
    if (status === 429) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    if (status === 500) {
      return 'A server error occurred. Please try again later or contact support.';
    }
    if (status === 503) {
      return 'The service is temporarily unavailable. Please try again later.';
    }

    // Use API error message if available
    if (apiError?.message) {
      return apiError.message;
    }

    // Use HTTP error message
    if (error.message) {
      return error.message;
    }

    // Network errors
    if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      return 'Network error. Please check your connection and try again.';
  }
  }

  // Handle non-Axios errors
  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
};


import { AxiosError } from 'axios';
import type { ApiError } from '../types';

/**
 * Extract user-friendly error message from API errors
 * Handles permission errors (403) and other common error codes
 */
export const getErrorMessage = (error: unknown, defaultMessage?: string): string => {
  if (AxiosError.isAxiosError(error)) {
    const status = error.response?.status;
    const apiError = error.response?.data as ApiError;

    // Permission errors - show specific messages
    if (status === 403) {
      // Check if API provides a specific message
      if (apiError?.message) {
        return apiError.message;
      }
      // Default permission message
      return 'You do not have permission to perform this action. Please contact a team administrator.';
    }

    // Authentication errors
    if (status === 401) {
      return 'Your session has expired. Please log in again.';
    }

    // Not found errors
    if (status === 404) {
      return apiError?.message || 'The requested resource was not found.';
    }

    // Conflict errors
    if (status === 409) {
      return apiError?.message || 'This action conflicts with the current state. Please refresh and try again.';
    }

    // Validation errors
    if (status === 422) {
      return apiError?.message || 'The provided data is invalid. Please check your input.';
    }

    // Rate limiting
    if (status === 429) {
      return 'Too many requests. Please wait a moment and try again.';
    }

    // Server errors
    if (status === 500) {
      return apiError?.message || 'A server error occurred. Please try again later or contact support.';
    }

    // Service unavailable
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

  // Default message
  return defaultMessage || 'An unexpected error occurred. Please try again or contact support if the problem persists.';
};

/**
 * Check if an error is a permission error (403)
 */
export const isPermissionError = (error: unknown): boolean => {
  if (AxiosError.isAxiosError(error)) {
    return error.response?.status === 403;
  }
  return false;
};

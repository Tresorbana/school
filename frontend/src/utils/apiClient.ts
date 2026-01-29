
/**
 * Centralized API client with token expiration handling
 */

import { getAuthHeaders } from './auth';

const envApiBaseUrl = import.meta.env.VITE_API_URL;
export const API_BASE_URL = envApiBaseUrl !== undefined ? envApiBaseUrl : 'http://localhost:3000';

// Global references to context functions (will be set by the provider)
let globalLogout: (() => Promise<void>) | null = null;
let globalAddToast: ((toast: { message: string; type: 'success' | 'error' | 'info' | 'warning'; title?: string }) => void) | null = null;

/**
 * Set global context functions for logout and toast
 * This should be called once from the app initialization
 */
export const setGlobalContexts = (
  logout: () => Promise<void>,
  addToast: (toast: { message: string; type: 'success' | 'error' | 'info' | 'warning'; title?: string }) => void
) => {
  globalLogout = logout;
  globalAddToast = addToast;
};

/**
 * Handle token expiration with user-friendly messaging
 */
const handleTokenExpiration = async () => {
  // Show friendly message
  if (globalAddToast) {
    globalAddToast({
      title: 'Session Expired',
      message: 'Your session has ended. Please login again to continue.',
      type: 'info'
    });
  }

  // Wait a moment for the toast to show
  await new Promise(resolve => setTimeout(resolve, 100));

  // Logout user
  if (globalLogout) {
    await globalLogout();
  }

  // Redirect to login
  window.location.href = '/login';
};

/**
 * Enhanced fetch wrapper with token expiration handling
 */
export const apiClient = {
  /**
   * Make an authenticated API request
   */
  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    try {
      // Add auth headers
      const headers = {
        ...getAuthHeaders(),
        ...options.headers,
      };

      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle token expiration
      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json().catch(() => ({}));

        // Check if it's a token expiration error
        if (
          errorData.message?.toLowerCase().includes('token') ||
          errorData.message?.toLowerCase().includes('expired') ||
          errorData.message?.toLowerCase().includes('unauthorized') ||
          errorData.error?.toLowerCase().includes('token') ||
          response.status === 401
        ) {
          await handleTokenExpiration();
          throw new Error('Session expired');
        }
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      // Re-throw the error for the calling code to handle
      throw error;
    }
  },

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  },

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  },

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
};

/**
 * Legacy fetch wrapper for backward compatibility
 * Gradually migrate existing code to use apiClient instead
 */
export const enhancedFetch = async (url: string, options: RequestInit = {}) => {
  return apiClient.request(url, options);
};
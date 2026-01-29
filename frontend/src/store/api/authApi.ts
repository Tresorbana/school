import { createApi } from '@reduxjs/toolkit/query/react';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/apiClient';

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/auth`,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor to handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid, clear it
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

// Custom base query using axios
const axiosBaseQuery = async ({ url, method, data, params }: {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  params?: any;
}) => {
  try {
    const response = await axiosInstance({
      url,
      method,
      data,
      params,
    });
    return { data: response.data };
  } catch (error: any) {
    return {
      error: {
        status: error.response?.status,
        data: error.response?.data || error.message,
      },
    };
  }
};

export interface SignupRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  status: string;
  message: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    role_id: string;
  };
  roles?: Array<{
    id: string;
    name: string;
  }>;
  token?: string;
}

export interface MeResponse {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  roles: Array<{
    id: string;
    name: string;
  }>;
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['User'],
  endpoints: (builder) => ({
    signup: builder.mutation<AuthResponse, SignupRequest>({
      query: (credentials) => ({
        url: 'signup',
        method: 'POST',
        data: credentials,
      }),
    }),
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: 'login',
        method: 'POST',
        data: credentials,
      }),
    }),
    me: builder.query<MeResponse, void>({
      query: () => ({
        url: 'me',
        method: 'GET',
      }),
      providesTags: ['User'],
      transformResponse: (response: any) => {
        // Transform the backend response to match our frontend interface
        return {
          id: response.user.id,
          first_name: response.user.first_name,
          last_name: response.user.last_name,
          email: response.user.email,
          roles: response.user.roles || [],
        };
      },
    }),
  }),
});

export const { useSignupMutation, useLoginMutation, useMeQuery } = authApi;

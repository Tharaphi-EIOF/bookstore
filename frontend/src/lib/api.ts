import axios, { AxiosError } from 'axios'
import { useAuthStore } from '@/store/auth.store'
import { getClerkToken, handleUnauthorized } from '@/lib/clerk-session'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// All service hooks share this client so auth/error behavior stays in one place.
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Prefer Clerk tokens when available, but keep legacy token support for existing flows.
api.interceptors.request.use(
  async (config) => {
    const clerkToken = await getClerkToken()
    const legacyToken = useAuthStore.getState().token
    const token = clerkToken ?? legacyToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// A 401 outside auth endpoints means the local session is no longer valid.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status
    const requestUrl = String(error.config?.url || '')
    const isAuthEndpoint =
      /\/auth\/(login|register|forgot-password|reset-password|me)/i.test(requestUrl)
    const shouldLogout = status === 401 && !isAuthEndpoint

    if (shouldLogout) {
      useAuthStore.getState().logout()
      void handleUnauthorized()
    }
    return Promise.reject(error)
  }
)

// Normalize backend, network, and timeout errors into UI-friendly copy.
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message: string | string[] }>
    
    // Handle validation errors (array of messages)
    if (Array.isArray(axiosError.response?.data?.message)) {
      return axiosError.response.data.message.join(', ')
    }
    
    // Handle single error message
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message
    }
    
    // Handle network errors
    if (axiosError.code === 'ERR_NETWORK') {
      return 'Cannot connect to server. Please check if the backend is running.'
    }
    
    // Handle timeout
    if (axiosError.code === 'ECONNABORTED') {
      return 'Request timeout. Please try again.'
    }
    
    // Generic axios error
    return axiosError.message || 'An error occurred'
  }
  
  // Generic error
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}

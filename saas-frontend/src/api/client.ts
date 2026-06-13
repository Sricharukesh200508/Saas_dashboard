import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { API_CONFIG } from '@/config/api.config'
import { getStoredTokens, storeTokens, clearAuthStorage } from '@/utils/storage'
import { logger } from '@/utils/logger'
import { ENDPOINTS } from '@/config/api.config'
import type { Token } from '@/types/auth'
import { useAuthStore } from '@/store/auth.store'

// ────────────────────────────────────────────────────────────────
// Axios instance
// ────────────────────────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Request Interceptor ──────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    // Add unique request ID
    config.headers['X-Request-ID'] = uuidv4()

    // Add Authorization header
    const tokens = getStoredTokens()
    if (tokens?.access_token) {
      config.headers['Authorization'] = `Bearer ${tokens.access_token}`
    }

    logger.debug(`→ ${config.method?.toUpperCase()} ${config.url}`, config.params)
    return config
  },
  (error) => {
    logger.error('Request interceptor error:', error)
    return Promise.reject(error)
  },
)

// ── Response Interceptor with token refresh ──────────────────────
let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

apiClient.interceptors.response.use(
  (response) => {
    logger.debug(`← ${response.status} ${response.config.url}`)
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // 401 — attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      const tokens = getStoredTokens()
      if (!tokens?.refresh_token) {
        clearAuthStorage()
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Queue other requests while refreshing
        return new Promise<string>((resolve) => {
          subscribeTokenRefresh(resolve)
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`
          return apiClient(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await axios.post<Token>(
          `${API_CONFIG.BASE_URL}${ENDPOINTS.REFRESH}`,
          { refresh_token: tokens.refresh_token },
        )
        const newTokens = response.data
        storeTokens(newTokens)
        onTokenRefreshed(newTokens.access_token)
        originalRequest.headers['Authorization'] = `Bearer ${newTokens.access_token}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        clearAuthStorage()
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    logger.error(`← ${error.response?.status} ${error.config?.url}`, error.response?.data)
    return Promise.reject(error)
  },
)

export default apiClient

import apiClient from './client'
import { ENDPOINTS } from '@/config/api.config'
import type { Token } from '@/types/auth'
import type { LoginRequest, TenantRegisterRequest, UserRegisterRequest } from '@/types/auth'

// ────────────────────────────────────────────────────────────────
// Auth API
// ────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (data: LoginRequest): Promise<Token> => {
    const response = await apiClient.post<Token>(ENDPOINTS.LOGIN, data)
    return response.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post(ENDPOINTS.LOGOUT)
  },

  registerTenant: async (data: TenantRegisterRequest): Promise<Token> => {
    const response = await apiClient.post<Token>(ENDPOINTS.REGISTER_TENANT, data)
    return response.data
  },

  registerUser: async (data: UserRegisterRequest) => {
    const response = await apiClient.post(ENDPOINTS.REGISTER_USER, data)
    return response.data
  },

  refreshToken: async (refreshToken: string): Promise<Token> => {
    const response = await apiClient.post<Token>(ENDPOINTS.REFRESH, {
      refresh_token: refreshToken,
    })
    return response.data
  },
}

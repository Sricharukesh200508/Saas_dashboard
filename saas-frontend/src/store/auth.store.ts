import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { jwtDecode } from 'jwt-decode'
import type { User, Token, TokenPayload } from '@/types/auth'
import { storeTokens, clearAuthStorage } from '@/utils/storage'
import { logger } from '@/utils/logger'

interface AuthStore {
  user: User | null
  tokens: Token | null
  tenant_id: string | null
  role: string | null
  isAuthenticated: boolean
  setAuth: (tokens: Token) => void
  clearAuth: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      tenant_id: null,
      role: null,
      isAuthenticated: false,

      setAuth: (tokens: Token) => {
        try {
          const payload = jwtDecode<TokenPayload>(tokens.access_token)
          storeTokens(tokens)
          set({
            tokens,
            tenant_id: payload.tenant_id,
            role: payload.role,
            isAuthenticated: true,
            user: {
              id: payload.sub,
              email: '',
              role: payload.role as User['role'],
              tenant_id: payload.tenant_id,
              is_active: true,
              created_at: new Date().toISOString(),
            },
          })
        } catch (e) {
          logger.error('Failed to decode token:', e)
        }
      },

      clearAuth: () => {
        clearAuthStorage()
        set({
          user: null,
          tokens: null,
          tenant_id: null,
          role: null,
          isAuthenticated: false,
        })
      },

      updateUser: (updates: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }))
      },
    }),
    {
      name: 'saas_auth',
      partialize: (state) => ({
        tokens: state.tokens,
        tenant_id: state.tenant_id,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    },
  ),
)

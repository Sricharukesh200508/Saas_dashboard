import { useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { authApi } from '@/api/auth'
import { ROUTES } from '@/utils/constants'
import { extractErrorMessage } from '@/utils/errors'
import type { LoginRequest, TenantRegisterRequest } from '@/types/auth'

// ────────────────────────────────────────────────────────────────
// useAuth hook — login, logout, registration, role checks
// ────────────────────────────────────────────────────────────────
export function useAuth() {
  const { user, tokens, tenant_id, role, isAuthenticated, setAuth, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (tokens) => {
      setAuth(tokens)
      navigate({ to: ROUTES.DASHBOARD })
    },
  })

  const registerMutation = useMutation({
    mutationFn: authApi.registerTenant,
    onSuccess: (tokens) => {
      setAuth(tokens)
      navigate({ to: ROUTES.DASHBOARD })
    },
  })

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Ignore logout API errors — still clear local state
    } finally {
      clearAuth()
      queryClient.clear()
      navigate({ to: ROUTES.LOGIN })
    }
  }, [clearAuth, navigate, queryClient])

  const login = useCallback(
    (data: LoginRequest) => loginMutation.mutateAsync(data),
    [loginMutation],
  )

  const registerTenant = useCallback(
    (data: TenantRegisterRequest) => registerMutation.mutateAsync(data),
    [registerMutation],
  )

  const hasRole = useCallback(
    (requiredRole: string): boolean => {
      const hierarchy = { owner: 4, admin: 3, member: 2, viewer: 1 }
      const userLevel = hierarchy[role as keyof typeof hierarchy] ?? 0
      const requiredLevel = hierarchy[requiredRole as keyof typeof hierarchy] ?? 0
      return userLevel >= requiredLevel
    },
    [role],
  )

  return {
    user,
    tokens,
    tenant_id,
    role,
    isAuthenticated,
    clearAuth,
    login,
    logout,
    registerTenant,
    hasRole,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error ? extractErrorMessage(loginMutation.error) : null,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error ? extractErrorMessage(registerMutation.error) : null,
  }
}

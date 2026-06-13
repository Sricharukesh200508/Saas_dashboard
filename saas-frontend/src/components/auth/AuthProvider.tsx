import React, { useEffect, useState } from 'react'
import { redirect, useLocation } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/utils/constants'
import { Spinner } from '../shared/index'
import { jwtDecode } from 'jwt-decode'
import type { TokenPayload } from '@/types/auth'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, tokens, clearAuth } = useAuth()
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    if (tokens?.access_token) {
      try {
        // Check real JWT expiry to avoid stale persisted auth state
        const payload = jwtDecode<TokenPayload>(tokens.access_token)
        const isExpired = payload.exp ? Date.now() / 1000 > payload.exp : false
        if (isExpired) {
          clearAuth()
        }
      } catch {
        // Malformed token — clear auth state
        clearAuth()
      }
    } else if (isAuthenticated) {
      // State mismatch: Zustand says authenticated but no token in storage
      clearAuth()
    }
    setIsInitializing(false)
  }, []) // Run only once on mount

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
        <Spinner size="lg" />
      </div>
    )
  }

  return <>{children}</>
}

export const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, hasRole } = useAuth()
  const location = useLocation()

  // Synchronous guard — no useEffect race condition
  if (!isAuthenticated) {
    // Throw redirect so TanStack Router handles it before render
    throw redirect({ to: ROUTES.LOGIN, search: { redirect: location.pathname } })
  }

  if (requiredRole && !hasRole(requiredRole)) {
    throw redirect({ to: ROUTES.DASHBOARD })
  }

  return <>{children}</>
}

import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/utils/constants'
import { Spinner } from '../shared/index'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, tokens, clearAuth } = useAuth()
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    // Check if tokens exist but might be expired (basic client-side check)
    // The Axios interceptor handles actual 401s and refresh token rotation.
    if (tokens?.access_token) {
      // Decode JWT to check expiration? For now we trust it until an API call fails
    } else if (isAuthenticated) {
      // State mismatch (e.g. localStorage cleared manually)
      clearAuth()
    }
    setIsInitializing(false)
  }, [tokens, isAuthenticated, clearAuth])

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
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: ROUTES.LOGIN, search: { redirect: location.pathname } })
    } else if (requiredRole && !hasRole(requiredRole)) {
      navigate({ to: ROUTES.DASHBOARD }) // Or a 403 Forbidden page
    }
  }, [isAuthenticated, hasRole, requiredRole, navigate, location])

  if (!isAuthenticated) return null
  if (requiredRole && !hasRole(requiredRole)) return null

  return <>{children}</>
}

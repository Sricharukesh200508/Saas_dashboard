import React from 'react'
import { Link, Navigate } from '@tanstack/react-router'
import { Hexagon } from 'lucide-react'
import { LoginForm } from '@/components/auth/LoginForm'
import { ROUTES } from '@/utils/constants'
import { useAuth } from '@/hooks/useAuth'
import { FadeIn, SlideIn } from '@/components/animations'

export const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuth()

  // Redirect if already logged in
  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] auth-gradient p-4">
      <div className="w-full max-w-[440px]">
        <FadeIn>
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-secondary p-3 shadow-glow-secondary mb-6">
              <Hexagon className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Welcome back</h1>
            <p className="text-[var(--text-secondary)]">Sign in to your workspace to continue.</p>
          </div>
        </FadeIn>

        <SlideIn direction="bottom" delay={0.1}>
          <div className="glass-light dark:glass rounded-3xl p-8 shadow-glass-dark">
            <LoginForm />
          </div>
        </SlideIn>

        <FadeIn delay={0.2}>
          <p className="text-center text-[var(--text-secondary)] mt-8">
            Don't have an account?{' '}
            <Link to={ROUTES.REGISTER} className="text-secondary hover:text-secondary-400 font-medium transition-colors">
              Create a workspace
            </Link>
          </p>
        </FadeIn>
      </div>
    </div>
  )
}

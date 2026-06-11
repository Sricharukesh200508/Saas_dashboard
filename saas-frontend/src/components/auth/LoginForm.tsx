import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '../shared/index'
import { Mail, Lock, AlertCircle } from 'lucide-react'
import { toast } from '../shared/Toast'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export const LoginForm: React.FC = () => {
  const { login, isLoggingIn, loginError } = useAuth()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data)
      toast.success('Welcome back!')
    } catch (error) {
      // Error is handled by the hook (loginError)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {loginError && (
        <div className="flex items-center gap-2 rounded-lg bg-error/10 p-4 text-sm text-error border border-error/20">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{loginError}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-primary)]">Email</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[var(--text-muted)]">
              <Mail className="h-5 w-5" />
            </div>
            <input
              {...register('email')}
              type="email"
              className="input-field pl-10"
              placeholder="you@company.com"
              autoComplete="email"
            />
          </div>
          {errors.email && (
            <p className="text-sm text-error mt-1 animate-slide-in-top">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--text-primary)]">Password</label>
            <a href="#" className="text-sm text-secondary hover:underline">Forgot password?</a>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[var(--text-muted)]">
              <Lock className="h-5 w-5" />
            </div>
            <input
              {...register('password')}
              type="password"
              className="input-field pl-10"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          {errors.password && (
            <p className="text-sm text-error mt-1 animate-slide-in-top">{errors.password.message}</p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={isLoggingIn}
        className="mt-6"
      >
        Sign in
      </Button>
    </form>
  )
}

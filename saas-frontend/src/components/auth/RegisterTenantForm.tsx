import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '../shared/index'
import { Building2, Mail, Lock, Globe, AlertCircle } from 'lucide-react'
import { toast } from '../shared/Toast'

const registerSchema = z.object({
  tenant_name: z.string().min(2, 'Company name must be at least 2 characters'),
  tenant_slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed'),
  domain: z.string().optional(),
  owner_email: z.string().min(1, 'Email is required').email('Invalid email format'),
  owner_password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export const RegisterTenantForm: React.FC = () => {
  const { registerTenant, isRegistering, registerError } = useAuth()
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  // Auto-generate slug from name
  const name = watch('tenant_name')
  React.useEffect(() => {
    if (name) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      setValue('tenant_slug', slug, { shouldValidate: true })
    }
  }, [name, setValue])

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await registerTenant(data)
      toast.success('Registration successful!', 'Your workspace has been created.')
    } catch (error) {
      // Handled by hook
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {registerError && (
        <div className="flex items-center gap-2 rounded-lg bg-error/10 p-4 text-sm text-error border border-error/20">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{registerError}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Company Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-primary)]">Company Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[var(--text-muted)]">
              <Building2 className="h-5 w-5" />
            </div>
            <input
              {...register('tenant_name')}
              type="text"
              className="input-field pl-10"
              placeholder="Acme Corp"
            />
          </div>
          {errors.tenant_name && <p className="text-sm text-error mt-1">{errors.tenant_name.message}</p>}
        </div>

        {/* Workspace URL (Slug) */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-primary)]">Workspace URL</label>
          <div className="flex rounded-md shadow-sm">
            <span className="inline-flex items-center rounded-l-md border border-r-0 border-[var(--border-color)] bg-[var(--bg-elevated)] px-3 text-[var(--text-muted)] sm:text-sm">
              nexusapi.com/
            </span>
            <input
              {...register('tenant_slug')}
              type="text"
              className="input-field rounded-l-none"
              placeholder="acme-corp"
            />
          </div>
          {errors.tenant_slug && <p className="text-sm text-error mt-1">{errors.tenant_slug.message}</p>}
        </div>

        {/* Optional Domain */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-primary)]">Custom Domain <span className="text-[var(--text-muted)] font-normal">(Optional)</span></label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[var(--text-muted)]">
              <Globe className="h-5 w-5" />
            </div>
            <input
              {...register('domain')}
              type="text"
              className="input-field pl-10"
              placeholder="api.acme.com"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--border-color)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Owner Account</h3>
          
          {/* Email */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[var(--text-muted)]">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  {...register('owner_email')}
                  type="email"
                  className="input-field pl-10"
                  placeholder="admin@acmecorp.com"
                />
              </div>
              {errors.owner_email && <p className="text-sm text-error mt-1">{errors.owner_email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[var(--text-muted)]">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  {...register('owner_password')}
                  type="password"
                  className="input-field pl-10"
                  placeholder="••••••••"
                />
              </div>
              {errors.owner_password && <p className="text-sm text-error mt-1">{errors.owner_password.message}</p>}
            </div>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={isRegistering}
      >
        Create Workspace
      </Button>
      
      <p className="text-xs text-center text-[var(--text-muted)] mt-4">
        By creating a workspace, you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  )
}

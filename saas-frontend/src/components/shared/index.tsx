import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { clsx } from 'clsx'

export * from './Table'

// ────────────────────────────────────────────────────────────────
// Button Component
// ────────────────────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'glass'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-md hover:shadow-glow-primary border border-primary-400/20',
  secondary: 'bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30 hover:border-secondary/60',
  ghost: 'bg-transparent hover:bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
  danger: 'bg-error/10 hover:bg-error/20 text-error border border-error/30 hover:border-error/60',
  outline: 'bg-transparent border border-[var(--border-color)] hover:border-[var(--text-muted)] text-[var(--text-primary)]',
  glass: 'glass hover:bg-white/10 text-white border-white/10',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  disabled,
  className,
  ...props
}) => {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      disabled={disabled || loading}
      className={clsx(
        'relative inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...(props as HTMLMotionProps<'button'>)}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading…</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  )
}

// ── Badge ───────────────────────────────────────────────────────
type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'secondary'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-[var(--text-secondary)] border border-[var(--border-color)]',
  success: 'bg-success/15 text-success border border-success/30',
  warning: 'bg-warning/15 text-warning border border-warning/30',
  error: 'bg-error/15 text-error border border-error/30',
  info: 'bg-primary-500/15 text-primary-300 border border-primary-500/30',
  secondary: 'bg-secondary/15 text-secondary border border-secondary/30',
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className,
  dot = false,
}) => (
  <span
    className={clsx(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
      badgeVariants[variant],
      className,
    )}
  >
    {dot && (
      <span
        className={clsx('h-1.5 w-1.5 rounded-full', {
          'bg-success': variant === 'success',
          'bg-warning': variant === 'warning',
          'bg-error': variant === 'error',
          'bg-secondary': variant === 'secondary',
          'bg-primary-400': variant === 'info',
          'bg-white/50': variant === 'default',
        })}
        aria-hidden="true"
      />
    )}
    {children}
  </span>
)

// ── Card ────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glow?: 'primary' | 'secondary' | false
  padding?: 'none' | 'sm' | 'md' | 'lg'
  onClick?: () => void
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hover = false,
  glow = false,
  padding = 'md',
  onClick,
}) => {
  const paddingClasses = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' }

  return (
    <motion.div
      whileHover={hover ? { y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' } : undefined}
      onClick={onClick}
      className={clsx(
        'rounded-2xl border bg-[var(--bg-surface)] border-[var(--border-color)]',
        paddingClasses[padding],
        hover && 'cursor-pointer transition-shadow',
        glow === 'primary' && 'glow-primary',
        glow === 'secondary' && 'glow-secondary',
        className,
      )}
    >
      {children}
    </motion.div>
  )
}

// ── Skeleton ────────────────────────────────────────────────────
interface SkeletonProps {
  className?: string
  height?: string
  width?: string
  rounded?: boolean
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  height = 'h-4',
  width = 'w-full',
  rounded = false,
}) => (
  <div
    className={clsx(
      'bg-[var(--bg-elevated)] relative overflow-hidden',
      height,
      width,
      rounded ? 'rounded-full' : 'rounded-lg',
      className,
    )}
    aria-hidden="true"
  >
    <div className="absolute inset-0 shimmer" />
  </div>
)

// ── Loading Spinner ──────────────────────────────────────────────
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }
  return (
    <svg
      className={clsx('animate-spin text-secondary', sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="status"
      aria-label="Loading"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ── Empty State ──────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    {icon && (
      <div className="mb-4 text-[var(--text-muted)] opacity-40 text-6xl">{icon}</div>
    )}
    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
    {description && (
      <p className="text-sm text-[var(--text-muted)] max-w-sm mb-6">{description}</p>
    )}
    {action}
  </div>
)

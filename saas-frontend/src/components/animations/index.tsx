import React from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

// ────────────────────────────────────────────────────────────────
// Shared utility
// ────────────────────────────────────────────────────────────────
export function cn(...inputs: (string | boolean | undefined | null)[]): string {
  return clsx(inputs)
}

// ── FadeIn ──────────────────────────────────────────────────────
interface FadeInProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 0.3,
  className,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration, delay, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.div>
)

// ── SlideIn ─────────────────────────────────────────────────────
interface SlideInProps {
  children: React.ReactNode
  direction?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  duration?: number
  className?: string
}

const slideVariants = {
  top: { hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } },
  bottom: { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } },
  left: { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } },
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction = 'bottom',
  delay = 0,
  duration = 0.4,
  className,
}) => (
  <motion.div
    initial={slideVariants[direction].hidden}
    animate={slideVariants[direction].visible}
    transition={{
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
    }}
    className={className}
  >
    {children}
  </motion.div>
)

// ── ScaleIn ─────────────────────────────────────────────────────
interface ScaleInProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export const ScaleIn: React.FC<ScaleInProps> = ({ children, delay = 0, className }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
)

// ── Stagger ─────────────────────────────────────────────────────
interface StaggerProps {
  children: React.ReactNode
  staggerDelay?: number
  className?: string
}

export const Stagger: React.FC<StaggerProps> = ({
  children,
  staggerDelay = 0.05,
  className,
}) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      visible: {
        transition: { staggerChildren: staggerDelay },
      },
    }}
    className={className}
  >
    {React.Children.map(children, (child) => (
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { ease: [0.16, 1, 0.3, 1], duration: 0.4 } },
        }}
      >
        {child}
      </motion.div>
    ))}
  </motion.div>
)

// ── NumberCounter ───────────────────────────────────────────────
interface NumberCounterProps {
  value: number
  duration?: number
  formatter?: (v: number) => string
  className?: string
}

export const NumberCounter: React.FC<NumberCounterProps> = ({
  value,
  duration = 1.5,
  formatter = (v) => Math.round(v).toLocaleString(),
  className,
}) => {
  const [displayValue, setDisplayValue] = React.useState(0)
  const prevValue = React.useRef(0)
  const startTime = React.useRef<number | null>(null)
  const rafRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    const from = prevValue.current
    const to = value
    startTime.current = null

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp
      const elapsed = timestamp - startTime.current
      const progress = Math.min(elapsed / (duration * 1000), 1)

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = from + (to - from) * eased
      setDisplayValue(current)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        prevValue.current = to
      }
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])

  return <span className={className}>{formatter(displayValue)}</span>
}

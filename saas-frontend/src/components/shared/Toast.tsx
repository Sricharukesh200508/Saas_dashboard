import React from 'react'
import * as ToastPrimitives from '@radix-ui/react-toast'
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { useUIStore } from '@/store/ui.store'

export const ToastProvider = ToastPrimitives.Provider
export const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={clsx(
      'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

// Toaster component that connects to UI store
export function Toaster() {
  // In a full implementation, you'd want a separate toast store or an array in UI store specifically for ephemeral toasts.
  // We'll use a local state or a simplified context. Radix UI Toast needs its own state management usually.
  // For simplicity, we'll expose a global `toast` function and use an event listener to trigger them.
  const [toasts, setToasts] = React.useState<any[]>([])

  React.useEffect(() => {
    const handleToast = (event: CustomEvent) => {
      setToasts((prev) => [...prev, event.detail])
    }
    window.addEventListener('add-toast' as any, handleToast as EventListener)
    return () => window.removeEventListener('add-toast' as any, handleToast as EventListener)
  }, [])

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, variant, ...props }) => {
        return (
          <Toast key={id} variant={variant} {...props} onOpenChange={(open) => {
            if (!open) {
              setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id))
              }, 300)
            }
          }}>
            <div className="grid gap-1">
              {title && <ToastPrimitives.Title className="text-sm font-semibold">{title}</ToastPrimitives.Title>}
              {description && (
                <ToastPrimitives.Description className="text-sm opacity-90">
                  {description}
                </ToastPrimitives.Description>
              )}
            </div>
            <ToastPrimitives.Close className="absolute right-2 top-2 rounded-md p-1 text-inherit opacity-50 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2">
              <X className="h-4 w-4" />
            </ToastPrimitives.Close>
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & {
    variant?: 'default' | 'success' | 'warning' | 'destructive'
  }
>(({ className, variant = 'default', children, ...props }, ref) => {
  const variantStyles = {
    default: 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-primary)]',
    success: 'bg-success/10 border-success text-success',
    warning: 'bg-warning/10 border-warning text-warning',
    destructive: 'bg-error/10 border-error text-error',
  }

  const icons = {
    default: <Info className="h-5 w-5 text-secondary" />,
    success: <CheckCircle className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    destructive: <AlertCircle className="h-5 w-5" />,
  }

  return (
    <ToastPrimitives.Root
      ref={ref}
      className={clsx(
        'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <div className="flex gap-3 items-start w-full">
        <div className="shrink-0 mt-0.5">{icons[variant]}</div>
        {children}
      </div>
    </ToastPrimitives.Root>
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

let toastCount = 0
export const toast = (props: { title?: string; description?: string; variant?: 'default' | 'success' | 'warning' | 'destructive' }) => {
  const id = `toast-${toastCount++}`
  const event = new CustomEvent('add-toast', { detail: { ...props, id } })
  window.dispatchEvent(event)
  return id
}

toast.success = (title: string, description?: string) => toast({ title, description, variant: 'success' })
toast.error = (title: string, description?: string) => toast({ title, description, variant: 'destructive' })
toast.warning = (title: string, description?: string) => toast({ title, description, variant: 'warning' })
toast.info = (title: string, description?: string) => toast({ title, description, variant: 'default' })

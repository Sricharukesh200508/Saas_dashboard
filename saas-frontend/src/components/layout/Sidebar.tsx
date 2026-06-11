import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Hexagon, ChevronLeft, ChevronRight } from 'lucide-react'
import { useUIStore } from '@/store/ui.store'
import { Navigation } from './Navigation'
import { clsx } from 'clsx'
import { useAuth } from '@/hooks/useAuth'

export const Sidebar: React.FC = () => {
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen, toggleSidebarCollapse } = useUIStore()
  const { tenant_id } = useAuth()

  // On mobile, click outside to close
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setSidebarOpen])

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Content */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarCollapsed ? 80 : 256,
          x: sidebarOpen ? 0 : -256,
        }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[var(--border-color)] sidebar-gradient shadow-2xl lg:shadow-none',
          'lg:translate-x-0' // Ensure visible on large screens unless explicitly closed
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-400 to-secondary p-1.5 shadow-glow-secondary">
              <Hexagon className="h-6 w-6 text-white" />
            </div>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col whitespace-nowrap"
              >
                <span className="font-bold text-white tracking-wide">NexusAPI</span>
                {tenant_id && <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{tenant_id}</span>}
              </motion.div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-4">
          <Navigation collapsed={sidebarCollapsed} />
        </div>

        <div className="hidden lg:flex p-4 border-t border-[var(--border-color)]">
          <button
            onClick={toggleSidebarCollapse}
            className="flex w-full items-center justify-center rounded-md p-2 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </motion.aside>
    </>
  )
}

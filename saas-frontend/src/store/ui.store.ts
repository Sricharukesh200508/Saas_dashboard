import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme, NotificationItem } from '@/types/ui'
import { storeTheme } from '@/utils/storage'
import { v4 as uuidv4 } from 'uuid'

interface UIStore {
  theme: Theme
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  notifications: NotificationItem[]
  unreadCount: number
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebarCollapse: () => void
  addNotification: (notification: Omit<NotificationItem, 'id' | 'read' | 'created_at'>) => void
  markAllRead: () => void
  removeNotification: (id: string) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarOpen: true,
      sidebarCollapsed: false,
      notifications: [],
      unreadCount: 0,

      setTheme: (theme: Theme) => {
        storeTheme(theme)
        // Apply to document
        const root = document.documentElement
        if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
        set({ theme })
      },

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
      toggleSidebarCollapse: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      addNotification: (notification) => {
        const newItem: NotificationItem = {
          ...notification,
          id: uuidv4(),
          read: false,
          created_at: new Date().toISOString(),
        }
        set((state) => ({
          notifications: [newItem, ...state.notifications].slice(0, 50),
          unreadCount: state.unreadCount + 1,
        }))
      },

      markAllRead: () => set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      })),

      removeNotification: (id: string) => set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      })),
    }),
    {
      name: 'saas_ui',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    },
  ),
)

// ────────────────────────────────────────────────────────────────
// UI State Types
// ────────────────────────────────────────────────────────────────
export type Theme = 'light' | 'dark' | 'system'

export interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  created_at: string
}

export interface ToastItem {
  id: string
  title: string
  description?: string
  variant: 'default' | 'success' | 'warning' | 'destructive'
  duration?: number
}

export interface SidebarItem {
  id: string
  label: string
  href: string
  icon: string
  badge?: string | number
  children?: SidebarItem[]
}

export interface TableColumn<T> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: T[keyof T], row: T) => React.ReactNode
}

export interface ApiKey {
  id: string
  name: string
  key_prefix: string
  scopes: string[]
  is_active: boolean
  created_at: string
  last_used_at?: string
  expires_at?: string
}

export interface TeamMember {
  id: string
  email: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  is_active: boolean
  joined_at: string
}

export interface WebhookConfig {
  id: string
  url: string
  events: string[]
  is_active: boolean
  secret?: string
  created_at: string
  last_triggered_at?: string
}

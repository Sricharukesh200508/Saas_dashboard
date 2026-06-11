// ────────────────────────────────────────────────────────────────
// Constants — Routes, query keys, etc.
// ────────────────────────────────────────────────────────────────
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
  SETTINGS_PROFILE: '/settings/profile',
  SETTINGS_API_KEYS: '/settings/api-keys',
  SETTINGS_WEBHOOKS: '/settings/webhooks',
  SETTINGS_TEAM: '/settings/team',
  SETTINGS_BILLING: '/settings/billing',
  SETTINGS_SECURITY: '/settings/security',
  SETTINGS_APPEARANCE: '/settings/appearance',
  SETTINGS_WEBHOOK_DELIVERIES: '/settings/webhooks/deliveries',
  SETTINGS_INTEGRATIONS: '/settings/integrations',
  BILLING: '/billing',
  ALERTS: '/alerts',
  AUDIT: '/audit',
  METRICS: '/metrics',
  API_EXPLORER: '/api-explorer',
  INTEGRATIONS: '/integrations',
  NOT_FOUND: '/404',
} as const

export const QUERY_KEYS = {
  METRICS_SUMMARY: ['metrics', 'summary'] as const,
  METRICS_TIMESERIES: (range: string, granularity: string) =>
    ['metrics', 'timeseries', range, granularity] as const,
  TOP_ENDPOINTS: (range: string) => ['metrics', 'top-endpoints', range] as const,
  ERROR_BREAKDOWN: (range: string) => ['metrics', 'error-breakdown', range] as const,
  API_KEYS: ['api-keys'] as const,
  WEBHOOKS: ['webhooks'] as const,
  TEAM_MEMBERS: ['team', 'members'] as const,
  SUBSCRIPTION: ['subscription'] as const,
  INVOICES: ['subscription', 'invoices'] as const,
  PROFILE: ['profile'] as const,
} as const

export const STALE_TIMES = {
  REAL_TIME: 10_000,      // 10 seconds
  DASHBOARD: 30_000,      // 30 seconds
  ANALYTICS: 60_000,      // 1 minute
  SETTINGS: 5 * 60_000,   // 5 minutes
} as const

export const PLANS = {
  starter: { label: 'Starter', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  pro: { label: 'Pro', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  enterprise: { label: 'Enterprise', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
} as const

export const STATUS_COLORS: Record<number, string> = {
  200: '#10B981',
  201: '#10B981',
  204: '#10B981',
  400: '#F59E0B',
  401: '#F59E0B',
  403: '#EF4444',
  404: '#F59E0B',
  429: '#8B5CF6',
  500: '#EF4444',
  502: '#EF4444',
  503: '#EF4444',
}

export const SCOPES = [
  { value: 'metrics:read', label: 'Metrics Read' },
  { value: 'metrics:write', label: 'Metrics Write' },
  { value: 'analytics:read', label: 'Analytics Read' },
  { value: 'admin', label: 'Admin (Full Access)' },
] as const

export const ROLES = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'viewer', label: 'Viewer' },
] as const

export const TOKEN_STORAGE_KEY = 'saas_tokens'
export const USER_STORAGE_KEY = 'saas_user'
export const THEME_STORAGE_KEY = 'saas_theme'

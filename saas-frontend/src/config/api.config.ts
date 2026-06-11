// ────────────────────────────────────────────────────────────────
// API Configuration
// ────────────────────────────────────────────────────────────────
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1',
  WS_URL: import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000/ws',
  TIMEOUT: 30_000,
  RETRY_ATTEMPTS: 3,
} as const

export const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REGISTER_TENANT: '/auth/register-tenant',
  REGISTER_USER: '/auth/register-user',
  REFRESH: '/auth/refresh',
  // Metrics
  METRICS_INGEST: '/metrics/ingest',
  METRICS_INGEST_BATCH: '/metrics/ingest/batch',
  METRICS_SUMMARY: '/metrics/summary',
  METRICS_TIMESERIES: '/metrics/timeseries',
  METRICS_TOP_ENDPOINTS: '/metrics/top-endpoints',
  METRICS_ERROR_BREAKDOWN: '/metrics/error-breakdown',
  // Analytics
  ANALYTICS: '/analytics',
  ANALYTICS_EXPORT: '/analytics/export',
  // Settings
  API_KEYS: '/api-keys',
  WEBHOOKS: '/webhooks',
  TEAM_MEMBERS: '/team/members',
  SUBSCRIPTION: '/subscriptions/current',
  INVOICES: '/subscriptions/invoices',
  // User
  PROFILE: '/users/me',
  // Health
  HEALTH: '/health',
} as const

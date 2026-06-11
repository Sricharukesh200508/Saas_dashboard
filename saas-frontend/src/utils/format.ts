import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'

// ── Number Formatting ────────────────────────────────────────────
export function formatNumber(value: number, decimals = 1): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(decimals)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(decimals)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(decimals)}K`
  return value.toFixed(0)
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function formatLatency(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`
  return `${Math.round(ms)}ms`
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

// ── Date Formatting ──────────────────────────────────────────────
export function formatDate(date: string | Date, pattern = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return 'Invalid date'
  return format(d, pattern)
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return 'Invalid date'
  return format(d, 'MMM d, yyyy HH:mm')
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return 'Unknown'
  return formatDistanceToNow(d, { addSuffix: true })
}

export function formatChartTime(timestamp: string, granularity: 'minute' | 'hour' | 'day'): string {
  const d = parseISO(timestamp)
  if (!isValid(d)) return ''
  switch (granularity) {
    case 'minute': return format(d, 'HH:mm')
    case 'hour': return format(d, 'MMM d HH:mm')
    case 'day': return format(d, 'MMM d')
    default: return format(d, 'MMM d')
  }
}

// ── Trend Formatting ────────────────────────────────────────────
export function formatTrend(change: number): { label: string; isPositive: boolean } {
  const abs = Math.abs(change)
  const label = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
  return { label, isPositive: change >= 0 }
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount / 100) // amount in cents
}

// ── Status Helpers ──────────────────────────────────────────────
export function getStatusLabel(code: number): string {
  const labels: Record<number, string> = {
    200: 'OK', 201: 'Created', 204: 'No Content',
    400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
    404: 'Not Found', 429: 'Rate Limited',
    500: 'Server Error', 502: 'Bad Gateway', 503: 'Unavailable',
  }
  return labels[code] ?? `HTTP ${code}`
}

export function isSuccessStatus(code: number): boolean {
  return code >= 200 && code < 300
}

export function isErrorStatus(code: number): boolean {
  return code >= 400
}

// ── String Helpers ──────────────────────────────────────────────
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength)}…`
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return '••••••••'
  return `${key.slice(0, 8)}${'•'.repeat(16)}`
}

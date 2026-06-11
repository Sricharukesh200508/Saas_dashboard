// ────────────────────────────────────────────────────────────────
// Metrics Types
// ────────────────────────────────────────────────────────────────
export interface MetricEvent {
  id: string
  tenant_id: string
  endpoint: string
  method: string
  status_code: number
  response_time_ms: number
  bytes_transferred?: number
  timestamp: string
  api_key_id?: string
  user_agent?: string
  ip_address?: string
  country?: string
}

export interface MetricsSummary {
  total_calls: number
  total_calls_change: number // percentage change vs previous period
  error_rate: number // percentage
  error_rate_change: number
  p50_latency_ms: number
  p95_latency_ms: number
  p99_latency_ms: number
  latency_change: number
  bytes_transferred: number
  bytes_change: number
  active_endpoints: number
}

export interface TopEndpoint {
  endpoint: string
  method: string
  call_count: number
  error_count: number
  error_rate: number
  avg_latency_ms: number
  p99_latency_ms: number
}

export interface TimeSeriesDataPoint {
  timestamp: string
  calls: number
  errors: number
  avg_latency_ms: number
  p99_latency_ms: number
  bytes: number
}

export interface ErrorBreakdown {
  status_code: number
  count: number
  percentage: number
  label: string
}

export interface LiveMetricEvent {
  type: 'metric'
  tenant_id: string
  endpoint: string
  method: string
  status_code: number
  response_time_ms: number
  timestamp: string
}

export type TimeGranularity = 'minute' | 'hour' | 'day'
export type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d' | '90d' | 'custom'

import { apiClient } from './client'
import type { MetricsSummary, TopEndpoint, TimeSeriesDataPoint, ErrorBreakdown, TimeGranularity, TimeRange } from '@/types/metrics'

// We changed the backend endpoint from /metrics to /metrics for FastAPI
export const metricsApi = {
  getSummary: async (): Promise<MetricsSummary> => {
    const response = await apiClient.get<MetricsSummary>('/metrics/summary')
    return response.data
  },

  getTimeSeries: async (range: TimeRange, granularity: TimeGranularity): Promise<TimeSeriesDataPoint[]> => {
    const response = await apiClient.get<TimeSeriesDataPoint[]>('/metrics/timeseries', {
      params: { time_range: range, granularity },
    })
    return response.data
  },

  getTopEndpoints: async (range: TimeRange): Promise<TopEndpoint[]> => {
    const response = await apiClient.get<TopEndpoint[]>('/metrics/top-endpoints', {
      params: { time_range: range },
    })
    return response.data
  },

  getErrorBreakdown: async (range: TimeRange): Promise<ErrorBreakdown[]> => {
    const response = await apiClient.get<ErrorBreakdown[]>('/metrics/error-breakdown', {
      params: { time_range: range },
    })
    return response.data
  },

  getOverview: async (params: { time_range: string }): Promise<any> => {
    const response = await apiClient.get('/metrics/summary', { params })
    return response.data
  }
}

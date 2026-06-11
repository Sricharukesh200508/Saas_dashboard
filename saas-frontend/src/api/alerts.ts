import { apiClient } from './client'

export interface Alert {
  id: string
  name: string
  description?: string
  metric: string
  operator: string
  threshold: number
  window_minutes: number
  channels: Record<string, string[]>
  is_active: boolean
  last_triggered_at?: string
}

export const alertsApi = {
  getAlerts: () => apiClient.get<Alert[]>('/alerts').then(res => res.data),
  createAlert: (data: Partial<Alert>) => apiClient.post<Alert>('/alerts', data).then(res => res.data),
  updateAlert: (id: string, data: Partial<Alert>) => apiClient.patch<Alert>(`/alerts/${id}`, data).then(res => res.data),
  deleteAlert: (id: string) => apiClient.delete(`/alerts/${id}`).then(res => res.data),
}

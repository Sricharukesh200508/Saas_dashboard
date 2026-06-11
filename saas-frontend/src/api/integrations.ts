import { apiClient } from './client'

export interface Integration {
  id: string
  provider: string
  is_active: boolean
  created_at: string
}

export const integrationsApi = {
  getIntegrations: () => apiClient.get<Integration[]>('/integrations').then(res => res.data),
  createIntegration: (data: { provider: string, credentials: any, is_active: boolean }) => apiClient.post<Integration>('/integrations', data).then(res => res.data),
  deleteIntegration: (id: string) => apiClient.delete(`/integrations/${id}`).then(res => res.data),
}

import { apiClient } from './client'

export interface WebhookEndpoint {
  id: string
  name: string
  url: string
  events: string[]
  is_active: boolean
  secret?: string
  created_at: string
}

export interface WebhookDelivery {
  id: string
  webhook_endpoint_id: string
  event_type: string
  url: string
  request_payload: any
  response_status?: number
  response_body?: string
  success: boolean
  created_at: string
}

export const webhooksApi = {
  getEndpoints: () => apiClient.get<WebhookEndpoint[]>('/user-webhooks').then(res => res.data),
  createEndpoint: (data: Partial<WebhookEndpoint>) => apiClient.post<WebhookEndpoint>('/user-webhooks', data).then(res => res.data),
  deleteEndpoint: (id: string) => apiClient.delete(`/user-webhooks/${id}`).then(res => res.data),
  getDeliveries: () => apiClient.get<WebhookDelivery[]>('/user-webhooks/deliveries').then(res => res.data),
  retryDelivery: (id: string) => apiClient.post(`/user-webhooks/deliveries/${id}/retry`).then(res => res.data),
}

import { apiClient } from './client'

export interface AuditLog {
  id: string
  tenant_id: string
  user_id?: string
  action: string
  resource_type: string
  resource_id: string
  before_state?: Record<string, any>
  after_state?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

export const auditApi = {
  getLogs: () => apiClient.get<AuditLog[]>('/audit-logs').then(res => res.data),
}

import { apiClient } from './client'

export interface TenantSettings {
  theme?: 'light' | 'dark' | 'system'
  brand_color?: string
  logo_url?: string
}

export interface Tenant {
  id: string
  name: string
  slug: string
  domain?: string
  plan: string
  is_active: boolean
  settings?: TenantSettings
}

export const tenantApi = {
  getSettings: () => apiClient.get<Tenant>('/tenant/settings').then(res => res.data),
  updateSettings: (data: { settings: TenantSettings }) => apiClient.patch<Tenant>('/tenant/settings', data).then(res => res.data),
}

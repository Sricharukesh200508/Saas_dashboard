import { apiClient } from './client'

export interface ApiKey {
  id: string
  name: string
  partial_key: string
  raw_key?: string
  scopes: string[]
  created_at: string
  last_used_at?: string
}

import { ENDPOINTS } from '../config/api.config'

export const apiKeysApi = {
  getKeys: () => apiClient.get<ApiKey[]>(ENDPOINTS.API_KEYS).then(res => res.data),
  createKey: (data: { name: string; scopes: string[] }) => apiClient.post<ApiKey>(ENDPOINTS.API_KEYS, data).then(res => res.data),
  deleteKey: (id: string) => apiClient.delete(`${ENDPOINTS.API_KEYS}/${id}`).then(res => res.data),
}

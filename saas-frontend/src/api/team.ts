import { apiClient } from './client'

export interface TeamMember {
  id: string
  email: string
  full_name?: string
  role: string
  is_active: boolean
  created_at: string
}

export const teamApi = {
  getMembers: () => apiClient.get<TeamMember[]>('/team').then(res => res.data),
  removeMember: (id: string) => apiClient.delete(`/team/${id}`).then(res => res.data),
  inviteMember: (data: { email: string, role: string }) => apiClient.post<TeamMember>('/team', data).then(res => res.data),
}

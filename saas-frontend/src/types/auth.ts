// ────────────────────────────────────────────────────────────────
// Auth Types
// ────────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  tenant_id: string
  is_active: boolean
  created_at: string
}

export interface Tenant {
  id: string
  name: string
  slug: string
  plan: 'starter' | 'pro' | 'enterprise'
  is_active: boolean
  created_at: string
}

export interface Token {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface TokenPayload {
  sub: string
  tenant_id: string
  role: string
  scopes: string[]
  exp: number
  iat: number
}

export interface AuthState {
  user: User | null
  tokens: Token | null
  tenant_id: string | null
  role: string | null
  isAuthenticated: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface TenantRegisterRequest {
  tenant_name: string
  tenant_slug: string
  domain?: string
  owner_email: string
  owner_password: string
}

export interface UserRegisterRequest {
  email: string
  password: string
  role?: string
}

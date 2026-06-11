// ────────────────────────────────────────────────────────────────
// Subscription Types
// ────────────────────────────────────────────────────────────────
export type PlanTier = 'starter' | 'pro' | 'enterprise'

export interface Plan {
  id: PlanTier
  name: string
  price_monthly: number
  price_yearly: number
  api_call_limit: number
  storage_limit_gb: number
  team_members_limit: number
  features: string[]
}

export interface Subscription {
  id: string
  tenant_id: string
  plan: PlanTier
  status: 'active' | 'past_due' | 'canceled' | 'trialing'
  stripe_subscription_id?: string
  stripe_customer_id?: string
  current_period_start: string
  current_period_end: string
  api_call_limit: number
  storage_limit_gb: number
  created_at: string
  updated_at: string
}

export interface UsageStats {
  api_calls_used: number
  api_calls_limit: number
  api_calls_percentage: number
  storage_used_gb: number
  storage_limit_gb: number
  storage_percentage: number
  team_members: number
  team_members_limit: number
  period_start: string
  period_end: string
}

export interface Invoice {
  id: string
  amount_paid: number
  currency: string
  status: 'paid' | 'open' | 'void' | 'uncollectible'
  created: string
  invoice_pdf?: string
  period_start: string
  period_end: string
}

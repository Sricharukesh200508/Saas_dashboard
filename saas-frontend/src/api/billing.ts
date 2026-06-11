import { apiClient } from './client'

export interface Subscription {
  id: string
  plan: string
  status: string
  current_period_end: string
  cancel_at_period_end: boolean
}

export interface Invoice {
  id: string
  amount_paid: number
  status: string
  created_at: string
  invoice_pdf: string
}

export const billingApi = {
  getSubscription: () => apiClient.get<Subscription>('/billing/subscription').then(res => res.data),
  getInvoices: () => apiClient.get<Invoice[]>('/billing/invoices').then(res => res.data),
}

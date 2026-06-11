import { create } from 'zustand'
import type { Subscription, UsageStats, Invoice } from '@/types/subscription'

interface SubscriptionsStore {
  subscription: Subscription | null
  usage: UsageStats | null
  invoices: Invoice[]
  setSubscription: (sub: Subscription) => void
  setUsage: (usage: UsageStats) => void
  setInvoices: (invoices: Invoice[]) => void
}

export const useSubscriptionsStore = create<SubscriptionsStore>()((set) => ({
  subscription: null,
  usage: null,
  invoices: [],
  setSubscription: (subscription) => set({ subscription }),
  setUsage: (usage) => set({ usage }),
  setInvoices: (invoices) => set({ invoices }),
}))

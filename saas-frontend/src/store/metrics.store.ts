import { create } from 'zustand'
import type { MetricsSummary, LiveMetricEvent } from '@/types/metrics'

interface MetricsStore {
  summary: MetricsSummary | null
  liveEvents: LiveMetricEvent[]
  wsConnected: boolean
  wsReconnecting: boolean
  totalLiveCalls: number
  totalLiveErrors: number
  setSummary: (summary: MetricsSummary) => void
  addLiveEvent: (event: LiveMetricEvent) => void
  setWsConnected: (connected: boolean) => void
  setWsReconnecting: (reconnecting: boolean) => void
  clearLiveEvents: () => void
}

export const useMetricsStore = create<MetricsStore>()((set) => ({
  summary: null,
  liveEvents: [],
  wsConnected: false,
  wsReconnecting: false,
  totalLiveCalls: 0,
  totalLiveErrors: 0,

  setSummary: (summary) => set({ summary }),

  addLiveEvent: (event) =>
    set((state) => ({
      liveEvents: [event, ...state.liveEvents].slice(0, 50), // Keep last 50
      totalLiveCalls: state.totalLiveCalls + 1,
      totalLiveErrors:
        event.status_code >= 400
          ? state.totalLiveErrors + 1
          : state.totalLiveErrors,
    })),

  setWsConnected: (connected) => set({ wsConnected: connected }),
  setWsReconnecting: (reconnecting) => set({ wsReconnecting: reconnecting }),
  clearLiveEvents: () => set({ liveEvents: [], totalLiveCalls: 0, totalLiveErrors: 0 }),
}))

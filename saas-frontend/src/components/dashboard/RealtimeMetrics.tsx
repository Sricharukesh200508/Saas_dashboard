import React from 'react'
import { Card, Badge } from '../shared/index'
import { useMetricsStore } from '@/store/metrics.store'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Activity, Radio, AlertCircle } from 'lucide-react'
import { formatDateTime, getStatusLabel, isErrorStatus } from '@/utils/format'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

export const RealtimeMetrics: React.FC = () => {
  // Initialize WebSocket connection
  useWebSocket()
  
  const { liveEvents, wsConnected, wsReconnecting, totalLiveCalls, totalLiveErrors } = useMetricsStore()

  const liveErrorRate = totalLiveCalls > 0 ? (totalLiveErrors / totalLiveCalls) * 100 : 0

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Radio className="h-5 w-5 text-secondary" />
            Live Activity
          </h3>
          <p className="text-sm text-[var(--text-muted)]">Real-time API stream</p>
        </div>
        <div className="flex items-center gap-3">
          {wsReconnecting ? (
            <Badge variant="warning" className="animate-pulse">Reconnecting...</Badge>
          ) : wsConnected ? (
            <span className="live-badge">
              <span className="status-dot live" />
              Live
            </span>
          ) : (
            <Badge variant="error" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Disconnected
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[var(--bg-elevated)] rounded-xl p-4 border border-[var(--border-color)]">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Calls / min</p>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{totalLiveCalls}</div>
        </div>
        <div className="bg-[var(--bg-elevated)] rounded-xl p-4 border border-[var(--border-color)]">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Live Error Rate</p>
          <div className={clsx('text-2xl font-bold', liveErrorRate > 5 ? 'text-error' : 'text-success')}>
            {liveErrorRate.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Recent Requests</h4>
        
        {liveEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-[var(--text-muted)] border border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-elevated)]/50">
            <Activity className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Waiting for incoming traffic...</p>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            <AnimatePresence initial={false}>
              {liveEvents.slice(0, 20).map((event, idx) => {
                const isError = isErrorStatus(event.status_code)
                return (
                  <motion.div
                    key={`${event.timestamp}-${idx}`}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={clsx(
                      'flex items-center justify-between p-3 rounded-lg border text-sm transition-colors',
                      isError 
                        ? 'bg-error/5 border-error/20' 
                        : 'bg-[var(--bg-elevated)] border-[var(--border-color)] hover:border-secondary/30'
                    )}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Badge variant={isError ? 'error' : 'success'} className="shrink-0 w-12 justify-center font-mono text-[10px]">
                        {event.method}
                      </Badge>
                      <div className="truncate">
                        <p className={clsx('font-medium truncate', isError ? 'text-error' : 'text-[var(--text-primary)]')}>
                          {event.endpoint}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {formatDateTime(event.timestamp)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end shrink-0 ml-2">
                      <span className={clsx('font-mono text-xs font-semibold', isError ? 'text-error' : 'text-success')}>
                        {event.status_code}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] font-mono">
                        {Math.round(event.response_time_ms)}ms
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Card>
  )
}

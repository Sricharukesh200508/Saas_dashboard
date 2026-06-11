import React from 'react'
import { Card } from '../shared/index'
import { Activity, AlertTriangle, ArrowUpRight, ArrowDownRight, HardDrive, Zap } from 'lucide-react'
import { formatNumber, formatTrend, formatBytes } from '@/utils/format'
import { clsx } from 'clsx'
import type { MetricsSummary } from '@/types/metrics'
import { NumberCounter } from '../animations/index'

interface MetricsOverviewProps {
  summary: MetricsSummary | null
  isLoading: boolean
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ summary, isLoading }) => {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-4 w-24 bg-[var(--bg-elevated)] rounded mb-4" />
            <div className="h-8 w-32 bg-[var(--bg-elevated)] rounded mb-2" />
            <div className="h-3 w-16 bg-[var(--bg-elevated)] rounded" />
          </Card>
        ))}
      </div>
    )
  }

  const metrics = [
    {
      title: 'Total API Calls',
      value: summary.total_calls,
      formatter: formatNumber,
      change: summary.total_calls_change,
      icon: <Activity className="h-5 w-5" />,
      color: 'text-primary-light',
      bg: 'bg-primary-500/10',
    },
    {
      title: 'Error Rate',
      value: summary.error_rate,
      formatter: (v: number) => `${v.toFixed(2)}%`,
      change: summary.error_rate_change,
      icon: <AlertTriangle className="h-5 w-5" />,
      color: summary.error_rate > 5 ? 'text-error' : 'text-warning',
      bg: summary.error_rate > 5 ? 'bg-error/10' : 'bg-warning/10',
      inverseTrend: true, // For errors, down is good
    },
    {
      title: 'p99 Latency',
      value: summary.p99_latency_ms,
      formatter: (v: number) => `${Math.round(v)}ms`,
      change: summary.latency_change,
      icon: <Zap className="h-5 w-5" />,
      color: 'text-secondary',
      bg: 'bg-secondary/10',
      inverseTrend: true,
    },
    {
      title: 'Data Transferred',
      value: summary.bytes_transferred,
      formatter: formatBytes,
      change: summary.bytes_change,
      icon: <HardDrive className="h-5 w-5" />,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((item, index) => {
        const trend = formatTrend(item.change)
        // If inverseTrend is true (e.g. latency, errors), then a negative change is "good" (positive).
        const isGood = item.inverseTrend ? !trend.isPositive : trend.isPositive

        return (
          <Card key={index} hover className="relative overflow-hidden">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--text-muted)] truncate">{item.title}</p>
              <div className={clsx('rounded-lg p-2', item.bg, item.color)}>
                {item.icon}
              </div>
            </div>
            
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                <NumberCounter value={item.value} formatter={item.formatter} />
              </span>
            </div>

            <div className="mt-2 flex items-center gap-1 text-sm">
              <span className={clsx('flex items-center font-medium', isGood ? 'text-success' : 'text-error')}>
                {trend.isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {trend.label}
              </span>
              <span className="text-[var(--text-muted)]">vs last period</span>
            </div>
            
            {/* Subtle gradient accent */}
            <div className={clsx('absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl opacity-20', item.bg)} />
          </Card>
        )
      })}
    </div>
  )
}

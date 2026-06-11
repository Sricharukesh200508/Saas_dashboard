import React, { useMemo } from 'react'
import { Card } from '../shared/index'
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { TimeSeriesDataPoint, TimeGranularity } from '@/types/metrics'
import { formatChartTime, formatNumber, formatLatency } from '@/utils/format'
import { useUIStore } from '@/store/ui.store'

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[]
  granularity: TimeGranularity
  metric: 'calls' | 'latency' | 'errors'
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ data, granularity, metric }) => {
  const { theme } = useUIStore()
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      formattedTime: formatChartTime(d.timestamp, granularity),
    }))
  }, [data, granularity])

  const colors = {
    calls: '#00D9FF', // secondary
    latency: '#8B5CF6', // purple
    errors: '#EF4444', // error
  }

  const metricConfig = {
    calls: { dataKey: 'calls', name: 'API Calls', color: colors.calls, formatter: formatNumber },
    latency: { dataKey: 'p99_latency_ms', name: 'p99 Latency', color: colors.latency, formatter: formatLatency },
    errors: { dataKey: 'errors', name: 'Errors', color: colors.errors, formatter: formatNumber },
  }

  const activeConfig = metricConfig[metric]

  return (
    <Card className="h-[400px] w-full pt-4 pb-2">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={activeConfig.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={activeConfig.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#e2e8f0'} />
          <XAxis 
            dataKey="formattedTime" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 12 }}
            dy={10}
            minTickGap={30}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 12 }}
            tickFormatter={(value) => activeConfig.formatter(value)}
            dx={-10}
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              borderColor: isDark ? '#1e293b' : '#e2e8f0',
              borderRadius: '8px',
              color: isDark ? '#f1f5f9' : '#0f172a',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}
            itemStyle={{ color: activeConfig.color, fontWeight: 600 }}
            formatter={(value: number) => [activeConfig.formatter(value), activeConfig.name]}
            labelStyle={{ color: isDark ? '#94a3b8' : '#64748b', marginBottom: '4px' }}
          />
          <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
          <Area
            type="monotone"
            dataKey={activeConfig.dataKey}
            name={activeConfig.name}
            stroke={activeConfig.color}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#gradient-${metric})`}
            activeDot={{ r: 6, strokeWidth: 0, fill: activeConfig.color }}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </Card>
  )
}

import React from 'react'
import { Card } from '../shared/index'
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { ErrorBreakdown } from '@/types/metrics'
import { useUIStore } from '@/store/ui.store'

export const ErrorBreakdownChart: React.FC<{ data: ErrorBreakdown[] }> = ({ data }) => {
  const { theme } = useUIStore()
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  // Filter out 200s for the *error* breakdown, but we might want to show them in a general status code chart
  // For now, let's show all that aren't 2xx if this is strictly "Error Breakdown"
  const errorData = data.filter(d => d.status_code >= 400).sort((a, b) => b.count - a.count)

  const COLORS = {
    400: '#F59E0B', // warning (amber)
    401: '#D97706', // dark amber
    403: '#B45309', // darker amber
    404: '#3B82F6', // blue
    429: '#8B5CF6', // purple
    500: '#EF4444', // error (red)
    502: '#DC2626', // dark red
    503: '#B91C1C', // darker red
  }

  return (
    <Card className="h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Error Breakdown</h3>
        <p className="text-sm text-[var(--text-muted)]">By status code</p>
      </div>
      
      <div className="flex-1 min-h-[250px]">
        {errorData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[var(--text-muted)]">
            No errors recorded in this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={errorData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
                nameKey="label"
              >
                {errorData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.status_code as keyof typeof COLORS] || '#94a3b8'} 
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ 
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  borderColor: isDark ? '#1e293b' : '#e2e8f0',
                  borderRadius: '8px',
                  color: isDark ? '#f1f5f9' : '#0f172a',
                }}
                itemStyle={{ fontWeight: 600 }}
                formatter={(value: number) => value.toLocaleString()}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                wrapperStyle={{ fontSize: '12px' }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}

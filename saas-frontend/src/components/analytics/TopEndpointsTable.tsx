import React from 'react'
import { Card, Badge } from '../shared/index'
import type { TopEndpoint } from '@/types/metrics'
import { formatNumber, formatLatency } from '@/utils/format'
import { clsx } from 'clsx'

export const TopEndpointsTable: React.FC<{ endpoints: TopEndpoint[] }> = ({ endpoints }) => {
  return (
    <Card className="h-full overflow-hidden flex flex-col p-0">
      <div className="p-6 border-b border-[var(--border-color)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Top Endpoints</h3>
        <p className="text-sm text-[var(--text-muted)]">By call volume</p>
      </div>
      
      <div className="flex-1 overflow-auto">
        <table className="w-full data-table">
          <thead className="bg-[var(--bg-elevated)]/50 sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th className="text-left font-medium">Endpoint</th>
              <th className="text-right font-medium">Calls</th>
              <th className="text-right font-medium">Errors</th>
              <th className="text-right font-medium">p99 Latency</th>
            </tr>
          </thead>
          <tbody>
            {endpoints.map((ep, idx) => (
              <tr key={`${ep.method}-${ep.endpoint}-${idx}`}>
                <td className="whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="w-14 justify-center font-mono text-[10px]">
                      {ep.method}
                    </Badge>
                    <span className="font-medium text-[var(--text-primary)]">{ep.endpoint}</span>
                  </div>
                </td>
                <td className="text-right text-[var(--text-primary)] font-medium">
                  {formatNumber(ep.call_count)}
                </td>
                <td className="text-right">
                  <span className={clsx('font-medium', ep.error_rate > 5 ? 'text-error' : ep.error_count > 0 ? 'text-warning' : 'text-success')}>
                    {formatNumber(ep.error_count)} 
                    <span className="text-[10px] ml-1 opacity-70">({ep.error_rate.toFixed(1)}%)</span>
                  </span>
                </td>
                <td className="text-right text-[var(--text-secondary)]">
                  {formatLatency(ep.p99_latency_ms)}
                </td>
              </tr>
            ))}
            {endpoints.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-[var(--text-muted)]">
                  No endpoint data available for this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

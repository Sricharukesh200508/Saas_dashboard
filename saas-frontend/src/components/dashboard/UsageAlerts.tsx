import React from 'react'
import { Card } from '../shared/index'
import { useQuery } from '@tanstack/react-query'
import { billingApi, metricsApi } from '@/api'
import { AlertTriangle, Info, BellRing } from 'lucide-react'

export const UsageAlerts: React.FC = () => {
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: billingApi.getSubscription
  })

  const { data: metrics } = useQuery({
    queryKey: ['metrics', 'overview'],
    queryFn: () => metricsApi.getOverview({ time_range: '7d' })
  })

  const currentPlan = subscription?.plan || 'starter'
  const planLimits = {
    starter: { api: 10000, storage: 5 },
    pro: { api: 100000, storage: 50 },
    hobby: { api: 1000, storage: 1 }
  }

  const limits = planLimits[currentPlan as keyof typeof planLimits] || planLimits.starter
  const apiCount = metrics?.total_events || 0
  const apiPercentage = Math.min((apiCount / limits.api) * 100, 100)

  const storageGB = 1.2
  const storagePercentage = Math.min((storageGB / limits.storage) * 100, 100)

  const alerts = []

  if (apiPercentage > 90) {
    alerts.push({
      type: 'critical',
      title: 'API Rate Limit Approaching',
      message: `You have used ${apiPercentage.toFixed(1)}% of your monthly API quota. Your API will be temporarily disabled if you exceed the limit.`,
    })
  } else if (apiPercentage > 75) {
    alerts.push({
      type: 'warning',
      title: 'High API Usage',
      message: `You are approaching your monthly API limit (${apiPercentage.toFixed(1)}% used). Consider upgrading your plan.`,
    })
  }

  if (storagePercentage > 90) {
    alerts.push({
      type: 'critical',
      title: 'Storage Limit Approaching',
      message: `You have used ${storagePercentage.toFixed(1)}% of your storage quota. Old metrics may be deleted.`,
    })
  }

  // If no critical/warning alerts, show an info one for design purposes
  if (alerts.length === 0) {
    alerts.push({
      type: 'info',
      title: 'System Optimal',
      message: 'All usage metrics are within normal bounds. No action required.',
    })
  }

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <BellRing className="h-5 w-5 text-warning" />
          Alerts
        </h3>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {alerts.map((alert, idx) => (
          <div 
            key={idx} 
            className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all hover:scale-[1.01] ${
              alert.type === 'critical' ? 'bg-error/10 border-error/30 text-error' :
              alert.type === 'warning' ? 'bg-warning/10 border-warning/30 text-warning' :
              'bg-primary-500/10 border-primary-500/30 text-primary-light'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {alert.type === 'critical' ? <AlertTriangle className="h-5 w-5" /> :
               alert.type === 'warning' ? <AlertTriangle className="h-5 w-5" /> :
               <Info className="h-5 w-5" />}
            </div>
            <div>
              <h4 className="text-sm font-bold mb-0.5">{alert.title}</h4>
              <p className="text-xs opacity-90 leading-relaxed">{alert.message}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

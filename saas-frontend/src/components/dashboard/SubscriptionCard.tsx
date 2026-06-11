import React from 'react'
import { Card, Badge, Button } from '../shared/index'
import { formatNumber } from '@/utils/format'
import { PLANS } from '@/utils/constants'
import { Crown, HardDrive, Zap, CreditCard } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { ROUTES } from '@/utils/constants'
import { useQuery } from '@tanstack/react-query'
import { billingApi, metricsApi } from '@/api'

export const SubscriptionCard: React.FC = () => {
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: billingApi.getSubscription
  })

  const { data: metrics } = useQuery({
    queryKey: ['metrics', 'overview'],
    queryFn: () => metricsApi.getOverview({ time_range: '7d' })
  })

  const currentPlan = subscription?.plan || 'starter'
  const planInfo = PLANS[currentPlan as keyof typeof PLANS] || PLANS.starter

  // Simulated limits based on plan
  const planLimits = {
    starter: { api: 10000, storage: 5 },
    pro: { api: 100000, storage: 50 },
    hobby: { api: 1000, storage: 1 }
  }

  const limits = planLimits[currentPlan as keyof typeof planLimits] || planLimits.starter
  const apiCount = metrics?.total_events || 0
  const apiPercentage = Math.min((apiCount / limits.api) * 100, 100)

  // Dummy storage for now
  const storageGB = 1.2
  const storagePercentage = Math.min((storageGB / limits.storage) * 100, 100)

  return (
    <Card className="flex flex-col h-full bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-elevated)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Crown className={`h-5 w-5 ${planInfo.color}`} />
            Current Plan
          </h3>
        </div>
        <Badge className={planInfo.bg + ' ' + planInfo.color + ' border-transparent font-bold px-3 py-1 text-sm capitalize'}>
          {currentPlan}
        </Badge>
      </div>

      <div className="space-y-6 flex-1">
        {/* API Calls Usage */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="flex items-center gap-1.5 text-[var(--text-secondary)] font-medium">
              <Zap className="h-4 w-4" /> API Calls
            </span>
            <span className="text-[var(--text-primary)] font-semibold">
              {formatNumber(apiCount)} <span className="text-[var(--text-muted)] font-normal">/ {formatNumber(limits.api)}</span>
            </span>
          </div>
          <ProgressBar value={apiPercentage} />
        </div>

        {/* Storage Usage */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="flex items-center gap-1.5 text-[var(--text-secondary)] font-medium">
              <HardDrive className="h-4 w-4" /> Storage
            </span>
            <span className="text-[var(--text-primary)] font-semibold">
              {storageGB.toFixed(1)} GB <span className="text-[var(--text-muted)] font-normal">/ {limits.storage} GB</span>
            </span>
          </div>
          <ProgressBar value={storagePercentage} />
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
        <Link to={ROUTES.SETTINGS_BILLING}>
          <Button variant="outline" fullWidth leftIcon={<CreditCard className="h-4 w-4" />}>
            Manage Billing
          </Button>
        </Link>
      </div>
    </Card>
  )
}

const ProgressBar: React.FC<{ value: number }> = ({ value }) => {
  // Determine color based on usage percentage
  let colorClass = 'bg-primary-500'
  if (value > 90) colorClass = 'bg-error'
  else if (value > 75) colorClass = 'bg-warning'

  return (
    <div className="h-2.5 w-full bg-[var(--bg-base)] rounded-full overflow-hidden border border-[var(--border-color)]">
      <div 
        className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${colorClass}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      >
        <div className="absolute inset-0 bg-white/20 animate-pulse-dot" />
      </div>
    </div>
  )
}

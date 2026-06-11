import React, { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { metricsApi } from '@/api/metrics'
import { QUERY_KEYS } from '@/utils/constants'
import { MetricsOverview } from './MetricsOverview'
import { RealtimeMetrics } from './RealtimeMetrics'
import { SubscriptionCard } from './SubscriptionCard'
import { UsageAlerts } from './UsageAlerts'
import { FadeIn, Stagger, SlideIn } from '../animations/index'
import { useMetricsStore } from '@/store/metrics.store'
import { Button, Spinner } from '../shared/index'
import { ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { ROUTES } from '@/utils/constants'
import { TimeSeriesChart } from '@/components/analytics/TimeSeriesChart'

export const DashboardHome: React.FC = () => {
  const { setSummary } = useMetricsStore()

  const { data: summary, isLoading } = useQuery({
    queryKey: QUERY_KEYS.METRICS_SUMMARY,
    queryFn: metricsApi.getSummary,
    staleTime: 30_000,
  })

  const { data: timeseries, isLoading: isTsLoading } = useQuery({
    queryKey: QUERY_KEYS.METRICS_TIMESERIES('24h', 'hour'),
    queryFn: () => metricsApi.getTimeSeries('24h', 'hour'),
    staleTime: 60_000,
  })

  useEffect(() => {
    if (summary) {
      setSummary(summary)
    }
  }, [summary, setSummary])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <FadeIn>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard Overview</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Real-time metrics and system status</p>
        </FadeIn>
        
        <FadeIn delay={0.1}>
          <Link to={ROUTES.ANALYTICS}>
            <Button variant="outline" rightIcon={<ArrowRight size={16} />}>
              Full Analytics
            </Button>
          </Link>
        </FadeIn>
      </div>

      <Stagger staggerDelay={0.1}>
        <MetricsOverview summary={summary || null} isLoading={isLoading} />
        
        <div className="mt-6 glass-light dark:glass rounded-2xl p-6 relative min-h-[300px]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Traffic (Last 24 Hours)</h3>
          {isTsLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <TimeSeriesChart data={timeseries || []} granularity="hour" metric="calls" />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 h-[400px]">
            <RealtimeMetrics />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 h-[400px]">
            <div className="h-full">
              <SubscriptionCard />
            </div>
            <div className="h-full">
              <UsageAlerts />
            </div>
          </div>
        </div>
      </Stagger>
    </div>
  )
}

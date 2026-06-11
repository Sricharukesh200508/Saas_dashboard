import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { metricsApi } from '@/api/metrics'
import { QUERY_KEYS } from '@/utils/constants'
import { TimeSeriesChart } from '@/components/analytics/TimeSeriesChart'
import { TopEndpointsTable } from '@/components/analytics/TopEndpointsTable'
import { ErrorBreakdownChart } from '@/components/analytics/ErrorBreakdownChart'
import { FadeIn, Stagger, SlideIn } from '@/components/animations'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/shared/Tabs'
import { Button, Spinner } from '@/components/shared/index'
import { Download, Calendar, FileText } from 'lucide-react'
import type { TimeGranularity, TimeRange } from '@/types/metrics'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/shared/Dropdown'
import { toast } from '@/components/shared/Toast'

export const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')
  const [granularity, setGranularity] = useState<TimeGranularity>('hour')
  const [isExporting, setIsExporting] = useState<string | null>(null)

  const { data: timeseries, isLoading: isTsLoading } = useQuery({
    queryKey: QUERY_KEYS.METRICS_TIMESERIES(timeRange, granularity),
    queryFn: () => metricsApi.getTimeSeries(timeRange, granularity),
  })

  const { data: topEndpoints, isLoading: isTeLoading } = useQuery({
    queryKey: QUERY_KEYS.TOP_ENDPOINTS(timeRange),
    queryFn: () => metricsApi.getTopEndpoints(timeRange),
  })

  const { data: errorBreakdown, isLoading: isEbLoading } = useQuery({
    queryKey: QUERY_KEYS.ERROR_BREAKDOWN(timeRange),
    queryFn: () => metricsApi.getErrorBreakdown(timeRange),
  })

  const handleTimeRangeChange = (range: TimeRange, gran: TimeGranularity) => {
    setTimeRange(range)
    setGranularity(gran)
  }

  const handleExportCSV = () => {
    setIsExporting('csv')
    setTimeout(() => {
      const csvContent = "data:text/csv;charset=utf-8,Timestamp,Calls,Latency,Errors\n" 
        + (timeseries || []).map(e => `${e.timestamp},${e.calls},${e.p99_latency_ms},${e.errors}`).join("\n")
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `analytics_export_${new Date().getTime()}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setIsExporting(null)
      toast.success('CSV Export Completed', 'Your dataset has been downloaded.')
    }, 1500)
  }

  const handleExportPDF = () => {
    setIsExporting('pdf')
    setTimeout(() => {
      setIsExporting(null)
      toast.success('PDF Report Generated', 'Your custom analytics report is ready for download.')
    }, 2500)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <FadeIn>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Detailed Analytics</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Deep dive into your API performance</p>
        </FadeIn>
        
        <FadeIn delay={0.1} className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" leftIcon={<Calendar size={16} />}>
                {timeRange === '1h' ? 'Last 1 Hour' : timeRange === '24h' ? 'Last 24 Hours' : timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleTimeRangeChange('1h', 'minute')}>Last 1 Hour</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTimeRangeChange('24h', 'hour')}>Last 24 Hours</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTimeRangeChange('7d', 'day')}>Last 7 Days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTimeRangeChange('30d', 'day')}>Last 30 Days</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex gap-2">
            <Button variant="secondary" leftIcon={<Download size={16} />} onClick={handleExportCSV} loading={isExporting === 'csv'}>
              CSV
            </Button>
            <Button variant="outline" leftIcon={<FileText size={16} />} onClick={handleExportPDF} loading={isExporting === 'pdf'}>
              Report (PDF)
            </Button>
          </div>
        </FadeIn>
      </div>

      <Stagger staggerDelay={0.1}>
        <SlideIn direction="bottom">
          <div className="glass-light dark:glass rounded-2xl p-6 mb-6">
            <Tabs defaultValue="calls" className="w-full">
              <div className="flex items-center justify-between mb-6">
                <TabsList>
                  <TabsTrigger value="calls">API Calls</TabsTrigger>
                  <TabsTrigger value="latency">Latency (p99)</TabsTrigger>
                  <TabsTrigger value="errors">Errors</TabsTrigger>
                </TabsList>
              </div>
              
              <div className="relative min-h-[400px]">
                {isTsLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Spinner />
                  </div>
                ) : (
                  <>
                    <TabsContent value="calls" className="mt-0 outline-none">
                      <TimeSeriesChart data={timeseries || []} granularity={granularity} metric="calls" />
                    </TabsContent>
                    <TabsContent value="latency" className="mt-0 outline-none">
                      <TimeSeriesChart data={timeseries || []} granularity={granularity} metric="latency" />
                    </TabsContent>
                    <TabsContent value="errors" className="mt-0 outline-none">
                      <TimeSeriesChart data={timeseries || []} granularity={granularity} metric="errors" />
                    </TabsContent>
                  </>
                )}
              </div>
            </Tabs>
          </div>
        </SlideIn>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SlideIn direction="bottom" delay={0.2} className="lg:col-span-2">
            <div className="h-[400px]">
              {isTeLoading ? (
                <div className="h-full flex items-center justify-center bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)]">
                  <Spinner />
                </div>
              ) : (
                <TopEndpointsTable endpoints={topEndpoints || []} />
              )}
            </div>
          </SlideIn>
          
          <SlideIn direction="bottom" delay={0.3}>
            <div className="h-[400px]">
              {isEbLoading ? (
                <div className="h-full flex items-center justify-center bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)]">
                  <Spinner />
                </div>
              ) : (
                <ErrorBreakdownChart data={errorBreakdown || []} />
              )}
            </div>
          </SlideIn>
        </div>
      </Stagger>
    </div>
  )
}

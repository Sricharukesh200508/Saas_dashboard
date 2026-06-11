import React from 'react'
import { Card, Button, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shared'
import { CreditCard, Zap, Download, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'
import { FadeIn } from '@/components/animations'
import { useQuery } from '@tanstack/react-query'
import { billingApi, metricsApi } from '@/api'

export const BillingFullPage: React.FC = () => {
  const { data: subscription, isLoading: isSubLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: billingApi.getSubscription
  })

  const { data: invoices = [], isLoading: isInvoicesLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: billingApi.getInvoices
  })

  const { data: metrics } = useQuery({
    queryKey: ['metrics', 'overview'],
    queryFn: () => metricsApi.getOverview({ time_range: '7d' })
  })

  // Simulated limits based on plan
  const planLimits = {
    starter: { api: 10000, storage: 5 },
    pro: { api: 100000, storage: 50 },
    hobby: { api: 1000, storage: 1 }
  }

  const currentPlan = subscription?.plan || 'starter'
  const limits = planLimits[currentPlan as keyof typeof planLimits] || planLimits.starter

  const apiCount = metrics?.total_events || 0
  const apiPercentage = Math.min((apiCount / limits.api) * 100, 100)

  // Dummy storage
  const storageGB = 1.2
  const storagePercentage = Math.min((storageGB / limits.storage) * 100, 100)

  return (
    <div className="space-y-8">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Subscriptions & Billing</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Manage your plan, view usage, and download invoices.</p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FadeIn delay={0.1} className="md:col-span-2">
          <Card className="h-full">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Current Usage</h3>
            <div className="space-y-6">
              {/* API Requests Gauge */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-[var(--text-primary)]">API Requests</span>
                  <span className="text-[var(--text-muted)]">{apiCount.toLocaleString()} / {limits.api.toLocaleString()}</span>
                </div>
                <div className="w-full bg-[var(--bg-elevated)] rounded-full h-3 mb-1 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ${apiPercentage > 80 ? 'bg-warning' : 'bg-primary-500'}`} 
                    style={{ width: `${apiPercentage}%` }}
                  ></div>
                </div>
                {apiPercentage > 80 && (
                  <p className="text-xs text-warning flex items-center gap-1 mt-2">
                    <AlertTriangle className="h-3 w-3" /> You are nearing your monthly API limit.
                  </p>
                )}
              </div>

              {/* Storage Gauge */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-[var(--text-primary)]">Storage</span>
                  <span className="text-[var(--text-muted)]">{storageGB}GB / {limits.storage}GB</span>
                </div>
                <div className="w-full bg-[var(--bg-elevated)] rounded-full h-3 mb-1 overflow-hidden">
                  <div 
                    className="bg-success h-3 rounded-full transition-all duration-1000" 
                    style={{ width: `${storagePercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Card glow="primary" className="h-full flex flex-col relative overflow-hidden bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-elevated)]">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <Zap className="h-24 w-24 text-primary-400" />
            </div>
            <div className="relative z-10 flex-1">
              <Badge variant="info" className="mb-4">Current Plan</Badge>
              <h2 className="text-3xl font-bold text-white mb-2 capitalize">{currentPlan}</h2>
              <div className="text-3xl font-bold text-white mb-6">
                ${currentPlan === 'starter' ? '29' : currentPlan === 'pro' ? '99' : '0'}
                <span className="text-sm text-[var(--text-muted)] font-normal">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><CheckCircle2 className="h-4 w-4 text-primary-400" /> {limits.api.toLocaleString()} API Requests/mo</li>
                <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><CheckCircle2 className="h-4 w-4 text-primary-400" /> {limits.storage}GB Storage</li>
                <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><CheckCircle2 className="h-4 w-4 text-primary-400" /> Email Support</li>
              </ul>
            </div>
            <Button variant="danger" fullWidth className="relative z-10 bg-error/10 hover:bg-error/20 border-error/20">Cancel Subscription</Button>
          </Card>
        </FadeIn>
      </div>

      <FadeIn delay={0.3}>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 mt-8">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className={currentPlan === 'hobby' ? "border-primary-500/50 shadow-glow-primary" : ""}>
            <h4 className="text-xl font-bold text-[var(--text-primary)]">Hobby</h4>
            <div className="text-2xl font-bold mt-2">$0<span className="text-sm font-normal text-[var(--text-muted)]">/mo</span></div>
            <Button variant="secondary" className="mt-6 w-full" disabled={currentPlan === 'hobby'}>{currentPlan === 'hobby' ? 'Current Plan' : 'Downgrade'}</Button>
          </Card>
          <Card className={currentPlan === 'starter' ? "border-primary-500/50 shadow-glow-primary" : ""}>
            <h4 className="text-xl font-bold text-[var(--text-primary)]">Starter</h4>
            <div className="text-2xl font-bold mt-2">$29<span className="text-sm font-normal text-[var(--text-muted)]">/mo</span></div>
            <Button variant={currentPlan === 'starter' ? "secondary" : "primary"} className="mt-6 w-full" disabled={currentPlan === 'starter'}>
              {currentPlan === 'starter' ? 'Current Plan' : currentPlan === 'pro' ? 'Downgrade' : 'Upgrade'}
            </Button>
          </Card>
          <Card className={currentPlan === 'pro' ? "border-primary-500/50 shadow-glow-primary" : "hover"}>
            <h4 className="text-xl font-bold text-[var(--text-primary)]">Pro</h4>
            <div className="text-2xl font-bold mt-2">$99<span className="text-sm font-normal text-[var(--text-muted)]">/mo</span></div>
            <ul className="mt-4 space-y-2 text-sm text-[var(--text-muted)]">
              <li>• 100,000 API Requests/mo</li>
              <li>• 50GB Storage</li>
              <li>• Priority 24/7 Support</li>
            </ul>
            <Button variant="primary" className="mt-6 w-full" disabled={currentPlan === 'pro'} rightIcon={<ArrowRight className="h-4 w-4" />}>
              {currentPlan === 'pro' ? 'Current Plan' : 'Upgrade Now'}
            </Button>
          </Card>
        </div>
      </FadeIn>

      <FadeIn delay={0.4}>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 mt-8">Invoice History</h3>
        <Card padding="none" className="overflow-hidden">
          {isInvoicesLoading ? (
            <div className="p-12 text-center text-[var(--text-muted)]">Loading invoices...</div>
          ) : invoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>INVOICE</TableHead>
                  <TableHead>DATE</TableHead>
                  <TableHead>AMOUNT</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead className="text-right">DOWNLOAD</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium text-[var(--text-primary)]">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-[var(--text-muted)]" />
                        INV-{invoice.id.substring(0, 8).toUpperCase()}
                      </div>
                    </TableCell>
                    <TableCell className="text-[var(--text-muted)]">{new Date(invoice.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>${invoice.amount_paid.toFixed(2)}</TableCell>
                    <TableCell><Badge variant="success" className="capitalize">{invoice.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-[var(--text-muted)] hover:text-primary-400">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center text-[var(--text-muted)]">
              <p>No invoices available.</p>
            </div>
          )}
        </Card>
      </FadeIn>
    </div>
  )
}

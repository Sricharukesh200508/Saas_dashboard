import React from 'react'
import { Card, Button, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shared'
import { CreditCard, Zap, Download, CheckCircle2 } from 'lucide-react'
import { FadeIn } from '@/components/animations'
import { toast } from '@/components/shared/Toast'

export const BillingPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Billing & Plans</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Manage your subscription, payment methods, and billing history.</p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FadeIn delay={0.1}>
          <Card glow="primary" className="h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <Zap className="h-24 w-24 text-primary-400" />
            </div>
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <Badge variant="info" className="mb-2">Current Plan</Badge>
                <h2 className="text-2xl font-bold text-white">Starter Plan</h2>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">$29<span className="text-sm text-[var(--text-muted)] font-normal">/mo</span></div>
              </div>
            </div>
            
            <div className="space-y-3 mt-4 flex-1 relative z-10">
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <CheckCircle2 className="h-4 w-4 text-primary-400" /> 10,000 API Requests/month
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <CheckCircle2 className="h-4 w-4 text-primary-400" /> 5GB Storage
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <CheckCircle2 className="h-4 w-4 text-primary-400" /> Basic Support
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-[var(--border-color)] relative z-10 flex gap-3">
              <Button fullWidth onClick={() => toast.success('Upgrade Requested', 'You will be redirected to the checkout page shortly.')}>Upgrade to Pro</Button>
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Card className="h-full flex flex-col">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Payment Method</h3>
            
            <div className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] mb-6">
              <div className="h-12 w-16 bg-white/10 rounded flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <div className="font-medium text-[var(--text-primary)]">Visa ending in 4242</div>
                <div className="text-sm text-[var(--text-muted)]">Expires 12/2025</div>
              </div>
            </div>
            
            <Button variant="outline" className="mt-auto" onClick={() => toast.success('Redirecting', 'Opening Stripe Customer Portal...')}>Update Payment Method</Button>
          </Card>
        </FadeIn>
      </div>

      <FadeIn delay={0.3}>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 mt-8">Billing History</h3>
        <Card padding="none" className="overflow-hidden">
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
              {[
                { id: 'INV-2024-001', date: 'Jan 1, 2024', amount: '$29.00', status: 'Paid' },
                { id: 'INV-2023-012', date: 'Dec 1, 2023', amount: '$29.00', status: 'Paid' },
                { id: 'INV-2023-011', date: 'Nov 1, 2023', amount: '$29.00', status: 'Paid' },
              ].map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium text-[var(--text-primary)]">{invoice.id}</TableCell>
                  <TableCell className="text-[var(--text-muted)]">{invoice.date}</TableCell>
                  <TableCell>{invoice.amount}</TableCell>
                  <TableCell><Badge variant="success">Paid</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-[var(--text-muted)] hover:text-primary-400" onClick={() => toast.success('Download Started', `Downloading ${invoice.id}.pdf`)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </FadeIn>
    </div>
  )
}

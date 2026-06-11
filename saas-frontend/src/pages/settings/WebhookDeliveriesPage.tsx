import React, { useState } from 'react'
import { Card, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Button } from '@/components/shared'
import { Modal, ModalContent } from '@/components/shared/Modal'
import { Webhook, RotateCcw, CheckCircle2, XCircle, Search, Terminal } from 'lucide-react'
import { FadeIn } from '@/components/animations'
import { toast } from '@/components/shared/Toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { webhooksApi, WebhookDelivery } from '@/api'

export const WebhookDeliveriesPage: React.FC = () => {
  const queryClient = useQueryClient()

  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ['webhook-deliveries'],
    queryFn: webhooksApi.getDeliveries
  })

  const [selectedDelivery, setSelectedDelivery] = useState<WebhookDelivery | null>(null)
  
  const retryMutation = useMutation({
    mutationFn: webhooksApi.retryDelivery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-deliveries'] })
      toast.success('Retry Triggered', 'The webhook payload is being redelivered.')
    },
    onError: () => toast.error('Error', 'Failed to retry delivery.')
  })

  const handleRetry = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    retryMutation.mutate(id)
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Webhook Deliveries</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Review webhook event logs and replay failed deliveries.</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <input 
              type="text" 
              placeholder="Search event types..." 
              className="input-field pl-9 w-full sm:w-64"
            />
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card padding="none" className="overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-[var(--text-muted)]">Loading deliveries...</div>
          ) : deliveries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>STATUS</TableHead>
                  <TableHead>EVENT TYPE</TableHead>
                  <TableHead>DESTINATION URL</TableHead>
                  <TableHead>TIMESTAMP</TableHead>
                  <TableHead className="text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((delivery) => (
                  <TableRow key={delivery.id} className="cursor-pointer hover:bg-[var(--bg-elevated)]" onClick={() => setSelectedDelivery(delivery)}>
                    <TableCell>
                      {delivery.success ? (
                        <Badge variant="success" className="font-mono text-xs"><CheckCircle2 className="w-3 h-3 mr-1"/> {delivery.response_status || 200}</Badge>
                      ) : (
                        <Badge variant="error" className="font-mono text-xs"><XCircle className="w-3 h-3 mr-1"/> {delivery.response_status || 500}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-[var(--text-primary)]">
                      <div className="flex items-center gap-2">
                        <Webhook className="h-4 w-4 text-[var(--text-muted)]" />
                        {delivery.event_type}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[var(--text-muted)] max-w-[250px] truncate" title={delivery.url}>
                      {delivery.url}
                    </TableCell>
                    <TableCell className="text-sm text-[var(--text-muted)]">{formatTime(delivery.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => handleRetry(e, delivery.id)}
                          disabled={retryMutation.isPending && retryMutation.variables === delivery.id}
                        >
                          <RotateCcw className={`h-4 w-4 mr-1 ${retryMutation.isPending && retryMutation.variables === delivery.id ? 'animate-spin' : ''}`} />
                          Retry
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center text-[var(--text-muted)]">
              <Webhook className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-1">No Deliveries Found</h3>
              <p className="text-sm">Webhook event logs will appear here once configured.</p>
            </div>
          )}
        </Card>
      </FadeIn>

      <Modal open={!!selectedDelivery} onOpenChange={(open) => !open && setSelectedDelivery(null)}>
        <ModalContent title="Delivery Details" description={`Event: ${selectedDelivery?.event_type}`} className="max-w-3xl">
          {selectedDelivery && (
            <div className="mt-4 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-[var(--bg-elevated)] p-3 rounded-lg border border-[var(--border-color)]">
                  <div className="text-[var(--text-muted)] mb-1 text-xs uppercase font-semibold tracking-wider">Destination</div>
                  <div className="text-[var(--text-primary)] break-all">{selectedDelivery.url}</div>
                </div>
                <div className="bg-[var(--bg-elevated)] p-3 rounded-lg border border-[var(--border-color)]">
                  <div className="text-[var(--text-muted)] mb-1 text-xs uppercase font-semibold tracking-wider">Timestamp</div>
                  <div className="text-[var(--text-primary)]">{formatTime(selectedDelivery.created_at)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-[var(--text-muted)]" />
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Request Payload</h4>
                </div>
                <pre className="bg-[#0D1117] p-4 rounded-lg text-xs text-green-400 font-mono overflow-auto max-h-[300px] border border-white/10 shadow-inner">
                  {JSON.stringify(selectedDelivery.request_payload, null, 2)}
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-[var(--text-muted)]" />
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Response Body</h4>
                  </div>
                  {selectedDelivery.success ? (
                    <Badge variant="success">HTTP {selectedDelivery.response_status || 200}</Badge>
                  ) : (
                    <Badge variant="error">HTTP {selectedDelivery.response_status || 500}</Badge>
                  )}
                </div>
                <pre className={`p-4 rounded-lg text-xs font-mono overflow-auto max-h-[200px] shadow-inner ${selectedDelivery.success ? 'bg-[#0D1117] text-gray-300 border border-white/10' : 'bg-error/10 text-error border border-error/20'}`}>
                  {selectedDelivery.response_body || 'No response body received.'}
                </pre>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
                <Button variant="ghost" onClick={() => setSelectedDelivery(null)}>Close</Button>
                <Button 
                  onClick={(e) => handleRetry(e as any, selectedDelivery.id)}
                  leftIcon={<RotateCcw className={`h-4 w-4 ${retryMutation.isPending ? 'animate-spin' : ''}`} />}
                  disabled={retryMutation.isPending}
                >
                  Retry Delivery
                </Button>
              </div>
            </div>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}

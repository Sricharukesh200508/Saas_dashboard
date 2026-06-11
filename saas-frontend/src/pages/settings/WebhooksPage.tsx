import React, { useState } from 'react'
import { Card, Button, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shared'
import { Modal, ModalContent, ModalTrigger } from '@/components/shared/Modal'
import { Webhook, Plus, Trash2 } from 'lucide-react'
import { FadeIn } from '@/components/animations'
import { toast } from '@/components/shared/Toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { webhooksApi, WebhookEndpoint } from '@/api'

export const WebhooksPage: React.FC = () => {
  const queryClient = useQueryClient()

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: webhooksApi.getEndpoints
  })

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newUrl, setNewUrl] = useState('')

  const createMutation = useMutation({
    mutationFn: webhooksApi.createEndpoint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
      setNewUrl('')
      setIsCreateOpen(false)
      toast.success('Webhook Added', 'The new webhook endpoint is now active and receiving events.')
    },
    onError: () => toast.error('Error', 'Failed to add webhook endpoint.')
  })

  const deleteMutation = useMutation({
    mutationFn: webhooksApi.deleteEndpoint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
      toast.success('Webhook Deleted', 'The webhook endpoint has been removed.')
    },
    onError: () => toast.error('Error', 'Failed to delete webhook.')
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUrl.trim()) return
    createMutation.mutate({ url: newUrl, name: 'Endpoint', events: ['*'], is_active: true })
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this webhook endpoint?')) {
      deleteMutation.mutate(id)
    }
  }

  const getStatusBadge = (webhook: WebhookEndpoint) => {
    if (!webhook.is_active) return <Badge variant="default" dot>Disabled</Badge>
    return <Badge variant="success" dot>Active</Badge>
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Webhooks</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Configure webhooks to receive real-time HTTP notifications.</p>
          </div>
          
          <Modal open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <ModalTrigger asChild>
              <Button leftIcon={<Plus className="h-4 w-4" />}>Add Endpoint</Button>
            </ModalTrigger>
            <ModalContent title="Add Webhook Endpoint" description="Enter the URL where you want to receive webhook payloads.">
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Endpoint URL</label>
                  <input 
                    type="url" 
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="input-field" 
                    placeholder="https://your-domain.com/webhook" 
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={!newUrl.trim() || createMutation.isPending}>
                    {createMutation.isPending ? 'Adding...' : 'Add Endpoint'}
                  </Button>
                </div>
              </form>
            </ModalContent>
          </Modal>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card padding="none" className="overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-[var(--text-muted)]">Loading webhooks...</div>
          ) : webhooks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>EVENTS</TableHead>
                  <TableHead>CREATED</TableHead>
                  <TableHead className="text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-medium text-[var(--text-primary)] max-w-[200px] truncate" title={webhook.url}>
                      {webhook.url}
                    </TableCell>
                    <TableCell>{getStatusBadge(webhook)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {(webhook.events || []).map((event: string) => (
                          <Badge key={event} variant="secondary" className="text-[10px]">{event}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-[var(--text-muted)]">{new Date(webhook.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-[var(--text-muted)] hover:text-error" onClick={() => handleDelete(webhook.id)} disabled={deleteMutation.isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center text-[var(--text-muted)]">
              <Webhook className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-1">No Webhooks</h3>
              <p className="text-sm">Add a webhook endpoint to start receiving events.</p>
            </div>
          )}
        </Card>
      </FadeIn>
    </div>
  )
}

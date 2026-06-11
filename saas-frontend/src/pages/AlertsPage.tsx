import React, { useState } from 'react'
import { Card, Button, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shared'
import { Modal, ModalContent, ModalTrigger } from '@/components/shared/Modal'
import { Bell, Plus, Trash2, Activity, Play, Square, Settings2 } from 'lucide-react'
import { FadeIn } from '@/components/animations'
import { toast } from '@/components/shared/Toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { alertsApi, Alert } from '@/api'

export const AlertsPage: React.FC = () => {
  const queryClient = useQueryClient()
  
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: alertsApi.getAlerts
  })

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newRule, setNewRule] = useState<Partial<Alert>>({
    name: '',
    metric: 'api.requests',
    operator: '>',
    threshold: 100,
    window_minutes: 5,
    channels: { email: [] },
    is_active: true
  })

  const createMutation = useMutation({
    mutationFn: alertsApi.createAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      setIsCreateOpen(false)
      setNewRule({ name: '', metric: 'api.requests', operator: '>', threshold: 100, window_minutes: 5, channels: { email: [] }, is_active: true })
      toast.success('Alert Rule Created', 'Rule is now monitoring metrics.')
    },
    onError: () => toast.error('Error', 'Failed to create alert.')
  })

  const deleteMutation = useMutation({
    mutationFn: alertsApi.deleteAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      toast.success('Alert Rule Deleted', 'The rule has been permanently removed.')
    },
    onError: () => toast.error('Error', 'Failed to delete alert.')
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Alert> }) => alertsApi.updateAlert(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      toast.success(data.is_active ? 'Alert Enabled' : 'Alert Disabled', `Monitoring for this rule has been ${data.is_active ? 'started' : 'stopped'}.`)
    },
    onError: () => toast.error('Error', 'Failed to update alert.')
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRule.name) return
    createMutation.mutate(newRule as Alert)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this alert?')) {
      deleteMutation.mutate(id)
    }
  }

  const toggleActive = (alert: Alert) => {
    toggleMutation.mutate({ id: alert.id, data: { is_active: !alert.is_active } })
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Alerts Management</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Configure automated alerts based on real-time metric thresholds.</p>
          </div>
          
          <Modal open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <ModalTrigger asChild>
              <Button leftIcon={<Plus className="h-4 w-4" />}>Create Rule</Button>
            </ModalTrigger>
            <ModalContent title="Create Alert Rule" description="Set up a new threshold monitor.">
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Rule Name</label>
                  <input 
                    type="text" 
                    value={newRule.name}
                    onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                    className="input-field" 
                    placeholder="e.g. CPU Spike" 
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-primary)]">Metric</label>
                    <select 
                      value={newRule.metric}
                      onChange={(e) => setNewRule({...newRule, metric: e.target.value})}
                      className="input-field bg-[var(--bg-elevated)]"
                    >
                      <option value="api.requests">api.requests</option>
                      <option value="api.errors">api.errors</option>
                      <option value="api.latency">api.latency</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-primary)]">Time Window (mins)</label>
                    <input 
                      type="number" 
                      value={newRule.window_minutes}
                      onChange={(e) => setNewRule({...newRule, window_minutes: Number(e.target.value)})}
                      className="input-field" 
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_2fr] gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-primary)]">Condition</label>
                    <select 
                      value={newRule.operator}
                      onChange={(e) => setNewRule({...newRule, operator: e.target.value as any})}
                      className="input-field bg-[var(--bg-elevated)]"
                    >
                      <option value="gt">Above (&gt;)</option>
                      <option value="lt">Below (&lt;)</option>
                      <option value="eq">Equals (==)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-primary)]">Threshold Value</label>
                    <input 
                      type="number" 
                      value={newRule.threshold}
                      onChange={(e) => setNewRule({...newRule, threshold: Number(e.target.value)})}
                      className="input-field" 
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={!newRule.name || createMutation.isPending}>
                    {createMutation.isPending ? 'Saving...' : 'Save Rule'}
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
            <div className="p-12 text-center text-[var(--text-muted)]">Loading alerts...</div>
          ) : alerts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>STATUS</TableHead>
                  <TableHead>RULE NAME</TableHead>
                  <TableHead>CONDITION</TableHead>
                  <TableHead>CHANNELS</TableHead>
                  <TableHead className="text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      {alert.is_active ? 
                        <Badge variant="success" dot>Active</Badge> : 
                        <Badge variant="default">Paused</Badge>
                      }
                    </TableCell>
                    <TableCell className="font-medium text-[var(--text-primary)]">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-[var(--text-muted)]" />
                        {alert.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                        <Activity className="h-3 w-3" />
                        <code className="bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded text-[var(--text-primary)]">{alert.metric}</code>
                        <span>{alert.operator === 'gt' ? '>' : alert.operator === 'lt' ? '<' : '=='}</span>
                        <span className="font-bold text-[var(--text-primary)]">{alert.threshold}</span>
                        <span>(over {alert.window_minutes}m)</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {Object.keys(alert.channels || {}).map(ch => (
                          <Badge key={ch} variant="secondary" className="text-[10px]">{ch}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => toggleActive(alert)} disabled={toggleMutation.isPending}>
                          {alert.is_active ? <Square className="h-4 w-4 text-warning" /> : <Play className="h-4 w-4 text-success" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:text-error" onClick={() => handleDelete(alert.id)} disabled={deleteMutation.isPending}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center text-[var(--text-muted)]">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-1">No Alerts Configured</h3>
              <p className="text-sm">Create an alert rule to get notified when metrics cross thresholds.</p>
            </div>
          )}
        </Card>
      </FadeIn>
    </div>
  )
}

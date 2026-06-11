import React, { useState } from 'react'
import { Card, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Button } from '@/components/shared'
import { Modal, ModalContent } from '@/components/shared/Modal'
import { ClipboardList, User, Shield, CreditCard, Activity, Code2 } from 'lucide-react'
import { FadeIn } from '@/components/animations'
import { useQuery } from '@tanstack/react-query'
import { auditApi, AuditLog } from '@/api'

export const AuditLogPage: React.FC = () => {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: auditApi.getLogs
  })

  const getActionIcon = (action: string) => {
    if (action.startsWith('user.')) return <User className="h-4 w-4 text-blue-400" />
    if (action.startsWith('api_key.') || action.startsWith('webhook.')) return <Code2 className="h-4 w-4 text-purple-400" />
    if (action.startsWith('subscription.')) return <CreditCard className="h-4 w-4 text-green-400" />
    return <Shield className="h-4 w-4 text-gray-400" />
  }

  const getActionBadge = (action: string) => {
    const parts = action.split('.')
    const resource = parts[0]
    let variant: any = 'default'
    if (resource === 'user') variant = 'info'
    if (resource === 'subscription') variant = 'success'
    if (resource === 'api_key' || resource === 'webhook') variant = 'secondary'
    
    return <Badge variant={variant} className="font-mono text-[10px] uppercase">{action}</Badge>
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Audit Logs</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">A verifiable timeline of all administrative actions in your workspace.</p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card padding="none" className="overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-[var(--text-muted)]">Loading logs...</div>
          ) : logs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ACTION</TableHead>
                  <TableHead>ACTOR ID</TableHead>
                  <TableHead>IP ADDRESS</TableHead>
                  <TableHead>TIMESTAMP</TableHead>
                  <TableHead className="text-right">DETAILS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="cursor-pointer hover:bg-[var(--bg-elevated)]" onClick={() => setSelectedLog(log)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-[var(--bg-elevated)] rounded-md border border-[var(--border-color)]">
                          {getActionIcon(log.action)}
                        </div>
                        {getActionBadge(log.action)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[var(--text-primary)]">{log.user_id || 'System'}</TableCell>
                    <TableCell><code className="text-xs text-[var(--text-muted)]">{log.ip_address || 'N/A'}</code></TableCell>
                    <TableCell className="text-sm text-[var(--text-muted)]">{formatTime(log.created_at)}</TableCell>
                    <TableCell className="text-right">
                      {(log.before_state || log.after_state) ? (
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}>
                          View JSON
                        </Button>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)] italic">No changes</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center text-[var(--text-muted)]">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-1">No Logs Found</h3>
              <p className="text-sm">Administrative actions will appear here.</p>
            </div>
          )}
        </Card>
      </FadeIn>

      {/* JSON Diff Modal */}
      <Modal open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <ModalContent title="Action Details" description={`View the state changes for ${selectedLog?.action}`}>
          {(selectedLog?.before_state || selectedLog?.after_state) ? (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Before</h4>
                  <pre className="bg-[var(--bg-elevated)] p-3 rounded-lg text-xs text-error font-mono overflow-auto border border-error/20">
                    {JSON.stringify(selectedLog.before_state || null, null, 2)}
                  </pre>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">After</h4>
                  <pre className="bg-[var(--bg-elevated)] p-3 rounded-lg text-xs text-success font-mono overflow-auto border border-success/20">
                    {JSON.stringify(selectedLog.after_state || null, null, 2)}
                  </pre>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={() => setSelectedLog(null)}>Close</Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 p-8 text-center text-[var(--text-muted)]">
              No detailed changes recorded for this event.
            </div>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}

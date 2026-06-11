import React, { useState } from 'react'
import { Card, Button, Badge } from '@/components/shared'
import { Modal, ModalContent } from '@/components/shared/Modal'
import { Link2, Github, Slack, MonitorSmartphone, Bell, Blocks, Activity } from 'lucide-react'
import { FadeIn } from '@/components/animations'
import { toast } from '@/components/shared/Toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { integrationsApi, Integration } from '@/api'

interface IntegrationMeta {
  id: string
  name: string
  description: string
  icon: React.ReactNode
}

export const IntegrationsPage: React.FC = () => {
  const queryClient = useQueryClient()

  const { data: dbIntegrations = [], isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: integrationsApi.getIntegrations
  })

  const [activeIntegrationMeta, setActiveIntegrationMeta] = useState<IntegrationMeta | null>(null)
  const [credentials, setCredentials] = useState('')

  const connectMutation = useMutation({
    mutationFn: integrationsApi.createIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      setActiveIntegrationMeta(null)
      setCredentials('')
      toast.success('Integration Connected', `The integration has been successfully linked to your workspace.`)
    },
    onError: () => toast.error('Error', 'Failed to connect integration.')
  })

  const deleteMutation = useMutation({
    mutationFn: integrationsApi.deleteIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      toast.success('Integration Removed', 'The connection has been revoked.')
    },
    onError: () => toast.error('Error', 'Failed to remove integration.')
  })

  const INTEGRATIONS_META: IntegrationMeta[] = [
    {
      id: 'slack',
      name: 'Slack',
      description: 'Receive real-time alerts and daily summary reports directly in your Slack channels.',
      icon: <Slack className="h-8 w-8 text-[#E01E5A]" />
    },
    {
      id: 'github',
      name: 'GitHub',
      description: 'Sync your API schemas and automatically deploy changes when code is pushed.',
      icon: <Github className="h-8 w-8 text-[var(--text-primary)]" />
    },
    {
      id: 'datadog',
      name: 'Datadog',
      description: 'Export all your API metrics and traces to Datadog for unified observability.',
      icon: <Activity className="h-8 w-8 text-[#632CA6]" />
    },
    {
      id: 'pagerduty',
      name: 'PagerDuty',
      description: 'Trigger incidents automatically when error rates spike above your thresholds.',
      icon: <Bell className="h-8 w-8 text-[#06AC38]" />
    }
  ]

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeIntegrationMeta || !credentials) return
    
    connectMutation.mutate({
      provider: activeIntegrationMeta.id,
      credentials: { token: credentials },
      is_active: true
    })
  }

  const handleDisconnect = (dbId: string) => {
    deleteMutation.mutate(dbId)
  }

  if (isLoading) {
    return <div className="p-12 text-center text-[var(--text-muted)]">Loading integrations...</div>
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Blocks className="h-6 w-6 text-primary-400" /> Integrations
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Connect Nexus with your favorite tools to supercharge your workflow.</p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {INTEGRATIONS_META.map((meta, idx) => {
          const connectedDbInstance = dbIntegrations.find((dbInt: Integration) => dbInt.provider === meta.id)
          const isConnected = !!connectedDbInstance

          return (
            <FadeIn key={meta.id} delay={idx * 0.1}>
              <Card hover className="h-full flex flex-col border-[var(--border-color)] bg-gradient-to-b from-[var(--bg-elevated)] to-[var(--bg-surface)]">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-[var(--bg-base)] rounded-xl border border-[var(--border-color)] shadow-sm">
                    {meta.icon}
                  </div>
                  {isConnected ? (
                    <Badge variant="success" dot>Connected</Badge>
                  ) : (
                    <Badge variant="secondary">Disconnected</Badge>
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{meta.name}</h3>
                <p className="text-sm text-[var(--text-muted)] flex-1">{meta.description}</p>
                
                <div className="pt-6 mt-auto">
                  {isConnected ? (
                    <div className="flex gap-2">
                      <Button variant="outline" fullWidth onClick={() => toast.success('Sync Triggered', 'Manually syncing data...')} leftIcon={<MonitorSmartphone className="h-4 w-4"/>}>Sync Now</Button>
                      <Button variant="ghost" className="px-3 hover:text-error hover:bg-error/10" onClick={() => handleDisconnect(connectedDbInstance!.id)} disabled={deleteMutation.isPending}>Disconnect</Button>
                    </div>
                  ) : (
                    <Button variant="primary" fullWidth leftIcon={<Link2 className="h-4 w-4" />} onClick={() => setActiveIntegrationMeta(meta)}>
                      Connect
                    </Button>
                  )}
                </div>
              </Card>
            </FadeIn>
          )
        })}
      </div>

      <Modal open={!!activeIntegrationMeta} onOpenChange={(open) => !open && setActiveIntegrationMeta(null)}>
        <ModalContent title={`Connect ${activeIntegrationMeta?.name}`} description="Enter your API token or authenticate via OAuth.">
          <form onSubmit={handleConnect} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">API Token / Webhook URL</label>
              <input 
                type="text" 
                placeholder="Paste credential here..." 
                className="input-field" 
                required 
                value={credentials}
                onChange={e => setCredentials(e.target.value)}
              />
            </div>
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-3 text-sm text-[var(--text-primary)]">
              By connecting {activeIntegrationMeta?.name}, you grant Nexus permission to read and write data to your account based on your configured scopes.
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setActiveIntegrationMeta(null)}>Cancel</Button>
              <Button type="submit" disabled={connectMutation.isPending || !credentials}>Authenticate</Button>
            </div>
          </form>
        </ModalContent>
      </Modal>
    </div>
  )
}

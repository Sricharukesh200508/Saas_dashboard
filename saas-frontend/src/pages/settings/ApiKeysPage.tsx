import React, { useState } from 'react'
import { Card, Button, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shared'
import { Modal, ModalContent, ModalTrigger } from '@/components/shared/Modal'
import { Key, Plus, Copy, Check, AlertCircle } from 'lucide-react'
import { FadeIn } from '@/components/animations'
import { toast } from '@/components/shared/Toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiKeysApi } from '@/api'

export const ApiKeysPage: React.FC = () => {
  const queryClient = useQueryClient()
  
  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: apiKeysApi.getKeys
  })

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const createMutation = useMutation({
    mutationFn: apiKeysApi.createKey,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      setNewKeySecret(data.raw_key || 'Error: Raw key not provided')
      setNewKeyName('')
      toast.success('API Key Created', 'Your new API key has been successfully generated.')
    },
    onError: () => toast.error('Error', 'Failed to create API Key.')
  })

  const deleteMutation = useMutation({
    mutationFn: apiKeysApi.deleteKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      toast.success('API Key Revoked', 'The API key has been permanently disabled.')
    },
    onError: () => toast.error('Error', 'Failed to revoke API Key.')
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyName.trim()) return
    createMutation.mutate({ name: newKeyName, scopes: ['metrics:write', 'metrics:read'] })
  }

  const handleRevoke = (id: string) => {
    if (confirm('Are you sure you want to revoke this API key? This cannot be undone.')) {
      deleteMutation.mutate(id)
    }
  }

  const handleCopy = () => {
    if (newKeySecret) {
      navigator.clipboard.writeText(newKeySecret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCloseModal = () => {
    setIsCreateOpen(false)
    setTimeout(() => setNewKeySecret(null), 200) // Clear secret after modal close animation
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">API Keys</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Manage access tokens for authenticating with the API.</p>
          </div>
          
          <Modal open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <ModalTrigger asChild>
              <Button leftIcon={<Plus className="h-4 w-4" />}>Generate New Key</Button>
            </ModalTrigger>
            <ModalContent title={newKeySecret ? "Save your API Key" : "Create API Key"} description={newKeySecret ? "Please copy this key now. You won't be able to see it again!" : "Create a new API key with specific permissions."}>
              {newKeySecret ? (
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg text-warning text-sm">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p>Make sure to copy your API key now. You won't be able to see it again!</p>
                  </div>
                  <div className="flex items-center gap-2 bg-[var(--bg-base)] border border-[var(--border-color)] p-3 rounded-lg">
                    <code className="text-sm text-[var(--text-primary)] flex-1 break-all">{newKeySecret}</code>
                    <Button variant="secondary" size="sm" onClick={handleCopy} leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}>
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleCloseModal}>Done</Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreate} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-primary)]">Key Name</label>
                    <input 
                      type="text" 
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="input-field" 
                      placeholder="e.g. Production Backend" 
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={!newKeyName.trim() || createMutation.isPending}>
                      {createMutation.isPending ? 'Generating...' : 'Create Key'}
                    </Button>
                  </div>
                </form>
              )}
            </ModalContent>
          </Modal>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card padding="none" className="overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-[var(--text-muted)]">Loading API keys...</div>
          ) : keys.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NAME</TableHead>
                  <TableHead>PREFIX</TableHead>
                  <TableHead>SCOPES</TableHead>
                  <TableHead>CREATED</TableHead>
                  <TableHead className="text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium text-[var(--text-primary)]">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-[var(--text-muted)]" />
                        {key.name}
                      </div>
                    </TableCell>
                    <TableCell><code className="text-xs bg-[var(--bg-elevated)] px-2 py-1 rounded">{key.partial_key}</code></TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {key.scopes.map(scope => (
                          <Badge key={scope} variant="secondary">{scope}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-[var(--text-muted)]">{new Date(key.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-error hover:text-error hover:bg-error/10" onClick={() => handleRevoke(key.id)} disabled={deleteMutation.isPending}>
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center text-[var(--text-muted)]">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-1">No API Keys</h3>
              <p className="text-sm">Generate an API key to authenticate your applications.</p>
            </div>
          )}
        </Card>
      </FadeIn>
    </div>
  )
}

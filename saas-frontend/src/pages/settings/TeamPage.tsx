import React, { useState } from 'react'
import { Card, Button, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shared'
import { Modal, ModalContent, ModalTrigger } from '@/components/shared/Modal'
import { Users, Plus, UserPlus, MoreVertical, Mail, Trash2 } from 'lucide-react'
import { FadeIn } from '@/components/animations'
import { toast } from '@/components/shared/Toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamApi, TeamMember } from '@/api'

export const TeamPage: React.FC = () => {
  const queryClient = useQueryClient()

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: teamApi.getMembers
  })

  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member')

  const inviteMutation = useMutation({
    mutationFn: teamApi.inviteMember,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
      setInviteEmail('')
      setIsInviteOpen(false)
      toast.success('Invitation Sent', `An invitation has been sent to ${data.email}.`)
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || 'Failed to send invite.'
      toast.error('Error', msg)
    }
  })

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    inviteMutation.mutate({ email: inviteEmail, role: inviteRole })
  }

  const removeMutation = useMutation({
    mutationFn: teamApi.removeMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
      toast.success('Member Removed', 'The user has been removed from the workspace.')
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || 'Failed to remove user.'
      toast.error('Error', msg)
    }
  })

  const handleRemove = (id: string, role: string) => {
    if (role === 'owner') {
      toast.error('Cannot Remove Owner', 'The workspace owner cannot be removed.')
      return
    }
    if (confirm('Are you sure you want to remove this member?')) {
      removeMutation.mutate(id)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner': return <Badge variant="info">Owner</Badge>
      case 'admin': return <Badge variant="success">Admin</Badge>
      case 'member': return <Badge variant="secondary">Member</Badge>
      default: return <Badge variant="default">Viewer</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Team Management</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Manage members and their roles in this workspace.</p>
          </div>
          
          <Modal open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <ModalTrigger asChild>
              <Button leftIcon={<UserPlus className="h-4 w-4" />}>Invite Member</Button>
            </ModalTrigger>
            <ModalContent title="Invite Team Member" description="Send an invitation to join your workspace.">
              <form onSubmit={handleInvite} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[var(--text-muted)]">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input 
                      type="email" 
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="input-field pl-10" 
                      placeholder="colleague@company.com" 
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Role</label>
                  <select 
                    value={inviteRole} 
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="input-field bg-[var(--bg-elevated)]"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={!inviteEmail.trim() || inviteMutation.isPending}>
                    {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
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
            <div className="p-12 text-center text-[var(--text-muted)]">Loading team members...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>USER</TableHead>
                  <TableHead>ROLE</TableHead>
                  <TableHead>JOINED</TableHead>
                  <TableHead className="text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center font-bold text-xs uppercase">
                          {(member.full_name || member.email).charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-[var(--text-primary)]">{member.full_name || 'No Name'}</div>
                          <div className="text-xs text-[var(--text-muted)]">{member.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(member.role)}</TableCell>
                    <TableCell className="text-[var(--text-muted)]">{new Date(member.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[var(--text-muted)] hover:text-error" 
                        onClick={() => handleRemove(member.id, member.role)}
                        disabled={removeMutation.isPending && removeMutation.variables === member.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </FadeIn>
    </div>
  )
}

import React, { useState } from 'react'
import { Card, Button, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shared'
import { ShieldCheck, KeyRound, Smartphone, Monitor, Clock } from 'lucide-react'
import { FadeIn } from '@/components/animations'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { toast } from '@/components/shared/Toast'

export const SecurityPage: React.FC = () => {
  const [mfaEnabled, setMfaEnabled] = useLocalStorage('nexus_mfa', false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword) return
    setCurrentPassword('')
    setNewPassword('')
    toast.success('Password Updated', 'Your password has been successfully changed.')
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Security Settings</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Manage your account security, passwords, and 2FA.</p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FadeIn delay={0.1}>
          <Card className="h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-secondary/10 rounded-xl text-secondary">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Change Password</h3>
                <p className="text-sm text-[var(--text-muted)]">Update your password to keep your account secure.</p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handlePasswordChange}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">Current Password</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="input-field" 
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="input-field" 
                  required
                />
              </div>
              <div className="pt-2">
                <Button type="submit" disabled={!currentPassword || !newPassword}>Update Password</Button>
              </div>
            </form>
          </Card>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Card className="h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-500/10 rounded-xl text-primary-400">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">Two-Factor Auth</h3>
                  <p className="text-sm text-[var(--text-muted)]">Add an extra layer of security.</p>
                </div>
              </div>
              <Badge variant={mfaEnabled ? 'success' : 'default'}>{mfaEnabled ? 'Enabled' : 'Disabled'}</Badge>
            </div>

            <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl mb-6">
              <p className="text-sm text-[var(--text-secondary)]">
                Two-factor authentication protects your account by requiring a code from your authenticator app when you log in.
              </p>
            </div>

            <Button 
              variant={mfaEnabled ? "outline" : "primary"} 
              fullWidth
              onClick={() => {
                setMfaEnabled(!mfaEnabled)
                toast.success('2FA Updated', mfaEnabled ? 'Two-Factor Authentication has been disabled.' : 'Authenticator App has been enabled.')
              }}
            >
              {mfaEnabled ? 'Disable 2FA' : 'Enable Authenticator App'}
            </Button>
          </Card>
        </FadeIn>
      </div>

      <FadeIn delay={0.3}>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 mt-8">Recent Login Activity</h3>
        <Card padding="none" className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>DEVICE</TableHead>
                <TableHead>LOCATION</TableHead>
                <TableHead>IP ADDRESS</TableHead>
                <TableHead>TIME</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { id: 1, device: 'MacBook Pro - Chrome', location: 'San Francisco, CA', ip: '192.168.1.1', time: 'Just now', current: true },
                { id: 2, device: 'iPhone 13 - Safari', location: 'San Francisco, CA', ip: '10.0.0.45', time: 'Yesterday at 4:30 PM', current: false },
                { id: 3, device: 'Windows PC - Edge', location: 'New York, NY', ip: '45.22.11.9', time: 'Oct 12, 2023', current: false },
              ].map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium text-[var(--text-primary)]">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-[var(--text-muted)]" />
                      {log.device}
                      {log.current && <Badge variant="info" className="ml-2 text-[10px]">Current</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-[var(--text-muted)]">{log.location}</TableCell>
                  <TableCell><code className="text-xs bg-[var(--bg-elevated)] px-2 py-1 rounded">{log.ip}</code></TableCell>
                  <TableCell className="text-[var(--text-muted)]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {log.time}
                    </div>
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

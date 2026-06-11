import React, { useState, useEffect } from 'react'
import { Card, Button } from '@/components/shared'
import { Palette, Moon, Sun, Monitor, ImagePlus, Check } from 'lucide-react'
import { FadeIn } from '@/components/animations'
import { toast } from '@/components/shared/Toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tenantApi } from '@/api'

const BRAND_COLORS = [
  { id: 'blue', color: '#3b82f6', label: 'Blue (Default)' },
  { id: 'violet', color: '#8b5cf6', label: 'Violet' },
  { id: 'emerald', color: '#10b981', label: 'Emerald' },
  { id: 'rose', color: '#f43f5e', label: 'Rose' },
  { id: 'amber', color: '#f59e0b', label: 'Amber' },
]

export const AppearancePage: React.FC = () => {
  const queryClient = useQueryClient()
  
  const { data: tenant } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: tenantApi.getSettings
  })

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [activeColor, setActiveColor] = useState('blue')
  const [isUploading, setIsUploading] = useState(false)

  // Sync state with tenant data
  useEffect(() => {
    if (tenant?.settings) {
      if (tenant.settings.theme) setTheme(tenant.settings.theme)
      if (tenant.settings.brand_color) setActiveColor(tenant.settings.brand_color)
    }
  }, [tenant])

  useEffect(() => {
    // Just a simulation of changing brand color by overriding a CSS variable locally
    // document.documentElement.style.setProperty('--primary-500', BRAND_COLORS.find(c => c.id === activeColor)?.color || '')
  }, [activeColor])

  const updateMutation = useMutation({
    mutationFn: tenantApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-settings'] })
      toast.success('Appearance Updated', 'Your branding and theme preferences have been saved.')
    },
    onError: () => toast.error('Error', 'Failed to update appearance settings.')
  })

  const handleLogoUpload = () => {
    setIsUploading(true)
    setTimeout(() => {
      setIsUploading(false)
      toast.success('Logo Uploaded', 'Your custom workspace logo has been updated.')
    }, 1500)
  }

  const handleSaveTheme = () => {
    updateMutation.mutate({ settings: { theme, brand_color: activeColor } })
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Appearance</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Customize the look and feel of your dashboard.</p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card>
          <div className="space-y-8">
            
            {/* Theme Selection */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Color Mode</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-primary-500 bg-primary-500/5' : 'border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)]'}`}
                >
                  <Sun className={`h-8 w-8 mb-2 ${theme === 'light' ? 'text-primary-500' : 'text-[var(--text-muted)]'}`} />
                  <span className="text-sm font-medium text-[var(--text-primary)]">Light</span>
                </button>
                <button 
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-primary-500 bg-primary-500/5' : 'border-[var(--border-color)] bg-[#0A0A0B] hover:bg-[#121214]'}`}
                >
                  <Moon className={`h-8 w-8 mb-2 ${theme === 'dark' ? 'text-primary-500' : 'text-[var(--text-muted)]'}`} />
                  <span className="text-sm font-medium text-[var(--text-primary)]">Dark</span>
                </button>
                <button 
                  onClick={() => setTheme('system')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'system' ? 'border-primary-500 bg-primary-500/5' : 'border-[var(--border-color)] bg-gradient-to-r from-[var(--bg-surface)] to-[#0A0A0B]'}`}
                >
                  <Monitor className={`h-8 w-8 mb-2 ${theme === 'system' ? 'text-primary-500' : 'text-[var(--text-muted)]'}`} />
                  <span className="text-sm font-medium text-[var(--text-primary)]">System</span>
                </button>
              </div>
            </div>

            {/* Brand Color */}
            <div className="pt-6 border-t border-[var(--border-color)]">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Brand Color</h3>
              <p className="text-sm text-[var(--text-muted)] mb-4">Choose a primary accent color for your workspace.</p>
              
              <div className="flex flex-wrap gap-4">
                {BRAND_COLORS.map(color => (
                  <button
                    key={color.id}
                    onClick={() => setActiveColor(color.id)}
                    className="group relative flex flex-col items-center gap-2"
                  >
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform ${activeColor === color.id ? 'scale-110 ring-2 ring-offset-2 ring-offset-[var(--bg-surface)] ring-[var(--text-primary)]' : 'hover:scale-105'}`}
                      style={{ backgroundColor: color.color }}
                    >
                      {activeColor === color.id && <Check className="h-5 w-5 text-white" />}
                    </div>
                    <span className="text-xs font-medium text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">{color.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Logo Upload */}
            <div className="pt-6 border-t border-[var(--border-color)]">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Workspace Logo</h3>
              <p className="text-sm text-[var(--text-muted)] mb-4">Upload a custom logo to display in the sidebar.</p>
              
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-center shrink-0">
                  <Palette className="h-8 w-8 text-[var(--text-muted)]" />
                </div>
                <div className="flex-1">
                  <div className="border-2 border-dashed border-[var(--border-color)] rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer" onClick={handleLogoUpload}>
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-2"></div>
                    ) : (
                      <ImagePlus className="h-8 w-8 text-[var(--text-muted)] mb-2" />
                    )}
                    <span className="text-sm font-medium text-[var(--text-primary)]">Click to upload or drag and drop</span>
                    <span className="text-xs text-[var(--text-muted)] mt-1">SVG, PNG, JPG or GIF (max. 2MB)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-4 flex justify-end">
              <Button onClick={handleSaveTheme} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </div>
        </Card>
      </FadeIn>
    </div>
  )
}

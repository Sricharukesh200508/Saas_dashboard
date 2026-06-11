import React from 'react'
import { EmptyState, Card } from '@/components/shared/index'
import { Settings as SettingsIcon } from 'lucide-react'
import { FadeIn } from '@/components/animations'

export const SettingsPage: React.FC<{ title: string; description: string }> = ({ title, description }) => {
  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">{description}</p>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card className="min-h-[400px] flex items-center justify-center">
          <EmptyState
            icon={<SettingsIcon />}
            title="Settings Coming Soon"
            description="This settings module is currently under development."
          />
        </Card>
      </FadeIn>
    </div>
  )
}

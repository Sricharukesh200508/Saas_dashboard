import React from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { LayoutDashboard, BarChart3, Settings, CreditCard, Shield, Users, Webhook, Key, Bell, ClipboardList, Activity, Blocks, TerminalSquare, Paintbrush } from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '@/hooks/useAuth'

export const NAVIGATION_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/analytics',
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    id: 'alerts',
    label: 'Alerts',
    href: '/alerts',
    icon: <Bell className="h-5 w-5" />,
  },
  {
    id: 'audit',
    label: 'Audit Logs',
    href: '/audit',
    icon: <ClipboardList className="h-5 w-5" />,
  },
  {
    id: 'billing',
    label: 'Billing',
    href: '/billing',
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    id: 'metrics',
    label: 'Metrics Tester',
    href: '/metrics',
    icon: <Activity className="h-5 w-5" />,
  },
  {
    id: 'api-explorer',
    label: 'API Explorer',
    href: '/api-explorer',
    icon: <TerminalSquare className="h-5 w-5" />,
  },
  {
    id: 'integrations',
    label: 'Integrations',
    href: '/integrations',
    icon: <Blocks className="h-5 w-5" />,
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: <Settings className="h-5 w-5" />,
    children: [
      { id: 'appearance', label: 'Appearance', href: '/settings/appearance', icon: <Paintbrush className="h-4 w-4" /> },
      { id: 'api-keys', label: 'API Keys', href: '/settings/api-keys', icon: <Key className="h-4 w-4" /> },
      { id: 'webhooks', label: 'Webhooks', href: '/settings/webhooks', icon: <Webhook className="h-4 w-4" /> },
      { id: 'webhook-deliveries', label: 'Deliveries', href: '/settings/webhooks/deliveries', icon: <Activity className="h-4 w-4" /> },
      { id: 'team', label: 'Team', href: '/settings/team', icon: <Users className="h-4 w-4" />, roles: ['owner', 'admin'] },
      { id: 'billing', label: 'Billing', href: '/settings/billing', icon: <CreditCard className="h-4 w-4" />, roles: ['owner', 'admin'] },
      { id: 'security', label: 'Security', href: '/settings/security', icon: <Shield className="h-4 w-4" /> },
    ],
  },
]

export const Navigation: React.FC<{ collapsed?: boolean }> = ({ collapsed }) => {
  const { hasRole } = useAuth()
  const location = useLocation()
  
  // This is a naive router check for active state
  const isActive = (href: string) => location.pathname.startsWith(href)

  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {NAVIGATION_ITEMS.map((item) => {
        const active = isActive(item.href)
        return (
          <div key={item.id}>
            <Link
              to={item.href}
              className={clsx(
                'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'nav-item-active'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
              )}
              title={collapsed ? item.label : undefined}
            >
              <span className={clsx('shrink-0', active ? 'text-secondary' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]')}>
                {item.icon}
              </span>
              {!collapsed && <span className="ml-3 truncate">{item.label}</span>}
            </Link>

            {item.children && active && !collapsed && (
              <div className="mt-1 space-y-1 pl-10 pr-3">
                {item.children.map((child) => {
                  if (child.roles && !child.roles.some((role) => hasRole(role))) return null
                  const childActive = location.pathname === child.href
                  return (
                    <Link
                      key={child.id}
                      to={child.href}
                      className={clsx(
                        'group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors',
                        childActive
                          ? 'text-secondary bg-[var(--bg-elevated)]'
                          : 'text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                      )}
                    >
                      <span className="shrink-0 mr-2 opacity-70">{child.icon}</span>
                      <span className="truncate">{child.label}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

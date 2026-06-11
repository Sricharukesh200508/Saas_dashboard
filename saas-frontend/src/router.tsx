import { createRouter, createRoute, createRootRoute, redirect } from '@tanstack/react-router'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { ProtectedRoute } from './components/auth/AuthProvider'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { SettingsPage } from './pages/SettingsPage'
import { ApiKeysPage } from './pages/settings/ApiKeysPage'
import { WebhooksPage } from './pages/settings/WebhooksPage'
import { TeamPage } from './pages/settings/TeamPage'
import { BillingPage } from './pages/settings/BillingPage'
import { BillingFullPage } from './pages/BillingFullPage'
import { AlertsPage } from './pages/AlertsPage'
import { AuditLogPage } from './pages/AuditLogPage'
import { MetricsTesterPage } from './pages/MetricsTesterPage'
import { ApiExplorerPage } from './pages/ApiExplorerPage'
import { IntegrationsPage } from './pages/IntegrationsPage'
import { SecurityPage } from './pages/settings/SecurityPage'
import { AppearancePage } from './pages/settings/AppearancePage'
import { WebhookDeliveriesPage } from './pages/settings/WebhookDeliveriesPage'
import { ROUTES } from './utils/constants'

// Root route
const rootRoute = createRootRoute()

// Public Routes
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.LOGIN,
  component: LoginPage,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.REGISTER,
  component: RegisterPage,
})

// Protected Layout
const protectedLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  component: () => (
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  ),
})

// Index redirects to dashboard
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  loader: () => { throw redirect({ to: ROUTES.DASHBOARD }) },
})

// Dashboard Routes
const dashboardRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: ROUTES.DASHBOARD,
  component: DashboardPage,
})

const analyticsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: ROUTES.ANALYTICS,
  component: AnalyticsPage,
})

const alertsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: ROUTES.ALERTS,
  component: AlertsPage,
})

const auditRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: ROUTES.AUDIT,
  component: AuditLogPage,
})

const billingRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: ROUTES.BILLING,
  component: BillingFullPage,
})

const metricsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: ROUTES.METRICS,
  component: MetricsTesterPage,
})

const apiExplorerRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: ROUTES.API_EXPLORER,
  component: ApiExplorerPage,
})

const integrationsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: ROUTES.INTEGRATIONS,
  component: IntegrationsPage,
})

// Settings Routes
const settingsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: ROUTES.SETTINGS,
  component: () => <SettingsPage title="General Settings" description="Manage your workspace settings." />,
})

const settingsProfileRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: ROUTES.SETTINGS_PROFILE,
  component: () => <SettingsPage title="User Profile" description="Manage your personal account." />,
})

const settingsApiKeysRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: ROUTES.SETTINGS_API_KEYS,
  component: ApiKeysPage,
})

const settingsWebhooksRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: ROUTES.SETTINGS_WEBHOOKS,
  component: WebhooksPage,
})

const settingsTeamRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: ROUTES.SETTINGS_TEAM,
  component: () => (
    <ProtectedRoute requiredRole="admin">
      <TeamPage />
    </ProtectedRoute>
  ),
})

const settingsBillingRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: ROUTES.SETTINGS_BILLING,
  component: () => (
    <ProtectedRoute requiredRole="admin">
      <BillingPage />
    </ProtectedRoute>
  ),
})

const settingsSecurityRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: ROUTES.SETTINGS_SECURITY,
  component: SecurityPage,
})

const settingsAppearanceRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: ROUTES.SETTINGS_APPEARANCE,
  component: AppearancePage,
})

const settingsWebhookDeliveriesRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: ROUTES.SETTINGS_WEBHOOK_DELIVERIES,
  component: WebhookDeliveriesPage,
})

// Catch-all route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  protectedLayout.addChildren([
    dashboardRoute,
    analyticsRoute,
    alertsRoute,
    auditRoute,
    billingRoute,
    metricsRoute,
    apiExplorerRoute,
    integrationsRoute,
    settingsRoute,
    settingsProfileRoute,
    settingsApiKeysRoute,
    settingsWebhooksRoute,
    settingsWebhookDeliveriesRoute,
    settingsTeamRoute,
    settingsBillingRoute,
    settingsSecurityRoute,
    settingsAppearanceRoute,
  ]),
])

// Create router
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

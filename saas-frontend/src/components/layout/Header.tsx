import React from 'react'
import { Menu, Bell, Sun, Moon, LogOut, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/store/ui.store'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '../shared/Dropdown'
import { Badge } from '../shared/index'
import { Link } from '@tanstack/react-router'
import { ROUTES } from '@/utils/constants'

export const Header: React.FC = () => {
  const { user, logout } = useAuth()
  const { toggleSidebar, theme, setTheme, unreadCount } = useUIStore()

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-[var(--border-color)] bg-[var(--bg-surface)]/80 px-4 shadow-sm backdrop-blur-md sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] lg:hidden"
        onClick={toggleSidebar}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center">
          {/* Breadcrumbs or page title could go here */}
        </div>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] relative"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <span className="sr-only">Toggle theme</span>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button type="button" className="-m-2.5 p-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] relative">
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-error ring-2 ring-[var(--bg-surface)]" />
            )}
          </button>

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-[var(--border-color)]" aria-hidden="true" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="-m-1.5 flex items-center p-1.5 focus:outline-none ring-offset-[var(--bg-surface)] focus-visible:ring-2 focus-visible:ring-secondary rounded-full">
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary flex items-center justify-center text-white font-semibold shadow-inner">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2">
              <div className="px-2 py-2.5">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{user?.role}</Badge>
                </div>
              </div>
              <DropdownMenuSeparator />
              <Link to={ROUTES.SETTINGS_PROFILE}>
                <DropdownMenuItem>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-error focus:text-error focus:bg-error/10">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

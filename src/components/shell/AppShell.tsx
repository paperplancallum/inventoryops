'use client'

import { useState } from 'react'
import { Menu, X, Sun, Moon } from 'lucide-react'
import { MainNav, type NavigationItem } from './MainNav'
import { UserMenu } from './UserMenu'

export interface AppShellProps {
  children: React.ReactNode
  navigationItems: NavigationItem[]
  utilityItems?: NavigationItem[]
  user?: {
    name: string
    email?: string
    avatarUrl?: string
  }
  onLogout?: () => void
  isDark?: boolean
  onToggleTheme?: () => void
}

export function AppShell({
  children,
  navigationItems,
  utilityItems = [],
  user,
  onLogout,
  isDark = false,
  onToggleTheme,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-60 flex flex-col
          bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo / Brand */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-800">
          <span className="text-lg font-semibold text-slate-900 dark:text-white">
            InventoryOps
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-md lg:hidden text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <MainNav items={navigationItems} />

          {utilityItems.length > 0 && (
            <>
              <div className="my-4 mx-3 border-t border-slate-200 dark:border-slate-800" />
              <MainNav items={utilityItems} />
            </>
          )}
        </div>

        {/* Theme Toggle */}
        {onToggleTheme && (
          <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={onToggleTheme}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? (
                <>
                  <Sun className="w-5 h-5 text-slate-400" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5 text-slate-400" />
                  Dark Mode
                </>
              )}
            </button>
          </div>
        )}

        {/* User Menu */}
        {user && (
          <div className="border-t border-slate-200 dark:border-slate-800">
            <UserMenu user={user} onLogout={onLogout} />
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="lg:pl-60">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 lg:hidden">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="ml-3 text-lg font-semibold text-slate-900 dark:text-white">
              InventoryOps
            </span>
          </div>
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          )}
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)] lg:min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}

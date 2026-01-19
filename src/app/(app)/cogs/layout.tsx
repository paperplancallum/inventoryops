'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Table2,
  FileText,
  Layers,
  DollarSign,
  AlertTriangle,
  Settings,
} from 'lucide-react'

const tabs = [
  { label: 'Dashboard', href: '/cogs', icon: LayoutDashboard },
  { label: 'Table', href: '/cogs/table', icon: Table2 },
  { label: 'Reports', href: '/cogs/reports', icon: FileText },
  { label: 'Batch FIFO', href: '/cogs/batch-report', icon: Layers },
  { label: 'Fees', href: '/cogs/fees', icon: DollarSign },
  { label: 'Losses', href: '/cogs/losses', icon: AlertTriangle },
  { label: 'Settings', href: '/cogs/settings', icon: Settings },
]

export default function COGSLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col min-h-screen">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20">
        <div className="px-4 sm:px-6">
          <nav className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px">
            {tabs.map(tab => {
              const isActive = pathname === tab.href ||
                (tab.href !== '/cogs' && pathname.startsWith(tab.href))
              const Icon = tab.icon

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap
                    border-b-2 transition-colors
                    ${isActive
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-600'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}

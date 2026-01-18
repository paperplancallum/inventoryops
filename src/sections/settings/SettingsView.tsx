'use client'

import { useState } from 'react'
import type { SettingsTab } from './types'

const TABS: { id: SettingsTab; label: string; description: string }[] = [
  { id: 'amazon-accounts', label: 'Amazon Accounts', description: 'Connect Seller Central accounts' },
  { id: 'brands', label: 'Brands', description: 'Product brand management' },
  { id: 'routes', label: 'Routes', description: 'Shipping legs and routes' },
]

interface SettingsViewProps {
  children: React.ReactNode
  activeTab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
}

export function SettingsView({ children, activeTab, onTabChange }: SettingsViewProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage Amazon connections, brands, and shipping configuration
          </p>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`
                    whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors
                    ${
                      isActive
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                    }
                  `}
                >
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 bg-slate-50 dark:bg-slate-950">
        {children}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import type { SettingsTab, SettingsTabOption } from '../types'
import { AmazonAccountsView } from './AmazonAccountsView'
import { BrandsSettingsView } from './BrandsSettingsView'
import { RoutesSettingsView } from './RoutesSettingsView'

const tabs: SettingsTabOption[] = [
  { id: 'amazon', label: 'Amazon Accounts', description: 'Connect Seller Central accounts' },
  { id: 'brands', label: 'Brands', description: 'Product brand management' },
  { id: 'routes', label: 'Routes', description: 'Shipping routes and legs' },
  { id: 'notifications', label: 'Notifications', description: 'Alert preferences', disabled: true },
  { id: 'preferences', label: 'Preferences', description: 'App preferences', disabled: true },
]

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('amazon')

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage shipping configuration, notifications, and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => !tab.disabled && setActiveTab(tab.id)}
                  disabled={tab.disabled}
                  className={`
                    whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors
                    ${
                      isActive
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : tab.disabled
                          ? 'border-transparent text-slate-300 cursor-not-allowed dark:text-slate-600'
                          : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                    }
                  `}
                >
                  {tab.label}
                  {tab.disabled && (
                    <span className="ml-1.5 text-xs text-slate-400 dark:text-slate-500">
                      (Soon)
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 bg-slate-50 dark:bg-slate-950">
        {activeTab === 'amazon' && <AmazonAccountsView />}
        {activeTab === 'brands' && <BrandsSettingsView />}
        {activeTab === 'routes' && <RoutesSettingsView />}

        {activeTab === 'notifications' && (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-600">
            <p className="text-slate-500 dark:text-slate-400">
              Notification settings coming soon.
            </p>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-600">
            <p className="text-slate-500 dark:text-slate-400">
              Preference settings coming soon.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

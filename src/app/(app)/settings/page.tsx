'use client'

import { useState } from 'react'
import { Route, Building2, Bell, Shield, Database, Cloud } from 'lucide-react'
import { ShippingRoutesSettings, AmazonSyncSettings } from '@/sections/settings'

type SettingsTab = 'shipping-routes' | 'amazon-sync' | 'locations' | 'notifications' | 'security' | 'data'

const tabs: { id: SettingsTab; label: string; icon: typeof Route; available: boolean }[] = [
  { id: 'shipping-routes', label: 'Shipping Routes', icon: Route, available: true },
  { id: 'amazon-sync', label: 'Amazon Sync', icon: Cloud, available: true },
  { id: 'locations', label: 'Locations', icon: Building2, available: false },
  { id: 'notifications', label: 'Notifications', icon: Bell, available: false },
  { id: 'security', label: 'Security', icon: Shield, available: false },
  { id: 'data', label: 'Data Management', icon: Database, available: false },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('shipping-routes')

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Configure your application preferences and integrations
          </p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-y-auto">
          <nav className="p-4 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => tab.available && setActiveTab(tab.id)}
                  disabled={!tab.available}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                      : tab.available
                        ? 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        : 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                  {!tab.available && (
                    <span className="ml-auto text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      Soon
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950">
          {activeTab === 'shipping-routes' && <ShippingRoutesSettings />}
          {activeTab === 'amazon-sync' && <AmazonSyncSettings />}

          {activeTab !== 'shipping-routes' && activeTab !== 'amazon-sync' && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-slate-500 dark:text-slate-400">
                  This section is coming soon
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

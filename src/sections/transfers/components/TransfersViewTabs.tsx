'use client'

import { Truck, Users, Package, List } from 'lucide-react'
import type { TransfersViewTab } from '../types'

interface TransfersViewTabsProps {
  activeTab: TransfersViewTab
  onTabChange: (tab: TransfersViewTab) => void
  transfersCount?: number
  lineItemsCount?: number
  agentsCount?: number
  amazonShipmentsCount?: number
}

export function TransfersViewTabs({
  activeTab,
  onTabChange,
  transfersCount = 0,
  lineItemsCount = 0,
  agentsCount = 0,
  amazonShipmentsCount = 0,
}: TransfersViewTabsProps) {
  const tabs: { id: TransfersViewTab; label: string; icon: typeof Truck; count: number }[] = [
    { id: 'transfers', label: 'Transfers', icon: Truck, count: transfersCount },
    { id: 'line-items', label: 'Line Items', icon: List, count: lineItemsCount },
    { id: 'shipping-agents', label: 'Shipping Agents', icon: Users, count: agentsCount },
    { id: 'amazon-shipments', label: 'Amazon Shipments', icon: Package, count: amazonShipmentsCount },
  ]

  return (
    <div className="flex gap-1 border-b border-stone-200 dark:border-stone-700">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              isActive
                ? 'border-lime-600 text-lime-600 dark:text-lime-400'
                : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
            <span
              className={`px-1.5 py-0.5 text-xs rounded ${
                isActive
                  ? 'bg-lime-100 text-lime-700 dark:bg-lime-900/50 dark:text-lime-300'
                  : 'bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

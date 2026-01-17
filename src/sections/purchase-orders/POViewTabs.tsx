'use client'

import type { POViewTabsProps } from './types'

export function POViewTabs({
  activeTab,
  onTabChange,
  orderCount,
  lineItemCount,
}: POViewTabsProps) {
  return (
    <div className="flex border-b border-slate-200 dark:border-slate-700">
      <button
        onClick={() => onTabChange('orders')}
        className={`px-4 py-3 text-sm font-medium transition-colors relative ${
          activeTab === 'orders'
            ? 'text-indigo-600 dark:text-indigo-400'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
        }`}
      >
        <span className="flex items-center gap-2">
          Orders
          <span
            className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'orders'
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}
          >
            {orderCount}
          </span>
        </span>
        {activeTab === 'orders' && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
        )}
      </button>

      <button
        onClick={() => onTabChange('line-items')}
        className={`px-4 py-3 text-sm font-medium transition-colors relative ${
          activeTab === 'line-items'
            ? 'text-indigo-600 dark:text-indigo-400'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
        }`}
      >
        <span className="flex items-center gap-2">
          Line Items
          <span
            className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'line-items'
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}
          >
            {lineItemCount}
          </span>
        </span>
        {activeTab === 'line-items' && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
        )}
      </button>
    </div>
  )
}

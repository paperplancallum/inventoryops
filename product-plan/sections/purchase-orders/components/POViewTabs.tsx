import type { POViewTab } from '@/../product/sections/purchase-orders/types'

interface POViewTabsProps {
  activeTab: POViewTab
  onTabChange: (tab: POViewTab) => void
  poCount: number
  lineItemCount: number
}

export function POViewTabs({ activeTab, onTabChange, poCount, lineItemCount }: POViewTabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg w-fit">
      <button
        onClick={() => onTabChange('purchase-orders')}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          activeTab === 'purchase-orders'
            ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        Purchase Orders
        <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
          activeTab === 'purchase-orders'
            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
            : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
        }`}>
          {poCount}
        </span>
      </button>
      <button
        onClick={() => onTabChange('line-items')}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          activeTab === 'line-items'
            ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        Line Items
        <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
          activeTab === 'line-items'
            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
            : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
        }`}>
          {lineItemCount}
        </span>
      </button>
    </div>
  )
}

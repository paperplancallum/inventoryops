import type { TransfersViewTab } from '@/../product/sections/transfers/types'

interface TransfersViewTabsProps {
  activeTab: TransfersViewTab
  onTabChange: (tab: TransfersViewTab) => void
  transfersCount: number
  agentsCount: number
  amazonShipmentsCount?: number
}

export function TransfersViewTabs({
  activeTab,
  onTabChange,
  transfersCount,
  agentsCount,
  amazonShipmentsCount = 0,
}: TransfersViewTabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg w-fit">
      <button
        onClick={() => onTabChange('transfers')}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          activeTab === 'transfers'
            ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        Transfers
        <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
          activeTab === 'transfers'
            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
            : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
        }`}>
          {transfersCount}
        </span>
      </button>
      <button
        onClick={() => onTabChange('shipping-agents')}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          activeTab === 'shipping-agents'
            ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        Shipping Agents
        <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
          activeTab === 'shipping-agents'
            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
            : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
        }`}>
          {agentsCount}
        </span>
      </button>
      <button
        onClick={() => onTabChange('amazon-shipments')}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          activeTab === 'amazon-shipments'
            ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        Amazon Shipments
        <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
          activeTab === 'amazon-shipments'
            ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
            : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
        }`}>
          {amazonShipmentsCount}
        </span>
      </button>
    </div>
  )
}

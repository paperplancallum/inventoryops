import type { LineItemsSummary } from '@/../product/sections/purchase-orders/types'

// Icons
const ListIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
)

const CubeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)

const CurrencyIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const TagIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
)

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return `$${value.toFixed(0)}`
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

interface LineItemsSummaryCardsProps {
  summary: LineItemsSummary
}

export function LineItemsSummaryCards({ summary }: LineItemsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-200 dark:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-300">
            <ListIcon />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Line Items
          </p>
        </div>
        <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
          {formatNumber(summary.totalLineItems)}
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
            <CubeIcon />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Total Units
          </p>
        </div>
        <p className="mt-2 text-2xl font-semibold text-indigo-600 dark:text-indigo-400">
          {formatNumber(summary.totalUnits)}
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
            <CurrencyIcon />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Total Value
          </p>
        </div>
        <p className="mt-2 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(summary.totalValue)}
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
            <TagIcon />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Unique SKUs
          </p>
        </div>
        <p className="mt-2 text-2xl font-semibold text-amber-600 dark:text-amber-400">
          {formatNumber(summary.uniqueProducts)}
        </p>
      </div>
    </div>
  )
}

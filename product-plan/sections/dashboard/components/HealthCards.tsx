import { Package, DollarSign, ChevronRight } from 'lucide-react'
import type { HealthCardsProps } from '../../../../product/sections/dashboard/types'

function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`
  }
  return `$${amount.toLocaleString()}`
}

export function HealthCards({ inventoryHealth, cashFlow, onNavigate }: HealthCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Inventory Health Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Inventory Health</h3>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-600 dark:text-slate-400">Stock levels</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">{inventoryHealth.healthyPercent}% healthy</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-2 rounded-full bg-lime-500"
              style={{ width: `${inventoryHealth.healthyPercent}%` }}
            />
          </div>
        </div>

        {/* Alert counts */}
        <div className="flex gap-4 text-sm mb-4">
          {inventoryHealth.criticalCount > 0 && (
            <span className="text-red-600 dark:text-red-400">
              {inventoryHealth.criticalCount} critical
            </span>
          )}
          {inventoryHealth.warningCount > 0 && (
            <span className="text-amber-600 dark:text-amber-400">
              {inventoryHealth.warningCount} warning
            </span>
          )}
        </div>

        {/* Link */}
        <button
          onClick={() => onNavigate?.('inventory-intelligence')}
          className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
        >
          View Suggestions
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Cash Flow Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Cash Flow</h3>
        </div>

        {/* Metrics */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">Outstanding</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(cashFlow.outstanding)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">Overdue</span>
            <span className={`font-medium ${cashFlow.overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
              {formatCurrency(cashFlow.overdue)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">Due this week</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(cashFlow.dueThisWeek)}</span>
          </div>
        </div>

        {/* Link */}
        <button
          onClick={() => onNavigate?.('invoices-and-payments')}
          className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
        >
          View Invoices
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

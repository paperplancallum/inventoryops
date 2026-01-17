'use client'

import type { DaysRemainingBadgeProps } from '@/../product/sections/inventory-intelligence/types'

export function DaysRemainingBadge({ days, stockoutDate, urgency }: DaysRemainingBadgeProps) {
  // Determine color based on urgency or days
  const getStyles = () => {
    const effectiveUrgency = urgency || (days < 7 ? 'critical' : days < 14 ? 'warning' : 'planned')

    switch (effectiveUrgency) {
      case 'critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'warning':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      case 'planned':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getStyles()}`}>
        {days} days
      </span>
      {stockoutDate && (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Stockout: {formatDate(stockoutDate)}
        </span>
      )}
    </div>
  )
}

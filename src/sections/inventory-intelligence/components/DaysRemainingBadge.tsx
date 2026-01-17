'use client'

import type { SuggestionUrgency } from '../types'

interface DaysRemainingBadgeProps {
  days: number | null
  stockoutDate?: string | null
  urgency?: SuggestionUrgency
}

export function DaysRemainingBadge({ days, stockoutDate, urgency }: DaysRemainingBadgeProps) {
  // Handle null days
  const effectiveDays = days ?? -1

  // Determine color based on urgency or days
  const getStyles = () => {
    const effectiveUrgency = urgency || (effectiveDays < 0 ? 'critical' : effectiveDays < 7 ? 'critical' : effectiveDays < 14 ? 'warning' : 'planned')

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

  const getDaysText = () => {
    if (days === null) return 'Unknown'
    if (effectiveDays < 0) return 'Stockout!'
    if (effectiveDays === 0) return 'Stockout today'
    return `${effectiveDays} ${effectiveDays === 1 ? 'day' : 'days'}`
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getStyles()}`}>
        {getDaysText()}
      </span>
      {stockoutDate && effectiveDays >= 0 && (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Stockout: {formatDate(stockoutDate)}
        </span>
      )}
    </div>
  )
}

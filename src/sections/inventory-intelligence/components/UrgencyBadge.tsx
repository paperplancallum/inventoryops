'use client'

import type { SuggestionUrgency } from '../types'

interface UrgencyBadgeProps {
  urgency: SuggestionUrgency
  size?: 'sm' | 'md' | 'lg'
}

const urgencyStyles: Record<SuggestionUrgency, { bg: string; text: string; dot: string }> = {
  critical: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
  },
  warning: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  planned: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-700 dark:text-indigo-400',
    dot: 'bg-indigo-500',
  },
  monitor: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-400',
    dot: 'bg-slate-500',
  },
}

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-1 text-xs',
  lg: 'px-2.5 py-1 text-sm',
}

export function UrgencyBadge({ urgency, size = 'md' }: UrgencyBadgeProps) {
  const styles = urgencyStyles[urgency]
  const label = urgency.charAt(0).toUpperCase() + urgency.slice(1)

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${styles.bg} ${styles.text} ${sizeStyles[size]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
      {label}
    </span>
  )
}

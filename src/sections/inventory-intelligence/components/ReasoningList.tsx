'use client'

import { Info, AlertTriangle, Calculator } from 'lucide-react'
import type { ReasoningItem, ReasoningItemType } from '../types'

interface ReasoningListProps {
  items: ReasoningItem[]
}

const iconMap: Record<ReasoningItemType, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  calculation: Calculator,
}

const styleMap: Record<ReasoningItemType, { icon: string; bg: string; text: string }> = {
  info: {
    icon: 'text-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    text: 'text-slate-700 dark:text-slate-300',
  },
  warning: {
    icon: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-800 dark:text-amber-300',
  },
  calculation: {
    icon: 'text-slate-500',
    bg: 'bg-slate-50 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
  },
}

export function ReasoningList({ items }: ReasoningListProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400 italic">
        No reasoning items available
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {items.map((item, index) => {
        const Icon = iconMap[item.type]
        const styles = styleMap[item.type]

        return (
          <li
            key={index}
            className={`flex items-start gap-3 rounded-lg p-3 ${styles.bg}`}
          >
            <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${styles.icon}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${styles.text}`}>{item.message}</p>
              {item.value !== undefined && (
                <p className="mt-0.5 text-sm font-medium text-slate-900 dark:text-white">
                  {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

import { Package, DollarSign, FileText, ClipboardCheck, ChevronRight, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import type { ActionNeededProps, ActionItem } from '../../../../product/sections/dashboard/types'

function getTypeIcon(type: ActionItem['type']) {
  switch (type) {
    case 'stock':
      return <Package className="h-5 w-5" />
    case 'payment':
      return <DollarSign className="h-5 w-5" />
    case 'invoice':
      return <FileText className="h-5 w-5" />
    case 'inspection':
      return <ClipboardCheck className="h-5 w-5" />
  }
}

function getUrgencyStyles(urgency: ActionItem['urgency']) {
  switch (urgency) {
    case 'critical':
      return {
        bg: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-200 dark:border-red-900',
        icon: 'text-red-600 dark:text-red-400',
        indicator: <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
      }
    case 'warning':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-amber-200 dark:border-amber-900',
        icon: 'text-amber-600 dark:text-amber-400',
        indicator: <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      }
    case 'info':
      return {
        bg: 'bg-slate-50 dark:bg-slate-800',
        border: 'border-slate-200 dark:border-slate-700',
        icon: 'text-slate-600 dark:text-slate-400',
        indicator: <Info className="h-4 w-4 text-slate-500 dark:text-slate-400" />
      }
  }
}

interface ActionRowProps {
  item: ActionItem
  onAction?: (item: ActionItem) => void
}

function ActionRow({ item, onAction }: ActionRowProps) {
  const styles = getUrgencyStyles(item.urgency)

  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 ${styles.bg} ${styles.border}`}>
      <div className={styles.icon}>
        {getTypeIcon(item.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {styles.indicator}
          <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{item.title}</p>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
      </div>
      <button
        onClick={() => onAction?.(item)}
        className="flex items-center gap-1 whitespace-nowrap rounded-md bg-white dark:bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
      >
        {item.actionLabel}
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ActionNeeded({ items, onAction, maxItems = 5 }: ActionNeededProps) {
  // Don't render anything if no items
  if (items.length === 0) {
    return null
  }

  const displayItems = items.slice(0, maxItems)
  const hasMore = items.length > maxItems

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100">Action Needed</h3>
      <div className="space-y-2">
        {displayItems.map((item) => (
          <ActionRow key={item.id} item={item} onAction={onAction} />
        ))}
      </div>
      {hasMore && (
        <button className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
          View all {items.length} items
        </button>
      )}
    </div>
  )
}

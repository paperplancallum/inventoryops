import Image from 'next/image'
import type { ActivityLogEntryRowProps, ActionType, EntityType } from '@/../product/sections/activity-log/types'
import { FieldChangeDisplay } from './FieldChangeDisplay'

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const ExternalLinkIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
)

function getActionBadgeStyles(action: ActionType): string {
  switch (action) {
    case 'create':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'update':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'delete':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'status_change':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
  }
}

function getActionLabel(action: ActionType): string {
  switch (action) {
    case 'create':
      return 'Created'
    case 'update':
      return 'Updated'
    case 'delete':
      return 'Deleted'
    case 'status_change':
      return 'Status Changed'
    default:
      return action
  }
}

function getEntityTypeIcon(entityType: EntityType) {
  switch (entityType) {
    case 'product':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    case 'supplier':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    case 'purchase-order':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    case 'transfer':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      )
    case 'inspection':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    case 'batch':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    case 'location':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    case 'cost':
    case 'payment':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    default:
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      )
  }
}

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function formatFullTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function ActivityLogEntryRow({
  entry,
  isExpanded = false,
  onToggleExpand,
  onViewEntity,
}: ActivityLogEntryRowProps) {
  const hasChanges = entry.changes.length > 0

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      {/* Main Row */}
      <div
        className={`px-4 py-3 flex items-center gap-3 ${hasChanges ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50' : ''}`}
        onClick={() => hasChanges && onToggleExpand?.()}
      >
        {/* Expand/Collapse Icon */}
        <div className="w-5 flex-shrink-0">
          {hasChanges && (
            <span className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} inline-block`}>
              <ChevronDownIcon />
            </span>
          )}
        </div>

        {/* Timestamp */}
        <div className="w-20 flex-shrink-0">
          <span
            className="text-xs text-slate-500 dark:text-slate-400"
            title={formatFullTime(entry.timestamp)}
          >
            {formatRelativeTime(entry.timestamp)}
          </span>
        </div>

        {/* User */}
        <div className="flex items-center gap-2 w-32 flex-shrink-0">
          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400">
            {entry.user.avatarUrl ? (
              <Image src={entry.user.avatarUrl} alt="" width={24} height={24} className="w-6 h-6 rounded-full" />
            ) : (
              <UserIcon />
            )}
          </div>
          <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
            {entry.user.name}
          </span>
        </div>

        {/* Action Badge */}
        <div className="w-28 flex-shrink-0">
          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getActionBadgeStyles(entry.action)}`}>
            {getActionLabel(entry.action)}
          </span>
        </div>

        {/* Entity */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-slate-400 dark:text-slate-500">
            {getEntityTypeIcon(entry.entityType)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onViewEntity?.()
            }}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline truncate flex items-center gap-1"
          >
            {entry.entityName}
            <ExternalLinkIcon />
          </button>
        </div>

        {/* Notes indicator */}
        {entry.notes && (
          <div className="flex-shrink-0" title={entry.notes}>
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && hasChanges && (
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
          <div className="ml-5 space-y-1 divide-y divide-slate-200 dark:divide-slate-700">
            {entry.changes.map((change, index) => (
              <FieldChangeDisplay key={index} change={change} />
            ))}
          </div>
          {entry.notes && (
            <div className="ml-5 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium">Note:</span> {entry.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import type { ActivityLogEntry, ActivityActionType, ActivityEntityType } from '@/lib/supabase/hooks/useActivityLog'
import { FieldChangeDisplay } from './FieldChangeDisplay'
import {
  ChevronDown,
  User,
  ExternalLink,
  Package,
  Building2,
  FileText,
  Layers,
  MapPin,
  CreditCard,
  ClipboardCheck,
  Truck,
  Tag,
  MessageSquare,
  Settings,
  Bot,
} from 'lucide-react'

function getActionBadgeStyles(action: ActivityActionType): string {
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

function getActionLabel(action: ActivityActionType): string {
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

function getEntityTypeIcon(entityType: ActivityEntityType) {
  const className = "w-4 h-4"
  switch (entityType) {
    case 'product':
      return <Package className={className} />
    case 'supplier':
      return <Building2 className={className} />
    case 'purchase_order':
      return <FileText className={className} />
    case 'transfer':
      return <Truck className={className} />
    case 'inspection':
      return <ClipboardCheck className={className} />
    case 'batch':
      return <Layers className={className} />
    case 'location':
      return <MapPin className={className} />
    case 'invoice':
    case 'payment':
      return <CreditCard className={className} />
    case 'brand':
      return <Tag className={className} />
    case 'shipping_agent':
      return <Truck className={className} />
    case 'setting':
      return <Settings className={className} />
    default:
      return <FileText className={className} />
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

interface ActivityLogEntryRowProps {
  entry: ActivityLogEntry
  isExpanded?: boolean
  onToggleExpand?: () => void
  onViewEntity?: () => void
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
              <ChevronDown className="w-4 h-4" />
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
            {entry.isSystemAction ? (
              <Bot className="w-3.5 h-3.5" />
            ) : entry.user.avatarUrl ? (
              <img src={entry.user.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
            ) : (
              <User className="w-3.5 h-3.5" />
            )}
          </div>
          <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
            {entry.isSystemAction ? 'System' : entry.user.name}
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
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Notes indicator */}
        {entry.notes && (
          <div className="flex-shrink-0" title={entry.notes}>
            <MessageSquare className="w-4 h-4 text-slate-400" />
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

'use client'

import { useState, useMemo } from 'react'
import type {
  ActivityLogEntry,
  ActivityLogFilters as ActivityLogFiltersType,
  ActivityLogSummary,
  ActivityUser,
  GroupByOption,
  ActivityEntityType,
  DatePreset,
} from '@/lib/supabase/hooks/useActivityLog'
import { ActivityLogEntryRow } from './ActivityLogEntryRow'
import { ActivityLogFilters } from './ActivityLogFilters'
import {
  Clock,
  Calendar,
  User,
  Layers,
  Download,
  ChevronLeft,
  ChevronRight,
  Activity,
} from 'lucide-react'

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100]

function formatEntityType(entityType: string): string {
  return entityType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatDateGroupHeader(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  })
}

function groupEntries(
  entries: ActivityLogEntry[],
  groupBy: GroupByOption
): { key: string; label: string; entries: ActivityLogEntry[] }[] {
  if (groupBy === 'none') {
    return [{ key: 'all', label: '', entries }]
  }

  const groups = new Map<string, ActivityLogEntry[]>()

  entries.forEach((entry) => {
    let key: string

    switch (groupBy) {
      case 'day':
        key = new Date(entry.timestamp).toDateString()
        break
      case 'entity':
        key = `${entry.entityType}:${entry.entityId}`
        break
      case 'user':
        key = entry.user.id
        break
      default:
        key = 'all'
    }

    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(entry)
  })

  return Array.from(groups.entries()).map(([key, groupEntries]) => {
    let label: string

    switch (groupBy) {
      case 'day':
        label = formatDateGroupHeader(groupEntries[0].timestamp)
        break
      case 'entity':
        label = `${formatEntityType(groupEntries[0].entityType)}: ${groupEntries[0].entityName}`
        break
      case 'user':
        label = groupEntries[0].user.name
        break
      default:
        label = ''
    }

    return { key, label, entries: groupEntries }
  })
}

interface ActivityLogViewProps {
  entries: ActivityLogEntry[]
  filters: ActivityLogFiltersType
  summary: ActivityLogSummary
  users: ActivityUser[]
  isLoading?: boolean
  hasMore?: boolean
  onFiltersChange: (filters: Partial<ActivityLogFiltersType>) => void
  onResetFilters: () => void
  onApplyDatePreset: (preset: DatePreset) => void
  onLoadMore?: () => void
  onExport?: () => void
  onViewEntity?: (entityType: ActivityEntityType, entityId: string) => void
}

export function ActivityLogView({
  entries,
  filters,
  summary,
  users,
  isLoading = false,
  hasMore = false,
  onFiltersChange,
  onResetFilters,
  onApplyDatePreset,
  onLoadMore,
  onExport,
  onViewEntity,
}: ActivityLogViewProps) {
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [groupBy, setGroupBy] = useState<GroupByOption>('none')

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  const toggleExpanded = (entryId: string) => {
    setExpandedEntries((prev) => {
      const next = new Set(prev)
      if (next.has(entryId)) {
        next.delete(entryId)
      } else {
        next.add(entryId)
      }
      return next
    })
  }

  // Pagination calculations
  const totalPages = Math.ceil(entries.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  // Paginated entries
  const paginatedEntries = useMemo(() => {
    return entries.slice(startIndex, endIndex)
  }, [entries, startIndex, endIndex])

  // Group entries (applied to paginated results)
  const groupedEntries = useMemo(() => {
    return groupEntries(paginatedEntries, groupBy)
  }, [paginatedEntries, groupBy])

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const showEllipsisThreshold = 7

    if (totalPages <= showEllipsisThreshold) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      if (currentPage > 3) {
        pages.push('ellipsis')
      }

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis')
      }

      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Activity Log</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Track all changes across the system
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Group By Selector */}
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
                className="appearance-none px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="none">No grouping</option>
                <option value="day">Group by day</option>
                <option value="entity">Group by entity</option>
                <option value="user">Group by user</option>
              </select>

              {onExport && (
                <button
                  onClick={onExport}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-200 dark:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-300">
                  <Activity className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Total
                </p>
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {summary.totalEntries.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  This Week
                </p>
              </div>
              <p className="mt-2 text-2xl font-semibold text-indigo-600 dark:text-indigo-400">
                {summary.entriesThisWeek.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <User className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Most Active
                </p>
              </div>
              <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white truncate">
                {summary.mostActiveUser?.name || '—'}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                  <Layers className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Most Changed
                </p>
              </div>
              <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                {summary.mostChangedEntityType
                  ? formatEntityType(summary.mostChangedEntityType)
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 pb-4">
          <ActivityLogFilters
            filters={filters}
            users={users}
            onFiltersChange={onFiltersChange}
            onResetFilters={onResetFilters}
            onApplyDatePreset={onApplyDatePreset}
          />
        </div>
      </div>

      {/* Entry List */}
      <div className="p-6">
        {isLoading && entries.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading activity...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-12 text-center">
            <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="mt-4 text-sm font-medium text-slate-900 dark:text-white">
              No activity found
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {filters.searchQuery || filters.entityTypes.length > 0 || filters.actionTypes.length > 0
                ? 'Try adjusting your filters'
                : 'Activity will appear here as changes are made'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedEntries.map((group) => (
              <div key={group.key}>
                {group.label && (
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    {group.label}
                    <span className="ml-2 text-slate-400 dark:text-slate-500 font-normal">
                      ({group.entries.length})
                    </span>
                  </h3>
                )}
                <div className="space-y-2">
                  {group.entries.map((entry) => (
                    <ActivityLogEntryRow
                      key={entry.id}
                      entry={entry}
                      isExpanded={expandedEntries.has(entry.id)}
                      onToggleExpand={() => toggleExpanded(entry.id)}
                      onViewEntity={() => onViewEntity?.(entry.entityType, entry.entityId)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {entries.length > 0 && (
          <div className="mt-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Results info and items per page */}
              <div className="flex items-center gap-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Showing {startIndex + 1}–{Math.min(endIndex, entries.length)} of {entries.length} entries
                </p>
                <div className="flex items-center gap-2">
                  <label htmlFor="itemsPerPage" className="text-sm text-slate-500 dark:text-slate-400">
                    Per page:
                  </label>
                  <select
                    id="itemsPerPage"
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="appearance-none px-2 py-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Page navigation */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  {/* Previous button */}
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Page numbers */}
                  {getPageNumbers().map((page, index) =>
                    page === 'ellipsis' ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-2 py-1 text-sm text-slate-400 dark:text-slate-500"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-[32px] px-2 py-1 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  {/* Next button */}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

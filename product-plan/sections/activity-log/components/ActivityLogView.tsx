import { useState, useMemo } from 'react'
import type {
  ActivityLogProps,
  ActivityLogFilters as ActivityLogFiltersType,
  ActivityLogEntry,
  GroupByOption,
} from '@/../product/sections/activity-log/types'
import { ActivityLogEntryRow } from './ActivityLogEntryRow'
import { ActivityLogFilters } from './ActivityLogFilters'

// Icons
const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const LayersIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
)

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
)

const EmptyIcon = () => (
  <svg className="w-12 h-12 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ChevronLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100]

function formatEntityType(entityType: string): string {
  return entityType
    .split('-')
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

export function ActivityLogView({
  entries,
  entityTypes,
  actionTypes,
  users,
  summary,
  onViewEntity,
  onFilterChange,
  onExport,
  onLoadMore: _onLoadMore,
  hasMore: _hasMore = false,
  isLoading: _isLoading = false,
}: ActivityLogProps) {
  const [filters, setFilters] = useState<ActivityLogFiltersType>({
    searchQuery: '',
    entityTypes: [],
    actionTypes: [],
    userIds: [],
    dateFrom: null,
    dateTo: null,
    groupBy: 'none',
  })

  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const handleFiltersChange = (newFilters: ActivityLogFiltersType) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
    onFilterChange?.(newFilters)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when items per page changes
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

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        const matches =
          entry.entityName.toLowerCase().includes(query) ||
          entry.user.name.toLowerCase().includes(query) ||
          entry.notes.toLowerCase().includes(query)
        if (!matches) return false
      }

      // Entity type filter
      if (filters.entityTypes.length > 0 && !filters.entityTypes.includes(entry.entityType)) {
        return false
      }

      // Action type filter
      if (filters.actionTypes.length > 0 && !filters.actionTypes.includes(entry.action)) {
        return false
      }

      // User filter
      if (filters.userIds.length > 0 && !filters.userIds.includes(entry.user.id)) {
        return false
      }

      return true
    })
  }, [entries, filters])

  // Pagination calculations
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  // Paginated entries
  const paginatedEntries = useMemo(() => {
    return filteredEntries.slice(startIndex, endIndex)
  }, [filteredEntries, startIndex, endIndex])

  // Group entries (applied to paginated results)
  const groupedEntries = useMemo(() => {
    return groupEntries(paginatedEntries, filters.groupBy)
  }, [paginatedEntries, filters.groupBy])

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const showEllipsisThreshold = 7

    if (totalPages <= showEllipsisThreshold) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage > 3) {
        pages.push('ellipsis')
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis')
      }

      // Always show last page
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
            {onExport && (
              <button
                onClick={onExport}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                <DownloadIcon />
                Export
              </button>
            )}
          </div>

          {/* Summary Cards */}
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-200 dark:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-300">
                  <ClockIcon />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Total
                </p>
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {summary.totalEntries}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <CalendarIcon />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  This Week
                </p>
              </div>
              <p className="mt-2 text-2xl font-semibold text-indigo-600 dark:text-indigo-400">
                {summary.entriesThisWeek}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <UserIcon />
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
                  <LayersIcon />
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
            entityTypes={entityTypes}
            actionTypes={actionTypes}
            users={users}
            onFiltersChange={handleFiltersChange}
          />
        </div>
      </div>

      {/* Entry List */}
      <div className="p-6">
        {filteredEntries.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-12 text-center">
            <EmptyIcon />
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
        {filteredEntries.length > 0 && (
          <div className="mt-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Results info and items per page */}
              <div className="flex items-center gap-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Showing {startIndex + 1}–{Math.min(endIndex, filteredEntries.length)} of {filteredEntries.length} entries
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
                    <ChevronLeftIcon />
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
                    <ChevronRightIcon />
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

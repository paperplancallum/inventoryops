'use client'

import { useState } from 'react'
import type {
  ActivityLogFilters as ActivityLogFiltersType,
  ActivityEntityType,
  ActivityActionType,
  ActivityUser,
  DatePreset,
} from '@/lib/supabase/hooks/useActivityLog'
import {
  ENTITY_TYPE_OPTIONS,
  ACTION_TYPE_OPTIONS,
  DATE_PRESET_OPTIONS,
} from '@/lib/supabase/hooks/useActivityLog'
import { Search, Filter, X, Calendar, ChevronDown } from 'lucide-react'

interface ActivityLogFiltersProps {
  filters: ActivityLogFiltersType
  users: ActivityUser[]
  onFiltersChange: (filters: Partial<ActivityLogFiltersType>) => void
  onResetFilters: () => void
  onApplyDatePreset: (preset: DatePreset) => void
}

export function ActivityLogFilters({
  filters,
  users,
  onFiltersChange,
  onResetFilters,
  onApplyDatePreset,
}: ActivityLogFiltersProps) {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [datePreset, setDatePreset] = useState<DatePreset | null>(null)

  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.entityTypes.length > 0 ||
    filters.actionTypes.length > 0 ||
    filters.userIds.length > 0 ||
    filters.dateFrom !== null ||
    filters.dateTo !== null ||
    !filters.includeSystemActions

  const handleClearFilters = () => {
    setDatePreset(null)
    setShowDatePicker(false)
    onResetFilters()
  }

  const handleDatePresetChange = (preset: DatePreset) => {
    setDatePreset(preset)
    if (preset === 'custom') {
      setShowDatePicker(true)
    } else {
      setShowDatePicker(false)
      onApplyDatePreset(preset)
    }
  }

  const handleCustomDateChange = (field: 'dateFrom' | 'dateTo', value: string) => {
    const isoValue = value ? new Date(value).toISOString() : null
    onFiltersChange({ [field]: isoValue })
  }

  // Get current date preset label
  const getDatePresetLabel = () => {
    if (datePreset && datePreset !== 'custom') {
      return DATE_PRESET_OPTIONS.find(o => o.id === datePreset)?.label || 'All time'
    }
    if (filters.dateFrom || filters.dateTo) {
      return 'Custom range'
    }
    return 'All time'
  }

  return (
    <div className="space-y-3">
      {/* Main Filter Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by entity name..."
            value={filters.searchQuery}
            onChange={(e) => onFiltersChange({ searchQuery: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Entity Type Filter */}
        <div className="relative">
          <select
            value={filters.entityTypes[0] || ''}
            onChange={(e) => {
              const value = e.target.value as ActivityEntityType | ''
              onFiltersChange({
                entityTypes: value ? [value] : [],
              })
            }}
            className="appearance-none pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
          >
            <option value="">All entities</option>
            {ENTITY_TYPE_OPTIONS.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <Filter className="w-4 h-4" />
          </div>
        </div>

        {/* Action Type Filter */}
        <div className="relative">
          <select
            value={filters.actionTypes[0] || ''}
            onChange={(e) => {
              const value = e.target.value as ActivityActionType | ''
              onFiltersChange({
                actionTypes: value ? [value] : [],
              })
            }}
            className="appearance-none pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
          >
            <option value="">All actions</option>
            {ACTION_TYPE_OPTIONS.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <Filter className="w-4 h-4" />
          </div>
        </div>

        {/* User Filter */}
        <div className="relative">
          <select
            value={filters.userIds[0] || ''}
            onChange={(e) => {
              const value = e.target.value
              onFiltersChange({
                userIds: value ? [value] : [],
              })
            }}
            className="appearance-none pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
          >
            <option value="">All users</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <Filter className="w-4 h-4" />
          </div>
        </div>

        {/* Date Preset Dropdown */}
        <div className="relative">
          <select
            value={datePreset || ''}
            onChange={(e) => handleDatePresetChange(e.target.value as DatePreset)}
            className="appearance-none pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
          >
            <option value="">All time</option>
            {DATE_PRESET_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
            <option value="custom">Custom range...</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <Calendar className="w-4 h-4" />
          </div>
        </div>

        {/* System Actions Toggle */}
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.includeSystemActions}
            onChange={(e) => onFiltersChange({ includeSystemActions: e.target.checked })}
            className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
          />
          Include system actions
        </label>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear filters
          </button>
        )}
      </div>

      {/* Custom Date Range Picker */}
      {showDatePicker && (
        <div className="flex items-center gap-3 pl-0 sm:pl-4 pt-2 border-t border-slate-200 dark:border-slate-700">
          <span className="text-sm text-slate-500 dark:text-slate-400">From:</span>
          <input
            type="date"
            value={filters.dateFrom ? new Date(filters.dateFrom).toISOString().split('T')[0] : ''}
            onChange={(e) => handleCustomDateChange('dateFrom', e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-sm text-slate-500 dark:text-slate-400">To:</span>
          <input
            type="date"
            value={filters.dateTo ? new Date(filters.dateTo).toISOString().split('T')[0] : ''}
            onChange={(e) => handleCustomDateChange('dateTo', e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => {
              setShowDatePicker(false)
              setDatePreset(null)
              onFiltersChange({ dateFrom: null, dateTo: null })
            }}
            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Clear dates
          </button>
        </div>
      )}
    </div>
  )
}

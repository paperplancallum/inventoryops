'use client'

import { useState, useMemo } from 'react'
import type {
  MagicLink,
  MagicLinksSummary,
  MagicLinksFilters,
  MagicLinkStatus,
  MagicLinkEntityType,
  MagicLinkPurpose,
} from '@/lib/supabase/hooks/useMagicLinks'
import { MagicLinkTableRow } from './MagicLinkTableRow'
import {
  Link2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface MagicLinksViewProps {
  magicLinks: MagicLink[]
  summary: MagicLinksSummary
  filters: MagicLinksFilters
  isLoading?: boolean
  statusOptions: { id: MagicLinkStatus; label: string }[]
  entityTypeOptions: { id: MagicLinkEntityType; label: string }[]
  purposeOptions: { id: MagicLinkPurpose; label: string }[]
  onFiltersChange: (filters: Partial<MagicLinksFilters>) => void
  onResetFilters: () => void
  onViewLink: (id: string) => void
  onRevokeLink: (id: string) => void
  onRegenerateLink: (id: string) => void
  onSendReminder: (id: string) => void
  onViewEntity: (entityType: MagicLinkEntityType, entityId: string) => void
}

const STATUS_COLORS: Record<MagicLinkStatus, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  expired: 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400',
  revoked: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export function MagicLinksView({
  magicLinks,
  summary,
  filters,
  isLoading = false,
  statusOptions,
  entityTypeOptions,
  purposeOptions,
  onFiltersChange,
  onResetFilters,
  onViewLink,
  onRevokeLink,
  onRegenerateLink,
  onSendReminder,
  onViewEntity,
}: MagicLinksViewProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const itemsPerPage = 25

  // Pagination
  const totalPages = Math.ceil(magicLinks.length / itemsPerPage)
  const paginatedLinks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return magicLinks.slice(start, start + itemsPerPage)
  }, [magicLinks, currentPage])

  const hasActiveFilters = filters.statuses.length > 0 ||
    filters.entityTypes.length > 0 ||
    filters.purposes.length > 0 ||
    filters.searchQuery.length > 0

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Link2 className="h-6 w-6" />
          Magic Links
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage secure links for external stakeholders
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Link2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.totalActive}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Active Links</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.pendingSubmission}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Pending</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.submittedThisWeek}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Submitted This Week</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.expiringWithin24Hours}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Expiring Soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 mb-6">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by recipient or entity..."
              value={filters.searchQuery}
              onChange={(e) => onFiltersChange({ searchQuery: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              hasActiveFilters
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-indigo-500 text-white text-xs px-1.5 rounded-full">
                {filters.statuses.length + filters.entityTypes.length + filters.purposes.length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      const newStatuses = filters.statuses.includes(option.id)
                        ? filters.statuses.filter((s) => s !== option.id)
                        : [...filters.statuses, option.id]
                      onFiltersChange({ statuses: newStatuses })
                    }}
                    className={`px-3 py-1 rounded-full text-sm ${
                      filters.statuses.includes(option.id)
                        ? STATUS_COLORS[option.id]
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Entity Type Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Entity Type
              </label>
              <div className="flex flex-wrap gap-2">
                {entityTypeOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      const newTypes = filters.entityTypes.includes(option.id)
                        ? filters.entityTypes.filter((t) => t !== option.id)
                        : [...filters.entityTypes, option.id]
                      onFiltersChange({ entityTypes: newTypes })
                    }}
                    className={`px-3 py-1 rounded-full text-sm ${
                      filters.entityTypes.includes(option.id)
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Purpose Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Purpose
              </label>
              <div className="flex flex-wrap gap-2">
                {purposeOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      const newPurposes = filters.purposes.includes(option.id)
                        ? filters.purposes.filter((p) => p !== option.id)
                        : [...filters.purposes, option.id]
                      onFiltersChange({ purposes: newPurposes })
                    }}
                    className={`px-3 py-1 rounded-full text-sm ${
                      filters.purposes.includes(option.id)
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Entity</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Recipient</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Purpose</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Created</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Expires</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    Loading magic links...
                  </td>
                </tr>
              ) : paginatedLinks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Link2 className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                      <p className="text-slate-500 dark:text-slate-400">
                        {hasActiveFilters ? 'No links match your filters' : 'No magic links yet'}
                      </p>
                      <p className="text-sm text-slate-400 dark:text-slate-500">
                        Generate links from Purchase Orders or Transfers
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLinks.map((link) => (
                  <MagicLinkTableRow
                    key={link.id}
                    link={link}
                    onView={() => onViewLink(link.id)}
                    onRevoke={() => onRevokeLink(link.id)}
                    onRegenerate={() => onRegenerateLink(link.id)}
                    onSendReminder={() => onSendReminder(link.id)}
                    onViewEntity={() => onViewEntity(link.linkedEntityType, link.linkedEntityId)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, magicLinks.length)} of {magicLinks.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

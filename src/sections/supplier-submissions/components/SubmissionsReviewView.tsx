'use client'

import { useState, useMemo } from 'react'
import {
  FileText,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Check,
  Clock,
  DollarSign,
} from 'lucide-react'
import type { SupplierInvoiceSubmission, SubmissionReviewStatus, SubmissionsSummary } from '@/lib/supabase/hooks'
import { SubmissionTableRow } from './SubmissionTableRow'

interface SubmissionsReviewViewProps {
  submissions: SupplierInvoiceSubmission[]
  summary: SubmissionsSummary
  isLoading?: boolean
  statusFilter: SubmissionReviewStatus[]
  onStatusFilterChange: (statuses: SubmissionReviewStatus[]) => void
  onViewSubmission: (id: string) => void
  onViewPO: (poId: string) => void
}

const STATUS_OPTIONS: { id: SubmissionReviewStatus; label: string; color: string }[] = [
  { id: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  { id: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { id: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  { id: 'partially_approved', label: 'Partial', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
]

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function SubmissionsReviewView({
  submissions,
  summary,
  isLoading = false,
  statusFilter,
  onStatusFilterChange,
  onViewSubmission,
  onViewPO,
}: SubmissionsReviewViewProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const itemsPerPage = 25

  // Pagination
  const totalPages = Math.ceil(submissions.length / itemsPerPage)
  const paginatedSubmissions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return submissions.slice(start, start + itemsPerPage)
  }, [submissions, currentPage])

  const hasActiveFilters = statusFilter.length > 0

  const toggleStatusFilter = (status: SubmissionReviewStatus) => {
    if (statusFilter.includes(status)) {
      onStatusFilterChange(statusFilter.filter(s => s !== status))
    } else {
      onStatusFilterChange([...statusFilter, status])
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Supplier Invoice Review
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Review and approve supplier price submissions from magic links
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.pendingReview}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Pending</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.approved}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Approved</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <X className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.rejected}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Rejected</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.partiallyApproved}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Partial</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <DollarSign className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(summary.pendingVarianceTotal)}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Pending Variance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              hasActiveFilters
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filter by Status
            {hasActiveFilters && (
              <span className="bg-indigo-500 text-white text-xs px-1.5 rounded-full">
                {statusFilter.length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={() => onStatusFilterChange([])}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}

          {/* Quick filter buttons */}
          {showFilters && (
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(option => (
                <button
                  key={option.id}
                  onClick={() => toggleStatusFilter(option.id)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    statusFilter.includes(option.id)
                      ? option.color
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">PO / Supplier</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Submitted By</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Expected vs Submitted</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Variance</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Submitted</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    Loading submissions...
                  </td>
                </tr>
              ) : paginatedSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                      <p className="text-slate-500 dark:text-slate-400">
                        {hasActiveFilters ? 'No submissions match your filter' : 'No submissions yet'}
                      </p>
                      <p className="text-sm text-slate-400 dark:text-slate-500">
                        Supplier submissions from magic links will appear here
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSubmissions.map(submission => (
                  <SubmissionTableRow
                    key={submission.id}
                    submission={submission}
                    onViewDetails={() => onViewSubmission(submission.id)}
                    onViewPO={() => onViewPO(submission.purchaseOrderId)}
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
              Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, submissions.length)} of {submissions.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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

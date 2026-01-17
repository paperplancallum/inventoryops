import { useState, useMemo } from 'react'
import type { SupplierInvoicesViewProps, SupplierInvoiceStatus } from '@/../product/sections/supplier-invoices/types'

// Icons
const SearchIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const ChevronUpIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

const ClipboardIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
)

type SortKey = 'submittedAt' | 'variance' | 'poNumber'
type SortDir = 'asc' | 'desc'

const STATUS_STYLES: Record<SupplierInvoiceStatus, string> = {
  'pending': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'approved': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'rejected': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'revised': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'expired': 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
}

const STATUS_LABELS: Record<SupplierInvoiceStatus, string> = {
  'pending': 'Pending Review',
  'approved': 'Approved',
  'rejected': 'Rejected',
  'revised': 'Revised',
  'expired': 'Expired',
}

export function SupplierInvoicesView({
  invoices,
  statuses,
  onViewInvoice,
  onViewPurchaseOrder,
}: SupplierInvoicesViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('submittedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filterStatus, setFilterStatus] = useState<SupplierInvoiceStatus | ''>('')

  // Filter and sort invoices
  const filteredInvoices = useMemo(() => {
    let result = [...invoices]

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (inv) =>
          inv.poNumber.toLowerCase().includes(q) ||
          inv.supplierName.toLowerCase().includes(q)
      )
    }

    // Filter by status
    if (filterStatus) {
      result = result.filter((inv) => inv.status === filterStatus)
    }

    // Sort
    result.sort((a, b) => {
      let aVal: string | number
      let bVal: string | number

      switch (sortKey) {
        case 'submittedAt':
          aVal = a.submittedAt || a.createdAt
          bVal = b.submittedAt || b.createdAt
          break
        case 'variance':
          aVal = a.variance
          bVal = b.variance
          break
        case 'poNumber':
          aVal = a.poNumber
          bVal = b.poNumber
          break
        default:
          return 0
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      return 0
    })

    return result
  }, [invoices, searchQuery, sortKey, sortDir, filterStatus])

  // Calculate stats
  const pendingCount = invoices.filter(inv => inv.status === 'pending').length
  const approvedThisMonth = invoices.filter(inv => {
    if (inv.status !== 'approved' || !inv.reviewedAt) return false
    const reviewDate = new Date(inv.reviewedAt)
    const now = new Date()
    return reviewDate.getMonth() === now.getMonth() && reviewDate.getFullYear() === now.getFullYear()
  }).length
  const totalVariance = invoices
    .filter(inv => inv.status === 'approved')
    .reduce((sum, inv) => sum + inv.variance, 0)
  const approvedInvoices = invoices.filter(inv => inv.status === 'approved')
  const avgVariancePercent = approvedInvoices.length > 0
    ? approvedInvoices.reduce((sum, inv) => sum + inv.variancePercent, 0) / approvedInvoices.length
    : 0

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return null
    return sortDir === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-red-600 dark:text-red-400'
    if (variance < 0) return 'text-emerald-600 dark:text-emerald-400'
    return 'text-slate-600 dark:text-slate-400'
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                Supplier Invoices
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Review and approve supplier price submissions
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Pending Review</p>
              <p className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-400">{pendingCount}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Approved (Month)</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{approvedThisMonth}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Variance</p>
              <p className={`mt-1 text-2xl font-semibold ${getVarianceColor(totalVariance)}`}>
                {totalVariance >= 0 ? '+' : ''}{formatCurrency(totalVariance)}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Avg Variance</p>
              <p className={`mt-1 text-2xl font-semibold ${getVarianceColor(avgVariancePercent)}`}>
                {avgVariancePercent >= 0 ? '+' : ''}{avgVariancePercent.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search by PO# or supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as SupplierInvoiceStatus | '')}
              className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              {statuses.map(status => (
                <option key={status.id} value={status.id}>{status.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('poNumber')}
                      className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      PO Number
                      <SortIcon column="poNumber" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Supplier
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('submittedAt')}
                      className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Submitted
                      <SortIcon column="submittedAt" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Original
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleSort('variance')}
                      className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hover:text-slate-700 dark:hover:text-slate-300 ml-auto"
                    >
                      Variance
                      <SortIcon column="variance" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredInvoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onViewPurchaseOrder?.(invoice.purchaseOrderId)}
                        className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                      >
                        {invoice.poNumber}
                      </button>
                      {invoice.revisionNumber > 1 && (
                        <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                          (Rev {invoice.revisionNumber})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-900 dark:text-white">{invoice.supplierName}</p>
                      {invoice.submittedByName && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">{invoice.submittedByName}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        {formatDate(invoice.submittedAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        {formatCurrency(invoice.originalSubtotal)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-slate-900 dark:text-white font-medium">
                        {formatCurrency(invoice.submittedTotal)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-medium ${getVarianceColor(invoice.variance)}`}>
                        {invoice.variance >= 0 ? '+' : ''}{formatCurrency(invoice.variance)}
                        <span className="text-xs ml-1">
                          ({invoice.variancePercent >= 0 ? '+' : ''}{invoice.variancePercent.toFixed(1)}%)
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[invoice.status]}`}>
                        {STATUS_LABELS[invoice.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {invoice.status === 'pending' ? (
                        <button
                          onClick={() => onViewInvoice?.(invoice.id)}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                        >
                          Review
                        </button>
                      ) : (
                        <button
                          onClick={() => onViewInvoice?.(invoice.id)}
                          className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredInvoices.length === 0 && (
            <div className="px-4 py-12 text-center">
              <ClipboardIcon />
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {searchQuery || filterStatus
                  ? 'No invoices match your filters'
                  : 'No supplier invoices yet'}
              </p>
            </div>
          )}

          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing {filteredInvoices.length} of {invoices.length} invoices
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

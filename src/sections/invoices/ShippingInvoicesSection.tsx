'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  Filter,
  ChevronDown,
  Ship,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  ExternalLink,
  Download,
  Trash2,
} from 'lucide-react'
import type {
  ShippingInvoiceSummary,
  ShippingInvoiceWithVariance,
  ShippingInvoiceStatus,
  ShippingInvoiceStats,
} from '@/sections/shipping-quotes/invoice-types'
import { createClient } from '@/lib/supabase/client'

interface ShippingInvoicesSectionProps {
  invoices: ShippingInvoiceSummary[]
  stats: ShippingInvoiceStats
  loading?: boolean
  onNewInvoice?: () => void
  onViewInvoice?: (invoiceId: string) => void
  onViewTransfer?: (transferId: string) => void
  onUpdateStatus?: (invoiceId: string, status: ShippingInvoiceStatus) => Promise<boolean>
  onDeleteInvoice?: (invoiceId: string) => Promise<boolean>
  onDownloadPdf?: (invoice: ShippingInvoiceSummary) => void
}

const statusConfig: Record<ShippingInvoiceStatus, { label: string; color: string; icon: typeof Clock }> = {
  received: {
    label: 'Received',
    color: 'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-300',
    icon: FileText,
  },
  approved: {
    label: 'Approved',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    icon: CheckCircle,
  },
  paid: {
    label: 'Paid',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    icon: CheckCircle,
  },
}

export function ShippingInvoicesSection({
  invoices,
  stats,
  loading = false,
  onNewInvoice,
  onViewInvoice,
  onViewTransfer,
  onUpdateStatus,
  onDeleteInvoice,
  onDownloadPdf,
}: ShippingInvoicesSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ShippingInvoiceStatus | 'all'>('all')
  const [varianceFilter, setVarianceFilter] = useState<'all' | 'over' | 'under'>('all')
  const [sortField, setSortField] = useState<'date' | 'amount' | 'variance'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const supabase = createClient()

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch = searchQuery === '' ||
        invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.shippingAgentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.transferNumbers.some(tn => tn.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
      const matchesVariance =
        varianceFilter === 'all' ||
        (varianceFilter === 'over' && invoice.varianceAmount > 0) ||
        (varianceFilter === 'under' && invoice.varianceAmount <= 0)

      return matchesSearch && matchesStatus && matchesVariance
    })
  }, [invoices, searchQuery, statusFilter, varianceFilter])

  // Sort invoices
  const sortedInvoices = useMemo(() => {
    return [...filteredInvoices].sort((a, b) => {
      let comparison = 0
      if (sortField === 'date') {
        comparison = new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime()
      } else if (sortField === 'amount') {
        comparison = a.totalAmount - b.totalAmount
      } else if (sortField === 'variance') {
        comparison = a.varianceAmount - b.varianceAmount
      }
      return sortDirection === 'desc' ? -comparison : comparison
    })
  }, [filteredInvoices, sortField, sortDirection])

  const handleSort = (field: 'date' | 'amount' | 'variance') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return `${currency} ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const handleDelete = async (invoiceId: string) => {
    if (!onDeleteInvoice) return
    setDeletingId(invoiceId)
    await onDeleteInvoice(invoiceId)
    setDeletingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-lime-500 border-t-transparent" />
          <span className="text-stone-600 dark:text-stone-400">Loading shipping invoices...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Ship className="w-4 h-4 text-stone-500 dark:text-stone-400" />
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase">Total Invoices</span>
          </div>
          <p className="text-2xl font-semibold text-stone-900 dark:text-white">{stats.totalInvoices}</p>
        </div>
        <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-stone-500 dark:text-stone-400" />
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase">Total Amount</span>
          </div>
          <p className="text-2xl font-semibold text-stone-900 dark:text-white">${stats.totalAmount.toLocaleString()}</p>
        </div>
        <div className={`rounded-lg p-4 ${stats.totalVariance > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
          <div className="flex items-center gap-2 mb-2">
            {stats.totalVariance > 0 ? (
              <TrendingUp className="w-4 h-4 text-red-500 dark:text-red-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-green-500 dark:text-green-400" />
            )}
            <span className={`text-xs font-medium uppercase ${stats.totalVariance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              Variance
            </span>
          </div>
          <p className={`text-2xl font-semibold ${stats.totalVariance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {stats.totalVariance > 0 ? '+' : ''}{formatCurrency(stats.totalVariance)}
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {stats.averageVariancePercent > 0 ? '+' : ''}{stats.averageVariancePercent}% avg
          </p>
        </div>
        <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase">Pending</span>
          </div>
          <p className="text-2xl font-semibold text-stone-900 dark:text-white">
            {stats.byStatus.received + stats.byStatus.approved}
          </p>
        </div>
        <div className={`rounded-lg p-4 ${stats.overdueCount > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-stone-50 dark:bg-stone-700/50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className={`w-4 h-4 ${stats.overdueCount > 0 ? 'text-red-500 dark:text-red-400' : 'text-stone-400'}`} />
            <span className={`text-xs font-medium uppercase ${stats.overdueCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-stone-500 dark:text-stone-400'}`}>
              Overdue
            </span>
          </div>
          <p className={`text-2xl font-semibold ${stats.overdueCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-stone-900 dark:text-white'}`}>
            {stats.overdueCount}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-stone-400" />
            </div>
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ShippingInvoiceStatus | 'all')}
              className="appearance-none pl-3 pr-10 py-2 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent cursor-pointer"
            >
              <option value="all">All statuses</option>
              <option value="received">Received</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Filter className="w-4 h-4 text-stone-400" />
            </div>
          </div>

          {/* Variance Filter */}
          <div className="relative">
            <select
              value={varianceFilter}
              onChange={(e) => setVarianceFilter(e.target.value as 'all' | 'over' | 'under')}
              className="appearance-none pl-3 pr-10 py-2 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent cursor-pointer"
            >
              <option value="all">All variances</option>
              <option value="over">Over budget</option>
              <option value="under">Under/On budget</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown className="w-4 h-4 text-stone-400" />
            </div>
          </div>
        </div>

        {/* Add Invoice Button */}
        {onNewInvoice && (
          <button
            onClick={onNewInvoice}
            className="inline-flex items-center gap-2 px-4 py-2 bg-lime-600 hover:bg-lime-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Shipping Invoice
          </button>
        )}
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  <button
                    onClick={() => handleSort('date')}
                    className="inline-flex items-center gap-1 hover:text-stone-700 dark:hover:text-stone-200"
                  >
                    Date
                    {sortField === 'date' && (
                      <span className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                        <ChevronDown className="w-4 h-4" />
                      </span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Invoice
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Agent
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Transfer(s)
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  <button
                    onClick={() => handleSort('amount')}
                    className="inline-flex items-center gap-1 hover:text-stone-700 dark:hover:text-stone-200"
                  >
                    Amount
                    {sortField === 'amount' && (
                      <span className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                        <ChevronDown className="w-4 h-4" />
                      </span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  <button
                    onClick={() => handleSort('variance')}
                    className="inline-flex items-center gap-1 hover:text-stone-700 dark:hover:text-stone-200"
                  >
                    Variance
                    {sortField === 'variance' && (
                      <span className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                        <ChevronDown className="w-4 h-4" />
                      </span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-700">
              {sortedInvoices.map((invoice) => {
                const config = statusConfig[invoice.status]
                const StatusIcon = config.icon

                return (
                  <tr
                    key={invoice.id}
                    className={`hover:bg-stone-50 dark:hover:bg-stone-700/50 ${invoice.isOverdue ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}
                  >
                    <td className="px-4 py-3 text-sm text-stone-900 dark:text-white">
                      <div>
                        <p>{formatDate(invoice.invoiceDate)}</p>
                        {invoice.dueDate && (
                          <p className={`text-xs ${invoice.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-stone-500 dark:text-stone-400'}`}>
                            Due: {formatDate(invoice.dueDate)}
                            {invoice.isOverdue && ' (Overdue)'}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-stone-900 dark:text-white">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-900 dark:text-white">
                      {invoice.shippingAgentName}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {invoice.transferNumbers.slice(0, 2).map((tn, idx) => (
                          <button
                            key={idx}
                            onClick={() => onViewTransfer?.(tn)}
                            className="text-lime-600 dark:text-lime-400 hover:underline"
                          >
                            {tn}
                          </button>
                        ))}
                        {invoice.transferNumbers.length > 2 && (
                          <span className="text-stone-500 dark:text-stone-400">
                            +{invoice.transferNumbers.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-stone-900 dark:text-white">
                      {formatCurrency(invoice.totalAmount, invoice.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        invoice.varianceAmount > 0
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                      }`}>
                        {invoice.varianceAmount > 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {invoice.varianceAmount > 0 ? '+' : ''}{formatCurrency(invoice.varianceAmount, invoice.currency)}
                        <span className="ml-1">
                          ({invoice.variancePercent > 0 ? '+' : ''}{invoice.variancePercent}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onDownloadPdf && (
                          <button
                            onClick={() => onDownloadPdf(invoice)}
                            className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        {onViewInvoice && (
                          <button
                            onClick={() => onViewInvoice(invoice.id)}
                            className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded transition-colors"
                            title="View details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}
                        {onDeleteInvoice && invoice.status === 'received' && (
                          <button
                            onClick={() => handleDelete(invoice.id)}
                            disabled={deletingId === invoice.id}
                            className="p-1.5 text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                            title="Delete invoice"
                          >
                            {deletingId === invoice.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {sortedInvoices.length === 0 && (
          <div className="px-4 py-12 text-center">
            <Ship className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 mb-4" strokeWidth={1.5} />
            <p className="text-sm font-medium text-stone-900 dark:text-white">
              No shipping invoices found
            </p>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              {searchQuery || statusFilter !== 'all' || varianceFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create a shipping invoice from a selected quote'}
            </p>
            {onNewInvoice && !searchQuery && statusFilter === 'all' && varianceFilter === 'all' && (
              <button
                onClick={onNewInvoice}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-lime-600 hover:bg-lime-700 text-white font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Shipping Invoice
              </button>
            )}
          </div>
        )}

        {/* Footer */}
        {sortedInvoices.length > 0 && (
          <div className="px-4 py-3 border-t border-stone-200 dark:border-stone-700">
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Showing {sortedInvoices.length} of {invoices.length} invoices
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

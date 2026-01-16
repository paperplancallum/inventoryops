'use client'

import { useState, useMemo } from 'react'
import {
  ArrowUpDown,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Filter,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  Award,
  AlertTriangle,
} from 'lucide-react'
import type { ShippingQuote, ShippingQuoteStatus } from '@/sections/shipping-quotes/types'
import { createClient } from '@/lib/supabase/client'
import { useShippingQuotes } from '@/lib/supabase/hooks/useShippingQuotes'
import { SelectQuoteConfirmDialog } from './SelectQuoteConfirmDialog'

interface QuoteComparisonViewProps {
  quotes: ShippingQuote[]
  onSelectQuote?: (quoteId: string) => void
  onViewDetails?: (quote: ShippingQuote) => void
  selectedQuoteId?: string
  onQuoteSelected?: () => void // Callback after quote is selected
}

type SortField = 'amount' | 'agent' | 'date' | 'validUntil'
type SortDirection = 'asc' | 'desc'

const statusConfig: Record<ShippingQuoteStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: {
    label: 'Awaiting',
    color: 'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-300',
    icon: Clock,
  },
  submitted: {
    label: 'Received',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    icon: FileText,
  },
  selected: {
    label: 'Selected',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    icon: XCircle,
  },
}

// Helper to check quote expiry status
function getQuoteExpiryStatus(validUntil: string | null): { isExpired: boolean; isExpiringSoon: boolean; daysUntilExpiry: number | null } {
  if (!validUntil) return { isExpired: false, isExpiringSoon: false, daysUntilExpiry: null }

  const expiryDate = new Date(validUntil)
  const now = new Date()
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  return {
    isExpired: expiryDate < now,
    isExpiringSoon: !(expiryDate < now) && daysUntilExpiry <= 3,
    daysUntilExpiry: expiryDate >= now ? daysUntilExpiry : null,
  }
}

export function QuoteComparisonView({
  quotes,
  onSelectQuote,
  onViewDetails,
  selectedQuoteId,
  onQuoteSelected,
}: QuoteComparisonViewProps) {
  const [sortField, setSortField] = useState<SortField>('amount')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [showRejected, setShowRejected] = useState(false)
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null)
  const [quoteToSelect, setQuoteToSelect] = useState<ShippingQuote | null>(null)

  const supabase = createClient()
  const { selectWinningQuote } = useShippingQuotes()

  // Check if there's already a selected quote
  const hasExistingSelection = useMemo(() => {
    return quotes.some((q) => q.status === 'selected') || !!selectedQuoteId
  }, [quotes, selectedQuoteId])

  // Handle quote selection confirmation
  const handleConfirmSelection = async (quoteId: string) => {
    const success = await selectWinningQuote(quoteId)
    if (success) {
      onQuoteSelected?.()
    }
  }

  // Handle select button click
  const handleSelectClick = (quote: ShippingQuote) => {
    if (onSelectQuote) {
      // Parent handles selection
      onSelectQuote(quote.id)
    } else {
      // Handle internally with dialog
      setQuoteToSelect(quote)
    }
  }

  // Filter and sort quotes
  const filteredAndSortedQuotes = useMemo(() => {
    let filtered = quotes
    if (!showRejected) {
      filtered = quotes.filter((q) => q.status !== 'rejected')
    }

    return [...filtered].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'amount':
          const amountA = a.totalAmount ?? Infinity
          const amountB = b.totalAmount ?? Infinity
          comparison = amountA - amountB
          break
        case 'agent':
          comparison = (a.shippingAgentName || '').localeCompare(b.shippingAgentName || '')
          break
        case 'date':
          const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0
          const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0
          comparison = dateB - dateA // Most recent first
          break
        case 'validUntil':
          const validA = a.validUntil ? new Date(a.validUntil).getTime() : Infinity
          const validB = b.validUntil ? new Date(b.validUntil).getTime() : Infinity
          comparison = validA - validB
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [quotes, sortField, sortDirection, showRejected])

  // Find lowest quote among submitted ones (excluding expired)
  const lowestQuote = useMemo(() => {
    const validSubmittedQuotes = quotes.filter(
      (q) => (q.status === 'submitted' || q.status === 'selected') &&
        q.totalAmount !== null &&
        !getQuoteExpiryStatus(q.validUntil).isExpired
    )
    if (validSubmittedQuotes.length === 0) return null
    return validSubmittedQuotes.reduce((lowest, q) => {
      if (!lowest || (q.totalAmount ?? Infinity) < (lowest.totalAmount ?? Infinity)) {
        return q
      }
      return lowest
    }, validSubmittedQuotes[0])
  }, [quotes])

  // Calculate average
  const averageAmount = useMemo(() => {
    const submittedQuotes = quotes.filter(
      (q) => (q.status === 'submitted' || q.status === 'selected') && q.totalAmount !== null
    )
    if (submittedQuotes.length === 0) return null
    const sum = submittedQuotes.reduce((acc, q) => acc + (q.totalAmount || 0), 0)
    return sum / submittedQuotes.length
  }, [quotes])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const formatCurrency = (amount: number | null, currency: string) => {
    if (amount === null) return '-'
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

  const handleDownloadPdf = async (quote: ShippingQuote) => {
    if (!quote.pdfPath) return

    try {
      const { data, error } = await supabase.storage
        .from('shipping-documents')
        .createSignedUrl(quote.pdfPath, 60)

      if (error) throw error

      window.open(data.signedUrl, '_blank')
    } catch (err) {
      console.error('Error downloading PDF:', err)
    }
  }

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wide ${
        sortField === field
          ? 'text-lime-600 dark:text-lime-400'
          : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
      }`}
    >
      {label}
      <ArrowUpDown className="w-3 h-3" />
    </button>
  )

  if (quotes.length === 0) {
    return (
      <div className="text-center py-8 text-stone-500 dark:text-stone-400">
        No quotes to compare
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 bg-stone-50 dark:bg-stone-700/50 rounded-lg">
          <p className="text-xs text-stone-500 dark:text-stone-400">Total Quotes</p>
          <p className="text-lg font-semibold text-stone-900 dark:text-white">{quotes.length}</p>
        </div>
        <div className="p-3 bg-lime-50 dark:bg-lime-900/20 rounded-lg">
          <p className="text-xs text-lime-600 dark:text-lime-400">Lowest Quote</p>
          <p className="text-lg font-semibold text-lime-700 dark:text-lime-300">
            {lowestQuote ? formatCurrency(lowestQuote.totalAmount, lowestQuote.currency) : '-'}
          </p>
        </div>
        <div className="p-3 bg-stone-50 dark:bg-stone-700/50 rounded-lg">
          <p className="text-xs text-stone-500 dark:text-stone-400">Average</p>
          <p className="text-lg font-semibold text-stone-900 dark:text-white">
            {averageAmount ? formatCurrency(averageAmount, quotes[0]?.currency || 'USD') : '-'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRejected(!showRejected)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              showRejected
                ? 'bg-stone-200 dark:bg-stone-600 text-stone-900 dark:text-white'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {showRejected ? 'Showing rejected' : 'Hide rejected'}
          </button>
        </div>
        <div className="flex items-center gap-4">
          <SortButton field="amount" label="Amount" />
          <SortButton field="agent" label="Agent" />
          <SortButton field="date" label="Date" />
        </div>
      </div>

      {/* Quote cards */}
      <div className="space-y-3">
        {filteredAndSortedQuotes.map((quote) => {
          const config = statusConfig[quote.status]
          const StatusIcon = config.icon
          const isLowest = lowestQuote?.id === quote.id
          const isSelected = quote.status === 'selected' || quote.id === selectedQuoteId
          const isExpanded = expandedQuoteId === quote.id
          const expiryStatus = getQuoteExpiryStatus(quote.validUntil)
          const canSelect = quote.status === 'submitted' && !selectedQuoteId && !expiryStatus.isExpired

          return (
            <div
              key={quote.id}
              className={`rounded-lg border overflow-hidden transition-colors ${
                isSelected
                  ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                  : expiryStatus.isExpired
                  ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                  : expiryStatus.isExpiringSoon
                  ? 'border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20'
                  : quote.status === 'rejected'
                  ? 'border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 opacity-60'
                  : 'border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-700/50'
              }`}
            >
              {/* Main content */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  {/* Left side - Agent info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stone-900 dark:text-white">
                        {quote.shippingAgentName || 'Unknown Agent'}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                      {isLowest && quote.status !== 'selected' && !expiryStatus.isExpired && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                          <Award className="w-3 h-3" />
                          Lowest
                        </span>
                      )}
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                          <CheckCircle className="w-3 h-3" />
                          Winner
                        </span>
                      )}
                      {expiryStatus.isExpired && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                          <XCircle className="w-3 h-3" />
                          Expired
                        </span>
                      )}
                      {expiryStatus.isExpiringSoon && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                          <AlertTriangle className="w-3 h-3" />
                          {expiryStatus.daysUntilExpiry === 0
                            ? 'Expires today'
                            : expiryStatus.daysUntilExpiry === 1
                            ? 'Expires tomorrow'
                            : `Expires in ${expiryStatus.daysUntilExpiry} days`}
                        </span>
                      )}
                    </div>

                    {/* Meta info row */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-stone-500 dark:text-stone-400">
                      {quote.submittedAt && <span>Submitted: {formatDate(quote.submittedAt)}</span>}
                      {quote.validUntil && (
                        <span
                          className={
                            new Date(quote.validUntil) < new Date()
                              ? 'text-red-600 dark:text-red-400'
                              : ''
                          }
                        >
                          Valid until: {formatDate(quote.validUntil)}
                        </span>
                      )}
                      {quote.lineItems.length > 0 && (
                        <span>{quote.lineItems.length} line items</span>
                      )}
                    </div>
                  </div>

                  {/* Right side - Amount and actions */}
                  <div className="flex items-center gap-4">
                    {quote.totalAmount !== null && (
                      <div className="text-right">
                        <p
                          className={`text-xl font-bold ${
                            isLowest && quote.status !== 'selected'
                              ? 'text-lime-600 dark:text-lime-400'
                              : isSelected
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-stone-900 dark:text-white'
                          }`}
                        >
                          {formatCurrency(quote.totalAmount, quote.currency)}
                        </p>
                        {averageAmount && quote.totalAmount !== null && (
                          <p className="text-xs text-stone-500 dark:text-stone-400">
                            {quote.totalAmount < averageAmount
                              ? `${Math.round(((averageAmount - quote.totalAmount) / averageAmount) * 100)}% below avg`
                              : quote.totalAmount > averageAmount
                              ? `${Math.round(((quote.totalAmount - averageAmount) / averageAmount) * 100)}% above avg`
                              : 'At average'}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      {quote.pdfPath && (
                        <button
                          onClick={() => handleDownloadPdf(quote)}
                          className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-600 rounded transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onViewDetails?.(quote)}
                        className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-600 rounded transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canSelect && (
                        <button
                          onClick={() => handleSelectClick(quote)}
                          className="px-3 py-1.5 text-sm font-medium bg-lime-600 hover:bg-lime-700 text-white rounded transition-colors"
                        >
                          Select
                        </button>
                      )}
                      {/* Allow changing selection if this is rejected but there's a selected quote, and not expired */}
                      {quote.status === 'rejected' && hasExistingSelection && !expiryStatus.isExpired && (
                        <button
                          onClick={() => handleSelectClick(quote)}
                          className="px-3 py-1.5 text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded transition-colors"
                        >
                          Change to this
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expand toggle for line items */}
                {quote.lineItems.length > 0 && (
                  <button
                    onClick={() => setExpandedQuoteId(isExpanded ? null : quote.id)}
                    className="flex items-center gap-1 mt-3 text-xs text-lime-600 dark:text-lime-400 hover:underline"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3 h-3" />
                        Hide breakdown
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        Show breakdown ({quote.lineItems.length} items)
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Expanded line items */}
              {isExpanded && quote.lineItems.length > 0 && (
                <div className="px-4 pb-4">
                  <div className="border-t border-stone-200 dark:border-stone-600 pt-3">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-stone-500 dark:text-stone-400 uppercase">
                          <th className="text-left pb-2">Description</th>
                          <th className="text-right pb-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-700">
                        {quote.lineItems.map((item) => (
                          <tr key={item.id}>
                            <td className="py-2 text-stone-700 dark:text-stone-300">
                              {item.description}
                            </td>
                            <td className="py-2 text-right font-medium text-stone-900 dark:text-white">
                              {formatCurrency(item.amount, quote.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-stone-200 dark:border-stone-600">
                          <td className="pt-2 font-medium text-stone-900 dark:text-white">
                            Total
                          </td>
                          <td className="pt-2 text-right font-bold text-stone-900 dark:text-white">
                            {formatCurrency(quote.totalAmount, quote.currency)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Notes preview */}
              {quote.notes && (
                <div className="px-4 pb-4">
                  <p className="text-xs text-stone-500 dark:text-stone-400 italic line-clamp-2">
                    &quot;{quote.notes}&quot;
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Quote Selection Confirmation Dialog */}
      <SelectQuoteConfirmDialog
        isOpen={!!quoteToSelect}
        quote={quoteToSelect}
        hasExistingSelection={hasExistingSelection}
        onConfirm={handleConfirmSelection}
        onClose={() => setQuoteToSelect(null)}
      />
    </div>
  )
}

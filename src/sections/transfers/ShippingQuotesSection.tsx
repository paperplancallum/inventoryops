'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FileText,
  Send,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { ShippingQuote, ShippingQuoteStatus } from '@/sections/shipping-quotes/types'
import { useShippingQuotes } from '@/lib/supabase/hooks/useShippingQuotes'
import { SelectQuoteConfirmDialog } from './SelectQuoteConfirmDialog'

interface ShippingQuotesSectionProps {
  transferId: string
  transferIds?: string[] // For grouped quotes
  onRequestQuotes?: () => void
  onAddManualQuote?: () => void
  onSelectQuote?: (quoteId: string) => void
  onViewQuoteDetails?: (quote: ShippingQuote) => void
  onQuoteSelected?: () => void // Callback after a quote is selected
}

const statusConfig: Record<ShippingQuoteStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: {
    label: 'Awaiting Response',
    color: 'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-300',
    icon: Clock,
  },
  submitted: {
    label: 'Quote Received',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    icon: FileText,
  },
  selected: {
    label: 'Selected',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Not Selected',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    icon: XCircle,
  },
}

export function ShippingQuotesSection({
  transferId,
  transferIds,
  onRequestQuotes,
  onAddManualQuote,
  onSelectQuote,
  onViewQuoteDetails,
  onQuoteSelected,
}: ShippingQuotesSectionProps) {
  const [expanded, setExpanded] = useState(true)
  const [quotes, setQuotes] = useState<ShippingQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [quoteToSelect, setQuoteToSelect] = useState<ShippingQuote | null>(null)

  const { fetchQuotesForTransfer, selectWinningQuote } = useShippingQuotes()

  // Load quotes function
  const loadQuotes = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchQuotesForTransfer(transferId)
      setQuotes(data)
    } catch (err) {
      console.error('Error loading quotes:', err)
    } finally {
      setLoading(false)
    }
  }, [transferId, fetchQuotesForTransfer])

  // Fetch quotes on mount
  useEffect(() => {
    loadQuotes()
  }, [loadQuotes])

  // Handle quote selection confirmation
  const handleConfirmSelection = async (quoteId: string) => {
    const success = await selectWinningQuote(quoteId)
    if (success) {
      await loadQuotes()
      onQuoteSelected?.()
    }
  }

  // Handle select button click - opens confirmation dialog
  const handleSelectClick = (quote: ShippingQuote) => {
    if (onSelectQuote) {
      // Parent handles selection
      onSelectQuote(quote.id)
    } else {
      // Handle internally with dialog
      setQuoteToSelect(quote)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number | null, currency: string) => {
    if (amount === null) return '-'
    return `${currency} ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  // Find selected quote and lowest quote
  const selectedQuote = quotes.find(q => q.status === 'selected')
  const submittedQuotes = quotes.filter(q => q.status === 'submitted' || q.status === 'selected')
  const lowestQuote = submittedQuotes.reduce<ShippingQuote | null>((lowest, q) => {
    if (!q.totalAmount) return lowest
    if (!lowest || !lowest.totalAmount) return q
    return q.totalAmount < lowest.totalAmount ? q : lowest
  }, null)

  const pendingCount = quotes.filter(q => q.status === 'pending').length
  const submittedCount = submittedQuotes.length

  return (
    <section className="bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-stone-700 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-stone-500 dark:text-stone-400" />
          <h3 className="text-sm font-semibold text-stone-900 dark:text-white">
            Shipping Quotes
          </h3>
          {quotes.length > 0 && (
            <span className="text-xs text-stone-500 dark:text-stone-400">
              ({submittedCount}/{quotes.length} received)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedQuote && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
              <CheckCircle className="w-3 h-3" />
              Quote Selected
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-stone-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-stone-400" />
          )}
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-lime-500 border-t-transparent" />
            </div>
          ) : quotes.length === 0 ? (
            // Empty state
            <div className="text-center py-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-stone-100 dark:bg-stone-700 flex items-center justify-center">
                <Send className="w-6 h-6 text-stone-400 dark:text-stone-500" />
              </div>
              <h4 className="text-sm font-medium text-stone-900 dark:text-white mb-1">
                No quotes yet
              </h4>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
                Request quotes from shipping agents to compare prices
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRequestQuotes?.()
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-lime-600 hover:bg-lime-700 text-white rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Request Quotes
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddManualQuote?.()
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Manually
                </button>
              </div>
            </div>
          ) : (
            // Quotes list
            <div className="space-y-3">
              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 mb-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRequestQuotes?.()
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-lime-600 dark:text-lime-400 hover:bg-lime-50 dark:hover:bg-lime-900/20 rounded transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  Request More
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddManualQuote?.()
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 rounded transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Manual
                </button>
              </div>

              {/* Quote cards */}
              {quotes.map((quote) => {
                const config = statusConfig[quote.status]
                const StatusIcon = config.icon
                const isLowest = lowestQuote?.id === quote.id && quote.status !== 'selected'
                const isSelected = quote.status === 'selected'

                return (
                  <div
                    key={quote.id}
                    className={`rounded-lg border p-3 transition-colors ${
                      isSelected
                        ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                        : 'border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700/50 hover:border-stone-300 dark:hover:border-stone-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      {/* Agent info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-stone-900 dark:text-white text-sm">
                            {quote.shippingAgentName || 'Unknown Agent'}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {config.label}
                          </span>
                          {isLowest && !isSelected && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                              Lowest
                            </span>
                          )}
                        </div>

                        {/* Quote details */}
                        {quote.totalAmount !== null && (
                          <div className="mt-2">
                            <span className="text-lg font-semibold text-stone-900 dark:text-white">
                              {formatCurrency(quote.totalAmount, quote.currency)}
                            </span>
                          </div>
                        )}

                        {/* Meta info */}
                        <div className="mt-2 flex items-center gap-4 text-xs text-stone-500 dark:text-stone-400">
                          {quote.submittedAt && (
                            <span>Submitted: {formatDate(quote.submittedAt)}</span>
                          )}
                          {quote.validUntil && (
                            <span>Valid until: {formatDate(quote.validUntil)}</span>
                          )}
                          {quote.lineItems.length > 0 && (
                            <span>{quote.lineItems.length} line items</span>
                          )}
                          {quote.pdfPath && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              PDF attached
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5">
                        {quote.status === 'submitted' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelectClick(quote)
                            }}
                            className="px-2.5 py-1 text-xs font-medium bg-lime-600 hover:bg-lime-700 text-white rounded transition-colors"
                          >
                            Select
                          </button>
                        )}
                        {/* Allow changing selection if this is rejected but there's a selected quote */}
                        {quote.status === 'rejected' && selectedQuote && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelectClick(quote)
                            }}
                            className="px-2.5 py-1 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded transition-colors"
                          >
                            Change to this
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onViewQuoteDetails?.(quote)
                          }}
                          className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 rounded transition-colors"
                          title="View details"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Line items preview (collapsed) */}
                    {quote.lineItems.length > 0 && quote.status !== 'pending' && (
                      <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-600">
                        <div className="text-xs text-stone-500 dark:text-stone-400 space-y-1">
                          {quote.lineItems.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex justify-between">
                              <span>{item.description}</span>
                              <span className="font-medium">
                                {formatCurrency(item.amount, quote.currency)}
                              </span>
                            </div>
                          ))}
                          {quote.lineItems.length > 3 && (
                            <div className="text-stone-400 dark:text-stone-500">
                              +{quote.lineItems.length - 3} more items
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Summary */}
              {submittedQuotes.length > 1 && (
                <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-600 flex items-center justify-between text-xs">
                  <span className="text-stone-500 dark:text-stone-400">
                    {pendingCount > 0 && `${pendingCount} awaiting response`}
                    {pendingCount > 0 && submittedCount > 0 && ' · '}
                    {submittedCount > 0 && `${submittedCount} quotes received`}
                  </span>
                  {lowestQuote && lowestQuote.totalAmount && !selectedQuote && (
                    <span className="text-stone-600 dark:text-stone-300">
                      Lowest: <span className="font-medium">{formatCurrency(lowestQuote.totalAmount, lowestQuote.currency)}</span>
                    </span>
                  )}
                </div>
              )}

              {/* Warning if no quote selected but quotes available */}
              {!selectedQuote && submittedCount > 0 && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-700 dark:text-amber-300">
                    <p className="font-medium">No quote selected yet</p>
                    <p className="mt-0.5">Select a quote before moving the transfer to in-transit status.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quote Selection Confirmation Dialog */}
      <SelectQuoteConfirmDialog
        isOpen={!!quoteToSelect}
        quote={quoteToSelect}
        hasExistingSelection={!!selectedQuote}
        onConfirm={handleConfirmSelection}
        onClose={() => setQuoteToSelect(null)}
      />
    </section>
  )
}

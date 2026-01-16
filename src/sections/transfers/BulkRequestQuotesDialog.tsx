'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  X,
  Send,
  Search,
  Check,
  Copy,
  ExternalLink,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Package,
  ArrowRight,
} from 'lucide-react'
import { useShippingAgents } from '@/lib/supabase/hooks/useShippingAgents'
import { useShippingQuotes } from '@/lib/supabase/hooks/useShippingQuotes'
import type { Transfer } from '@/sections/transfers/types'
import type { QuoteRequestResult } from '@/sections/shipping-quotes/types'

interface BulkRequestQuotesDialogProps {
  isOpen: boolean
  transfers: Transfer[]
  onClose: () => void
  onSuccess?: (results: QuoteRequestResult[]) => void
}

type DialogStep = 'review' | 'select' | 'generating' | 'results'

export function BulkRequestQuotesDialog({
  isOpen,
  transfers,
  onClose,
  onSuccess,
}: BulkRequestQuotesDialogProps) {
  const [step, setStep] = useState<DialogStep>('review')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set())
  const [results, setResults] = useState<QuoteRequestResult[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { shippingAgents, loading: agentsLoading } = useShippingAgents()
  const { createQuoteRequest } = useShippingQuotes()

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStep('review')
      setSearchQuery('')
      setSelectedAgentIds(new Set())
      setResults([])
      setCopiedId(null)
      setError(null)
    }
  }, [isOpen])

  // Calculate totals
  const totals = useMemo(() => {
    return transfers.reduce(
      (acc, t) => ({
        units: acc.units + t.totalUnits,
        value: acc.value + t.totalValue,
      }),
      { units: 0, value: 0 }
    )
  }, [transfers])

  // Filter agents by search query
  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) return shippingAgents.filter((a) => a.isActive)

    const query = searchQuery.toLowerCase()
    return shippingAgents.filter(
      (agent) =>
        agent.isActive &&
        (agent.name.toLowerCase().includes(query) ||
          agent.email.toLowerCase().includes(query) ||
          agent.contactName.toLowerCase().includes(query))
    )
  }, [shippingAgents, searchQuery])

  // Toggle agent selection
  const toggleAgent = (agentId: string) => {
    setSelectedAgentIds((prev) => {
      const next = new Set(prev)
      if (next.has(agentId)) {
        next.delete(agentId)
      } else {
        next.add(agentId)
      }
      return next
    })
  }

  // Select/deselect all filtered agents
  const toggleAllFiltered = () => {
    const allSelected = filteredAgents.every((a) => selectedAgentIds.has(a.id))
    if (allSelected) {
      setSelectedAgentIds(new Set())
    } else {
      setSelectedAgentIds(new Set(filteredAgents.map((a) => a.id)))
    }
  }

  // Generate quote requests
  const handleGenerate = async () => {
    if (selectedAgentIds.size === 0) {
      setError('Please select at least one shipping agent')
      return
    }

    setStep('generating')
    setError(null)

    try {
      const transferIds = transfers.map((t) => t.id)
      const agentIdsArray = Array.from(selectedAgentIds)

      const quoteResults = await createQuoteRequest(agentIdsArray, transferIds)

      if (quoteResults.length === 0) {
        throw new Error('Failed to generate quote requests')
      }

      setResults(quoteResults)
      setStep('results')
      onSuccess?.(quoteResults)
    } catch (err) {
      console.error('Error generating quotes:', err)
      setError('Failed to generate quote requests. Please try again.')
      setStep('select')
    }
  }

  // Copy magic link to clipboard
  const handleCopyLink = async (result: QuoteRequestResult) => {
    try {
      await navigator.clipboard.writeText(result.magicLinkUrl)
      setCopiedId(result.quoteId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Open email client
  const handleEmailAgent = (result: QuoteRequestResult) => {
    const agent = shippingAgents.find((a) => a.id === result.shippingAgentId)
    if (!agent) return

    const transferList = transfers.map((t) => t.transferNumber).join(', ')
    const subject = encodeURIComponent(`Quote Request - ${transfers.length} Transfers`)
    const body = encodeURIComponent(
      `Hi ${agent.contactName || agent.name},\n\n` +
        `We would like to request a shipping quote for the following transfers:\n${transferList}\n\n` +
        `Please submit your quote using this secure link:\n${result.magicLinkUrl}\n\n` +
        `This link will expire on ${new Date(result.tokenExpiresAt).toLocaleDateString()}.\n\n` +
        `Thank you,`
    )

    window.open(`mailto:${agent.email}?subject=${subject}&body=${body}`)
  }

  // Copy all links
  const handleCopyAll = async () => {
    const allLinks = results
      .map((r) => `${r.shippingAgentName}: ${r.magicLinkUrl}`)
      .join('\n')

    try {
      await navigator.clipboard.writeText(allLinks)
      setCopiedId('all')
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="absolute inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl bg-white dark:bg-stone-800 rounded-xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-stone-700">
          <div>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-white">
              Request Quotes for Multiple Transfers
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              {transfers.length} transfers selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 'review' && (
            <div className="space-y-4">
              {/* Info banner */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-700 dark:text-blue-300">
                    Consolidated Quote Request
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Each agent will receive one link to quote on all {transfers.length} transfers together.
                    This is ideal for consolidated shipments.
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-stone-50 dark:bg-stone-700/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-stone-900 dark:text-white">
                    {transfers.length}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Transfers</p>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-stone-700/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-stone-900 dark:text-white">
                    {totals.units.toLocaleString()}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Total Units</p>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-stone-700/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-stone-900 dark:text-white">
                    ${totals.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Total Value</p>
                </div>
              </div>

              {/* Transfer list */}
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {transfers.map((transfer) => (
                  <div
                    key={transfer.id}
                    className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-700/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-stone-900 dark:text-white text-sm">
                        {transfer.transferNumber}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
                        <span>{transfer.sourceLocationName}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span>{transfer.destinationLocationName}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-stone-900 dark:text-white">
                        {transfer.totalUnits.toLocaleString()} units
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        ${transfer.totalValue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'select' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search shipping agents..."
                  className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Select all */}
              {filteredAgents.length > 0 && (
                <div className="flex items-center justify-between">
                  <button
                    onClick={toggleAllFiltered}
                    className="text-sm text-lime-600 dark:text-lime-400 hover:underline"
                  >
                    {filteredAgents.every((a) => selectedAgentIds.has(a.id))
                      ? 'Deselect all'
                      : 'Select all'}
                  </button>
                  <span className="text-xs text-stone-500 dark:text-stone-400">
                    {selectedAgentIds.size} selected
                  </span>
                </div>
              )}

              {/* Agent list */}
              {agentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-lime-500 animate-spin" />
                </div>
              ) : filteredAgents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-stone-500 dark:text-stone-400">
                    {searchQuery ? 'No agents match your search' : 'No active shipping agents'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {filteredAgents.map((agent) => {
                    const isSelected = selectedAgentIds.has(agent.id)
                    return (
                      <button
                        key={agent.id}
                        onClick={() => toggleAgent(agent.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          isSelected
                            ? 'border-lime-500 bg-lime-50 dark:bg-lime-900/20'
                            : 'border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-stone-900 dark:text-white text-sm">
                              {agent.name}
                            </p>
                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                              {agent.contactName} · {agent.email}
                            </p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center ${
                              isSelected
                                ? 'bg-lime-500 border-lime-500'
                                : 'border-stone-300 dark:border-stone-500'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {step === 'generating' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-lime-500 animate-spin mb-4" />
              <p className="text-stone-600 dark:text-stone-400">Generating quote requests...</p>
            </div>
          )}

          {step === 'results' && (
            <div className="space-y-4">
              {/* Success message */}
              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-300">
                    Quote requests sent successfully!
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Each agent can quote on all {transfers.length} transfers. Links expire in 7 days.
                  </p>
                </div>
              </div>

              {/* Copy all button */}
              <button
                onClick={handleCopyAll}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-lime-700 dark:text-lime-300 bg-lime-50 dark:bg-lime-900/30 hover:bg-lime-100 dark:hover:bg-lime-900/50 rounded-lg transition-colors"
              >
                {copiedId === 'all' ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied all links!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy all links
                  </>
                )}
              </button>

              {/* Results list */}
              <div className="space-y-3">
                {results.map((result) => (
                  <div
                    key={result.quoteId}
                    className="p-3 bg-stone-50 dark:bg-stone-700/50 border border-stone-200 dark:border-stone-600 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-stone-900 dark:text-white text-sm">
                        {result.shippingAgentName}
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopyLink(result)}
                          className="p-1.5 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-600 rounded transition-colors"
                          title="Copy link"
                        >
                          {copiedId === result.quoteId ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEmailAgent(result)}
                          className="p-1.5 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-600 rounded transition-colors"
                          title="Send email"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <a
                          href={result.magicLinkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-600 rounded transition-colors"
                          title="Open link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <code className="flex-1 p-2 bg-stone-100 dark:bg-stone-600 rounded text-stone-600 dark:text-stone-300 font-mono truncate">
                        {result.magicLinkUrl}
                      </code>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-stone-500 dark:text-stone-400">
                      <Clock className="w-3 h-3" />
                      <span>
                        Expires: {new Date(result.tokenExpiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-stone-200 dark:border-stone-700">
          {step === 'review' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('select')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-lime-600 hover:bg-lime-700 text-white rounded-lg transition-colors"
              >
                Continue to Select Agents
              </button>
            </>
          )}

          {step === 'select' && (
            <>
              <button
                onClick={() => setStep('review')}
                className="px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleGenerate}
                disabled={selectedAgentIds.size === 0}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-lime-600 hover:bg-lime-700 disabled:bg-stone-300 dark:disabled:bg-stone-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Generate Links ({selectedAgentIds.size})
              </button>
            </>
          )}

          {step === 'results' && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-lime-600 hover:bg-lime-700 text-white rounded-lg transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

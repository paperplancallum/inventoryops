'use client'

import { useState, useMemo } from 'react'
import type { InboxViewProps, InboxSourceFilter } from './types'
import { InboxSummaryCards } from './InboxSummaryCards'
import { InboxRow } from './InboxRow'

// Icons
const SearchIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const InboxIcon = () => (
  <svg className="w-12 h-12 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

const sourceFilterOptions: { id: InboxSourceFilter; label: string }[] = [
  { id: 'all', label: 'All Sources' },
  { id: 'purchase-order', label: 'Purchase Orders' },
  { id: 'shipping-agent', label: 'Shipping Agents' },
]

export function InboxView({
  messages,
  summary,
  suppliers,
  shippingAgents = [],
  onViewPO,
  onViewTransfer,
  onMarkRead,
  onMarkUnread,
  onClearMessage,
  onRestoreMessage,
}: InboxViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<InboxSourceFilter>('all')
  const [supplierFilter, setSupplierFilter] = useState<string>('all')
  const [agentFilter, setAgentFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showSourceDropdown, setShowSourceDropdown] = useState(false)
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)
  const [showAgentDropdown, setShowAgentDropdown] = useState(false)
  const [showCleared, setShowCleared] = useState(false)

  // Filter messages - inbox only shows inbound messages
  const filteredMessages = useMemo(() => {
    return messages.filter(msg => {
      // Inbox only shows inbound messages (received from suppliers/agents)
      if (msg.direction !== 'inbound') {
        return false
      }

      // Exclude cleared messages unless showCleared is true
      if (msg.isCleared && !showCleared) {
        return false
      }

      // Source filter
      if (sourceFilter !== 'all' && msg.sourceType !== sourceFilter) {
        return false
      }

      // Supplier filter (only applies to PO messages)
      if (supplierFilter !== 'all') {
        if (msg.sourceType !== 'purchase-order' || msg.supplierId !== supplierFilter) {
          return false
        }
      }

      // Agent filter (only applies to shipping agent messages)
      if (agentFilter !== 'all') {
        if (msg.sourceType !== 'shipping-agent' || msg.agentId !== agentFilter) {
          return false
        }
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesContent = msg.content.toLowerCase().includes(query)
        const matchesSender = msg.senderName.toLowerCase().includes(query)
        const matchesPO = msg.poNumber?.toLowerCase().includes(query) || false
        const matchesSupplier = msg.supplierName?.toLowerCase().includes(query) || false
        const matchesAgent = msg.agentName?.toLowerCase().includes(query) || false
        const matchesTransfer = msg.transferNumber?.toLowerCase().includes(query) || false
        return matchesContent || matchesSender || matchesPO || matchesSupplier || matchesAgent || matchesTransfer
      }

      return true
    })
  }, [messages, sourceFilter, supplierFilter, agentFilter, searchQuery, showCleared])

  const activeSourceLabel = sourceFilterOptions.find(s => s.id === sourceFilter)?.label || 'All Sources'
  const activeSupplierLabel = supplierFilter === 'all'
    ? 'All Suppliers'
    : suppliers.find(s => s.id === supplierFilter)?.name || 'All Suppliers'
  const activeAgentLabel = agentFilter === 'all'
    ? 'All Agents'
    : shippingAgents.find(a => a.id === agentFilter)?.name || 'All Agents'

  // Determine which entity filter to show based on source filter
  const showSupplierFilter = sourceFilter === 'all' || sourceFilter === 'purchase-order'
  const showAgentFilter = sourceFilter === 'all' || sourceFilter === 'shipping-agent'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                Inbox
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                All messages across purchase orders and shipping agents
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="mt-6">
            <InboxSummaryCards summary={summary} />
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 pb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Source Filter */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSourceDropdown(!showSourceDropdown)
                  setShowSupplierDropdown(false)
                  setShowAgentDropdown(false)
                }}
                className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
              >
                {activeSourceLabel}
                <ChevronDownIcon />
              </button>
              {showSourceDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSourceDropdown(false)}
                  />
                  <div className="absolute left-0 top-full mt-1 z-20 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 min-w-[180px]">
                    {sourceFilterOptions.map(option => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSourceFilter(option.id)
                          setShowSourceDropdown(false)
                          // Reset entity filters when switching source
                          if (option.id === 'shipping-agent') {
                            setSupplierFilter('all')
                          } else if (option.id === 'purchase-order') {
                            setAgentFilter('all')
                          }
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${
                          option.id === sourceFilter
                            ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Supplier Filter - only show for PO messages */}
            {showSupplierFilter && suppliers.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSupplierDropdown(!showSupplierDropdown)
                    setShowSourceDropdown(false)
                    setShowAgentDropdown(false)
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
                >
                  {activeSupplierLabel}
                  <ChevronDownIcon />
                </button>
                {showSupplierDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowSupplierDropdown(false)}
                    />
                    <div className="absolute left-0 top-full mt-1 z-20 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 min-w-[200px] max-h-64 overflow-y-auto">
                      <button
                        onClick={() => {
                          setSupplierFilter('all')
                          setShowSupplierDropdown(false)
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${
                          supplierFilter === 'all'
                            ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        All Suppliers
                      </button>
                      {suppliers.map(supplier => (
                        <button
                          key={supplier.id}
                          onClick={() => {
                            setSupplierFilter(supplier.id)
                            setShowSupplierDropdown(false)
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${
                            supplier.id === supplierFilter
                              ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {supplier.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Agent Filter - only show for shipping agent messages */}
            {showAgentFilter && shippingAgents.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowAgentDropdown(!showAgentDropdown)
                    setShowSourceDropdown(false)
                    setShowSupplierDropdown(false)
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
                >
                  {activeAgentLabel}
                  <ChevronDownIcon />
                </button>
                {showAgentDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowAgentDropdown(false)}
                    />
                    <div className="absolute left-0 top-full mt-1 z-20 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 min-w-[200px] max-h-64 overflow-y-auto">
                      <button
                        onClick={() => {
                          setAgentFilter('all')
                          setShowAgentDropdown(false)
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${
                          agentFilter === 'all'
                            ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        All Agents
                      </button>
                      {shippingAgents.map(agent => (
                        <button
                          key={agent.id}
                          onClick={() => {
                            setAgentFilter(agent.id)
                            setShowAgentDropdown(false)
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${
                            agent.id === agentFilter
                              ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {agent.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Show Cleared Toggle */}
            <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showCleared}
                onChange={(e) => setShowCleared(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
              />
              Show cleared
            </label>
          </div>
        </div>
      </div>

      {/* Message List */}
      <div className="p-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {filteredMessages.length > 0 ? (
            <>
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredMessages.map(message => (
                  <InboxRow
                    key={message.messageId}
                    message={message}
                    isExpanded={expandedId === message.messageId}
                    onToggleExpand={() => {
                      setExpandedId(expandedId === message.messageId ? null : message.messageId)
                      // Mark as read when expanded
                      if (!message.isRead && expandedId !== message.messageId) {
                        onMarkRead?.(message.messageId)
                      }
                    }}
                    onViewPO={() => message.poId && onViewPO?.(message.poId)}
                    onViewTransfer={() => message.transferId && onViewTransfer?.(message.transferId)}
                    onMarkRead={() => onMarkRead?.(message.messageId)}
                    onMarkUnread={() => onMarkUnread?.(message.messageId)}
                    onClear={() => onClearMessage?.(message.messageId)}
                    onRestore={() => onRestoreMessage?.(message.messageId)}
                  />
                ))}
              </div>
              <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Showing {filteredMessages.length} of {messages.filter(m => m.direction === 'inbound' && (!m.isCleared || showCleared)).length} messages
                </p>
              </div>
            </>
          ) : (
            <div className="px-4 py-16 text-center">
              <div className="flex justify-center">
                <InboxIcon />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-900 dark:text-white">
                No messages found
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {searchQuery || sourceFilter !== 'all' || supplierFilter !== 'all' || agentFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Messages from suppliers and shipping agents will appear here'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

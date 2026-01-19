'use client'

import { useState, useEffect, useRef } from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  Percent,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Trash2,
  BarChart3,
  CloudDownload,
  Link2,
} from 'lucide-react'
import { useAmazonSettlements, AmazonSettlement } from '@/lib/supabase/hooks/useAmazonSettlements'
import { useAmazonConnection } from '@/lib/supabase/hooks/useAmazonConnection'

const STATUS_LABELS: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: RefreshCw },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertCircle },
  reconciled: { label: 'Reconciled', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: CheckCircle },
}

const TRANSACTION_TYPE_COLORS: Record<string, string> = {
  Order: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Refund: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  ServiceFee: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  FBAInventoryFee: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Adjustment: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Transfer: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Other: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
}

export function SettlementsView() {
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const hasAutoSynced = useRef(false)

  // Amazon connection status
  const {
    isConnected: amazonConnected,
    loading: connectionLoading,
    getAuthUrl,
    isConnecting,
  } = useAmazonConnection()

  const {
    settlements,
    selectedSettlement,
    transactions,
    feeBreakdown,
    skuBreakdown,
    summary,
    loading,
    loadingDetail,
    syncing,
    syncStatus,
    error,
    refetch,
    fetchSettlementDetail,
    deleteSettlement,
    clearSelection,
    syncSettlements,
  } = useAmazonSettlements()

  // Auto-sync on page load (once) - only if connected
  useEffect(() => {
    if (amazonConnected && !hasAutoSynced.current && !loading && !syncing) {
      hasAutoSynced.current = true
      handleSync()
    }
  }, [loading, amazonConnected])

  // Handle Amazon connect button
  const handleConnectAmazon = async () => {
    const authUrl = await getAuthUrl()
    if (authUrl) {
      window.location.href = authUrl
    }
  }

  // Handle mock connect for development
  const handleMockConnect = async () => {
    try {
      const response = await fetch('/api/amazon/mock-connect', { method: 'POST' })
      if (response.ok) {
        window.location.reload()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create mock connection')
      }
    } catch (err) {
      console.error('Mock connect error:', err)
      alert('Failed to create mock connection')
    }
  }

  const handleSync = async () => {
    setSyncMessage(null)
    const result = await syncSettlements()
    if (result.synced > 0) {
      setSyncMessage(`Synced ${result.synced} new settlement${result.synced !== 1 ? 's' : ''}`)
    } else if (result.skipped > 0) {
      setSyncMessage(`All ${result.skipped} settlements already synced`)
    } else {
      setSyncMessage(result.message || 'No new settlements available')
    }
    // Clear message after 5 seconds
    setTimeout(() => setSyncMessage(null), 5000)
  }

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // Pagination
  const totalPages = Math.ceil(settlements.length / pageSize)
  const paginatedSettlements = settlements.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const handleViewDetail = async (settlement: AmazonSettlement) => {
    await fetchSettlementDetail(settlement.id)
    setViewMode('detail')
  }

  const handleBackToList = () => {
    clearSelection()
    setViewMode('list')
  }

  const handleDeleteSettlement = async (id: string) => {
    if (confirm('Are you sure you want to delete this settlement? This cannot be undone.')) {
      await deleteSettlement(id)
      if (viewMode === 'detail') {
        handleBackToList()
      }
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  // Connection loading state
  if (connectionLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  // Not connected - show connection prompt
  if (!amazonConnected) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="px-6 py-5">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Amazon Settlements</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Financial reconciliation from Amazon settlement reports
            </p>
          </div>
        </div>
        <div className="p-6">
          <div className="max-w-lg mx-auto bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.61 7.2c-.08-.06-.18-.1-.28-.1a.48.48 0 0 0-.22.05c-1.84.72-3.7 1.4-5.56 2.06-1.44.51-2.88 1.01-4.33 1.49-.24.08-.48.15-.72.22-.13.04-.28.04-.41-.01-.18-.07-.37-.13-.56-.2-1.71-.62-3.42-1.26-5.12-1.92-.26-.1-.53-.2-.79-.31a.51.51 0 0 0-.61.2.49.49 0 0 0 .03.54c.17.23.34.45.52.68.94 1.18 1.88 2.37 2.82 3.55.19.24.38.47.57.71.08.1.17.18.27.24.1.06.21.1.33.11h.08c.07 0 .15-.02.21-.05 2.31-.71 4.62-1.42 6.93-2.13 1.08-.33 2.17-.67 3.25-1 .28-.09.55-.17.83-.25.14-.04.29-.04.43.01.12.05.22.13.29.23.08.12.12.26.1.4-.02.15-.1.28-.21.38l-.06.05c-1.66 1.49-3.33 2.99-5 4.48-.48.43-.97.86-1.45 1.29-.27.24-.38.6-.29.94.09.34.35.61.69.71 1.83.5 3.67 1 5.5 1.51.34.09.69.19 1.03.28.11.03.23.03.34 0 .11-.03.21-.09.28-.17.93-.97 1.86-1.93 2.79-2.9.47-.49.95-.98 1.42-1.47.08-.08.15-.18.19-.29.04-.11.05-.23.03-.34-.58-2.83-1.16-5.67-1.73-8.5-.07-.35-.14-.69-.21-1.04a.5.5 0 0 0-.17-.29z"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Connect Your Amazon Account
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Connect your Amazon Seller Central account to automatically sync settlement reports,
              view fee breakdowns, and track your financial data.
            </p>
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={handleConnectAmazon}
                disabled={isConnecting}
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 font-medium"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Link2 className="w-5 h-5" />
                    Connect Amazon Seller Central
                  </>
                )}
              </button>
              {process.env.NODE_ENV !== 'production' && (
                <button
                  onClick={handleMockConnect}
                  className="text-sm text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 underline"
                >
                  Use Mock Connection (Dev Only)
                </button>
              )}
            </div>
            <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
              You can also connect from the Inventory page
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">Error: {error.message}</p>
          <button
            onClick={refetch}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Detail view
  if (viewMode === 'detail' && selectedSettlement) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="px-6 py-5">
            <button
              onClick={handleBackToList}
              className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Settlements
            </button>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  Settlement {selectedSettlement.settlementId}
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {formatDateRange(selectedSettlement.settlementStartDate, selectedSettlement.settlementEndDate)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const statusInfo = STATUS_LABELS[selectedSettlement.status] || STATUS_LABELS.pending
                  const StatusIcon = statusInfo.icon
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full ${statusInfo.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      {statusInfo.label}
                    </span>
                  )
                })()}
                <button
                  onClick={() => handleDeleteSettlement(selectedSettlement.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  title="Delete settlement"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Settlement Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Deposit Amount
                </p>
                <p className="mt-1 text-xl font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(selectedSettlement.totalAmount)}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Product Sales
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(selectedSettlement.totalSales)}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Fees
                </p>
                <p className="mt-1 text-xl font-semibold text-red-600 dark:text-red-400">
                  {formatCurrency(selectedSettlement.totalFees)}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Refunds
                </p>
                <p className="mt-1 text-xl font-semibold text-orange-600 dark:text-orange-400">
                  {formatCurrency(selectedSettlement.totalRefunds)}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Orders / Refunds
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                  {formatNumber(selectedSettlement.orderCount)} / {formatNumber(selectedSettlement.refundCount)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loadingDetail ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">Loading settlement details...</p>
            </div>
          ) : (
            <>
              {/* Fee Breakdown */}
              {feeBreakdown.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-red-500" />
                    Fee Breakdown
                  </h2>
                  <div className="space-y-3">
                    {feeBreakdown.slice(0, 10).map((fee, index) => {
                      const maxFee = Math.abs(feeBreakdown[0]?.amount || 1)
                      const widthPercent = Math.abs(fee.amount) / maxFee * 100
                      return (
                        <div key={fee.type} className="flex items-center gap-4">
                          <div className="w-48 text-sm text-slate-600 dark:text-slate-400 truncate">
                            {fee.type}
                          </div>
                          <div className="flex-1">
                            <div
                              className="h-6 bg-red-500 dark:bg-red-600 rounded"
                              style={{ width: `${widthPercent}%` }}
                            />
                          </div>
                          <div className="w-24 text-sm text-right font-medium text-red-600 dark:text-red-400">
                            {formatCurrency(fee.amount)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {feeBreakdown.length > 10 && (
                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                      + {feeBreakdown.length - 10} more fee types
                    </p>
                  )}
                </div>
              )}

              {/* SKU Breakdown */}
              {skuBreakdown.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Package className="w-5 h-5 text-indigo-500" />
                      SKU Performance
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">SKU</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Sales</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Fees</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Refunds</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Net</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {skuBreakdown.slice(0, 20).map(sku => (
                          <tr key={sku.sku} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <td className="px-4 py-3">
                              <span className="font-mono text-sm font-medium text-slate-900 dark:text-white">
                                {sku.sku}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400">
                              {formatCurrency(sku.sales)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-red-600 dark:text-red-400">
                              {formatCurrency(sku.fees)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-orange-600 dark:text-orange-400">
                              {formatCurrency(sku.refunds)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900 dark:text-white">
                              {formatCurrency(sku.net)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {skuBreakdown.length > 20 && (
                    <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Showing top 20 of {skuBreakdown.length} SKUs
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Transactions */}
              {transactions.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-slate-500" />
                      Transactions ({transactions.length})
                    </h2>
                  </div>
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-white dark:bg-slate-800">
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Order ID</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">SKU</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Description</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {transactions.slice(0, 100).map(txn => (
                          <tr key={txn.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400">
                              {formatDate(txn.postedDate)}
                            </td>
                            <td className="px-4 py-2">
                              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${TRANSACTION_TYPE_COLORS[txn.transactionType] || TRANSACTION_TYPE_COLORS.Other}`}>
                                {txn.transactionType}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm font-mono text-slate-600 dark:text-slate-400">
                              {txn.orderId || '-'}
                            </td>
                            <td className="px-4 py-2 text-sm font-mono text-slate-900 dark:text-white">
                              {txn.sku || '-'}
                            </td>
                            <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
                              {txn.amountDescription || txn.amountType}
                            </td>
                            <td className={`px-4 py-2 text-sm text-right font-medium ${
                              txn.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {formatCurrency(txn.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {transactions.length > 100 && (
                    <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Showing first 100 of {transactions.length} transactions
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Amazon Settlements</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Financial reconciliation from Amazon settlement reports
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Sync status indicator */}
              {syncStatus && (
                <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                  <div>Last synced: {formatRelativeTime(syncStatus.lastSyncedAt)}</div>
                  <div>{syncStatus.totalSettlements} settlement{syncStatus.totalSettlements !== 1 ? 's' : ''}</div>
                </div>
              )}
              <button
                onClick={handleSync}
                disabled={syncing || loading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <CloudDownload className={`w-4 h-4 ${syncing ? 'animate-pulse' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync from Amazon'}
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/50 rounded-lg text-green-600 dark:text-green-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Total Deposits
                </p>
              </div>
              <p className="mt-2 text-2xl font-semibold text-green-600 dark:text-green-400">
                {loading ? '...' : formatCurrency(summary.totalDeposits)}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Total Sales
                </p>
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {loading ? '...' : formatCurrency(summary.totalSales)}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-100 dark:bg-red-900/50 rounded-lg text-red-600 dark:text-red-400">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Total Fees
                </p>
              </div>
              <p className="mt-2 text-2xl font-semibold text-red-600 dark:text-red-400">
                {loading ? '...' : formatCurrency(summary.totalFees)}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 dark:bg-orange-900/50 rounded-lg text-orange-600 dark:text-orange-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Total Refunds
                </p>
              </div>
              <p className="mt-2 text-2xl font-semibold text-orange-600 dark:text-orange-400">
                {loading ? '...' : formatCurrency(summary.totalRefunds)}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/50 rounded-lg text-purple-600 dark:text-purple-400">
                  <Percent className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Avg Fee %
                </p>
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {loading ? '...' : `${summary.avgFeePct.toFixed(1)}%`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Message Notification */}
      {syncMessage && (
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg text-indigo-700 dark:text-indigo-300 text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {syncMessage}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          {loading || syncing ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">
                {syncing ? 'Syncing settlements from Amazon...' : 'Loading settlements...'}
              </p>
            </div>
          ) : settlements.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No settlements found</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                No settlement reports available from Amazon yet. Reports are typically generated every 14 days.
              </p>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                <CloudDownload className="w-4 h-4" />
                Sync from Amazon
              </button>
            </div>
          ) : (
            <>
              {/* Settlements Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Period
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Settlement ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Sales
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Fees
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Deposit
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {paginatedSettlements.map(settlement => {
                      const statusInfo = STATUS_LABELS[settlement.status] || STATUS_LABELS.pending
                      const StatusIcon = statusInfo.icon
                      return (
                        <tr
                          key={settlement.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                          onClick={() => handleViewDetail(settlement)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span className="text-sm text-slate-900 dark:text-white">
                                {formatDateRange(settlement.settlementStartDate, settlement.settlementEndDate)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm text-slate-600 dark:text-slate-400">
                              {settlement.settlementId}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-slate-900 dark:text-white">
                            {formatCurrency(settlement.totalSales)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-red-600 dark:text-red-400">
                            {formatCurrency(settlement.totalFees)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(settlement.totalAmount)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewDetail(settlement)
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, settlements.length)} of {settlements.length} settlements
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

    </div>
  )
}

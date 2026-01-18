'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, CheckCircle, AlertCircle, Cloud, Calendar } from 'lucide-react'
import { useSalesHistory } from '@/lib/supabase/hooks/useSalesHistory'

interface SyncStatus {
  connected: boolean
  lastConnectionSync?: string
  latestSalesDate?: string
}

export function AmazonSyncSettings() {
  const { syncFromAmazon, checkAmazonSyncStatus, loading } = useSalesHistory()
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ connected: false })
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })

  // Check sync status on mount
  useEffect(() => {
    checkAmazonSyncStatus().then(setSyncStatus)
  }, [checkAmazonSyncStatus])

  const handleSync = async () => {
    setSyncing(true)
    setMessage(null)

    const result = await syncFromAmazon({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    })

    setSyncing(false)
    setMessage({
      type: result.success ? 'success' : 'error',
      text: result.message,
    })

    if (result.success) {
      checkAmazonSyncStatus().then(setSyncStatus)
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
          Amazon Sales History Sync
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Sync your sales history from Amazon Seller Central to improve forecast accuracy
        </p>

        {/* Connection Status */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              syncStatus.connected
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-slate-100 dark:bg-slate-700'
            }`}>
              <Cloud className={`w-5 h-5 ${
                syncStatus.connected
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-slate-400'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-900 dark:text-white">
                  Amazon Connection
                </span>
                {syncStatus.connected ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle className="w-3 h-3" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-3 h-3" />
                    Not connected
                  </span>
                )}
              </div>
              {syncStatus.latestSalesDate && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Latest data: {new Date(syncStatus.latestSalesDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {!syncStatus.connected && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Amazon account not connected. Connect your Amazon Seller Central account to enable sales history sync.
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  Contact your administrator to set up the Amazon SP-API integration.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sync Options */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Date Range
            </label>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Start Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  End Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex gap-2">
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                )}
                <span className={`text-sm ${
                  message.type === 'success'
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {message.text}
                </span>
              </div>
            </div>
          )}

          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={!syncStatus.connected || syncing || loading}
            className={`
              flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg font-medium transition-colors
              ${syncStatus.connected && !syncing && !loading
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Sales History'}
          </button>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Sales data will be synced for the selected date range and used to improve demand forecasting.
          </p>
        </div>
      </div>
    </div>
  )
}

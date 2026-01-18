'use client'

import { useState } from 'react'
import { Plus, RefreshCw, ExternalLink, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAmazonConnection } from '@/lib/supabase/hooks/useAmazonConnection'

export function AmazonAccountsView() {
  const {
    connection,
    isConnected,
    isPending,
    needsReauth,
    loading,
    error,
    isConnecting,
    getAuthUrl,
    disconnect,
    refreshToken,
  } = useAmazonConnection()

  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)

  const handleConnect = async () => {
    const authUrl = await getAuthUrl()
    if (authUrl) {
      window.location.href = authUrl
    }
  }

  const handleDisconnect = async () => {
    await disconnect()
    setShowDisconnectConfirm(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-slate-900 dark:text-white">
            Amazon Seller Central
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Connect your Amazon Seller Central account to sync inventory and orders
          </p>
        </div>
        {!connection && (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Connect Account
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error.message}
        </div>
      )}

      {/* Connection Card */}
      {connection ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.336-.12.48-.256.19-.6.41-1.006.654-1.244.743-2.64 1.316-4.185 1.726-1.553.414-3.09.623-4.62.623-2.322 0-4.562-.4-6.71-1.19-2.15-.788-4.03-1.86-5.63-3.21-.09-.065-.143-.14-.143-.18zm6.57-5.234c0-.842.202-1.56.61-2.155.405-.594 1.02-1.1 1.845-1.52-.764-.65-1.29-1.285-1.58-1.905-.295-.622-.438-1.2-.438-1.74 0-.88.308-1.63.928-2.25.622-.62 1.382-.93 2.28-.93.892 0 1.648.303 2.268.91.62.61.93 1.357.93 2.25 0 1.09-.502 2.12-1.507 3.085l.018.01c.608.354 1.065.8 1.37 1.336.308.54.463 1.12.463 1.74 0 .615-.13 1.19-.387 1.73-.26.54-.612.99-1.058 1.35-.445.362-.95.64-1.515.828-.565.19-1.16.285-1.778.285-.698 0-1.345-.118-1.935-.35-.595-.235-1.107-.56-1.54-.977-.434-.42-.77-.91-1.01-1.475-.24-.565-.36-1.18-.36-1.84zm3.15 3.12c.4 0 .772-.065 1.115-.195.343-.13.64-.31.888-.54.25-.228.445-.5.585-.812.143-.315.213-.66.213-1.035 0-.86-.25-1.537-.75-2.028-.5-.49-1.145-.735-1.935-.735-.43 0-.822.078-1.17.235-.347.157-.64.37-.878.64-.24.27-.426.586-.555.945-.13.36-.195.74-.195 1.14 0 .76.243 1.37.73 1.82.49.452 1.13.677 1.92.677v-.112zm.405-7.488c.448 0 .818-.14 1.11-.42.29-.28.436-.64.436-1.08 0-.44-.145-.8-.436-1.08-.292-.28-.662-.42-1.11-.42-.44 0-.81.14-1.11.42-.3.28-.45.64-.45 1.08 0 .44.15.8.45 1.08.3.28.67.42 1.11.42z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-base font-medium text-slate-900 dark:text-white">
                  Seller ID: {connection.sellerId}
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  {isConnected ? (
                    <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-4 h-4" />
                      Connected
                    </span>
                  ) : isPending ? (
                    <span className="inline-flex items-center gap-1 text-sm text-yellow-600 dark:text-yellow-400">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Pending
                    </span>
                  ) : needsReauth ? (
                    <span className="inline-flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      Needs Re-authorization
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                      {connection.status}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {connection.marketplaces.map((marketplace) => (
                    <span
                      key={marketplace}
                      className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded"
                    >
                      {marketplace}
                    </span>
                  ))}
                </div>
                {connection.lastSyncAt && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Last synced: {new Date(connection.lastSyncAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {needsReauth && (
                <button
                  onClick={handleConnect}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                >
                  <ExternalLink className="w-4 h-4" />
                  Re-authorize
                </button>
              )}
              <button
                onClick={() => refreshToken()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => setShowDisconnectConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4" />
                Disconnect
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.336-.12.48-.256.19-.6.41-1.006.654-1.244.743-2.64 1.316-4.185 1.726-1.553.414-3.09.623-4.62.623-2.322 0-4.562-.4-6.71-1.19-2.15-.788-4.03-1.86-5.63-3.21-.09-.065-.143-.14-.143-.18zm6.57-5.234c0-.842.202-1.56.61-2.155.405-.594 1.02-1.1 1.845-1.52-.764-.65-1.29-1.285-1.58-1.905-.295-.622-.438-1.2-.438-1.74 0-.88.308-1.63.928-2.25.622-.62 1.382-.93 2.28-.93.892 0 1.648.303 2.268.91.62.61.93 1.357.93 2.25 0 1.09-.502 2.12-1.507 3.085l.018.01c.608.354 1.065.8 1.37 1.336.308.54.463 1.12.463 1.74 0 .615-.13 1.19-.387 1.73-.26.54-.612.99-1.058 1.35-.445.362-.95.64-1.515.828-.565.19-1.16.285-1.778.285-.698 0-1.345-.118-1.935-.35-.595-.235-1.107-.56-1.54-.977-.434-.42-.77-.91-1.01-1.475-.24-.565-.36-1.18-.36-1.84zm3.15 3.12c.4 0 .772-.065 1.115-.195.343-.13.64-.31.888-.54.25-.228.445-.5.585-.812.143-.315.213-.66.213-1.035 0-.86-.25-1.537-.75-2.028-.5-.49-1.145-.735-1.935-.735-.43 0-.822.078-1.17.235-.347.157-.64.37-.878.64-.24.27-.426.586-.555.945-.13.36-.195.74-.195 1.14 0 .76.243 1.37.73 1.82.49.452 1.13.677 1.92.677v-.112zm.405-7.488c.448 0 .818-.14 1.11-.42.29-.28.436-.64.436-1.08 0-.44-.145-.8-.436-1.08-.292-.28-.662-.42-1.11-.42-.44 0-.81.14-1.11.42-.3.28-.45.64-.45 1.08 0 .44.15.8.45 1.08.3.28.67.42 1.11.42z"/>
            </svg>
          </div>
          <h3 className="text-base font-medium text-slate-900 dark:text-white mb-2">
            No Amazon Account Connected
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-sm mx-auto">
            Connect your Amazon Seller Central account to automatically sync inventory levels and FBA shipments.
          </p>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Connect Amazon Account
              </>
            )}
          </button>
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      {showDisconnectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              Disconnect Amazon Account?
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              This will stop syncing inventory from Amazon. You can reconnect at any time.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDisconnectConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

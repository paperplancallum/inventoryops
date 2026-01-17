'use client'

import { useState } from 'react'
import { Link2, Link2Off, RefreshCw, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react'
import type { AmazonConnection } from '@/lib/supabase/hooks/useAmazonConnection'

interface AmazonConnectCardProps {
  connection: AmazonConnection | null
  isConnected: boolean
  needsReauth: boolean
  loading: boolean
  isConnecting: boolean
  lastSyncAt: string | null
  onConnect: () => void
  onDisconnect: () => Promise<boolean>
  onSync: () => Promise<boolean>
  syncing: boolean
}

export function AmazonConnectCard({
  connection,
  isConnected,
  needsReauth,
  loading,
  isConnecting,
  lastSyncAt,
  onConnect,
  onDisconnect,
  onSync,
  syncing,
}: AmazonConnectCardProps) {
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)

  const getStatusDisplay = () => {
    if (loading) {
      return {
        icon: <RefreshCw className="w-5 h-5 animate-spin text-stone-400" />,
        text: 'Checking connection...',
        color: 'text-stone-500',
        bgColor: 'bg-stone-100 dark:bg-stone-800',
      }
    }

    if (isConnected) {
      return {
        icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
        text: 'Connected',
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      }
    }

    if (isConnecting) {
      return {
        icon: <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />,
        text: 'Connecting...',
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      }
    }

    if (needsReauth) {
      return {
        icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
        text: 'Needs Reconnection',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
      }
    }

    return {
      icon: <Link2Off className="w-5 h-5 text-stone-400" />,
      text: 'Not Connected',
      color: 'text-stone-500 dark:text-stone-400',
      bgColor: 'bg-stone-100 dark:bg-stone-800',
    }
  }

  const status = getStatusDisplay()

  const handleDisconnect = async () => {
    await onDisconnect()
    setShowDisconnectConfirm(false)
  }

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.61 7.2c-.08-.06-.18-.1-.28-.1a.48.48 0 0 0-.22.05c-1.84.72-3.7 1.4-5.56 2.06-1.44.51-2.88 1.01-4.33 1.49-.24.08-.48.15-.72.22-.13.04-.28.04-.41-.01-.18-.07-.37-.13-.56-.2-1.71-.62-3.42-1.26-5.12-1.92-.26-.1-.53-.2-.79-.31a.51.51 0 0 0-.61.2.49.49 0 0 0 .03.54c.17.23.34.45.52.68.94 1.18 1.88 2.37 2.82 3.55.19.24.38.47.57.71.08.1.17.18.27.24.1.06.21.1.33.11h.08c.07 0 .15-.02.21-.05 2.31-.71 4.62-1.42 6.93-2.13 1.08-.33 2.17-.67 3.25-1 .28-.09.55-.17.83-.25.14-.04.29-.04.43.01.12.05.22.13.29.23.08.12.12.26.1.4-.02.15-.1.28-.21.38l-.06.05c-1.66 1.49-3.33 2.99-5 4.48-.48.43-.97.86-1.45 1.29-.27.24-.38.6-.29.94.09.34.35.61.69.71 1.83.5 3.67 1 5.5 1.51.34.09.69.19 1.03.28.11.03.23.03.34 0 .11-.03.21-.09.28-.17.93-.97 1.86-1.93 2.79-2.9.47-.49.95-.98 1.42-1.47.08-.08.15-.18.19-.29.04-.11.05-.23.03-.34-.58-2.83-1.16-5.67-1.73-8.5-.07-.35-.14-.69-.21-1.04a.5.5 0 0 0-.17-.29z"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-stone-900 dark:text-white">
              Amazon Seller Central
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Connect to sync FBA inventory data
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${status.bgColor} ${status.color} flex items-center gap-2`}>
            {status.icon}
            {status.text}
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        {isConnected && connection && (
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-500 dark:text-stone-400">Seller ID</span>
              <span className="font-mono text-stone-900 dark:text-white">{connection.sellerId}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-500 dark:text-stone-400">Marketplaces</span>
              <span className="text-stone-900 dark:text-white">{connection.marketplaces.join(', ')}</span>
            </div>
            {lastSyncAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500 dark:text-stone-400">Last Synced</span>
                <span className="text-stone-900 dark:text-white">
                  {new Date(lastSyncAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}

        {needsReauth && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">
              Your Amazon connection has expired. Please reconnect to continue syncing inventory.
            </p>
          </div>
        )}

        <div className="flex items-center gap-3">
          {!isConnected && !isConnecting && (
            <button
              onClick={onConnect}
              disabled={isConnecting || loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-stone-300 dark:disabled:bg-stone-600 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  Connect Amazon
                </>
              )}
            </button>
          )}

          {needsReauth && (
            <button
              onClick={onConnect}
              disabled={isConnecting || loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-stone-300 dark:disabled:bg-stone-600 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Reconnecting...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Reconnect
                </>
              )}
            </button>
          )}

          {isConnected && !showDisconnectConfirm && (
            <>
              <button
                onClick={onSync}
                disabled={loading || syncing}
                className="flex items-center gap-2 px-4 py-2 bg-lime-600 hover:bg-lime-700 disabled:bg-stone-300 dark:disabled:bg-stone-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
              <button
                onClick={() => setShowDisconnectConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors"
              >
                <Link2Off className="w-4 h-4" />
                Disconnect
              </button>
            </>
          )}

          {isConnected && showDisconnectConfirm && (
            <div className="flex-1 flex items-center gap-2">
              <span className="text-sm text-stone-600 dark:text-stone-400">Disconnect Amazon?</span>
              <button
                onClick={handleDisconnect}
                className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Yes, Disconnect
              </button>
              <button
                onClick={() => setShowDisconnectConfirm(false)}
                className="px-3 py-1 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {!isConnected && !needsReauth && (
        <div className="px-6 py-3 bg-stone-50 dark:bg-stone-800/50 border-t border-stone-200 dark:border-stone-700">
          <a
            href="https://developer-docs.amazon.com/sp-api/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
          >
            Learn more about Amazon SP-API
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  )
}

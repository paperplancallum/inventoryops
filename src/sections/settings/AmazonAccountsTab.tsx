'use client'

import { RefreshCw, Unplug, Settings2, CheckCircle2, AlertCircle, Clock, Plus, Globe } from 'lucide-react'
import type { AmazonAccountsTabProps, AmazonConnection, AmazonConnectionStatus } from './types'
import { NA_MARKETPLACES } from '@/lib/supabase/hooks/useAmazonConnections'

const statusConfig: Record<AmazonConnectionStatus, { icon: typeof CheckCircle2; label: string; className: string }> = {
  active: {
    icon: CheckCircle2,
    label: 'Connected',
    className: 'text-emerald-600 dark:text-emerald-400',
  },
  revoked: {
    icon: Unplug,
    label: 'Disconnected',
    className: 'text-slate-500 dark:text-slate-400',
  },
  expired: {
    icon: AlertCircle,
    label: 'Expired',
    className: 'text-amber-600 dark:text-amber-400',
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    className: 'text-blue-600 dark:text-blue-400',
  },
}

function formatLastSync(dateString: string | null): string {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function AmazonConnectionCard({
  connection,
  onRefresh,
  onEditMarketplaces,
  onDisconnect,
}: {
  connection: AmazonConnection
  onRefresh: (id: string) => void
  onEditMarketplaces: (id: string) => void
  onDisconnect: (id: string) => void
}) {
  const status = statusConfig[connection.status]
  const StatusIcon = status.icon

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
              {connection.sellerName || 'Amazon Account'}
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              North America
            </span>
          </div>

          {/* Seller info */}
          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-3">
            <span className="font-mono text-xs">{connection.sellerId}</span>
          </div>

          {/* Status and sync */}
          <div className="flex items-center gap-4 mb-4">
            <div className={`flex items-center gap-1.5 text-sm ${status.className}`}>
              <StatusIcon className="h-4 w-4" />
              <span>{status.label}</span>
            </div>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Last sync: {formatLastSync(connection.lastSyncAt)}
            </span>
          </div>

          {/* Marketplaces */}
          <div className="flex items-center gap-2 flex-wrap">
            <Globe className="h-4 w-4 text-slate-400" />
            {connection.marketplaces.map((mp) => {
              const info = NA_MARKETPLACES.find((m) => m.id === mp)
              return (
                <span
                  key={mp}
                  className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                  title={info?.name}
                >
                  {mp}
                </span>
              )
            })}
            {connection.marketplaces.length === 0 && (
              <span className="text-sm text-slate-400 italic">No marketplaces enabled</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onRefresh(connection.id)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition-colors"
            title="Refresh connection"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEditMarketplaces(connection.id)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition-colors"
            title="Edit marketplaces"
          >
            <Settings2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDisconnect(connection.id)}
            className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
            title="Disconnect account"
          >
            <Unplug className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function AmazonAccountsTab({
  connections,
  loading,
  onConnect,
  onRefresh,
  onEditMarketplaces,
  onDisconnect,
}: AmazonAccountsTabProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800/50 animate-pulse">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Amazon Seller Central Accounts
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Connect your Amazon accounts to sync inventory and orders
          </p>
        </div>
        <button
          onClick={onConnect}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white font-medium text-sm hover:bg-amber-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Connect Account
        </button>
      </div>

      {/* Connections list */}
      {connections.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 p-12 text-center dark:border-slate-700">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <Globe className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            No Amazon accounts connected
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Connect your Seller Central account to start syncing inventory
          </p>
          <button
            onClick={onConnect}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white font-medium text-sm hover:bg-amber-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Connect Your First Account
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {connections.map((connection) => (
            <AmazonConnectionCard
              key={connection.id}
              connection={connection}
              onRefresh={onRefresh}
              onEditMarketplaces={onEditMarketplaces}
              onDisconnect={onDisconnect}
            />
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
          About Amazon Integration
        </h4>
        <p className="text-sm text-blue-700 dark:text-blue-400">
          InventoryOps uses the Amazon Selling Partner API to sync your inventory levels,
          orders, and product data. Connect your North America account to get started.
        </p>
      </div>
    </div>
  )
}

import { RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react'

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

interface AmazonSyncStatusProps {
  lastSyncedAt: string
  status?: SyncStatus
  onSync?: () => void
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function AmazonSyncStatus({
  lastSyncedAt,
  status = 'idle',
  onSync,
}: AmazonSyncStatusProps) {
  const isSyncing = status === 'syncing'

  return (
    <div className="flex items-center gap-3">
      {/* Status indicator */}
      <div className="flex items-center gap-2 text-sm">
        {status === 'syncing' && (
          <>
            <RefreshCw className="w-4 h-4 text-lime-600 dark:text-lime-400 animate-spin" />
            <span className="text-stone-600 dark:text-stone-400">Syncing...</span>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-stone-600 dark:text-stone-400">Synced</span>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-red-600 dark:text-red-400">Sync failed</span>
          </>
        )}
        {status === 'idle' && (
          <>
            <Clock className="w-4 h-4 text-stone-400 dark:text-stone-500" />
            <span className="text-stone-500 dark:text-stone-400">
              {formatRelativeTime(lastSyncedAt)}
            </span>
          </>
        )}
      </div>

      {/* Sync button */}
      <button
        onClick={onSync}
        disabled={isSyncing}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
          isSyncing
            ? 'bg-stone-100 dark:bg-stone-700 text-stone-400 dark:text-stone-500 cursor-not-allowed'
            : 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
        }`}
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Syncing...' : 'Sync Now'}
      </button>
    </div>
  )
}

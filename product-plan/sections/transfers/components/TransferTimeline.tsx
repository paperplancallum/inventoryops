import type { StatusHistoryEntry, TransferStatus } from '@/../product/sections/transfers/types'

interface TransferTimelineProps {
  history: StatusHistoryEntry[]
}

const statusColors: Record<TransferStatus, string> = {
  draft: 'bg-slate-400',
  booked: 'bg-indigo-500',
  'in-transit': 'bg-amber-500',
  delivered: 'bg-cyan-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
}

const statusLabels: Record<TransferStatus, string> = {
  draft: 'Draft',
  booked: 'Booked',
  'in-transit': 'In Transit',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function TransferTimeline({ history }: TransferTimelineProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-slate-200 dark:bg-slate-700" />

      {/* Timeline items */}
      <div className="space-y-4">
        {history.map((entry, index) => (
          <div key={index} className="relative flex items-start gap-4">
            {/* Dot */}
            <div className={`relative z-10 w-6 h-6 rounded-full ${statusColors[entry.status]} flex items-center justify-center ring-4 ring-white dark:ring-slate-800`}>
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {statusLabels[entry.status]}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDate(entry.date)} at {formatTime(entry.date)}
                </span>
              </div>
              {entry.note && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {entry.note}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

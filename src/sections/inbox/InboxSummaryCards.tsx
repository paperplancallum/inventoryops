import type { InboxSummaryCardsProps } from './types'

// Icons
const InboxIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
  </svg>
)

const BellIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)

const ReplyIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
  </svg>
)

export function InboxSummaryCards({ summary }: InboxSummaryCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-200 dark:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-300">
            <InboxIcon />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Total Messages
          </p>
        </div>
        <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
          {summary.totalMessages}
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
            <BellIcon />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Unread
          </p>
        </div>
        <p className="mt-2 text-2xl font-semibold text-red-600 dark:text-red-400">
          {summary.unreadCount}
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
            <ReplyIcon />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Awaiting Reply
          </p>
        </div>
        <p className="mt-2 text-2xl font-semibold text-amber-600 dark:text-amber-400">
          {summary.awaitingReply}
        </p>
      </div>
    </div>
  )
}

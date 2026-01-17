import type { InboxRowProps } from '@/../product/sections/inbox/types'

// Icons
const ChevronRightIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)

const ChevronDownIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

const PaperClipIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
)

const CheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()

  if (isToday) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
  if (isYesterday) {
    return 'Yesterday'
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatFullDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const getPreviewText = (content: string, maxLength = 60) => {
  const firstLine = content.split('\n')[0]
  if (firstLine.length <= maxLength) return firstLine
  return firstLine.slice(0, maxLength) + '...'
}

export function InboxRow({
  message,
  isExpanded,
  onToggleExpand,
  onViewPO,
  onViewTransfer,
  onClear,
}: InboxRowProps) {
  const hasAttachments = message.attachments && message.attachments.length > 0

  // Row background based on read status
  const rowBgClass = message.isRead
    ? 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50'
    : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'

  // Determine source display (PO number or Agent name)
  const isPurchaseOrder = message.sourceType === 'purchase-order'

  // Sender display - inbox only shows inbound messages
  const senderDisplay = message.senderName

  // Text weight based on read status
  const textWeight = message.isRead ? 'font-normal' : 'font-semibold'

  return (
    <div className={`border-b border-slate-200 dark:border-slate-700 last:border-b-0 ${rowBgClass}`}>
      {/* Collapsed row */}
      <button
        onClick={onToggleExpand}
        className="w-full px-4 py-3 flex items-start gap-3 text-left"
      >
        {/* Expand/collapse icon */}
        <div className="mt-0.5 text-slate-400 dark:text-slate-500">
          {isExpanded ? (
            <ChevronDownIcon className="w-4 h-4" />
          ) : (
            <ChevronRightIcon className="w-4 h-4" />
          )}
        </div>

        {/* Read indicator */}
        <div className="mt-1.5 flex-shrink-0">
          {message.isRead ? (
            <span className="block w-2 h-2 rounded-full border-2 border-slate-300 dark:border-slate-500" />
          ) : (
            <span className="block w-2 h-2 rounded-full bg-blue-500" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className={`text-sm ${textWeight} text-slate-900 dark:text-white`}>
              {senderDisplay}
            </span>
            {isPurchaseOrder ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onViewPO?.()
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                {message.poNumber}
              </button>
            ) : (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewTransfer?.()
                  }}
                  className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
                >
                  {message.transferNumber}
                </button>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  via {message.agentName}
                </span>
              </>
            )}
          </div>
          <p className={`text-sm ${textWeight} text-slate-600 dark:text-slate-400 truncate`}>
            {getPreviewText(message.content)}
          </p>
        </div>

        {/* Attachment indicator */}
        {hasAttachments && (
          <div className="flex-shrink-0 text-slate-400 dark:text-slate-500">
            <PaperClipIcon className="w-4 h-4" />
          </div>
        )}

        {/* Date */}
        <div className="flex-shrink-0 text-xs text-slate-500 dark:text-slate-400">
          {formatDate(message.timestamp)}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 pl-14">
          <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
            {/* Header with full date */}
            <div className="flex items-center gap-2 mb-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{formatFullDate(message.timestamp)}</span>
              {message.senderEmail && (
                <>
                  <span>-</span>
                  <span>{message.senderEmail}</span>
                </>
              )}
            </div>

            {/* Full message content */}
            <div className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300">
              {message.content}
            </div>

            {/* Attachments */}
            {hasAttachments && (
              <div className="mt-3 flex flex-wrap gap-2">
                {message.attachments!.map(att => (
                  <a
                    key={att.id}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs hover:bg-slate-200 dark:hover:bg-slate-600"
                  >
                    <PaperClipIcon className="w-3.5 h-3.5" />
                    {att.name}
                  </a>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onClear?.()
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                <CheckIcon className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

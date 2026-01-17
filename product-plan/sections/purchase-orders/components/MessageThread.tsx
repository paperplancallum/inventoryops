import { useState } from 'react'
import type { Message } from '@/../product/sections/purchase-orders/types'

interface MessageThreadProps {
  messages: Message[]
}

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

const PaperclipIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
)

const DownloadIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
)

const NoteIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

export function MessageThread({ messages }: MessageThreadProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Sort messages by timestamp (newest first for email-style)
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const formatCompactDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const isThisYear = date.getFullYear() === now.getFullYear()

    if (isThisYear) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
  }

  const formatFullDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getPreview = (content: string, maxLength = 50) => {
    const firstLine = content.split('\n')[0]
    if (firstLine.length <= maxLength) return firstLine
    return firstLine.slice(0, maxLength) + '...'
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    }
    if (type === 'application/pdf') {
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    }
    return <PaperclipIcon />
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  if (sortedMessages.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="text-slate-400 dark:text-slate-500 mb-2">
          <svg className="w-10 h-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No messages yet
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      {sortedMessages.map((message) => {
        const isOutbound = message.direction === 'outbound'
        const isInbound = message.direction === 'inbound'
        const isNote = message.direction === 'note'
        const isExpanded = expandedId === message.id
        const hasAttachments = message.attachments && message.attachments.length > 0

        // Row background colors
        const rowBgClass = isNote
          ? 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30'
          : isOutbound
          ? 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50'
          : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/30'

        // Expanded content background
        const expandedBgClass = isNote
          ? 'bg-amber-50/50 dark:bg-amber-900/10'
          : isOutbound
          ? 'bg-slate-50/50 dark:bg-slate-800/30'
          : 'bg-white dark:bg-slate-800'

        // Sender label
        const senderLabel = isNote
          ? 'Internal Note'
          : isOutbound
          ? 'You'
          : message.senderName

        return (
          <div key={message.id}>
            {/* Collapsed row */}
            <button
              onClick={() => toggleExpand(message.id)}
              className={`w-full px-3 py-2.5 flex items-center gap-3 text-left transition-colors ${rowBgClass}`}
            >
              {/* Chevron */}
              <span className={`flex-shrink-0 ${isNote ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
              </span>

              {/* Note icon for notes */}
              {isNote && (
                <span className="text-amber-500 dark:text-amber-400 flex-shrink-0">
                  <NoteIcon />
                </span>
              )}

              {/* Sender */}
              <span className={`w-28 flex-shrink-0 truncate text-sm ${
                isNote
                  ? 'text-amber-700 dark:text-amber-300 font-medium'
                  : isInbound
                  ? 'font-medium text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}>
                {senderLabel}
              </span>

              {/* Preview */}
              <span className={`flex-1 text-sm truncate ${
                isNote
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}>
                {getPreview(message.content)}
              </span>

              {/* Attachment indicator */}
              {hasAttachments && (
                <span className="text-slate-400 dark:text-slate-500 flex-shrink-0">
                  <PaperclipIcon />
                </span>
              )}

              {/* Date */}
              <span className={`text-xs flex-shrink-0 w-16 text-right ${
                isNote
                  ? 'text-amber-500 dark:text-amber-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}>
                {formatCompactDate(message.timestamp)}
              </span>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className={`px-4 py-3 border-t ${
                isNote
                  ? 'border-amber-200 dark:border-amber-800'
                  : 'border-slate-100 dark:border-slate-700'
              } ${expandedBgClass}`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className={`text-sm font-medium ${
                      isNote
                        ? 'text-amber-800 dark:text-amber-200'
                        : 'text-slate-900 dark:text-white'
                    }`}>
                      {isNote ? `Note by ${message.senderName}` : message.senderName}
                    </div>
                    {message.senderEmail && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {message.senderEmail}
                      </div>
                    )}
                  </div>
                  <div className={`text-xs ${
                    isNote
                      ? 'text-amber-500 dark:text-amber-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {formatFullDate(message.timestamp)}
                  </div>
                </div>

                {/* Content */}
                <div className={`text-sm whitespace-pre-wrap ${
                  isNote
                    ? 'text-amber-800 dark:text-amber-200'
                    : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {message.content}
                </div>

                {/* Attachments */}
                {hasAttachments && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {message.attachments!.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        {getFileIcon(attachment.type)}
                        <span className="max-w-[150px] truncate">{attachment.name}</span>
                        <DownloadIcon />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

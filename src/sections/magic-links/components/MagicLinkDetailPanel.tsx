'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Link2,
  Mail,
  Clock,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  XCircle,
  Eye,
  Send,
  CheckCircle,
  AlertTriangle,
  FileText,
  Package
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import type {
  MagicLink,
  MagicLinkEvent,
  MagicLinkStatus,
  MagicLinkEventType,
} from '@/lib/supabase/hooks/useMagicLinks'
import { EVENT_TYPE_LABELS } from '@/lib/supabase/hooks/useMagicLinks'

interface MagicLinkDetailPanelProps {
  link: MagicLink | null
  events: MagicLinkEvent[]
  isLoading?: boolean
  onClose: () => void
  onRevoke: (id: string) => Promise<void>
  onRegenerate: (id: string) => Promise<{ magicLink: { id: string }; rawToken: string } | null>
  onSendReminder: (id: string) => Promise<boolean>
}

const STATUS_COLORS: Record<MagicLinkStatus, { bg: string; text: string; icon: typeof CheckCircle }> = {
  active: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: Clock },
  submitted: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: CheckCircle },
  expired: { bg: 'bg-slate-100 dark:bg-slate-700/50', text: 'text-slate-600 dark:text-slate-400', icon: Clock },
  revoked: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: XCircle },
}

const STATUS_LABELS: Record<MagicLinkStatus, string> = {
  active: 'Active',
  submitted: 'Submitted',
  expired: 'Expired',
  revoked: 'Revoked',
}

const EVENT_ICONS: Record<MagicLinkEventType, typeof Eye> = {
  created: Link2,
  sent: Mail,
  reminder_sent: Mail,
  viewed: Eye,
  form_started: FileText,
  validation_error: AlertTriangle,
  submitted: CheckCircle,
  expired: Clock,
  revoked: XCircle,
  regenerated: RefreshCw,
}

const EVENT_COLORS: Record<MagicLinkEventType, string> = {
  created: 'text-indigo-500',
  sent: 'text-blue-500',
  reminder_sent: 'text-purple-500',
  viewed: 'text-amber-500',
  form_started: 'text-cyan-500',
  validation_error: 'text-orange-500',
  submitted: 'text-green-500',
  expired: 'text-slate-400',
  revoked: 'text-red-500',
  regenerated: 'text-teal-500',
}

const PURPOSE_LABELS: Record<string, string> = {
  'invoice-submission': 'Invoice Submission',
  'document-upload': 'Document Upload',
}

export function MagicLinkDetailPanel({
  link,
  events,
  isLoading = false,
  onClose,
  onRevoke,
  onRegenerate,
  onSendReminder,
}: MagicLinkDetailPanelProps) {
  const [copied, setCopied] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [sendingReminder, setSendingReminder] = useState(false)
  const [newLinkUrl, setNewLinkUrl] = useState<string | null>(null)

  // Reset state when link changes
  useEffect(() => {
    setCopied(false)
    setNewLinkUrl(null)
  }, [link?.id])

  if (!link) return null

  const StatusIcon = STATUS_COLORS[link.status].icon
  const isExpiringSoon = link.status === 'active' &&
    new Date(link.expiresAt).getTime() - Date.now() <= 24 * 60 * 60 * 1000

  const handleCopyUrl = async () => {
    const formPath = link.purpose === 'invoice-submission' ? 'invoice' : 'documents'
    // Note: In a real implementation, the token would be stored/retrieved
    // Here we just show the base URL pattern
    const url = newLinkUrl || `${window.location.origin}/forms/${formPath}/[token]`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleRevoke = async () => {
    if (!confirm('Are you sure you want to revoke this link? The recipient will no longer be able to access it.')) {
      return
    }

    setRevoking(true)
    try {
      await onRevoke(link.id)
    } finally {
      setRevoking(false)
    }
  }

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      const result = await onRegenerate(link.id)
      if (result) {
        const formPath = link.purpose === 'invoice-submission' ? 'invoice' : 'documents'
        setNewLinkUrl(`${window.location.origin}/forms/${formPath}/${result.rawToken}`)
      }
    } finally {
      setRegenerating(false)
    }
  }

  const handleSendReminder = async () => {
    setSendingReminder(true)
    try {
      await onSendReminder(link.id)
    } finally {
      setSendingReminder(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-slate-800 shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                <Link2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Magic Link Details
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {link.linkedEntityName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_COLORS[link.status].bg} ${STATUS_COLORS[link.status].text}`}>
              <StatusIcon className="w-4 h-4" />
              {STATUS_LABELS[link.status]}
            </span>
            {isExpiringSoon && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                Expires soon
              </span>
            )}
          </div>

          {/* New Link URL (after regeneration) */}
          {newLinkUrl && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
                New link generated!
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={newLinkUrl}
                  className="flex-1 text-xs font-mono bg-white dark:bg-slate-800 border border-green-300 dark:border-green-700 rounded px-2 py-1"
                />
                <button
                  onClick={handleCopyUrl}
                  className={`p-1.5 rounded ${copied ? 'text-green-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="space-y-4">
            <div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Recipient</span>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{link.recipientName}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{link.recipientEmail}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Entity Type</span>
                <p className="text-sm text-slate-900 dark:text-white flex items-center gap-1.5 mt-1">
                  <Package className="w-4 h-4 text-slate-400" />
                  {link.linkedEntityType === 'purchase-order' ? 'Purchase Order' : 'Transfer'}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Purpose</span>
                <p className="text-sm text-slate-900 dark:text-white flex items-center gap-1.5 mt-1">
                  <FileText className="w-4 h-4 text-slate-400" />
                  {PURPOSE_LABELS[link.purpose] || link.purpose}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Created</span>
                <p className="text-sm text-slate-900 dark:text-white mt-1">
                  {format(new Date(link.createdAt), 'MMM d, yyyy')}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDistanceToNow(new Date(link.createdAt), { addSuffix: true })}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Expires</span>
                <p className={`text-sm mt-1 ${isExpiringSoon ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-slate-900 dark:text-white'}`}>
                  {format(new Date(link.expiresAt), 'MMM d, yyyy')}
                </p>
                {link.status === 'active' && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDistanceToNow(new Date(link.expiresAt), { addSuffix: true })}
                  </p>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Views</span>
              <p className="text-sm text-slate-900 dark:text-white mt-1">
                {events.filter(e => e.eventType === 'viewed').length}
              </p>
            </div>

            {link.submittedAt && (
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Submitted</span>
                <p className="text-sm text-slate-900 dark:text-white mt-1">
                  {format(new Date(link.submittedAt), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Actions</h3>
            <div className="flex flex-wrap gap-2">
              {link.status === 'active' && (
                <>
                  <button
                    onClick={handleSendReminder}
                    disabled={sendingReminder}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {sendingReminder ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                    Send Reminder
                  </button>
                  <button
                    onClick={handleRevoke}
                    disabled={revoking}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {revoking ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    Revoke
                  </button>
                </>
              )}
              {(link.status === 'expired' || link.status === 'revoked') && (
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  {regenerating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Regenerate
                </button>
              )}
            </div>
          </div>

          {/* Event Timeline */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Activity Timeline</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : events.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                No events recorded yet.
              </p>
            ) : (
              <div className="space-y-4">
                {events.map((event, index) => {
                  const EventIcon = EVENT_ICONS[event.eventType]
                  return (
                    <div key={event.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center ${EVENT_COLORS[event.eventType]}`}>
                          <EventIcon className="w-4 h-4" />
                        </div>
                        {index < events.length - 1 && (
                          <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-700 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {EVENT_TYPE_LABELS[event.eventType]}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {format(new Date(event.timestamp), 'MMM d, yyyy h:mm a')}
                        </p>
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {!!event.metadata.newMagicLinkId && (
                              <span>New link created</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

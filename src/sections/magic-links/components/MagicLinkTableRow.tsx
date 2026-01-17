'use client'

import { useState } from 'react'
import type { MagicLink, MagicLinkStatus } from '@/lib/supabase/hooks/useMagicLinks'
import {
  MoreHorizontal,
  Eye,
  XCircle,
  RefreshCw,
  Mail,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react'
import { formatDistanceToNow, format, differenceInHours } from 'date-fns'

interface MagicLinkTableRowProps {
  link: MagicLink
  onView: () => void
  onRevoke: () => void
  onRegenerate: () => void
  onSendReminder: () => void
  onViewEntity: () => void
}

const STATUS_COLORS: Record<MagicLinkStatus, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  expired: 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400',
  revoked: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const STATUS_LABELS: Record<MagicLinkStatus, string> = {
  active: 'Active',
  submitted: 'Submitted',
  expired: 'Expired',
  revoked: 'Revoked',
}

const PURPOSE_LABELS: Record<string, string> = {
  'invoice-submission': 'Invoice Submission',
  'document-upload': 'Document Upload',
}

const ENTITY_TYPE_LABELS: Record<string, string> = {
  'purchase-order': 'PO',
  'transfer': 'Transfer',
}

export function MagicLinkTableRow({
  link,
  onView,
  onRevoke,
  onRegenerate,
  onSendReminder,
  onViewEntity,
}: MagicLinkTableRowProps) {
  const [showActions, setShowActions] = useState(false)

  const expiresAt = new Date(link.expiresAt)
  const now = new Date()
  const hoursUntilExpiry = differenceInHours(expiresAt, now)
  const isExpiringSoon = link.status === 'active' && hoursUntilExpiry <= 24 && hoursUntilExpiry > 0

  return (
    <tr className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
      {/* Entity */}
      <td className="px-4 py-3">
        <button
          onClick={onViewEntity}
          className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {ENTITY_TYPE_LABELS[link.linkedEntityType]}
          </span>
          <span className="font-medium">{link.linkedEntityName}</span>
          <ExternalLink className="h-3 w-3" />
        </button>
      </td>

      {/* Recipient */}
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-slate-900 dark:text-white">{link.recipientName}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{link.recipientEmail}</p>
        </div>
      </td>

      {/* Purpose */}
      <td className="px-4 py-3">
        <span className="text-sm text-slate-700 dark:text-slate-300">
          {PURPOSE_LABELS[link.purpose] || link.purpose}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[link.status]}`}>
            {STATUS_LABELS[link.status]}
          </span>
          {isExpiringSoon && (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs">
              <AlertTriangle className="h-3 w-3" />
              Expires soon
            </span>
          )}
        </div>
      </td>

      {/* Created */}
      <td className="px-4 py-3">
        <div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {format(new Date(link.createdAt), 'MMM d, yyyy')}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatDistanceToNow(new Date(link.createdAt), { addSuffix: true })}
          </p>
        </div>
      </td>

      {/* Expires */}
      <td className="px-4 py-3">
        <div>
          <p className={`text-sm ${isExpiringSoon ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-slate-700 dark:text-slate-300'}`}>
            {format(expiresAt, 'MMM d, yyyy')}
          </p>
          {link.status === 'active' && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formatDistanceToNow(expiresAt, { addSuffix: true })}
            </p>
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <div className="relative inline-block">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <MoreHorizontal className="h-4 w-4 text-slate-500" />
          </button>

          {showActions && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowActions(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 min-w-[160px]">
                <button
                  onClick={() => {
                    setShowActions(false)
                    onView()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </button>

                {link.status === 'active' && (
                  <>
                    <button
                      onClick={() => {
                        setShowActions(false)
                        onSendReminder()
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      <Mail className="h-4 w-4" />
                      Send Reminder
                    </button>

                    <button
                      onClick={() => {
                        setShowActions(false)
                        onRevoke()
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <XCircle className="h-4 w-4" />
                      Revoke
                    </button>
                  </>
                )}

                {(link.status === 'expired' || link.status === 'revoked') && (
                  <button
                    onClick={() => {
                      setShowActions(false)
                      onRegenerate()
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Regenerate
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

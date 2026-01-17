'use client'

import { useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Eye,
  Check,
  X,
  AlertTriangle,
  Clock,
  DollarSign,
} from 'lucide-react'
import type { SupplierInvoiceSubmission, SubmissionReviewStatus } from '@/lib/supabase/hooks'

interface SubmissionTableRowProps {
  submission: SupplierInvoiceSubmission
  onViewDetails: () => void
  onViewPO: () => void
}

const STATUS_COLORS: Record<SubmissionReviewStatus, { bg: string; text: string; icon: typeof Clock }> = {
  pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: Clock },
  approved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: Check },
  rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: X },
  partially_approved: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: AlertTriangle },
}

const STATUS_LABELS: Record<SubmissionReviewStatus, string> = {
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  partially_approved: 'Partially Approved',
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatVariance(amount: number, percentage: number): { text: string; color: string } {
  const formattedAmount = formatCurrency(Math.abs(amount))
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : ''
  const formattedPercentage = Math.abs(percentage).toFixed(1)

  if (amount === 0) {
    return { text: 'No variance', color: 'text-slate-500' }
  }
  if (amount > 0) {
    return {
      text: `+${formattedAmount} (+${formattedPercentage}%)`,
      color: 'text-red-600 dark:text-red-400'
    }
  }
  return {
    text: `-${formattedAmount} (-${formattedPercentage}%)`,
    color: 'text-green-600 dark:text-green-400'
  }
}

export function SubmissionTableRow({
  submission,
  onViewDetails,
  onViewPO,
}: SubmissionTableRowProps) {
  const StatusIcon = STATUS_COLORS[submission.reviewStatus].icon
  const variance = formatVariance(submission.varianceAmount, submission.variancePercentage)

  return (
    <tr className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      {/* PO & Supplier */}
      <td className="px-4 py-3">
        <button
          onClick={onViewPO}
          className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium text-sm flex items-center gap-1"
        >
          {submission.poNumber}
          <ExternalLink className="w-3 h-3" />
        </button>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {submission.supplierName}
        </p>
      </td>

      {/* Submitted By */}
      <td className="px-4 py-3">
        <p className="text-sm text-slate-900 dark:text-white">{submission.submittedByName}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{submission.submittedByEmail}</p>
      </td>

      {/* Expected vs Submitted */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Expected</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {formatCurrency(submission.expectedTotal)}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Submitted</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {formatCurrency(submission.submittedTotal)}
            </p>
          </div>
        </div>
      </td>

      {/* Variance */}
      <td className="px-4 py-3">
        <span className={`text-sm font-medium ${variance.color}`}>
          {variance.text}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[submission.reviewStatus].bg} ${STATUS_COLORS[submission.reviewStatus].text}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {STATUS_LABELS[submission.reviewStatus]}
        </span>
      </td>

      {/* Submitted At */}
      <td className="px-4 py-3">
        <p className="text-sm text-slate-900 dark:text-white">
          {format(new Date(submission.submittedAt), 'MMM d, yyyy')}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}
        </p>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <button
          onClick={onViewDetails}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
          {submission.reviewStatus === 'pending' ? 'Review' : 'View'}
        </button>
      </td>
    </tr>
  )
}

'use client'

import { useState, useMemo, useEffect } from 'react'
import { format } from 'date-fns'
import {
  X,
  FileText,
  ExternalLink,
  Check,
  XCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Package,
  RefreshCw,
  RotateCcw,
  Copy,
  Mail,
  Paperclip,
  Download,
  FileImage,
  FileSpreadsheet,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type {
  SupplierInvoiceSubmission,
  SubmissionLineItem,
  SubmissionAdditionalCost,
  SubmissionReviewStatus,
  SubmissionAttachment,
} from '@/lib/supabase/hooks'

interface SubmissionReviewPanelProps {
  submission: SupplierInvoiceSubmission | null
  isLoading?: boolean
  onClose: () => void
  onApproveLineItem: (lineItemId: string, approvedCost?: number) => Promise<boolean>
  onRejectLineItem: (lineItemId: string) => Promise<boolean>
  onApproveCost: (costId: string, approvedAmount?: number) => Promise<boolean>
  onRejectCost: (costId: string) => Promise<boolean>
  onCompleteReview: (status: SubmissionReviewStatus, notes: string) => Promise<boolean>
  onRejectForRevision?: (notes: string) => Promise<{ success: boolean; magicLinkUrl?: string; error?: string }>
  onViewPO: () => void
}

const STATUS_COLORS: Record<SubmissionReviewStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
  approved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
  rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
  partially_approved: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
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

function VarianceIndicator({ variance, percentage }: { variance: number; percentage?: number }) {
  if (variance === 0) {
    return <span className="text-slate-500">-</span>
  }
  const sign = variance > 0 ? '+' : ''
  const color = variance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
  return (
    <span className={`font-medium ${color}`}>
      {sign}{formatCurrency(variance)}
      {percentage !== undefined && ` (${sign}${percentage.toFixed(1)}%)`}
    </span>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return <FileImage className="w-5 h-5 text-blue-500" />
  }
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    return <FileSpreadsheet className="w-5 h-5 text-green-500" />
  }
  if (mimeType === 'application/pdf') {
    return <FileText className="w-5 h-5 text-red-500" />
  }
  return <FileText className="w-5 h-5 text-slate-500" />
}

interface LineItemReviewState {
  [id: string]: {
    action: 'approve' | 'reject' | null
    approvedCost?: number
  }
}

interface CostReviewState {
  [id: string]: {
    action: 'approve' | 'reject' | null
    approvedAmount?: number
  }
}

export function SubmissionReviewPanel({
  submission,
  isLoading = false,
  onClose,
  onApproveLineItem,
  onRejectLineItem,
  onApproveCost,
  onRejectCost,
  onCompleteReview,
  onRejectForRevision,
  onViewPO,
}: SubmissionReviewPanelProps) {
  const [lineItemStates, setLineItemStates] = useState<LineItemReviewState>({})
  const [costStates, setCostStates] = useState<CostReviewState>({})
  const [reviewNotes, setReviewNotes] = useState('')
  const [completing, setCompleting] = useState(false)
  const [showCosts, setShowCosts] = useState(true)
  const [savingItem, setSavingItem] = useState<string | null>(null)

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionNotes, setRejectionNotes] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [revisionLinkUrl, setRevisionLinkUrl] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  // Attachments state
  const [showAttachments, setShowAttachments] = useState(true)
  const [downloadingAttachment, setDownloadingAttachment] = useState<string | null>(null)

  // Reset state when submission changes
  useEffect(() => {
    if (submission) {
      const lineStates: LineItemReviewState = {}
      submission.lineItems?.forEach(item => {
        lineStates[item.id] = {
          action: item.isApproved === true ? 'approve' : item.isApproved === false ? 'reject' : null,
          approvedCost: item.approvedUnitCost || undefined,
        }
      })
      setLineItemStates(lineStates)

      const costStates: CostReviewState = {}
      submission.additionalCosts?.forEach(cost => {
        costStates[cost.id] = {
          action: cost.isApproved === true ? 'approve' : cost.isApproved === false ? 'reject' : null,
          approvedAmount: cost.approvedAmount || undefined,
        }
      })
      setCostStates(costStates)
      setReviewNotes(submission.reviewNotes || '')
    }
  }, [submission?.id])

  // Calculate totals
  const totals = useMemo(() => {
    if (!submission) return { approvedTotal: 0, rejectedTotal: 0, pendingTotal: 0 }

    let approvedTotal = 0
    let rejectedTotal = 0
    let pendingTotal = 0

    submission.lineItems?.forEach(item => {
      const state = lineItemStates[item.id]
      if (state?.action === 'approve') {
        approvedTotal += (state.approvedCost || item.submittedUnitCost) * item.quantity
      } else if (state?.action === 'reject') {
        rejectedTotal += item.submittedLineTotal
      } else {
        pendingTotal += item.submittedLineTotal
      }
    })

    submission.additionalCosts?.forEach(cost => {
      const state = costStates[cost.id]
      if (state?.action === 'approve') {
        approvedTotal += state.approvedAmount || cost.amount
      } else if (state?.action === 'reject') {
        rejectedTotal += cost.amount
      } else {
        pendingTotal += cost.amount
      }
    })

    return { approvedTotal, rejectedTotal, pendingTotal }
  }, [submission, lineItemStates, costStates])

  if (!submission) return null

  const isPending = submission.reviewStatus === 'pending'
  const lineItems = submission.lineItems || []
  const additionalCosts = submission.additionalCosts || []

  const handleLineItemAction = async (itemId: string, action: 'approve' | 'reject') => {
    setSavingItem(itemId)
    const state = lineItemStates[itemId]
    let success = false

    if (action === 'approve') {
      success = await onApproveLineItem(itemId, state?.approvedCost)
    } else {
      success = await onRejectLineItem(itemId)
    }

    if (success) {
      setLineItemStates(prev => ({
        ...prev,
        [itemId]: { ...prev[itemId], action },
      }))
    }
    setSavingItem(null)
  }

  const handleCostAction = async (costId: string, action: 'approve' | 'reject') => {
    setSavingItem(costId)
    const state = costStates[costId]
    let success = false

    if (action === 'approve') {
      success = await onApproveCost(costId, state?.approvedAmount)
    } else {
      success = await onRejectCost(costId)
    }

    if (success) {
      setCostStates(prev => ({
        ...prev,
        [costId]: { ...prev[costId], action },
      }))
    }
    setSavingItem(null)
  }

  const handleCompleteReview = async (status: SubmissionReviewStatus) => {
    setCompleting(true)
    try {
      const success = await onCompleteReview(status, reviewNotes)
      if (success) {
        onClose()
      }
    } finally {
      setCompleting(false)
    }
  }

  const handleRejectForRevision = async () => {
    if (!onRejectForRevision || !rejectionNotes.trim()) return

    setRejecting(true)
    try {
      const result = await onRejectForRevision(rejectionNotes)
      if (result.success && result.magicLinkUrl) {
        setRevisionLinkUrl(result.magicLinkUrl)
      } else {
        console.error('Failed to reject for revision:', result.error)
      }
    } finally {
      setRejecting(false)
    }
  }

  const handleCopyLink = async () => {
    if (revisionLinkUrl) {
      await navigator.clipboard.writeText(revisionLinkUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const handleEmailLink = () => {
    if (revisionLinkUrl && submission) {
      const subject = encodeURIComponent(`Revision Requested: ${submission.poNumber}`)
      const body = encodeURIComponent(
        `Hello ${submission.submittedByName},\n\n` +
        `We have reviewed your invoice submission for ${submission.poNumber} and require some revisions.\n\n` +
        `Reason: ${rejectionNotes}\n\n` +
        `Please submit a revised invoice using this link:\n${revisionLinkUrl}\n\n` +
        `Thank you.`
      )
      window.open(`mailto:${submission.submittedByEmail}?subject=${subject}&body=${body}`)
    }
  }

  const handleDownloadAttachment = async (attachment: SubmissionAttachment) => {
    setDownloadingAttachment(attachment.id)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from('supplier-invoice-attachments')
        .createSignedUrl(attachment.filePath, 60) // 60 second expiry

      if (error) {
        console.error('Error creating signed URL:', error)
        return
      }

      // Open in new tab or trigger download
      window.open(data.signedUrl, '_blank')
    } catch (err) {
      console.error('Failed to download attachment:', err)
    } finally {
      setDownloadingAttachment(null)
    }
  }

  const attachments = submission?.attachments || []

  const allItemsReviewed = lineItems.every(item => lineItemStates[item.id]?.action) &&
    additionalCosts.every(cost => costStates[cost.id]?.action)

  const anyApproved = lineItems.some(item => lineItemStates[item.id]?.action === 'approve') ||
    additionalCosts.some(cost => costStates[cost.id]?.action === 'approve')

  const allApproved = lineItems.every(item => lineItemStates[item.id]?.action === 'approve') &&
    additionalCosts.every(cost => costStates[cost.id]?.action === 'approve')

  const allRejected = lineItems.every(item => lineItemStates[item.id]?.action === 'reject') &&
    additionalCosts.every(cost => costStates[cost.id]?.action === 'reject')

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-slate-800 shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {isPending ? 'Review Submission' : 'Submission Details'}
                </h2>
                <button
                  onClick={onViewPO}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  {submission.poNumber}
                  <ExternalLink className="w-3 h-3" />
                </button>
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

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="px-6 py-6 space-y-6">
            {/* Status & Summary */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_COLORS[submission.reviewStatus].bg} ${STATUS_COLORS[submission.reviewStatus].text}`}>
                  {STATUS_LABELS[submission.reviewStatus]}
                </span>
                {submission.revisionNumber > 1 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                    <RotateCcw className="w-3 h-3" />
                    Revision {submission.revisionNumber}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Submitted {format(new Date(submission.submittedAt), 'MMM d, yyyy h:mm a')}
              </p>
            </div>

            {/* Supplier Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Supplier</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{submission.supplierName}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Submitted By</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{submission.submittedByName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{submission.submittedByEmail}</p>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Expected Total</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(submission.expectedTotal)}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Submitted Total</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(submission.submittedTotal)}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Variance</p>
                <VarianceIndicator
                  variance={submission.varianceAmount}
                  percentage={submission.variancePercentage}
                />
              </div>
            </div>

            {/* Supplier Notes */}
            {submission.supplierNotes && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">Supplier Notes</p>
                <p className="text-sm text-amber-700 dark:text-amber-400">{submission.supplierNotes}</p>
              </div>
            )}

            {/* Attachments */}
            {attachments.length > 0 && (
              <div>
                <button
                  onClick={() => setShowAttachments(!showAttachments)}
                  className="w-full flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white mb-3"
                >
                  <span className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Attachments ({attachments.length})
                  </span>
                  {showAttachments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showAttachments && (
                  <div className="space-y-2">
                    {attachments.map(attachment => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {getFileIcon(attachment.mimeType)}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {attachment.fileName}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {formatFileSize(attachment.fileSize)} • {format(new Date(attachment.uploadedAt), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadAttachment(attachment)}
                          disabled={downloadingAttachment === attachment.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-700 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {downloadingAttachment === attachment.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          {downloadingAttachment === attachment.id ? 'Opening...' : 'View'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Line Items */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Line Items ({lineItems.length})
              </h3>
              <div className="space-y-3">
                {lineItems.map(item => {
                  const state = lineItemStates[item.id]
                  const variance = item.submittedUnitCost - item.expectedUnitCost
                  const variancePercent = item.expectedUnitCost > 0
                    ? (variance / item.expectedUnitCost) * 100
                    : 0

                  return (
                    <div
                      key={item.id}
                      className={`p-4 border rounded-lg ${
                        state?.action === 'approve'
                          ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                          : state?.action === 'reject'
                          ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{item.productName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">SKU: {item.sku} | Qty: {item.quantity}</p>
                        </div>
                        {state?.action && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                            state.action === 'approve'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                          }`}>
                            {state.action === 'approve' ? 'Approved' : 'Rejected'}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-sm mb-3">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Expected</p>
                          <p className="font-medium">{formatCurrency(item.expectedUnitCost)}/unit</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Submitted</p>
                          <p className="font-medium">{formatCurrency(item.submittedUnitCost)}/unit</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Variance</p>
                          <VarianceIndicator variance={variance} percentage={variancePercent} />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Line Total</p>
                          <p className="font-medium">{formatCurrency(item.submittedLineTotal)}</p>
                        </div>
                      </div>

                      {isPending && (
                        <div className="flex items-center gap-2">
                          {state?.action !== 'approve' && (
                            <button
                              onClick={() => handleLineItemAction(item.id, 'approve')}
                              disabled={savingItem === item.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {savingItem === item.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                              Approve
                            </button>
                          )}
                          {state?.action !== 'reject' && (
                            <button
                              onClick={() => handleLineItemAction(item.id, 'reject')}
                              disabled={savingItem === item.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Additional Costs */}
            {additionalCosts.length > 0 && (
              <div>
                <button
                  onClick={() => setShowCosts(!showCosts)}
                  className="w-full flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white mb-3"
                >
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Additional Costs ({additionalCosts.length})
                  </span>
                  {showCosts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showCosts && (
                  <div className="space-y-3">
                    {additionalCosts.map(cost => {
                      const state = costStates[cost.id]
                      return (
                        <div
                          key={cost.id}
                          className={`p-4 border rounded-lg ${
                            state?.action === 'approve'
                              ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                              : state?.action === 'reject'
                              ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white capitalize">{cost.costType}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{cost.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {formatCurrency(cost.amount)}
                              </p>
                              {state?.action && (
                                <span className={`text-xs font-medium ${
                                  state.action === 'approve' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {state.action === 'approve' ? 'Approved' : 'Rejected'}
                                </span>
                              )}
                            </div>
                          </div>

                          {isPending && (
                            <div className="flex items-center gap-2">
                              {state?.action !== 'approve' && (
                                <button
                                  onClick={() => handleCostAction(cost.id, 'approve')}
                                  disabled={savingItem === cost.id}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {savingItem === cost.id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Check className="w-4 h-4" />
                                  )}
                                  Approve
                                </button>
                              )}
                              {state?.action !== 'reject' && (
                                <button
                                  onClick={() => handleCostAction(cost.id, 'reject')}
                                  disabled={savingItem === cost.id}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Reject
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Review Summary */}
            {isPending && allItemsReviewed && (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-2">Review Summary</p>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400">Approved Total</p>
                    <p className="font-medium text-green-700 dark:text-green-400">
                      {formatCurrency(totals.approvedTotal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400">Rejected Total</p>
                    <p className="font-medium text-red-700 dark:text-red-400">
                      {formatCurrency(totals.rejectedTotal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400">Pending</p>
                    <p className="font-medium text-amber-700 dark:text-amber-400">
                      {formatCurrency(totals.pendingTotal)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Review Notes */}
            {isPending && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Review Notes (Optional)
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  placeholder="Add notes about this review..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Complete Review Actions */}
            {isPending && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Complete Review</h3>
                <div className="flex flex-wrap gap-2">
                  {allApproved && (
                    <button
                      onClick={() => handleCompleteReview('approved')}
                      disabled={completing || !allItemsReviewed}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {completing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Approve All
                    </button>
                  )}
                  {allRejected && (
                    <button
                      onClick={() => handleCompleteReview('rejected')}
                      disabled={completing || !allItemsReviewed}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {completing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Reject All
                    </button>
                  )}
                  {!allApproved && !allRejected && anyApproved && (
                    <button
                      onClick={() => handleCompleteReview('partially_approved')}
                      disabled={completing || !allItemsReviewed}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {completing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                      Partially Approve
                    </button>
                  )}
                  {onRejectForRevision && (
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={completing}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Request Revision
                    </button>
                  )}
                  {!allItemsReviewed && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Review all items before completing
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Review Info (for completed reviews) */}
            {!isPending && submission.reviewedAt && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Review Details</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-slate-500 dark:text-slate-400">Reviewed by:</span>{' '}
                    <span className="text-slate-900 dark:text-white">{submission.reviewedByUserName}</span>
                  </p>
                  <p>
                    <span className="text-slate-500 dark:text-slate-400">Reviewed at:</span>{' '}
                    <span className="text-slate-900 dark:text-white">
                      {format(new Date(submission.reviewedAt), 'MMM d, yyyy h:mm a')}
                    </span>
                  </p>
                  {submission.reviewNotes && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg mt-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Notes</p>
                      <p className="text-slate-900 dark:text-white">{submission.reviewNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reject for Revision Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => !rejecting && setShowRejectModal(false)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
            {!revisionLinkUrl ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                    <RotateCcw className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Request Revision</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Explain what needs to be corrected
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Revision Notes <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    rows={4}
                    placeholder="Please explain what needs to be corrected in the submission..."
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    This message will be shown to the supplier when they open the revision link.
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowRejectModal(false)}
                    disabled={rejecting}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectForRevision}
                    disabled={rejecting || !rejectionNotes.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {rejecting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                    Create Revision Link
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Revision Link Created</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Share this link with the supplier
                    </p>
                  </div>
                </div>

                <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Magic Link URL</p>
                  <p className="text-sm font-mono text-slate-900 dark:text-white break-all">
                    {revisionLinkUrl}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    {copiedLink ? 'Copied!' : 'Copy Link'}
                  </button>
                  <button
                    onClick={handleEmailLink}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Email to Supplier
                  </button>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowRejectModal(false)
                      setRevisionLinkUrl(null)
                      setRejectionNotes('')
                      onClose()
                    }}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

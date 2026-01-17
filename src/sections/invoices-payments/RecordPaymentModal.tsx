'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { X, CreditCard, Paperclip, FileText, Trash2, Check } from 'lucide-react'
import type { PaymentMethod, PaymentMethodOption, NewPayment, Invoice, PaymentScheduleItem } from './types'

interface RecordPaymentModalProps {
  isOpen: boolean
  invoice: Invoice
  paymentMethods: PaymentMethodOption[]
  onClose: () => void
  onSubmit: (payment: NewPayment) => Promise<void>
  loading?: boolean
}

/** Get remaining balance for a milestone (amount - paidAmount) */
function getMilestoneRemaining(milestone: PaymentScheduleItem): number {
  return Math.max(0, milestone.amount - milestone.paidAmount)
}

export function RecordPaymentModal({
  isOpen,
  invoice,
  paymentMethods,
  onClose,
  onSubmit,
  loading = false,
}: RecordPaymentModalProps) {
  const today = new Date().toISOString().split('T')[0]
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get milestones with remaining balance
  const unpaidMilestones = useMemo(() => {
    return invoice.paymentSchedule.filter(m => getMilestoneRemaining(m) > 0)
  }, [invoice.paymentSchedule])

  const [selectedMilestoneIds, setSelectedMilestoneIds] = useState<string[]>([])
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(today)
  const [method, setMethod] = useState<PaymentMethod>('wire-transfer')
  const [notes, setNotes] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [errors, setErrors] = useState<{ amount?: string; milestones?: string }>({})
  const [submitting, setSubmitting] = useState(false)

  // Calculate selected total
  const selectedTotal = useMemo(() => {
    return unpaidMilestones
      .filter(m => selectedMilestoneIds.includes(m.id))
      .reduce((sum, m) => sum + getMilestoneRemaining(m), 0)
  }, [unpaidMilestones, selectedMilestoneIds])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // If there are unpaid milestones, default to selecting all
      if (unpaidMilestones.length > 0) {
        setSelectedMilestoneIds(unpaidMilestones.map(m => m.id))
      } else {
        setSelectedMilestoneIds([])
      }
      setAmount('')
      setDate(new Date().toISOString().split('T')[0])
      setMethod('wire-transfer')
      setNotes('')
      setAttachments([])
      setErrors({})
    }
  }, [isOpen, unpaidMilestones])

  // Update amount when milestone selection changes
  useEffect(() => {
    if (selectedMilestoneIds.length > 0) {
      setAmount(selectedTotal.toFixed(2))
    } else if (unpaidMilestones.length === 0) {
      // No milestones, use invoice balance
      setAmount(invoice.balance.toFixed(2))
    }
  }, [selectedMilestoneIds, selectedTotal, unpaidMilestones.length, invoice.balance])

  if (!isOpen) return null

  const handleToggleMilestone = (id: string) => {
    setSelectedMilestoneIds(prev =>
      prev.includes(id)
        ? prev.filter(mId => mId !== id)
        : [...prev, id]
    )
    setErrors({ ...errors, milestones: undefined })
  }

  const handleSelectAll = () => {
    if (selectedMilestoneIds.length === unpaidMilestones.length) {
      setSelectedMilestoneIds([])
    } else {
      setSelectedMilestoneIds(unpaidMilestones.map(m => m.id))
    }
    setErrors({ ...errors, milestones: undefined })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: { amount?: string; milestones?: string } = {}
    const amountNum = parseFloat(amount)

    if (isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Please enter a valid amount'
    } else if (amountNum > invoice.balance) {
      newErrors.amount = `Amount cannot exceed balance ($${invoice.balance.toLocaleString()})`
    }


    if (unpaidMilestones.length > 0 && selectedMilestoneIds.length === 0) {
      newErrors.milestones = 'Please select at least one milestone to pay'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        amount: amountNum,
        date,
        method,
        notes: notes.trim() || undefined,
        scheduleItemIds: selectedMilestoneIds.length > 0 ? selectedMilestoneIds : undefined,
        attachments,
      })

      // Reset form
      setSelectedMilestoneIds([])
      setAmount('')
      setDate(today)
      setMethod('wire-transfer')
      setNotes('')
      setAttachments([])
      setErrors({})
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (submitting || loading) return
    setSelectedMilestoneIds([])
    setAmount('')
    setDate(today)
    setMethod('wire-transfer')
    setNotes('')
    setAttachments([])
    setErrors({})
    onClose()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setAttachments(prev => [...prev, ...Array.from(files)])

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const isSubmitting = submitting || loading
  const allSelected = unpaidMilestones.length > 0 && selectedMilestoneIds.length === unpaidMilestones.length

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg transform rounded-xl bg-white dark:bg-slate-800 shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Record Payment
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                  {invoice.description}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-500 dark:hover:text-slate-300 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Balance Display */}
          <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-800/50">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
              Outstanding Balance
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              ${formatCurrency(invoice.balance)}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Milestone Selection */}
            {unpaidMilestones.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Select Milestones to Pay
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                  >
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-600 rounded-lg p-2">
                  {unpaidMilestones.map((milestone) => {
                    const remaining = getMilestoneRemaining(milestone)
                    const isSelected = selectedMilestoneIds.includes(milestone.id)
                    return (
                      <label
                        key={milestone.id}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700'
                            : 'bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-slate-300 dark:border-slate-500'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleMilestone(milestone.id)}
                            className="sr-only"
                          />
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {milestone.milestoneName}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {milestone.percentage}% of invoice
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            ${formatCurrency(remaining)}
                          </p>
                          {milestone.paidAmount > 0 && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">
                              ${formatCurrency(milestone.paidAmount)} paid
                            </p>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
                {errors.milestones && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.milestones}</p>
                )}
                {selectedMilestoneIds.length > 0 && (
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">
                      {selectedMilestoneIds.length} milestone{selectedMilestoneIds.length > 1 ? 's' : ''} selected
                    </span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      Total: ${formatCurrency(selectedTotal)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Amount
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  id="amount"
                  step="0.01"
                  min="0.01"
                  max={invoice.balance}
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value)
                    setErrors({ ...errors, amount: undefined })
                  }}
                  disabled={isSubmitting}
                  className={`w-full rounded-lg border pl-7 pr-4 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 ${
                    errors.amount
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-slate-200 dark:border-slate-600'
                  }`}
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.amount}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Date
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
            </div>

            {/* Method */}
            <div>
              <label htmlFor="method" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                id="method"
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {paymentMethods.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isSubmitting}
                rows={2}
                placeholder="Any additional notes..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 resize-none"
              />
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Attachments
              </label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 px-4 py-3 text-sm text-slate-500 dark:text-slate-400 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Paperclip className="w-4 h-4" />
                <span>Attach files (receipts, confirmations)</span>
              </button>

              {/* Attached Files List */}
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-2 bg-slate-50 dark:bg-slate-700/50"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="text-slate-400 dark:text-slate-500">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        disabled={isSubmitting}
                        className="ml-2 p-1 rounded text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                        title="Remove attachment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting && (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                Record Payment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Plus,
  Trash2,
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { useShippingAgents } from '@/lib/supabase/hooks/useShippingAgents'
import { useShippingQuotes } from '@/lib/supabase/hooks/useShippingQuotes'
import { createClient } from '@/lib/supabase/client'
import type { ShippingAgent } from '@/sections/transfers/types'
import type { ShippingQuote } from '@/sections/shipping-quotes/types'

interface LineItem {
  id: string
  description: string
  amount: string
}

interface ManualQuoteEntryFormProps {
  isOpen: boolean
  transferId: string
  transferIds?: string[] // For grouped quotes
  onClose: () => void
  onSuccess?: (quote: ShippingQuote) => void
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CNY', 'AUD', 'CAD']

export function ManualQuoteEntryForm({
  isOpen,
  transferId,
  transferIds,
  onClose,
  onSuccess,
}: ManualQuoteEntryFormProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [totalAmount, setTotalAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfPath, setPdfPath] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { shippingAgents, loading: agentsLoading } = useShippingAgents()
  const { createManualQuote } = useShippingQuotes()
  const supabase = createClient()

  const activeAgents = shippingAgents.filter((a) => a.isActive)

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedAgentId('')
      setTotalAmount('')
      setCurrency('USD')
      setValidUntil('')
      setNotes('')
      setLineItems([])
      setPdfFile(null)
      setPdfPath(null)
      setUploading(false)
      setSubmitting(false)
      setError(null)
      setSuccess(false)
    }
  }, [isOpen])

  // Calculate sum of line items
  const lineItemsSum = lineItems.reduce((sum, item) => {
    const amount = parseFloat(item.amount) || 0
    return sum + amount
  }, 0)

  const totalAmountNum = parseFloat(totalAmount) || 0
  const hasMismatch = lineItems.length > 0 && Math.abs(lineItemsSum - totalAmountNum) > 0.01

  // Add line item
  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: crypto.randomUUID(), description: '', amount: '' },
    ])
  }

  // Remove line item
  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id))
  }

  // Update line item
  const updateLineItem = (id: string, field: 'description' | 'amount', value: string) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  // Set total from line items sum
  const setTotalFromLineItems = () => {
    if (lineItems.length > 0) {
      setTotalAmount(lineItemsSum.toFixed(2))
    }
  }

  // Handle PDF upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are accepted')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setPdfFile(file)
    setUploading(true)
    setError(null)

    try {
      const allTransferIds = transferIds?.length ? transferIds : [transferId]
      const fileName = `quotes/manual/${allTransferIds[0]}/${Date.now()}-${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('shipping-documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      setPdfPath(fileName)
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload file. Please try again.')
      setPdfFile(null)
    } finally {
      setUploading(false)
    }
  }

  // Remove uploaded PDF
  const handleRemovePdf = async () => {
    if (pdfPath) {
      try {
        await supabase.storage.from('shipping-documents').remove([pdfPath])
      } catch (err) {
        console.error('Error removing file:', err)
      }
    }
    setPdfFile(null)
    setPdfPath(null)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!selectedAgentId) {
      setError('Please select a shipping agent')
      return
    }
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      setError('Please enter a valid total amount')
      return
    }

    // Check line items have descriptions
    const invalidLineItems = lineItems.filter(
      (item) => item.description.trim() === '' || !item.amount
    )
    if (invalidLineItems.length > 0) {
      setError('Please complete all line item details or remove empty rows')
      return
    }

    setSubmitting(true)

    try {
      const allTransferIds = transferIds?.length ? transferIds : [transferId]

      const quote = await createManualQuote({
        shippingAgentId: selectedAgentId,
        transferIds: allTransferIds,
        totalAmount: parseFloat(totalAmount),
        currency,
        validUntil: validUntil || undefined,
        notes: notes || undefined,
        lineItems: lineItems.length > 0
          ? lineItems.map((li) => ({
              description: li.description.trim(),
              amount: parseFloat(li.amount),
            }))
          : undefined,
      })

      // Update with PDF path if uploaded
      if (pdfPath && quote) {
        await supabase
          .from('shipping_quotes')
          .update({ pdf_path: pdfPath })
          .eq('id', quote.id)
      }

      setSuccess(true)
      setTimeout(() => {
        if (quote) onSuccess?.(quote)
        onClose()
      }, 1500)
    } catch (err) {
      console.error('Error creating quote:', err)
      setError('Failed to create quote. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="absolute inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white dark:bg-stone-800 rounded-xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-stone-700">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-white">
            Add Quote Manually
          </h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-400 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Success state */}
          {success ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
              <p className="text-lg font-medium text-stone-900 dark:text-white">
                Quote added successfully!
              </p>
            </div>
          ) : (
            <>
              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Shipping Agent */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Shipping Agent <span className="text-red-500">*</span>
                </label>
                {agentsLoading ? (
                  <div className="flex items-center gap-2 p-3 bg-stone-50 dark:bg-stone-700/50 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-stone-500">Loading agents...</span>
                  </div>
                ) : (
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select an agent...</option>
                    {activeAgents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} ({agent.contactName})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Total Amount & Currency */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Total Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Valid Until */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Valid Until
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                />
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                    Cost Breakdown (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="text-sm text-lime-600 hover:text-lime-700 dark:text-lime-400 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>

                {lineItems.length > 0 ? (
                  <div className="space-y-2">
                    {lineItems.map((item) => (
                      <div key={item.id} className="flex gap-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            updateLineItem(item.id, 'description', e.target.value)
                          }
                          placeholder="Description"
                          className="flex-1 px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-white text-sm"
                        />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.amount}
                          onChange={(e) =>
                            updateLineItem(item.id, 'amount', e.target.value)
                          }
                          placeholder="Amount"
                          className="w-24 px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-white text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeLineItem(item.id)}
                          className="p-2 text-stone-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {/* Line items sum */}
                    <div className="flex justify-between items-center pt-2 border-t border-stone-200 dark:border-stone-700">
                      <span className="text-sm text-stone-600 dark:text-stone-400">
                        Line Items Total:
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${
                            hasMismatch
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-stone-900 dark:text-white'
                          }`}
                        >
                          {currency}{' '}
                          {lineItemsSum.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        {hasMismatch && (
                          <button
                            type="button"
                            onClick={setTotalFromLineItems}
                            className="text-xs text-lime-600 hover:underline"
                          >
                            Use as total
                          </button>
                        )}
                      </div>
                    </div>
                    {hasMismatch && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Line items total doesn&apos;t match the total amount
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    Add a breakdown of costs if included in the quote
                  </p>
                )}
              </div>

              {/* PDF Upload */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Quote Document (Optional)
                </label>
                {pdfFile ? (
                  <div className="flex items-center justify-between p-3 border border-stone-200 dark:border-stone-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="font-medium text-stone-900 dark:text-white text-sm">
                          {pdfFile.name}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          {formatFileSize(pdfFile.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {uploading ? (
                        <Loader2 className="w-5 h-5 text-lime-500 animate-spin" />
                      ) : pdfPath ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : null}
                      <button
                        type="button"
                        onClick={handleRemovePdf}
                        disabled={uploading}
                        className="p-1.5 text-stone-400 hover:text-red-600 dark:hover:text-red-400 rounded disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-lg cursor-pointer hover:border-stone-400 dark:hover:border-stone-500 transition-colors">
                    <Upload className="w-8 h-8 text-stone-400 mb-2" />
                    <p className="text-sm text-stone-600 dark:text-stone-400">
                      <span className="text-lime-600 dark:text-lime-400 font-medium">
                        Click to upload
                      </span>{' '}
                      or drag and drop
                    </p>
                    <p className="text-xs text-stone-500 mt-1">PDF only, max 10MB</p>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Any additional information..."
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                />
              </div>
            </>
          )}
        </form>

        {/* Footer */}
        {!success && (
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-stone-200 dark:border-stone-700">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={submitting || uploading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-lime-600 hover:bg-lime-700 disabled:bg-stone-300 dark:disabled:bg-stone-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Adding...' : 'Add Quote'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

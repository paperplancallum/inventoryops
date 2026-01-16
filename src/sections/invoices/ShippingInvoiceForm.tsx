'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  X,
  Plus,
  Trash2,
  FileText,
  Upload,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react'
import type { ShippingQuote } from '@/sections/shipping-quotes/types'
import type { CreateShippingInvoiceInput, ShippingInvoiceStatus } from '@/sections/shipping-quotes/invoice-types'

interface ShippingInvoiceFormProps {
  isOpen: boolean
  selectedQuotes: ShippingQuote[] // List of winning (selected) quotes to choose from
  onClose: () => void
  onSubmit: (input: CreateShippingInvoiceInput) => Promise<boolean>
  onUploadPdf?: (file: File) => Promise<string | null>
}

interface LineItemInput {
  id: string
  description: string
  amount: string
}

export function ShippingInvoiceForm({
  isOpen,
  selectedQuotes,
  onClose,
  onSubmit,
  onUploadPdf,
}: ShippingInvoiceFormProps) {
  // Form state
  const [selectedQuoteId, setSelectedQuoteId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [totalAmount, setTotalAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [lineItems, setLineItems] = useState<LineItemInput[]>([])
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfPath, setPdfPath] = useState<string | null>(null)

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingPdf, setIsUploadingPdf] = useState(false)

  // Get the selected quote
  const selectedQuote = useMemo(() => {
    return selectedQuotes.find(q => q.id === selectedQuoteId) || null
  }, [selectedQuotes, selectedQuoteId])

  // Calculate variance
  const variance = useMemo(() => {
    const actual = parseFloat(totalAmount) || 0
    const quoted = selectedQuote?.totalAmount || 0
    const varianceAmount = actual - quoted
    const variancePercent = quoted > 0 ? (varianceAmount / quoted) * 100 : 0

    return {
      amount: varianceAmount,
      percent: Math.round(variancePercent * 100) / 100,
      isOver: varianceAmount > 0,
    }
  }, [totalAmount, selectedQuote])

  // Calculate line items total
  const lineItemsTotal = useMemo(() => {
    return lineItems.reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0
      return sum + amount
    }, 0)
  }, [lineItems])

  // Auto-set currency when quote is selected
  useEffect(() => {
    if (selectedQuote) {
      setCurrency(selectedQuote.currency)
    }
  }, [selectedQuote])

  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      setSelectedQuoteId('')
      setInvoiceNumber('')
      setInvoiceDate(new Date().toISOString().split('T')[0])
      setDueDate('')
      setCurrency('USD')
      setTotalAmount('')
      setNotes('')
      setLineItems([])
      setPdfFile(null)
      setPdfPath(null)
    }
  }, [isOpen])

  const handleAddLineItem = () => {
    setLineItems(prev => [
      ...prev,
      { id: crypto.randomUUID(), description: '', amount: '' },
    ])
  }

  const handleRemoveLineItem = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id))
  }

  const handleLineItemChange = (id: string, field: 'description' | 'amount', value: string) => {
    setLineItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPdfFile(file)

    if (onUploadPdf) {
      setIsUploadingPdf(true)
      const path = await onUploadPdf(file)
      setPdfPath(path)
      setIsUploadingPdf(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedQuoteId || !invoiceNumber || !invoiceDate || !totalAmount) {
      return
    }

    setIsSubmitting(true)

    const input: CreateShippingInvoiceInput = {
      shippingQuoteId: selectedQuoteId,
      invoiceNumber,
      invoiceDate,
      dueDate: dueDate || undefined,
      currency,
      totalAmount: parseFloat(totalAmount),
      notes: notes || undefined,
      pdfPath: pdfPath || undefined,
      lineItems: lineItems.length > 0 ? lineItems.map(li => ({
        description: li.description,
        amount: parseFloat(li.amount) || 0,
      })).filter(li => li.description && li.amount) : undefined,
    }

    const success = await onSubmit(input)
    setIsSubmitting(false)

    if (success) {
      onClose()
    }
  }

  const formatCurrency = (amount: number | null, curr: string = currency) => {
    if (amount === null) return '-'
    return `${curr} ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-2xl max-h-[90vh] mx-4 bg-white dark:bg-stone-800 rounded-xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-white">
            New Shipping Invoice
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quote Selection */}
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Select Winning Quote *
            </label>
            <select
              value={selectedQuoteId}
              onChange={(e) => setSelectedQuoteId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            >
              <option value="">Select a quote...</option>
              {selectedQuotes.map(quote => (
                <option key={quote.id} value={quote.id}>
                  {quote.shippingAgentName} - {formatCurrency(quote.totalAmount, quote.currency)}
                  {quote.transfers.length > 0 && ` (${quote.transfers.map(t => t.transfer?.transferNumber).join(', ')})`}
                </option>
              ))}
            </select>
            {selectedQuotes.length === 0 && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                No winning quotes available. Select a quote first from a transfer.
              </p>
            )}
          </div>

          {/* Quote Reference (read-only) */}
          {selectedQuote && (
            <div className="p-4 bg-stone-50 dark:bg-stone-700/50 rounded-lg">
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase mb-2">
                Quote Reference
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Agent</p>
                  <p className="font-medium text-stone-900 dark:text-white">
                    {selectedQuote.shippingAgentName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Quoted Amount</p>
                  <p className="font-medium text-stone-900 dark:text-white">
                    {formatCurrency(selectedQuote.totalAmount, selectedQuote.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Transfer(s)</p>
                  <p className="font-medium text-stone-900 dark:text-white">
                    {selectedQuote.transfers.map(t => t.transfer?.transferNumber).join(', ') || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Quote Valid Until</p>
                  <p className="font-medium text-stone-900 dark:text-white">
                    {selectedQuote.validUntil
                      ? new Date(selectedQuote.validUntil).toLocaleDateString()
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                Invoice Number *
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
                placeholder="INV-001"
                className="w-full px-3 py-2 bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CNY">CNY</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                Invoice Date *
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Total Amount with Variance */}
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Total Amount *
            </label>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                    {currency}
                  </span>
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    required
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full pl-14 pr-4 py-2 bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Variance Display */}
              {selectedQuote && totalAmount && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  variance.isOver
                    ? 'bg-red-50 dark:bg-red-900/20'
                    : 'bg-green-50 dark:bg-green-900/20'
                }`}>
                  {variance.isOver ? (
                    <TrendingUp className="w-4 h-4 text-red-600 dark:text-red-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-green-600 dark:text-green-400" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${
                      variance.isOver
                        ? 'text-red-700 dark:text-red-300'
                        : 'text-green-700 dark:text-green-300'
                    }`}>
                      {variance.isOver ? '+' : ''}{formatCurrency(variance.amount)}
                    </p>
                    <p className={`text-xs ${
                      variance.isOver
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {variance.isOver ? '+' : ''}{variance.percent}% vs quote
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Warning if significantly over */}
            {variance.isOver && variance.percent > 10 && (
              <div className="mt-2 flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Invoice amount is significantly higher than the quoted amount ({variance.percent}% over).
                </p>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                Line Items (Optional)
              </label>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="inline-flex items-center gap-1 text-xs text-lime-600 dark:text-lime-400 hover:underline"
              >
                <Plus className="w-3 h-3" />
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
                      onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value)}
                      placeholder="Description"
                      className="flex-1 px-3 py-2 bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                    />
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">
                        {currency}
                      </span>
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => handleLineItemChange(item.id, 'amount', e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        className="w-full pl-12 pr-3 py-2 bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(item.id)}
                      className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Line items total */}
                <div className="flex justify-end pt-2 border-t border-stone-200 dark:border-stone-600">
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    Line items total: <span className="font-medium text-stone-900 dark:text-white">{formatCurrency(lineItemsTotal)}</span>
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-stone-500 dark:text-stone-400 italic">
                No line items added
              </p>
            )}
          </div>

          {/* PDF Upload */}
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Invoice PDF
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-1 relative cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfChange}
                  className="sr-only"
                />
                <div className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-lg hover:border-lime-500 dark:hover:border-lime-500 transition-colors">
                  {isUploadingPdf ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-lime-500 border-t-transparent" />
                      <span className="text-sm text-stone-600 dark:text-stone-400">Uploading...</span>
                    </>
                  ) : pdfFile ? (
                    <>
                      <FileText className="w-5 h-5 text-lime-600 dark:text-lime-400" />
                      <span className="text-sm text-stone-900 dark:text-white">{pdfFile.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-stone-400" />
                      <span className="text-sm text-stone-600 dark:text-stone-400">Click to upload PDF</span>
                    </>
                  )}
                </div>
              </label>
              {pdfFile && (
                <button
                  type="button"
                  onClick={() => {
                    setPdfFile(null)
                    setPdfPath(null)
                  }}
                  className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
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
              placeholder="Any additional notes..."
              className="w-full px-3 py-2 bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200 dark:border-stone-700 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedQuoteId || !invoiceNumber || !totalAmount}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-lime-600 hover:bg-lime-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Creating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Create Invoice
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

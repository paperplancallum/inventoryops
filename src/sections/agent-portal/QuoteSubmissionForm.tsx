'use client'

import { useState } from 'react'
import { Plus, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { QuotePdfUpload } from './QuotePdfUpload'

interface LineItem {
  id: string
  description: string
  amount: string
}

interface QuoteSubmissionFormProps {
  token: string
  quoteId: string
  onSuccess: () => void
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CNY', 'AUD', 'CAD']

export function QuoteSubmissionForm({ token, quoteId, onSuccess }: QuoteSubmissionFormProps) {
  const [totalAmount, setTotalAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [pdfPath, setPdfPath] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Calculate sum of line items
  const lineItemsSum = lineItems.reduce((sum, item) => {
    const amount = parseFloat(item.amount) || 0
    return sum + amount
  }, 0)

  const totalAmountNum = parseFloat(totalAmount) || 0
  const hasMismatch = lineItems.length > 0 && Math.abs(lineItemsSum - totalAmountNum) > 0.01

  // Add new line item
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
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
      // Update quote with submitted data
      const { error: updateError } = await supabase
        .from('shipping_quotes')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          total_amount: parseFloat(totalAmount),
          currency,
          valid_until: validUntil || null,
          notes: notes || null,
          pdf_path: pdfPath,
        })
        .eq('id', quoteId)
        .eq('magic_link_token', token)
        .eq('status', 'pending')

      if (updateError) throw updateError

      // Add line items if provided
      if (lineItems.length > 0) {
        const lineItemsToInsert = lineItems.map((item, index) => ({
          shipping_quote_id: quoteId,
          description: item.description.trim(),
          amount: parseFloat(item.amount),
          sort_order: index,
        }))

        const { error: lineItemsError } = await supabase
          .from('shipping_quote_line_items')
          .insert(lineItemsToInsert)

        if (lineItemsError) throw lineItemsError
      }

      onSuccess()
    } catch (err) {
      console.error('Error submitting quote:', err)
      setError('Failed to submit quote. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Set total from line items sum
  const setTotalFromLineItems = () => {
    if (lineItems.length > 0) {
      setTotalAmount(lineItemsSum.toFixed(2))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Main form card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          Quote Details
        </h2>

        {/* Total Amount & Currency */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Total Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Quote Valid Until
          </label>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Line Items (Optional) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Cost Breakdown (Optional)
            </label>
            <button
              type="button"
              onClick={addLineItem}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Line Item
            </button>
          </div>

          {lineItems.length > 0 && (
            <div className="space-y-2">
              {lineItems.map((item) => (
                <div key={item.id} className="flex gap-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                    placeholder="Description (e.g., Ocean Freight)"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.amount}
                    onChange={(e) => updateLineItem(item.id, 'amount', e.target.value)}
                    placeholder="Amount"
                    className="w-28 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeLineItem(item.id)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Line items sum */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Line Items Total:
                </span>
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${hasMismatch ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                    {currency} {lineItemsSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {hasMismatch && (
                    <button
                      type="button"
                      onClick={setTotalFromLineItems}
                      className="text-xs text-blue-600 hover:underline"
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
          )}

          {lineItems.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add a breakdown of costs if you want to show individual charges (freight, handling, customs, etc.)
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes / Comments
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any additional information about your quote..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* PDF Upload */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
          Quote Document (Optional)
        </h2>
        <QuotePdfUpload
          quoteId={quoteId}
          onUpload={(path) => setPdfPath(path)}
          onRemove={() => setPdfPath(null)}
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? 'Submitting...' : 'Submit Quote'}
        </button>
      </div>
    </form>
  )
}

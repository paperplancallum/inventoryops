import { useState } from 'react'
import {
  Building2,
  Package,
  Clock,
  AlertCircle,
  Check,
  Plus,
  X,
  DollarSign,
  FileText,
} from 'lucide-react'

// Types for the external form
interface LineItemInput {
  id: string
  sku: string
  productName: string
  quantity: number
  originalUnitCost: number
  submittedUnitCost: number | null
  notes: string
}

interface AdditionalCost {
  id: string
  type: 'handling' | 'rush' | 'tooling' | 'shipping' | 'inspection' | 'other'
  description: string
  amount: number
}

interface SupplierInvoiceFormProps {
  /** Company name for branding */
  companyName?: string
  /** PO number */
  poNumber: string
  /** Supplier name */
  supplierName: string
  /** Order date */
  orderDate: string
  /** Expected delivery date */
  expectedDate: string
  /** Line items from PO */
  lineItems: Array<{
    id: string
    sku: string
    productName: string
    quantity: number
    unitCost: number
  }>
  /** Expiration date of the magic link */
  expiresAt: string
  /** Whether the link has expired */
  isExpired?: boolean
  /** Whether already submitted */
  isSubmitted?: boolean
  /** Called when form is submitted */
  onSubmit?: (data: {
    lineItems: LineItemInput[]
    additionalCosts: AdditionalCost[]
    submitterName: string
    submitterEmail: string
    notes: string
  }) => void
}

const costTypeOptions = [
  { value: 'handling', label: 'Handling Fee' },
  { value: 'rush', label: 'Rush Fee' },
  { value: 'tooling', label: 'Tooling' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'other', label: 'Other' },
] as const

export function SupplierInvoiceForm({
  companyName = 'InventoryOps',
  poNumber,
  supplierName,
  orderDate,
  expectedDate,
  lineItems: initialLineItems,
  expiresAt,
  isExpired = false,
  isSubmitted = false,
  onSubmit,
}: SupplierInvoiceFormProps) {
  const [lineItems, setLineItems] = useState<LineItemInput[]>(
    initialLineItems.map((item) => ({
      ...item,
      originalUnitCost: item.unitCost,
      submittedUnitCost: null,
      notes: '',
    }))
  )
  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCost[]>([])
  const [submitterName, setSubmitterName] = useState('')
  const [submitterEmail, setSubmitterEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const expiresDate = new Date(expiresAt)
  const now = new Date()
  const hoursUntilExpiry = Math.max(0, (expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60))
  const showExpiryWarning = hoursUntilExpiry > 0 && hoursUntilExpiry < 24

  const updateLineItemPrice = (id: string, price: number | null) => {
    setLineItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, submittedUnitCost: price } : item
      )
    )
  }

  const updateLineItemNotes = (id: string, notes: string) => {
    setLineItems((items) =>
      items.map((item) => (item.id === id ? { ...item, notes } : item))
    )
  }

  const addAdditionalCost = () => {
    setAdditionalCosts((costs) => [
      ...costs,
      {
        id: `cost-${Date.now()}`,
        type: 'other',
        description: '',
        amount: 0,
      },
    ])
  }

  const updateAdditionalCost = (
    id: string,
    field: keyof AdditionalCost,
    value: string | number
  ) => {
    setAdditionalCosts((costs) =>
      costs.map((cost) => (cost.id === id ? { ...cost, [field]: value } : cost))
    )
  }

  const removeAdditionalCost = (id: string) => {
    setAdditionalCosts((costs) => costs.filter((cost) => cost.id !== id))
  }

  const calculateOriginalTotal = () => {
    return lineItems.reduce(
      (sum, item) => sum + item.originalUnitCost * item.quantity,
      0
    )
  }

  const calculateSubmittedTotal = () => {
    const lineItemsTotal = lineItems.reduce((sum, item) => {
      const price = item.submittedUnitCost ?? item.originalUnitCost
      return sum + price * item.quantity
    }, 0)
    const costsTotal = additionalCosts.reduce((sum, cost) => sum + cost.amount, 0)
    return lineItemsTotal + costsTotal
  }

  const calculateVariance = () => {
    return calculateSubmittedTotal() - calculateOriginalTotal()
  }

  const calculateVariancePercent = () => {
    const original = calculateOriginalTotal()
    if (original === 0) return 0
    return (calculateVariance() / original) * 100
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit) {
      onSubmit({
        lineItems,
        additionalCosts,
        submitterName,
        submitterEmail,
        notes,
      })
    }
    setShowSuccess(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Show expired state
  if (isExpired) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Link Expired</h1>
          <p className="text-slate-600 mb-4">
            This invoice submission link has expired. Please contact the buyer to request a new link.
          </p>
          <p className="text-sm text-slate-500">Reference: {poNumber}</p>
        </div>
      </div>
    )
  }

  // Show already submitted state
  if (isSubmitted || showSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Invoice Submitted</h1>
          <p className="text-slate-600 mb-4">
            Thank you! Your invoice has been submitted successfully. The buyer will review it and get back to you.
          </p>
          <p className="text-sm text-slate-500">Reference: {poNumber}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">{companyName}</h1>
                <p className="text-sm text-slate-500">Invoice Submission</p>
              </div>
            </div>
            {showExpiryWarning && (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Expires in {Math.ceil(hoursUntilExpiry)} hours
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        <form onSubmit={handleSubmit}>
          {/* PO Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{poNumber}</h2>
                <p className="text-slate-600">{supplierName}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Order Date</span>
                <p className="font-medium text-slate-900">{formatDate(orderDate)}</p>
              </div>
              <div>
                <span className="text-slate-500">Expected Delivery</span>
                <p className="font-medium text-slate-900">{formatDate(expectedDate)}</p>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-400" />
              Line Items
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Please enter your actual unit prices for each item. Leave blank to use the original quoted price.
            </p>

            <div className="space-y-4">
              {lineItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-slate-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        {item.sku}
                      </span>
                      <h4 className="font-medium text-slate-900">{item.productName}</h4>
                    </div>
                    <span className="text-sm text-slate-600">
                      Qty: <span className="font-medium">{item.quantity.toLocaleString()}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">
                        Original Quote
                      </label>
                      <div className="text-lg font-medium text-slate-400">
                        {formatCurrency(item.originalUnitCost)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">
                        Your Price <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          $
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={item.originalUnitCost.toFixed(2)}
                          value={item.submittedUnitCost ?? ''}
                          onChange={(e) =>
                            updateLineItemPrice(
                              item.id,
                              e.target.value ? parseFloat(e.target.value) : null
                            )
                          }
                          className="w-full pl-7 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm text-slate-600 mb-1">
                      Notes (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Price increase due to material costs"
                      value={item.notes}
                      onChange={(e) => updateLineItemNotes(item.id, e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>

                  {item.submittedUnitCost !== null &&
                    item.submittedUnitCost !== item.originalUnitCost && (
                      <div className="mt-3 text-sm">
                        <span className="text-slate-500">Line variance: </span>
                        <span
                          className={
                            item.submittedUnitCost > item.originalUnitCost
                              ? 'text-red-600 font-medium'
                              : 'text-green-600 font-medium'
                          }
                        >
                          {item.submittedUnitCost > item.originalUnitCost ? '+' : ''}
                          {formatCurrency(
                            (item.submittedUnitCost - item.originalUnitCost) * item.quantity
                          )}
                        </span>
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>

          {/* Additional Costs */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-slate-400" />
                Additional Costs
              </h3>
              <button
                type="button"
                onClick={addAdditionalCost}
                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Cost
              </button>
            </div>

            {additionalCosts.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                No additional costs. Click "Add Cost" if you need to include handling fees, rush fees, etc.
              </p>
            ) : (
              <div className="space-y-3">
                {additionalCosts.map((cost) => (
                  <div
                    key={cost.id}
                    className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <select
                        value={cost.type}
                        onChange={(e) =>
                          updateAdditionalCost(cost.id, 'type', e.target.value)
                        }
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      >
                        {costTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Description"
                        value={cost.description}
                        onChange={(e) =>
                          updateAdditionalCost(cost.id, 'description', e.target.value)
                        }
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          $
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={cost.amount || ''}
                          onChange={(e) =>
                            updateAdditionalCost(
                              cost.id,
                              'amount',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full pl-7 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAdditionalCost(cost.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Notes</h3>
            <textarea
              rows={3}
              placeholder="Any additional notes or comments about this order..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Submitter Info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Li Wei"
                  value={submitterName}
                  onChange={(e) => setSubmitterName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Your Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g., liwei@company.com"
                  value={submitterEmail}
                  onChange={(e) => setSubmitterEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Summary & Submit */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Summary</h3>
            <div className="space-y-2 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-slate-600">Original Total</span>
                <span className="text-slate-900">{formatCurrency(calculateOriginalTotal())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Submitted Subtotal</span>
                <span className="text-slate-900">
                  {formatCurrency(
                    calculateSubmittedTotal() -
                      additionalCosts.reduce((sum, cost) => sum + cost.amount, 0)
                  )}
                </span>
              </div>
              {additionalCosts.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Additional Costs</span>
                  <span className="text-slate-900">
                    {formatCurrency(
                      additionalCosts.reduce((sum, cost) => sum + cost.amount, 0)
                    )}
                  </span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between font-medium">
                <span className="text-slate-900">Submitted Total</span>
                <span className="text-slate-900">{formatCurrency(calculateSubmittedTotal())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Variance</span>
                <span
                  className={
                    calculateVariance() > 0
                      ? 'text-red-600 font-medium'
                      : calculateVariance() < 0
                      ? 'text-green-600 font-medium'
                      : 'text-slate-900'
                  }
                >
                  {calculateVariance() > 0 ? '+' : ''}
                  {formatCurrency(calculateVariance())} ({calculateVariancePercent().toFixed(1)}%)
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              Submit Invoice
            </button>
            <p className="text-xs text-slate-500 text-center mt-3">
              By submitting, you confirm that the prices provided are accurate and valid for this order.
            </p>
          </div>
        </form>
      </main>
    </div>
  )
}

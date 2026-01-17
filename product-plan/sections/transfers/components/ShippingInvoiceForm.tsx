import { useState } from 'react'
import {
  Building2,
  Truck,
  Clock,
  AlertCircle,
  Check,
  Plus,
  X,
  DollarSign,
  FileText,
  MapPin,
  Package,
  Upload,
} from 'lucide-react'

// Types for the shipping invoice form
interface CostLineItem {
  id: string
  category: 'freight' | 'insurance' | 'duties' | 'taxes' | 'handling' | 'storage' | 'customs-brokerage' | 'other'
  description: string
  amount: number
  currency: string
}

interface ShippingInvoiceFormProps {
  /** Company name for branding */
  companyName?: string
  /** Transfer ID */
  transferId: string
  /** Transfer reference number */
  transferNumber: string
  /** Shipping agent name */
  shippingAgentName: string
  /** Origin location */
  origin: string
  /** Destination location */
  destination: string
  /** Carrier name */
  carrier?: string
  /** Shipping method */
  shippingMethod?: string
  /** Products being shipped */
  products: Array<{
    sku: string
    productName: string
    quantity: number
  }>
  /** Total units */
  totalUnits: number
  /** Scheduled departure date */
  departureDate: string
  /** Scheduled arrival date */
  arrivalDate: string
  /** Expected costs (from the transfer quote) */
  expectedCosts?: {
    freight?: number
    insurance?: number
    duties?: number
    taxes?: number
    handling?: number
    other?: number
  }
  /** Expiration date of the magic link */
  expiresAt: string
  /** Whether the link has expired */
  isExpired?: boolean
  /** Whether already submitted */
  isSubmitted?: boolean
  /** Called when form is submitted */
  onSubmit?: (data: {
    lineItems: CostLineItem[]
    invoiceNumber: string
    invoiceDate: string
    dueDate: string
    invoiceFile: File | null
    submitterName: string
    submitterEmail: string
    notes: string
  }) => void
}

const costCategoryOptions = [
  { value: 'freight', label: 'Freight / Transportation' },
  { value: 'insurance', label: 'Cargo Insurance' },
  { value: 'duties', label: 'Import Duties' },
  { value: 'taxes', label: 'Taxes' },
  { value: 'handling', label: 'Handling Fees' },
  { value: 'storage', label: 'Storage / Warehousing' },
  { value: 'customs-brokerage', label: 'Customs Brokerage' },
  { value: 'other', label: 'Other' },
] as const

export function ShippingInvoiceForm({
  companyName = 'InventoryOps',
  transferId: _transferId,
  transferNumber,
  shippingAgentName,
  origin,
  destination,
  carrier,
  shippingMethod,
  products,
  totalUnits,
  departureDate,
  arrivalDate,
  expectedCosts,
  expiresAt,
  isExpired = false,
  isSubmitted = false,
  onSubmit,
}: ShippingInvoiceFormProps) {
  const [lineItems, setLineItems] = useState<CostLineItem[]>([
    { id: 'cost-1', category: 'freight', description: '', amount: 0, currency: 'USD' },
  ])
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
  const [submitterName, setSubmitterName] = useState('')
  const [submitterEmail, setSubmitterEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const expiresDate = new Date(expiresAt)
  const now = new Date()
  const hoursUntilExpiry = Math.max(0, (expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60))
  const showExpiryWarning = hoursUntilExpiry > 0 && hoursUntilExpiry < 24

  const addLineItem = () => {
    setLineItems((items) => [
      ...items,
      {
        id: `cost-${Date.now()}`,
        category: 'other',
        description: '',
        amount: 0,
        currency: 'USD',
      },
    ])
  }

  const updateLineItem = (
    id: string,
    field: keyof CostLineItem,
    value: string | number
  ) => {
    setLineItems((items) =>
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems((items) => items.filter((item) => item.id !== id))
    }
  }

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.amount || 0), 0)
  }

  const calculateExpectedTotal = () => {
    if (!expectedCosts) return null
    return (
      (expectedCosts.freight || 0) +
      (expectedCosts.insurance || 0) +
      (expectedCosts.duties || 0) +
      (expectedCosts.taxes || 0) +
      (expectedCosts.handling || 0) +
      (expectedCosts.other || 0)
    )
  }

  const calculateVariance = () => {
    const expected = calculateExpectedTotal()
    if (expected === null) return null
    return calculateTotal() - expected
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit) {
      onSubmit({
        lineItems,
        invoiceNumber,
        invoiceDate,
        dueDate,
        invoiceFile,
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
            This invoice submission link has expired. Please contact the shipper to request a new link.
          </p>
          <p className="text-sm text-slate-500">Reference: {transferNumber}</p>
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
            Thank you! Your shipping invoice has been submitted successfully. The customer will review it and process payment.
          </p>
          <p className="text-sm text-slate-500">Reference: {transferNumber}</p>
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
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">{companyName}</h1>
                <p className="text-sm text-slate-500">Shipping Invoice Submission</p>
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
          {/* Transfer Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{transferNumber}</h2>
                <p className="text-slate-600">{shippingAgentName}</p>
              </div>
            </div>

            {/* Route */}
            <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="w-4 h-4" />
                  <span>From</span>
                </div>
                <p className="font-medium text-slate-900">{origin}</p>
              </div>
              <div className="flex-shrink-0 text-slate-300">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
              <div className="flex-1 text-right">
                <div className="flex items-center justify-end gap-2 text-sm text-slate-500">
                  <span>To</span>
                  <MapPin className="w-4 h-4" />
                </div>
                <p className="font-medium text-slate-900">{destination}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              {carrier && (
                <div>
                  <span className="text-slate-500">Carrier</span>
                  <p className="font-medium text-slate-900">{carrier}</p>
                </div>
              )}
              {shippingMethod && (
                <div>
                  <span className="text-slate-500">Method</span>
                  <p className="font-medium text-slate-900">{shippingMethod}</p>
                </div>
              )}
              <div>
                <span className="text-slate-500">Departure</span>
                <p className="font-medium text-slate-900">{formatDate(departureDate)}</p>
              </div>
              <div>
                <span className="text-slate-500">Arrival</span>
                <p className="font-medium text-slate-900">{formatDate(arrivalDate)}</p>
              </div>
            </div>

            {/* Products Summary */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                <Package className="w-4 h-4" />
                <span>Shipment Contents ({totalUnits.toLocaleString()} total units)</span>
              </div>
              <div className="space-y-1">
                {products.slice(0, 3).map((product, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-slate-700">{product.productName}</span>
                    <span className="text-slate-500">{product.quantity.toLocaleString()} units</span>
                  </div>
                ))}
                {products.length > 3 && (
                  <p className="text-sm text-slate-500">+ {products.length - 3} more items</p>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              Invoice Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Invoice Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., INV-2024-001"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Invoice Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Payment Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Cost Line Items */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-slate-400" />
                Charges
              </h3>
              <button
                type="button"
                onClick={addLineItem}
                className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Charge
              </button>
            </div>

            {expectedCosts && (
              <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-2">Expected costs from quote:</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-sm">
                  {expectedCosts.freight !== undefined && expectedCosts.freight > 0 && (
                    <div>
                      <span className="text-slate-500">Freight</span>
                      <p className="font-medium">{formatCurrency(expectedCosts.freight)}</p>
                    </div>
                  )}
                  {expectedCosts.insurance !== undefined && expectedCosts.insurance > 0 && (
                    <div>
                      <span className="text-slate-500">Insurance</span>
                      <p className="font-medium">{formatCurrency(expectedCosts.insurance)}</p>
                    </div>
                  )}
                  {expectedCosts.duties !== undefined && expectedCosts.duties > 0 && (
                    <div>
                      <span className="text-slate-500">Duties</span>
                      <p className="font-medium">{formatCurrency(expectedCosts.duties)}</p>
                    </div>
                  )}
                  {expectedCosts.handling !== undefined && expectedCosts.handling > 0 && (
                    <div>
                      <span className="text-slate-500">Handling</span>
                      <p className="font-medium">{formatCurrency(expectedCosts.handling)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {lineItems.map((item, _index) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-3">
                      <label className="block text-xs text-slate-500 mb-1">Category</label>
                      <select
                        value={item.category}
                        onChange={(e) => updateLineItem(item.id, 'category', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                      >
                        {costCategoryOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-6">
                      <label className="block text-xs text-slate-500 mb-1">Description</label>
                      <input
                        type="text"
                        placeholder="e.g., Ocean freight FCL 40ft container"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs text-slate-500 mb-1">Amount (USD)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          $
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={item.amount || ''}
                          onChange={(e) =>
                            updateLineItem(item.id, 'amount', parseFloat(e.target.value) || 0)
                          }
                          className="w-full pl-7 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded mt-6"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Invoice Upload */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-slate-400" />
              Invoice Document
            </h3>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                invoiceFile
                  ? 'border-green-300 bg-green-50'
                  : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              {invoiceFile ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="flex items-center gap-2 text-green-700 bg-green-100 px-4 py-2 rounded-lg">
                    <Check className="w-4 h-4" />
                    <span className="font-medium">{invoiceFile.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInvoiceFile(null)}
                    className="p-2 text-slate-400 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">
                    Drag & drop or <span className="text-emerald-600 font-medium">browse</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PDF up to 10MB (optional)</p>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) setInvoiceFile(file)
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Notes (Optional)</h3>
            <textarea
              rows={3}
              placeholder="Any additional notes about this invoice..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                  placeholder="e.g., David Chen"
                  value={submitterName}
                  onChange={(e) => setSubmitterName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Your Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g., david@company.com"
                  value={submitterEmail}
                  onChange={(e) => setSubmitterEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Summary & Submit */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Summary</h3>
            <div className="space-y-2 text-sm mb-6">
              {lineItems.filter(item => item.amount > 0).map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-slate-600">
                    {costCategoryOptions.find(opt => opt.value === item.category)?.label}
                    {item.description && ` - ${item.description}`}
                  </span>
                  <span className="text-slate-900">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="border-t border-slate-200 pt-2 flex justify-between font-medium text-base">
                <span className="text-slate-900">Total Amount</span>
                <span className="text-slate-900">{formatCurrency(calculateTotal())}</span>
              </div>
              {calculateVariance() !== null && calculateVariance() !== 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Variance from Quote</span>
                  <span
                    className={
                      calculateVariance()! > 0
                        ? 'text-red-600 font-medium'
                        : 'text-green-600 font-medium'
                    }
                  >
                    {calculateVariance()! > 0 ? '+' : ''}
                    {formatCurrency(calculateVariance()!)}
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
            >
              Submit Invoice
            </button>
            <p className="text-xs text-slate-500 text-center mt-3">
              By submitting, you confirm that the charges provided are accurate and valid for this shipment.
            </p>
          </div>
        </form>
      </main>
    </div>
  )
}

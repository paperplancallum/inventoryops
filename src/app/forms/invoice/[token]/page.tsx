'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Package,
  AlertTriangle,
  Clock,
  CheckCircle,
  Plus,
  Trash2,
  Send,
  FileText,
  DollarSign,
  Building,
  Loader2,
  RotateCcw,
  MessageSquare,
  Upload,
  File,
  X as XIcon
} from 'lucide-react'

interface POLineItem {
  id: string
  sku: string
  productName: string
  productImageUrl?: string
  quantity: number
  expectedUnitCost?: number
  estimatedUnitCost?: number
  expectedSubtotal?: number
}

interface PODetails {
  id: string
  poNumber: string
  supplierName: string
  orderDate: string
  lineItems: POLineItem[]
  currency: string
  paymentTerms: string | null
}

interface MagicLinkMetadata {
  revision_number?: number
  previous_submission_id?: string
  rejection_notes?: string
  po_number?: string
}

interface MagicLinkData {
  id: string
  purpose: string
  recipientName: string
  recipientEmail: string
  expiresAt: string
  entityData: PODetails
  metadata?: MagicLinkMetadata
}

interface SubmissionLineItem {
  lineItemId: string
  actualUnitCost: string
  notes: string
}

interface SubmissionCost {
  id: string
  category: string
  amount: string
  notes: string
}

interface UploadedFile {
  id: string
  file: File
  preview?: string
}

const COST_CATEGORIES = [
  { id: 'shipping', label: 'Shipping' },
  { id: 'packaging', label: 'Packaging' },
  { id: 'tooling', label: 'Tooling' },
  { id: 'customs', label: 'Customs/Duties' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'other', label: 'Other' },
]

export default function SupplierInvoiceFormPage() {
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [linkData, setLinkData] = useState<MagicLinkData | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Form state
  const [lineItems, setLineItems] = useState<SubmissionLineItem[]>([])
  const [additionalCosts, setAdditionalCosts] = useState<SubmissionCost[]>([])
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [confirmationName, setConfirmationName] = useState('')
  const [isConfirmed, setIsConfirmed] = useState(false)

  // Load magic link data
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(`/api/magic-links/validate/${token}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Invalid or expired link')
          return
        }

        if (data.magicLink.purpose !== 'invoice-submission') {
          setError('This link is not for invoice submission')
          return
        }

        // Merge entityData into the magicLink object
        setLinkData({
          ...data.magicLink,
          entityData: data.entityData,
        })

        // Initialize line items with expected costs
        const initialLineItems = data.entityData?.lineItems?.map((item: POLineItem) => ({
          lineItemId: item.id,
          actualUnitCost: (item.expectedUnitCost ?? item.estimatedUnitCost ?? 0).toString(),
          notes: '',
        })) || []
        setLineItems(initialLineItems)
      } catch (err) {
        setError('Failed to load form data')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      loadData()
    }
  }, [token])

  const handleLineItemChange = (index: number, field: 'actualUnitCost' | 'notes', value: string) => {
    setLineItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addAdditionalCost = () => {
    setAdditionalCosts(prev => [
      ...prev,
      { id: crypto.randomUUID(), category: 'shipping', amount: '', notes: '' }
    ])
  }

  const removeAdditionalCost = (id: string) => {
    setAdditionalCosts(prev => prev.filter(c => c.id !== id))
  }

  const handleCostChange = (id: string, field: keyof SubmissionCost, value: string) => {
    setAdditionalCosts(prev => prev.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ))
  }

  const calculateTotal = () => {
    if (!linkData) return 0

    const lineItemTotal = lineItems.reduce((sum, item, index) => {
      const qty = linkData.entityData.lineItems[index]?.quantity || 0
      const cost = parseFloat(item.actualUnitCost) || 0
      return sum + (qty * cost)
    }, 0)

    const costsTotal = additionalCosts.reduce((sum, cost) => {
      return sum + (parseFloat(cost.amount) || 0)
    }, 0)

    return lineItemTotal + costsTotal
  }

  // File handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles) return

    const newFiles: UploadedFile[] = Array.from(selectedFiles).map(file => ({
      id: crypto.randomUUID(),
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }))

    setFiles(prev => [...prev, ...newFiles])
    e.target.value = '' // Reset input
  }

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') return '📄'
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊'
    if (mimeType.startsWith('image/')) return '🖼️'
    return '📎'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkData) return

    setSubmitting(true)

    try {
      // Use FormData to support file uploads
      const formData = new FormData()

      // Add JSON data
      formData.append('data', JSON.stringify({
        token,
        invoiceNumber: invoiceNumber.trim() || null,
        invoiceDate,
        notes: notes.trim() || null,
        confirmedByName: confirmationName.trim(),
        lineItems: lineItems.map((item, index) => ({
          purchaseOrderLineItemId: item.lineItemId,
          actualUnitCost: parseFloat(item.actualUnitCost) || 0,
          actualQuantity: linkData.entityData.lineItems[index].quantity,
          notes: item.notes.trim() || null,
        })),
        additionalCosts: additionalCosts
          .filter(c => c.amount && parseFloat(c.amount) > 0)
          .map(c => ({
            category: c.category,
            amount: parseFloat(c.amount),
            notes: c.notes.trim() || null,
          })),
      }))

      // Add files
      files.forEach((f, index) => {
        formData.append(`file-${index}`, f.file)
      })

      const res = await fetch('/api/magic-links/submit/invoice', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit invoice')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit invoice')
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading form...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !linkData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Link Not Available</h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Invoice Submitted!</h1>
          <p className="text-slate-600 mb-4">
            Thank you for submitting your invoice. Paper Plan Group will review it shortly.
          </p>
          <p className="text-sm text-slate-500">
            You can close this page now.
          </p>
        </div>
      </div>
    )
  }

  if (!linkData || !linkData.entityData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Missing Order Data</h1>
          <p className="text-slate-600">Unable to load purchase order details. Please contact support.</p>
        </div>
      </div>
    )
  }

  const { entityData: po } = linkData
  const expiresAt = new Date(linkData.expiresAt)
  const daysUntilExpiry = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Paper Plan Group</h1>
              <p className="text-sm text-slate-500">Invoice Submission</p>
            </div>
            {daysUntilExpiry <= 3 && (
              <div className="flex items-center gap-1 text-amber-600 text-sm">
                <Clock className="w-4 h-4" />
                Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Submission Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Revision Banner - shown when this is a revision request */}
        {linkData.metadata?.revision_number && linkData.metadata.revision_number > 1 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <RotateCcw className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-amber-800">Revision Requested</h3>
                  <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs font-medium rounded-full">
                    Revision {linkData.metadata.revision_number}
                  </span>
                </div>
                <p className="text-sm text-amber-700 mb-3">
                  Your previous submission requires some corrections. Please review the notes below and resubmit.
                </p>
                {linkData.metadata.rejection_notes && (
                  <div className="bg-white border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-amber-600 mb-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Reviewer Notes
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {linkData.metadata.rejection_notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PO Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{po.poNumber}</h2>
              <p className="text-sm text-slate-500">Purchase Order</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Supplier</span>
              <p className="font-medium text-slate-900">{po.supplierName}</p>
            </div>
            <div>
              <span className="text-slate-500">Order Date</span>
              <p className="font-medium text-slate-900">
                {new Date(po.orderDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Currency</span>
              <p className="font-medium text-slate-900">{po.currency}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Invoice Details */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Invoice Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="invoiceNumber" className="block text-sm font-medium text-slate-700 mb-1">
                  Your Invoice Number (Optional)
                </label>
                <input
                  type="text"
                  id="invoiceNumber"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g., INV-2024-001"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="invoiceDate" className="block text-sm font-medium text-slate-700 mb-1">
                  Invoice Date
                </label>
                <input
                  type="date"
                  id="invoiceDate"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* File Upload */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Upload className="w-4 h-4 inline mr-1" />
                Attach Invoice Document (Optional)
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Upload your invoice as a PDF, Excel file, or image. Max 50MB per file.
              </p>

              {/* Upload Zone */}
              <div className="relative">
                <input
                  type="file"
                  id="fileUpload"
                  multiple
                  accept=".pdf,.xls,.xlsx,image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors">
                  <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-600">
                    <span className="text-indigo-600 font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    PDF, Excel, JPEG, PNG (max 50MB)
                  </p>
                </div>
              </div>

              {/* Uploaded Files List */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      {f.preview ? (
                        <img
                          src={f.preview}
                          alt={f.file.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-slate-200 rounded flex items-center justify-center text-lg">
                          {getFileIcon(f.file.type)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {f.file.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatFileSize(f.file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(f.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Line Items
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="w-14 py-2 px-2"></th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 uppercase">Product</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase">Qty</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase">Expected</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase w-32">Actual Cost</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {po.lineItems.map((item, index) => {
                    const expectedCost = item.expectedUnitCost ?? item.estimatedUnitCost ?? 0
                    const actualCost = parseFloat(lineItems[index]?.actualUnitCost) || 0
                    const subtotal = item.quantity * actualCost
                    const variance = actualCost - expectedCost
                    const variancePercent = expectedCost > 0
                      ? ((variance / expectedCost) * 100).toFixed(1)
                      : '0'

                    return (
                      <tr key={item.id}>
                        <td className="py-3 px-2">
                          {item.productImageUrl ? (
                            <img
                              src={item.productImageUrl}
                              alt={item.productName}
                              className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
                              <Package className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <p className="font-medium text-slate-900">{item.productName}</p>
                          <p className="text-xs text-slate-500">{item.sku}</p>
                        </td>
                        <td className="py-3 px-2 text-right text-slate-700">
                          {item.quantity.toLocaleString()}
                        </td>
                        <td className="py-3 px-2 text-right text-slate-500">
                          ${expectedCost.toFixed(2)}
                        </td>
                        <td className="py-3 px-2">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={lineItems[index]?.actualUnitCost || ''}
                              onChange={(e) => handleLineItemChange(index, 'actualUnitCost', e.target.value)}
                              className="w-full pl-7 pr-3 py-1.5 border border-slate-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>
                          {variance !== 0 && (
                            <p className={`text-xs mt-1 text-right ${variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {variance > 0 ? '+' : ''}{variancePercent}%
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right font-medium text-slate-900">
                          ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Additional Costs */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Additional Costs
              </h3>
              <button
                type="button"
                onClick={addAdditionalCost}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Cost
              </button>
            </div>

            {additionalCosts.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                No additional costs added. Click &quot;Add Cost&quot; to include shipping, packaging, or other charges.
              </p>
            ) : (
              <div className="space-y-3">
                {additionalCosts.map((cost) => (
                  <div key={cost.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <select
                      value={cost.category}
                      onChange={(e) => handleCostChange(cost.id, 'category', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {COST_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={cost.amount}
                        onChange={(e) => handleCostChange(cost.id, 'amount', e.target.value)}
                        placeholder="Amount"
                        className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <input
                      type="text"
                      value={cost.notes}
                      onChange={(e) => handleCostChange(cost.id, 'notes', e.target.value)}
                      placeholder="Notes (optional)"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => removeAdditionalCost(cost.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Notes (Optional)</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information about this invoice..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Total & Submit */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-lg font-semibold text-slate-900">Total</span>
              <span className="text-2xl font-bold text-slate-900">
                ${calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Confirmation Section */}
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Confirmation</h4>

              <div className="mb-4">
                <label htmlFor="confirmationName" className="block text-sm font-medium text-slate-700 mb-1">
                  Your Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="confirmationName"
                  value={confirmationName}
                  onChange={(e) => setConfirmationName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  required
                />
                <span className="text-sm text-slate-700">
                  I, <strong>{confirmationName || '[Your Name]'}</strong>, confirm that the prices and terms provided in this invoice submission are official and accurate to the best of my knowledge.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || !isConfirmed || !confirmationName.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Invoice
                </>
              )}
            </button>

            <p className="mt-4 text-xs text-center text-slate-500">
              Paper Plan Group will review your submission.
            </p>
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-8 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-400">
            Paper Plan Group &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  )
}

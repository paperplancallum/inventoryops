'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  Package,
  AlertTriangle,
  Clock,
  CheckCircle,
  Upload,
  FileText,
  Trash2,
  Send,
  ArrowRight,
  Loader2,
  X
} from 'lucide-react'

interface TransferLineItem {
  id: string
  sku: string
  productName: string
  quantity: number
}

interface TransferDetails {
  id: string
  transferNumber: string
  sourceLocationName: string
  destinationLocationName: string
  carrier: string | null
  lineItems: TransferLineItem[]
  totalUnits: number
  scheduledDepartureDate: string | null
  scheduledArrivalDate: string | null
}

interface MagicLinkData {
  id: string
  purpose: string
  recipientName: string
  recipientEmail: string
  expiresAt: string
  entityData: TransferDetails
}

interface UploadedDocument {
  id: string
  file: File
  documentType: string
  trackingNumber: string
  trackingUrl: string
  notes: string
  uploading: boolean
  error: string | null
}

const DOCUMENT_TYPES = [
  { id: 'bill-of-lading', label: 'Bill of Lading (BOL)' },
  { id: 'packing-list', label: 'Packing List' },
  { id: 'commercial-invoice', label: 'Commercial Invoice' },
  { id: 'certificate-of-origin', label: 'Certificate of Origin' },
  { id: 'customs-declaration', label: 'Customs Declaration' },
  { id: 'proof-of-delivery', label: 'Proof of Delivery (POD)' },
  { id: 'inspection-report', label: 'Inspection Report' },
  { id: 'other', label: 'Other' },
]

export default function TransferDocumentFormPage() {
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [linkData, setLinkData] = useState<MagicLinkData | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Form state
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [actualDepartureDate, setActualDepartureDate] = useState('')
  const [actualArrivalDate, setActualArrivalDate] = useState('')
  const [notes, setNotes] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

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

        if (data.magicLink.purpose !== 'document-upload') {
          setError('This link is not for document upload')
          return
        }

        setLinkData(data.magicLink)
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

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newDocs: UploadedDocument[] = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      file,
      documentType: 'bill-of-lading',
      trackingNumber: '',
      trackingUrl: '',
      notes: '',
      uploading: false,
      error: null,
    }))

    setDocuments(prev => [...prev, ...newDocs])

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id))
  }

  const updateDocument = (id: string, field: keyof UploadedDocument, value: string) => {
    setDocuments(prev => prev.map(d =>
      d.id === id ? { ...d, [field]: value } : d
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkData || documents.length === 0) return

    setSubmitting(true)

    try {
      // Prepare documents data (in a real app, we'd upload files to storage first)
      const documentsData = documents.map(doc => ({
        name: doc.file.name,
        documentType: doc.documentType,
        trackingNumber: doc.trackingNumber.trim() || null,
        trackingUrl: doc.trackingUrl.trim() || null,
        notes: doc.notes.trim() || null,
        fileSize: doc.file.size,
        mimeType: doc.file.type,
      }))

      const res = await fetch('/api/magic-links/submit/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          documents: documentsData,
          actualDepartureDate: actualDepartureDate || null,
          actualArrivalDate: actualArrivalDate || null,
          notes: notes.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit documents')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit documents')
    } finally {
      setSubmitting(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Documents Submitted!</h1>
          <p className="text-slate-600 mb-4">
            Thank you for uploading the shipping documents. Paper Plan Group will process them shortly.
          </p>
          <p className="text-sm text-slate-500">
            You can close this page now.
          </p>
        </div>
      </div>
    )
  }

  if (!linkData) return null

  const { entityData: transfer } = linkData
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
              <p className="text-sm text-slate-500">Document Upload</p>
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

        {/* Transfer Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{transfer.transferNumber}</h2>
              <p className="text-sm text-slate-500">Transfer</p>
            </div>
          </div>

          {/* Route */}
          <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
            <span className="text-sm font-medium text-slate-700">{transfer.sourceLocationName}</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">{transfer.destinationLocationName}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Carrier</span>
              <p className="font-medium text-slate-900">{transfer.carrier || 'Not specified'}</p>
            </div>
            <div>
              <span className="text-slate-500">Total Units</span>
              <p className="font-medium text-slate-900">{transfer.totalUnits.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-slate-500">Line Items</span>
              <p className="font-medium text-slate-900">{transfer.lineItems.length}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Document Upload */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Upload Documents
            </h3>

            {/* File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-slate-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors cursor-pointer"
            >
              <Upload className="w-8 h-8 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Click to upload documents</span>
              <span className="text-xs text-slate-500">PDF, images, Word, Excel supported</span>
            </button>

            {/* Uploaded Documents */}
            {documents.length > 0 && (
              <div className="mt-6 space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">
                            {doc.file.name}
                          </p>
                          <p className="text-xs text-slate-500">{formatFileSize(doc.file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument(doc.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Document Type
                        </label>
                        <select
                          value={doc.documentType}
                          onChange={(e) => updateDocument(doc.id, 'documentType', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          {DOCUMENT_TYPES.map((type) => (
                            <option key={type.id} value={type.id}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Tracking Number (Optional)
                        </label>
                        <input
                          type="text"
                          value={doc.trackingNumber}
                          onChange={(e) => updateDocument(doc.id, 'trackingNumber', e.target.value)}
                          placeholder="e.g., 1Z999AA10123456784"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Shipping Updates */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Shipping Updates (Optional)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="departureDate" className="block text-sm font-medium text-slate-700 mb-1">
                  Actual Departure Date
                </label>
                <input
                  type="date"
                  id="departureDate"
                  value={actualDepartureDate}
                  onChange={(e) => setActualDepartureDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {transfer.scheduledDepartureDate && (
                  <p className="text-xs text-slate-500 mt-1">
                    Scheduled: {new Date(transfer.scheduledDepartureDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="arrivalDate" className="block text-sm font-medium text-slate-700 mb-1">
                  Actual/Expected Arrival Date
                </label>
                <input
                  type="date"
                  id="arrivalDate"
                  value={actualArrivalDate}
                  onChange={(e) => setActualArrivalDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {transfer.scheduledArrivalDate && (
                  <p className="text-xs text-slate-500 mt-1">
                    Scheduled: {new Date(transfer.scheduledArrivalDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Notes (Optional)</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information about this shipment..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Submit */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <button
              type="submit"
              disabled={submitting || documents.length === 0}
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
                  Submit Documents ({documents.length})
                </>
              )}
            </button>

            {documents.length === 0 && (
              <p className="mt-4 text-xs text-center text-amber-600">
                Please upload at least one document to submit.
              </p>
            )}

            <p className="mt-4 text-xs text-center text-slate-500">
              By submitting, you confirm that the documents provided are accurate.
              Paper Plan Group will process your submission.
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

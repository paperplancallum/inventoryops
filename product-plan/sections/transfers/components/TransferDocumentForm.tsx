import { useState, useCallback } from 'react'
import {
  Building2,
  Truck,
  Clock,
  AlertCircle,
  Check,
  Upload,
  FileText,
  X,
  MapPin,
  Package,
  Calendar,
} from 'lucide-react'

// Types for document uploads
interface DocumentUpload {
  id: string
  type: 'bill-of-lading' | 'proof-of-delivery' | 'insurance-certificate' | 'customs-declaration' | 'other'
  file: File | null
  fileName: string | null
  uploaded: boolean
}

interface TrackingUpdate {
  status: string
  location: string
  timestamp: string
  notes: string
}

interface TransferDocumentFormProps {
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
  /** Tracking number */
  trackingNumber?: string
  /** Products being shipped */
  products: Array<{
    sku: string
    productName: string
    quantity: number
  }>
  /** Scheduled pickup date */
  pickupDate: string
  /** Expected delivery date */
  deliveryDate: string
  /** Required document types */
  requiredDocuments?: Array<'bill-of-lading' | 'proof-of-delivery' | 'insurance-certificate' | 'customs-declaration'>
  /** Expiration date of the magic link */
  expiresAt: string
  /** Whether the link has expired */
  isExpired?: boolean
  /** Whether already submitted */
  isSubmitted?: boolean
  /** Called when form is submitted */
  onSubmit?: (data: {
    documents: DocumentUpload[]
    trackingUpdates: TrackingUpdate[]
    actualPickupDate: string | null
    actualDeliveryDate: string | null
    submitterName: string
    submitterEmail: string
    notes: string
  }) => void
}

const documentTypeLabels: Record<string, string> = {
  'bill-of-lading': 'Bill of Lading',
  'proof-of-delivery': 'Proof of Delivery',
  'insurance-certificate': 'Insurance Certificate',
  'customs-declaration': 'Customs Declaration',
  'other': 'Other Document',
}

const documentTypeDescriptions: Record<string, string> = {
  'bill-of-lading': 'Official shipping document from the carrier',
  'proof-of-delivery': 'Signed confirmation of delivery receipt',
  'insurance-certificate': 'Cargo insurance documentation',
  'customs-declaration': 'Customs clearance documentation',
  'other': 'Any other relevant shipping document',
}

export function TransferDocumentForm({
  companyName = 'InventoryOps',
  transferId: _transferId,
  transferNumber,
  shippingAgentName,
  origin,
  destination,
  carrier,
  trackingNumber,
  products,
  pickupDate,
  deliveryDate,
  requiredDocuments = ['bill-of-lading', 'proof-of-delivery'],
  expiresAt,
  isExpired = false,
  isSubmitted = false,
  onSubmit,
}: TransferDocumentFormProps) {
  const [documents, setDocuments] = useState<DocumentUpload[]>(
    requiredDocuments.map((type, index) => ({
      id: `doc-${index}`,
      type,
      file: null,
      fileName: null,
      uploaded: false,
    }))
  )
  const [trackingUpdates, setTrackingUpdates] = useState<TrackingUpdate[]>([])
  const [actualPickupDate, setActualPickupDate] = useState('')
  const [actualDeliveryDate, setActualDeliveryDate] = useState('')
  const [submitterName, setSubmitterName] = useState('')
  const [submitterEmail, setSubmitterEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const expiresDate = new Date(expiresAt)
  const now = new Date()
  const hoursUntilExpiry = Math.max(0, (expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60))
  const showExpiryWarning = hoursUntilExpiry > 0 && hoursUntilExpiry < 24

  const handleFileUpload = useCallback((docId: string, file: File) => {
    setDocuments((docs) =>
      docs.map((doc) =>
        doc.id === docId
          ? { ...doc, file, fileName: file.name, uploaded: true }
          : doc
      )
    )
  }, [])

  const handleDrop = useCallback((docId: string, e: React.DragEvent) => {
    e.preventDefault()
    setDragOverId(null)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileUpload(docId, file)
    }
  }, [handleFileUpload])

  const handleDragOver = useCallback((docId: string, e: React.DragEvent) => {
    e.preventDefault()
    setDragOverId(docId)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverId(null)
  }, [])

  const removeDocument = (docId: string) => {
    setDocuments((docs) =>
      docs.map((doc) =>
        doc.id === docId
          ? { ...doc, file: null, fileName: null, uploaded: false }
          : doc
      )
    )
  }

  const addOtherDocument = () => {
    setDocuments((docs) => [
      ...docs,
      {
        id: `doc-${Date.now()}`,
        type: 'other',
        file: null,
        fileName: null,
        uploaded: false,
      },
    ])
  }

  const addTrackingUpdate = () => {
    setTrackingUpdates((updates) => [
      ...updates,
      {
        status: '',
        location: '',
        timestamp: new Date().toISOString().slice(0, 16),
        notes: '',
      },
    ])
  }

  const updateTrackingUpdate = (
    index: number,
    field: keyof TrackingUpdate,
    value: string
  ) => {
    setTrackingUpdates((updates) =>
      updates.map((update, i) =>
        i === index ? { ...update, [field]: value } : update
      )
    )
  }

  const removeTrackingUpdate = (index: number) => {
    setTrackingUpdates((updates) => updates.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit) {
      onSubmit({
        documents,
        trackingUpdates,
        actualPickupDate: actualPickupDate || null,
        actualDeliveryDate: actualDeliveryDate || null,
        submitterName,
        submitterEmail,
        notes,
      })
    }
    setShowSuccess(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const requiredDocsUploaded = documents
    .filter((doc) => requiredDocuments.includes(doc.type as any))
    .every((doc) => doc.uploaded)

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
            This document upload link has expired. Please contact the shipper to request a new link.
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
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Documents Submitted</h1>
          <p className="text-slate-600 mb-4">
            Thank you! Your documents have been uploaded successfully. The shipper will be notified.
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
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">{companyName}</h1>
                <p className="text-sm text-slate-500">Document Upload</p>
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
              {trackingNumber && (
                <div>
                  <span className="text-slate-500">Tracking #</span>
                  <p className="font-medium text-slate-900">{trackingNumber}</p>
                </div>
              )}
              <div>
                <span className="text-slate-500">Pickup Date</span>
                <p className="font-medium text-slate-900">{formatDate(pickupDate)}</p>
              </div>
              <div>
                <span className="text-slate-500">Delivery Date</span>
                <p className="font-medium text-slate-900">{formatDate(deliveryDate)}</p>
              </div>
            </div>

            {/* Products */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                <Package className="w-4 h-4" />
                <span>Products ({products.length})</span>
              </div>
              <div className="space-y-1">
                {products.map((product, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-slate-700">{product.productName}</span>
                    <span className="text-slate-500">{product.quantity.toLocaleString()} units</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Document Uploads */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                Required Documents
              </h3>
              <button
                type="button"
                onClick={addOtherDocument}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                + Add Other
              </button>
            </div>

            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
                    dragOverId === doc.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : doc.uploaded
                      ? 'border-green-300 bg-green-50'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                  onDrop={(e) => handleDrop(doc.id, e)}
                  onDragOver={(e) => handleDragOver(doc.id, e)}
                  onDragLeave={handleDragLeave}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900 flex items-center gap-2">
                        {documentTypeLabels[doc.type]}
                        {requiredDocuments.includes(doc.type as any) && (
                          <span className="text-red-500 text-sm">*</span>
                        )}
                      </h4>
                      <p className="text-sm text-slate-500">
                        {documentTypeDescriptions[doc.type]}
                      </p>
                    </div>
                    {doc.uploaded && (
                      <button
                        type="button"
                        onClick={() => removeDocument(doc.id)}
                        className="p-1 text-slate-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {doc.uploaded ? (
                    <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-100 px-3 py-2 rounded-lg">
                      <Check className="w-4 h-4" />
                      <span className="font-medium">{doc.fileName}</span>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <label className="flex flex-col items-center justify-center py-6 cursor-pointer">
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-sm text-slate-600">
                          Drag & drop or{' '}
                          <span className="text-indigo-600 font-medium">browse</span>
                        </span>
                        <span className="text-xs text-slate-400 mt-1">
                          PDF, JPG, PNG up to 10MB
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(doc.id, file)
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actual Dates */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-slate-400" />
              Actual Dates (Optional)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Actual Pickup Date
                </label>
                <input
                  type="date"
                  value={actualPickupDate}
                  onChange={(e) => setActualPickupDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Actual Delivery Date
                </label>
                <input
                  type="date"
                  value={actualDeliveryDate}
                  onChange={(e) => setActualDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Tracking Updates */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Tracking Updates (Optional)</h3>
              <button
                type="button"
                onClick={addTrackingUpdate}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                + Add Update
              </button>
            </div>

            {trackingUpdates.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                No tracking updates added. Click "Add Update" to provide shipment status updates.
              </p>
            ) : (
              <div className="space-y-4">
                {trackingUpdates.map((update, index) => (
                  <div key={index} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex justify-between mb-3">
                      <span className="text-sm font-medium text-slate-700">Update #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeTrackingUpdate(index)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Status (e.g., In Transit)"
                        value={update.status}
                        onChange={(e) => updateTrackingUpdate(index, 'status', e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Location"
                        value={update.location}
                        onChange={(e) => updateTrackingUpdate(index, 'location', e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                      <input
                        type="datetime-local"
                        value={update.timestamp}
                        onChange={(e) => updateTrackingUpdate(index, 'timestamp', e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Notes (optional)"
                        value={update.notes}
                        onChange={(e) => updateTrackingUpdate(index, 'notes', e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Notes (Optional)</h3>
            <textarea
              rows={3}
              placeholder="Any additional notes or comments about this shipment..."
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
                  placeholder="e.g., John Smith"
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
                  placeholder="e.g., john@company.com"
                  value={submitterEmail}
                  onChange={(e) => setSubmitterEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            {!requiredDocsUploaded && (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-3 rounded-lg mb-4">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">
                  Please upload all required documents before submitting.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={!requiredDocsUploaded}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                requiredDocsUploaded
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
            >
              Submit Documents
            </button>
            <p className="text-xs text-slate-500 text-center mt-3">
              By submitting, you confirm that the documents provided are accurate and complete.
            </p>
          </div>
        </form>
      </main>
    </div>
  )
}

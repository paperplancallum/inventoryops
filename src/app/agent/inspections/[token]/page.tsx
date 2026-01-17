'use client'

import { useState, useEffect, use } from 'react'

interface LineItem {
  id: string
  productName: string
  productSku: string
  orderedQuantity: number
  sampleSize: number
}

interface InspectionDetails {
  id: string
  purchaseOrderNumber: string
  supplierName: string
  scheduledDate: string
  confirmedDate: string | null
  status: string
  notes: string | null
  lineItems: LineItem[]
}

interface Agent {
  id: string
  name: string
  email: string
  company: string
}

interface ApiResponse {
  inspection: InspectionDetails
  agent: Agent | null
  error?: string
}

// Status display config
const statusConfig: Record<string, { label: string; color: string }> = {
  'scheduled': { label: 'Scheduled', color: 'bg-slate-100 text-slate-700' },
  'pending-confirmation': { label: 'Pending Your Confirmation', color: 'bg-amber-100 text-amber-700' },
  'confirmed': { label: 'Confirmed - Awaiting Payment', color: 'bg-blue-100 text-blue-700' },
  'paid': { label: 'Payment Received - Ready to Inspect', color: 'bg-green-100 text-green-700' },
  'in-progress': { label: 'Inspection In Progress', color: 'bg-indigo-100 text-indigo-700' },
  'report-submitted': { label: 'Report Submitted', color: 'bg-purple-100 text-purple-700' },
}

export default function AgentInspectionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inspection, setInspection] = useState<InspectionDetails | null>(null)
  const [agent, setAgent] = useState<Agent | null>(null)

  // Confirmation form state
  const [showConfirmForm, setShowConfirmForm] = useState(false)
  const [confirmedDate, setConfirmedDate] = useState('')
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Fetch inspection details
  useEffect(() => {
    async function fetchInspection() {
      try {
        const response = await fetch(`/api/inspections/agent/${token}`)
        const data: ApiResponse = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch inspection')
        }

        setInspection(data.inspection)
        setAgent(data.agent)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchInspection()
  }, [token])

  // Handle confirmation submission
  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    if (!confirmedDate || !invoiceAmount) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/inspections/agent/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm',
          confirmedDate,
          invoiceAmount: parseFloat(invoiceAmount),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to confirm inspection')
      }

      setSuccessMessage('Inspection confirmed successfully! You will receive payment before the inspection date.')
      setShowConfirmForm(false)
      // Refresh inspection data
      setInspection(prev => prev ? { ...prev, status: 'confirmed', confirmedDate } : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle report submission
  async function handleSubmitReport() {
    setSubmitting(true)
    try {
      const response = await fetch(`/api/inspections/agent/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit-report' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit report')
      }

      setSuccessMessage('Report submitted successfully! The internal team will review your findings.')
      setInspection(prev => prev ? { ...prev, status: 'report-submitted' } : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading inspection details...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6 max-w-md w-full text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-slate-900 mb-2">Unable to Access Inspection</h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!inspection) return null

  const status = statusConfig[inspection.status] || { label: inspection.status, color: 'bg-slate-100 text-slate-700' }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Inspection Portal</h1>
              <p className="text-sm text-slate-500">InventoryOps Quality Control</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Status Banner */}
        <div className={`rounded-lg p-4 mb-6 ${status.color}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <span>{status.label}</span>
            </div>
            {inspection.status === 'pending-confirmation' && !showConfirmForm && (
              <button
                onClick={() => setShowConfirmForm(true)}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Confirm Inspection
              </button>
            )}
            {['paid', 'in-progress'].includes(inspection.status) && (
              <button
                onClick={handleSubmitReport}
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            )}
          </div>
        </div>

        {/* Confirmation Form */}
        {showConfirmForm && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Confirm Inspection Details</h2>
            <form onSubmit={handleConfirm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Confirmed Inspection Date
                </label>
                <input
                  type="date"
                  value={confirmedDate}
                  onChange={e => setConfirmedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Suggested: {new Date(inspection.scheduledDate).toLocaleDateString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Invoice Amount (USD)
                </label>
                <input
                  type="number"
                  value={invoiceAmount}
                  onChange={e => setInvoiceAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Enter your total fee for this inspection
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowConfirmForm(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Confirming...' : 'Confirm & Submit Invoice'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Inspection Details */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Inspection Details</h2>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Purchase Order</p>
                <p className="font-medium text-slate-900">{inspection.purchaseOrderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Supplier</p>
                <p className="font-medium text-slate-900">{inspection.supplierName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Scheduled Date</p>
                <p className="font-medium text-slate-900">
                  {new Date(inspection.scheduledDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Confirmed Date</p>
                <p className="font-medium text-slate-900">
                  {inspection.confirmedDate
                    ? new Date(inspection.confirmedDate).toLocaleDateString()
                    : 'Not confirmed'}
                </p>
              </div>
            </div>

            {inspection.notes && (
              <div className="pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-500 mb-1">Notes</p>
                <p className="text-slate-900">{inspection.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mt-6">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Items to Inspect</h2>
          </div>

          <div className="divide-y divide-slate-200">
            {inspection.lineItems.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                No line items found for this inspection.
              </div>
            ) : (
              inspection.lineItems.map(item => (
                <div key={item.id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{item.productName}</p>
                      <p className="text-sm text-slate-500">SKU: {item.productSku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Ordered Qty</p>
                      <p className="font-medium text-slate-900">{item.orderedQuantity}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Agent Info */}
        {agent && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mt-6">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Assigned Agent</h3>
            <p className="font-medium text-slate-900">{agent.name}</p>
            <p className="text-sm text-slate-500">{agent.company}</p>
            <p className="text-sm text-slate-500">{agent.email}</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-slate-500">
          <p>InventoryOps Quality Control System</p>
          <p className="mt-1">Questions? Contact the operations team.</p>
        </div>
      </footer>
    </div>
  )
}

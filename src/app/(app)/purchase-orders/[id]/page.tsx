'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Edit, FileDown, Link2, Boxes, ArrowRightLeft, MapPin, Calendar, Package, DollarSign, Clock, FileText, Check, ChevronLeft, ChevronRight, XCircle } from 'lucide-react'
import Link from 'next/link'
import { usePurchaseOrders, useBatches, useMagicLinks } from '@/lib/supabase/hooks'
import { downloadPOPDF } from '@/sections/purchase-orders/POPDFDocument'
import { GenerateMagicLinkModal } from '@/sections/magic-links/components'
import type { PurchaseOrder, POStatus, POStatusOption } from '@/sections/purchase-orders/types'
import type { Batch } from '@/sections/inventory/types'

const PO_STATUSES: POStatusOption[] = [
  { id: 'draft', label: 'Draft', order: 1 },
  { id: 'sent', label: 'Sent', order: 2 },
  { id: 'awaiting_invoice', label: 'Awaiting Invoice', order: 3 },
  { id: 'invoice_received', label: 'Invoice Received', order: 4 },
  { id: 'confirmed', label: 'Confirmed', order: 5 },
  { id: 'production_complete', label: 'Production Complete', order: 6 },
  { id: 'partially-received', label: 'Partially Received', order: 7 },
  { id: 'received', label: 'Received', order: 8 },
  { id: 'cancelled', label: 'Cancelled', order: 9 },
]

const STATUS_TRANSITIONS: Record<POStatus, { status: POStatus; label: string; primary?: boolean; variant?: 'forward' | 'back' | 'cancel' }[]> = {
  draft: [
    { status: 'cancelled', label: 'Cancel Order', variant: 'cancel' }
  ],
  sent: [
    { status: 'awaiting_invoice', label: 'Awaiting Invoice', primary: true, variant: 'forward' },
    { status: 'draft', label: 'Back to Draft', variant: 'back' },
    { status: 'cancelled', label: 'Cancel Order', variant: 'cancel' }
  ],
  awaiting_invoice: [
    { status: 'invoice_received', label: 'Invoice Received', primary: true, variant: 'forward' },
    { status: 'sent', label: 'Back to Sent', variant: 'back' },
    { status: 'cancelled', label: 'Cancel Order', variant: 'cancel' }
  ],
  invoice_received: [
    { status: 'confirmed', label: 'Confirm Order', primary: true, variant: 'forward' },
    { status: 'awaiting_invoice', label: 'Back to Awaiting', variant: 'back' },
    { status: 'cancelled', label: 'Cancel Order', variant: 'cancel' }
  ],
  confirmed: [
    { status: 'production_complete', label: 'Production Complete', primary: true, variant: 'forward' },
    { status: 'invoice_received', label: 'Back to Invoice Received', variant: 'back' },
    { status: 'cancelled', label: 'Cancel Order', variant: 'cancel' }
  ],
  'production_complete': [
    { status: 'ready-to-ship', label: 'Ready to Ship', primary: true, variant: 'forward' },
    { status: 'confirmed', label: 'Back to Confirmed', variant: 'back' }
  ],
  'ready-to-ship': [
    { status: 'received', label: 'Mark as Received', primary: true, variant: 'forward' },
    { status: 'partially-received', label: 'Partial Receipt', variant: 'forward' },
    { status: 'production_complete', label: 'Back to Production Complete', variant: 'back' }
  ],
  'partially-received': [
    { status: 'received', label: 'Mark as Received', primary: true, variant: 'forward' },
    { status: 'production_complete', label: 'Back to Production Complete', variant: 'back' }
  ],
  received: [
    { status: 'production_complete', label: 'Revert to Production Complete', variant: 'back' },
    { status: 'partially-received', label: 'Revert to Partial', variant: 'back' }
  ],
  cancelled: [
    { status: 'draft', label: 'Reopen as Draft', variant: 'back' }
  ]
}

const statusColors: Record<POStatus, { bg: string; text: string; dot: string }> = {
  draft: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-300', dot: 'bg-slate-400' },
  sent: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  awaiting_invoice: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' },
  invoice_received: { bg: 'bg-lime-100 dark:bg-lime-900/30', text: 'text-lime-700 dark:text-lime-300', dot: 'bg-lime-500' },
  confirmed: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500' },
  'production_complete': { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300', dot: 'bg-teal-500' },
  'ready-to-ship': { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300', dot: 'bg-cyan-500' },
  'partially-received': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  received: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
}

const stageBadgeColors: Record<string, { bg: string; text: string }> = {
  ordered: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-300' },
  factory: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  inspected: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  ready_to_ship: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300' },
  'in-transit': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
  warehouse: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300' },
  amazon: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
}

const stageLabels: Record<string, string> = {
  ordered: 'Ordered',
  factory: 'At Factory',
  inspected: 'Inspected',
  ready_to_ship: 'Ready to Ship',
  'in-transit': 'In Transit',
  warehouse: 'Warehouse',
  amazon: 'Amazon',
}

// Workflow steps for the timeline (excluding cancelled)
const WORKFLOW_STEPS: { id: POStatus; label: string; shortLabel: string }[] = [
  { id: 'draft', label: 'Draft', shortLabel: 'Draft' },
  { id: 'sent', label: 'Sent to Supplier', shortLabel: 'Sent' },
  { id: 'awaiting_invoice', label: 'Awaiting Invoice', shortLabel: 'Awaiting' },
  { id: 'invoice_received', label: 'Invoice Received', shortLabel: 'Invoice' },
  { id: 'confirmed', label: 'Confirmed', shortLabel: 'Confirmed' },
  { id: 'production_complete', label: 'Production Complete', shortLabel: 'Production' },
  { id: 'ready-to-ship', label: 'Ready to Ship', shortLabel: 'Ready' },
  { id: 'received', label: 'Received', shortLabel: 'Received' },
]

// Timeline component
function POTimeline({
  currentStatus,
  onStatusChange,
  updating,
  isCancelled
}: {
  currentStatus: POStatus
  onStatusChange: (status: POStatus) => void
  updating: boolean
  isCancelled: boolean
}) {
  const currentIndex = WORKFLOW_STEPS.findIndex(s => s.id === currentStatus)
  const canGoBack = currentIndex > 0 && !isCancelled
  const canGoForward = currentIndex < WORKFLOW_STEPS.length - 1 && currentIndex >= 0 && !isCancelled

  const getPrevStatus = () => currentIndex > 0 ? WORKFLOW_STEPS[currentIndex - 1].id : null
  const getNextStatus = () => currentIndex < WORKFLOW_STEPS.length - 1 ? WORKFLOW_STEPS[currentIndex + 1].id : null

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Timeline header with navigation */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-slate-900 dark:text-white">Order Progress</h3>
          {!isCancelled && currentStatus !== 'received' && (
            <button
              onClick={() => onStatusChange('cancelled' as POStatus)}
              disabled={updating}
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline transition-colors disabled:opacity-40"
            >
              Cancel Order
            </button>
          )}
        </div>
        {!isCancelled && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => getPrevStatus() && onStatusChange(getPrevStatus()!)}
              disabled={!canGoBack || updating}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Back
            </button>
            <button
              onClick={() => getNextStatus() && onStatusChange(getNextStatus()!)}
              disabled={!canGoForward || updating}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Cancelled banner */}
      {isCancelled && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
              <XCircle className="w-4 h-4" />
              <span className="font-medium">This order has been cancelled</span>
            </div>
            <button
              onClick={() => onStatusChange('draft' as POStatus)}
              disabled={updating}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition-colors disabled:opacity-40"
            >
              Reopen as Draft
            </button>
          </div>
        </div>
      )}

      {/* Timeline steps */}
      <div className="px-4 py-4">
        <div className="relative">
          {/* Progress line background */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-600" />

          {/* Progress line filled */}
          {currentIndex >= 0 && (
            <div
              className={`absolute top-4 left-0 h-0.5 transition-all duration-300 ${isCancelled ? 'bg-red-400' : 'bg-indigo-500'}`}
              style={{ width: `${(currentIndex / (WORKFLOW_STEPS.length - 1)) * 100}%` }}
            />
          )}

          {/* Steps */}
          <div className="relative flex justify-between">
            {WORKFLOW_STEPS.map((step, index) => {
              const isCompleted = currentIndex > index
              const isCurrent = currentIndex === index
              const isFuture = currentIndex < index

              return (
                <div key={step.id} className="flex flex-col items-center" style={{ width: '12.5%' }}>
                  {/* Step circle */}
                  <button
                    onClick={() => {
                      if (!isCancelled && !updating && index !== currentIndex) {
                        onStatusChange(step.id)
                      }
                    }}
                    disabled={isCancelled || updating}
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all
                      ${isCompleted
                        ? isCancelled
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-2 border-red-400'
                          : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-500'
                        : isCurrent
                          ? isCancelled
                            ? 'bg-red-600 text-white border-2 border-red-600 ring-4 ring-red-100 dark:ring-red-900/50'
                            : 'bg-indigo-600 text-white border-2 border-indigo-600 ring-4 ring-indigo-100 dark:ring-indigo-900/50'
                          : 'bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-500 border-2 border-slate-200 dark:border-slate-600'
                      }
                      ${!isCancelled && !updating && index !== currentIndex ? 'cursor-pointer hover:scale-110' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </button>

                  {/* Step label */}
                  <span className={`
                    mt-2 text-xs text-center leading-tight
                    ${isCurrent
                      ? 'font-semibold text-slate-900 dark:text-white'
                      : isCompleted
                        ? 'font-medium text-slate-600 dark:text-slate-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }
                  `}>
                    {step.shortLabel}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PurchaseOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const poId = params.id as string

  const { purchaseOrders, loading, updateStatus, refetch } = usePurchaseOrders()
  const { fetchBatchesByPO } = useBatches()
  const { createMagicLink } = useMagicLinks()

  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null)
  const [linkedBatches, setLinkedBatches] = useState<Batch[]>([])
  const [loadingBatches, setLoadingBatches] = useState(false)
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([])
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [isMagicLinkModalOpen, setIsMagicLinkModalOpen] = useState(false)

  // Find the PO from the list
  useEffect(() => {
    if (!loading && purchaseOrders.length > 0) {
      const po = purchaseOrders.find(p => p.id === poId)
      setPurchaseOrder(po || null)

      // Fetch batches if appropriate status
      if (po && ['production_complete', 'partially-received', 'received'].includes(po.status)) {
        setLoadingBatches(true)
        fetchBatchesByPO(poId)
          .then(batches => setLinkedBatches(batches))
          .catch(err => console.error('Failed to fetch batches:', err))
          .finally(() => setLoadingBatches(false))
      }
    }
  }, [loading, purchaseOrders, poId, fetchBatchesByPO])

  const handleUpdateStatus = useCallback(async (newStatus: POStatus) => {
    if (!purchaseOrder) return
    setUpdatingStatus(true)
    try {
      const success = await updateStatus(purchaseOrder.id, newStatus)
      if (success) {
        await refetch()
        // Refetch batches if needed
        if (['production_complete', 'partially-received', 'received'].includes(newStatus)) {
          const batches = await fetchBatchesByPO(poId)
          setLinkedBatches(batches)
        }
      }
    } catch (err) {
      console.error('Status update error:', err)
    } finally {
      setUpdatingStatus(false)
    }
  }, [purchaseOrder, updateStatus, refetch, fetchBatchesByPO, poId])

  const handleExportPDF = useCallback(async () => {
    if (purchaseOrder) {
      await downloadPOPDF(purchaseOrder, PO_STATUSES)
    }
  }, [purchaseOrder])

  const handleCreateTransfer = useCallback((batchIds: string[]) => {
    sessionStorage.setItem('preselectedBatchIds', JSON.stringify(batchIds))
    router.push('/transfers?action=create')
  }, [router])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading purchase order...</p>
        </div>
      </div>
    )
  }

  if (!purchaseOrder) {
    return (
      <div className="min-h-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Purchase Order Not Found</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">The requested purchase order could not be found.</p>
          <Link
            href="/purchase-orders"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Purchase Orders
          </Link>
        </div>
      </div>
    )
  }

  const statusStyle = statusColors[purchaseOrder.status]
  const statusLabel = PO_STATUSES.find(s => s.id === purchaseOrder.status)?.label || purchaseOrder.status
  const availableTransitions = STATUS_TRANSITIONS[purchaseOrder.status] || []

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/purchase-orders"
                className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {purchaseOrder.poNumber}
                  </h1>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                    {statusLabel}
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {purchaseOrder.supplierName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMagicLinkModalOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
              >
                <Link2 className="w-4 h-4" />
                Magic Link
              </button>
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                <FileDown className="w-4 h-4" />
                Export PDF
              </button>
              <Link
                href={`/purchase-orders?edit=${purchaseOrder.id}`}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                <Package className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Supplier</span>
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {purchaseOrder.supplierName}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Order Date</span>
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {formatDate(purchaseOrder.orderDate)}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Expected</span>
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {formatDate(purchaseOrder.expectedDate)}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Total</span>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                ${purchaseOrder.total.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Order Progress Timeline */}
          <POTimeline
            currentStatus={purchaseOrder.status}
            onStatusChange={handleUpdateStatus}
            updating={updatingStatus}
            isCancelled={purchaseOrder.status === 'cancelled'}
          />

          {/* Line Items */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                Line Items ({purchaseOrder.lineItems.length})
              </h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">SKU</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Product</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Unit Cost</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                {purchaseOrder.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm font-mono text-slate-600 dark:text-slate-400">{item.sku}</td>
                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">{item.productName}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-600 dark:text-slate-400">{item.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-600 dark:text-slate-400">${item.unitCost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-slate-900 dark:text-white">${item.subtotal.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 dark:border-slate-500 bg-slate-50 dark:bg-slate-700/50">
                  <td colSpan={4} className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white text-right">Total</td>
                  <td className="px-4 py-3 text-sm font-semibold text-right text-slate-900 dark:text-white">${purchaseOrder.total.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Details */}
          {(purchaseOrder.paymentTerms || purchaseOrder.notes) && (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {purchaseOrder.paymentTerms && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Payment Terms</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{purchaseOrder.paymentTerms}</p>
                  </div>
                )}
                {purchaseOrder.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Notes
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{purchaseOrder.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status History */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Status History</h3>
            <div className="space-y-3">
              {purchaseOrder.statusHistory.map((entry, index) => {
                const entryStatusStyle = statusColors[entry.status]
                const entryLabel = PO_STATUSES.find(s => s.id === entry.status)?.label || entry.status
                return (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${entryStatusStyle.dot}`} />
                      {index < purchaseOrder.statusHistory.length - 1 && (
                        <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-600 my-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${entryStatusStyle.text}`}>{entryLabel}</span>
                        <span className="text-xs text-slate-400">{formatDateTime(entry.date)}</span>
                      </div>
                      {entry.note && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{entry.note}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Inventory Batches */}
          {['production_complete', 'partially-received', 'received'].includes(purchaseOrder.status) && (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                  <Boxes className="w-4 h-4" />
                  Inventory Batches ({linkedBatches.length})
                </h3>
                {linkedBatches.length > 0 && (
                  <button
                    onClick={() => {
                      const batchIds = selectedBatchIds.length > 0 ? selectedBatchIds : linkedBatches.map(b => b.id)
                      handleCreateTransfer(batchIds)
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Create Transfer
                    {selectedBatchIds.length > 0 && ` (${selectedBatchIds.length})`}
                  </button>
                )}
              </div>

              {loadingBatches ? (
                <div className="p-4 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                  <span className="ml-2 text-sm text-slate-500">Loading batches...</span>
                </div>
              ) : linkedBatches.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50">
                      <th className="px-3 py-2 text-left w-8">
                        <input
                          type="checkbox"
                          checked={selectedBatchIds.length === linkedBatches.length && linkedBatches.length > 0}
                          onChange={(e) => setSelectedBatchIds(e.target.checked ? linkedBatches.map(b => b.id) : [])}
                          className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Batch</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Product</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Qty</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Stage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                    {linkedBatches.map((batch) => {
                      const stageStyle = stageBadgeColors[batch.stage] || stageBadgeColors.ordered
                      return (
                        <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={selectedBatchIds.includes(batch.id)}
                              onChange={(e) => setSelectedBatchIds(prev => e.target.checked ? [...prev, batch.id] : prev.filter(id => id !== batch.id))}
                              className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <span className="text-sm font-mono text-slate-600 dark:text-slate-400">{batch.batchNumber}</span>
                          </td>
                          <td className="px-3 py-2">
                            <div>
                              <span className="text-sm text-slate-900 dark:text-white">{batch.productName}</span>
                              <span className="block text-xs text-slate-500 font-mono">{batch.sku}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{batch.quantity.toLocaleString()}</span>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${stageStyle.bg} ${stageStyle.text}`}>
                              <MapPin className="w-3 h-3" />
                              {stageLabels[batch.stage] || batch.stage}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center">
                  <Boxes className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">No inventory batches linked to this PO yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Batches are created when goods are received at the factory.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Magic Link Modal */}
      <GenerateMagicLinkModal
        isOpen={isMagicLinkModalOpen}
        entityType="purchase-order"
        entityId={purchaseOrder.id}
        entityName={`${purchaseOrder.poNumber} - ${purchaseOrder.supplierName}`}
        defaultPurpose="invoice-submission"
        defaultRecipientName={purchaseOrder.supplierName}
        onClose={() => setIsMagicLinkModalOpen(false)}
        onGenerate={createMagicLink}
      />
    </div>
  )
}

'use client'

import { useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { FileText, Ship } from 'lucide-react'
import { useInvoices } from '@/lib/supabase/hooks/useInvoices'
import { useShippingInvoices } from '@/lib/supabase/hooks/useShippingInvoices'
import { useBrands } from '@/lib/supabase/hooks/useBrands'
import { usePurchaseOrders } from '@/lib/supabase/hooks/usePurchaseOrders'
import {
  InvoicesPaymentsView,
  INVOICE_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from '@/sections/invoices-payments'
import { ShippingInvoicesSection } from '@/sections/invoices'
import { PODetailModal } from '@/sections/purchase-orders/PODetailModal'
import type { PurchaseOrder, POStatusOption } from '@/sections/purchase-orders/types'
import type { LinkedEntityType, NewPayment, EditableScheduleItem } from '@/sections/invoices-payments/types'

type InvoiceCategory = 'purchase-orders' | 'shipping'

// PO Status options for the detail modal
const PO_STATUSES: POStatusOption[] = [
  { id: 'draft', label: 'Draft', order: 1 },
  { id: 'sent', label: 'Sent', order: 2 },
  { id: 'confirmed', label: 'Confirmed', order: 3 },
  { id: 'partially-received', label: 'Partially Received', order: 4 },
  { id: 'received', label: 'Received', order: 5 },
  { id: 'cancelled', label: 'Cancelled', order: 6 },
]

export default function InvoicesAndPaymentsPage() {
  const searchParams = useSearchParams()
  const selectedInvoiceId = searchParams.get('invoice')

  const {
    invoices,
    paymentsWithInvoice,
    summary,
    loading,
    error,
    refetch,
    recordPayment,
    updateScheduleItems,
    addPaymentAttachments,
    deletePayment,
  } = useInvoices()

  const {
    invoiceSummaries: shippingInvoiceSummaries,
    stats: shippingStats,
    loading: shippingLoading,
    error: shippingError,
    refetch: refetchShipping,
    updateInvoiceStatus: updateShippingStatus,
    deleteInvoice: deleteShippingInvoice,
  } = useShippingInvoices()

  const { brands } = useBrands()
  const { fetchPurchaseOrder, updateStatus: updatePOStatus } = usePurchaseOrders()

  // State for invoice category (PO invoices vs Shipping invoices)
  const [invoiceCategory, setInvoiceCategory] = useState<InvoiceCategory>('purchase-orders')

  // State for linked entity sidebar
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [poDetailOpen, setPODetailOpen] = useState(false)
  const [loadingLinkedEntity, setLoadingLinkedEntity] = useState(false)

  // View linked entity in sidebar
  const handleViewLinkedEntity = useCallback(async (type: LinkedEntityType, id: string) => {
    if (type === 'purchase-order') {
      setLoadingLinkedEntity(true)
      const po = await fetchPurchaseOrder(id)
      setSelectedPO(po)
      setPODetailOpen(true)
      setLoadingLinkedEntity(false)
    }
    // Future: handle other entity types (shipment, batch, inspection)
  }, [fetchPurchaseOrder])

  const handleClosePODetail = useCallback(() => {
    setPODetailOpen(false)
    setSelectedPO(null)
  }, [])

  // Wrapper for PO status update (adapts return type)
  const handleUpdatePOStatus = useCallback(async (id: string, newStatus: Parameters<typeof updatePOStatus>[1]) => {
    await updatePOStatus(id, newStatus)
    // Refresh the PO to get updated data
    const updatedPO = await fetchPurchaseOrder(id)
    if (updatedPO) {
      setSelectedPO(updatedPO)
    }
  }, [updatePOStatus, fetchPurchaseOrder])

  // Record payment with file upload
  const handleRecordPayment = async (invoiceId: string, payment: NewPayment) => {
    const success = await recordPayment(invoiceId, payment)
    if (!success) {
      // Error is already set in the hook
      console.error('Failed to record payment')
    }
  }

  // Update payment milestones
  const handleUpdateMilestones = async (invoiceId: string, items: EditableScheduleItem[]) => {
    return await updateScheduleItems(invoiceId, items)
  }

  // Add attachments to existing payment
  const handleAddPaymentAttachments = async (invoiceId: string, paymentId: string, files: File[]) => {
    return await addPaymentAttachments(invoiceId, paymentId, files)
  }

  // Delete payment
  const handleDeletePayment = async (invoiceId: string, paymentId: string) => {
    return await deletePayment(invoiceId, paymentId)
  }

  // Convert brands to the format expected by the view
  const brandOptions = brands.map(b => ({
    id: b.id,
    name: b.name,
  }))

  const currentError = invoiceCategory === 'purchase-orders' ? error : shippingError

  if (currentError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{currentError.message}</p>
          <button
            onClick={invoiceCategory === 'purchase-orders' ? refetch : refetchShipping}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Category Tabs */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Invoices & Payments
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Track invoices and manage payments
            </p>
          </div>
          <div className="px-6 border-b border-slate-200 dark:border-slate-700">
            <nav className="flex gap-6">
              <button
                onClick={() => setInvoiceCategory('purchase-orders')}
                className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                  invoiceCategory === 'purchase-orders'
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <FileText className="w-4 h-4" />
                Purchase Orders
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                  {invoices.length}
                </span>
              </button>
              <button
                onClick={() => setInvoiceCategory('shipping')}
                className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                  invoiceCategory === 'shipping'
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Ship className="w-4 h-4" />
                Shipping
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                  {shippingInvoiceSummaries.length}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Content based on selected category */}
        {invoiceCategory === 'purchase-orders' ? (
          <InvoicesPaymentsView
            invoices={invoices}
            payments={paymentsWithInvoice}
            invoiceTypes={INVOICE_TYPES}
            paymentMethods={PAYMENT_METHODS}
            paymentStatuses={PAYMENT_STATUSES}
            brands={brandOptions}
            summary={summary}
            loading={loading}
            error={error}
            selectedInvoiceId={selectedInvoiceId}
            onRecordPayment={handleRecordPayment}
            onUpdateMilestones={handleUpdateMilestones}
            onAddPaymentAttachments={handleAddPaymentAttachments}
            onDeletePayment={handleDeletePayment}
            onViewLinkedEntity={handleViewLinkedEntity}
            onRefresh={refetch}
          />
        ) : (
          <div className="p-6">
            <ShippingInvoicesSection
              invoices={shippingInvoiceSummaries}
              stats={shippingStats}
              loading={shippingLoading}
              onNewInvoice={() => {
                // TODO: Open new shipping invoice form
              }}
              onViewInvoice={(invoiceId) => {
                // TODO: Open invoice detail view
              }}
              onUpdateStatus={updateShippingStatus}
              onDeleteInvoice={deleteShippingInvoice}
            />
          </div>
        )}
      </div>

      {/* Purchase Order Detail Sidebar */}
      <PODetailModal
        isOpen={poDetailOpen}
        onClose={handleClosePODetail}
        purchaseOrder={selectedPO}
        poStatuses={PO_STATUSES}
        onUpdateStatus={async (id, newStatus) => { await updatePOStatus(id, newStatus) }}
      />
    </>
  )
}

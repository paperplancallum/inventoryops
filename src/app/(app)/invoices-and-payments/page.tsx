'use client'

import { useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
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
import { PODetailModal } from '@/sections/purchase-orders/PODetailModal'
import type { PurchaseOrder, POStatusOption } from '@/sections/purchase-orders/types'
import type {
  LinkedEntityType,
  NewPayment,
  EditableScheduleItem,
  Invoice,
  PaymentStatus,
} from '@/sections/invoices-payments/types'
import type { ShippingInvoiceSummary } from '@/sections/shipping-quotes/invoice-types'

// PO Status options for the detail modal
const PO_STATUSES: POStatusOption[] = [
  { id: 'draft', label: 'Draft', order: 1 },
  { id: 'sent', label: 'Sent', order: 2 },
  { id: 'confirmed', label: 'Confirmed', order: 3 },
  { id: 'partially-received', label: 'Partially Received', order: 4 },
  { id: 'received', label: 'Received', order: 5 },
  { id: 'cancelled', label: 'Cancelled', order: 6 },
]

// Map shipping invoice status to payment status
function mapShippingStatus(status: ShippingInvoiceSummary['status'], isOverdue: boolean): PaymentStatus {
  if (isOverdue) return 'overdue'
  if (status === 'paid') return 'paid'
  return 'unpaid' // 'received' and 'approved' both map to unpaid
}

// Convert shipping invoice to unified Invoice format
function mapShippingInvoiceToInvoice(shipping: ShippingInvoiceSummary): Invoice {
  const isPaid = shipping.status === 'paid'
  return {
    id: `shipping-${shipping.id}`, // Prefix to avoid ID collisions
    invoiceNumber: shipping.invoiceNumber,
    invoiceDate: shipping.invoiceDate,
    description: `Shipping - ${shipping.shippingAgentName}`,
    type: 'shipping',
    linkedEntityType: 'shipment',
    linkedEntityId: shipping.id, // Use the shipping invoice ID
    linkedEntityName: shipping.transferNumbers.length > 0
      ? shipping.transferNumbers.slice(0, 2).join(', ') + (shipping.transferNumbers.length > 2 ? ` +${shipping.transferNumbers.length - 2}` : '')
      : shipping.shippingAgentName,
    amount: shipping.totalAmount,
    paidAmount: isPaid ? shipping.totalAmount : 0,
    balance: isPaid ? 0 : shipping.totalAmount,
    status: mapShippingStatus(shipping.status, shipping.isOverdue),
    dueDate: shipping.dueDate,
    paymentSchedule: [], // Shipping invoices don't have payment schedules
    payments: [], // Would need to fetch separately if needed
    notes: null,
    creationMethod: 'manual',
    paymentTermsTemplateId: null,
    brandId: null,
    brandName: null,
    createdAt: shipping.invoiceDate,
    updatedAt: shipping.invoiceDate,
  }
}

export default function InvoicesAndPaymentsPage() {
  const searchParams = useSearchParams()
  const selectedInvoiceId = searchParams.get('invoice')

  const {
    invoices: poInvoices,
    paymentsWithInvoice,
    summary: poSummary,
    loading: poLoading,
    error: poError,
    refetch: refetchPO,
    recordPayment,
    updateScheduleItems,
    addPaymentAttachments,
    deletePayment,
  } = useInvoices()

  const {
    invoiceSummaries: shippingInvoiceSummaries,
    loading: shippingLoading,
    error: shippingError,
    refetch: refetchShipping,
  } = useShippingInvoices()

  const { brands } = useBrands()
  const { fetchPurchaseOrder, updateStatus: updatePOStatus } = usePurchaseOrders()

  // State for linked entity sidebar
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [poDetailOpen, setPODetailOpen] = useState(false)

  // Combine all invoices into a unified list
  const allInvoices = useMemo(() => {
    const mappedShippingInvoices = shippingInvoiceSummaries.map(mapShippingInvoiceToInvoice)
    return [...poInvoices, ...mappedShippingInvoices]
  }, [poInvoices, shippingInvoiceSummaries])

  // Combined summary
  const combinedSummary = useMemo(() => {
    const shippingTotal = shippingInvoiceSummaries.reduce((sum, inv) => sum + inv.totalAmount, 0)
    const shippingPaid = shippingInvoiceSummaries
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.totalAmount, 0)
    const shippingOverdue = shippingInvoiceSummaries.filter(inv => inv.isOverdue).length

    return {
      totalInvoices: poSummary.totalInvoices + shippingTotal,
      totalPaid: poSummary.totalPaid + shippingPaid,
      outstanding: poSummary.outstanding + (shippingTotal - shippingPaid),
      upcomingThisWeek: poSummary.upcomingThisWeek,
      overdueCount: poSummary.overdueCount + shippingOverdue,
    }
  }, [poSummary, shippingInvoiceSummaries])

  // View linked entity in sidebar
  const handleViewLinkedEntity = useCallback(async (type: LinkedEntityType, id: string) => {
    if (type === 'purchase-order') {
      const po = await fetchPurchaseOrder(id)
      setSelectedPO(po)
      setPODetailOpen(true)
    }
    // For shipment type, could navigate to transfers page or show a modal
    if (type === 'shipment') {
      // TODO: Handle shipment view - for now just log
      console.log('View shipment:', id)
    }
  }, [fetchPurchaseOrder])

  const handleClosePODetail = useCallback(() => {
    setPODetailOpen(false)
    setSelectedPO(null)
  }, [])

  // Record payment with file upload
  const handleRecordPayment = async (invoiceId: string, payment: NewPayment) => {
    // Only PO invoices support payment recording
    if (invoiceId.startsWith('shipping-')) {
      console.warn('Shipping invoices should be managed from the Transfers page')
      return
    }
    const success = await recordPayment(invoiceId, payment)
    if (!success) {
      console.error('Failed to record payment')
    }
  }

  // Update payment milestones
  const handleUpdateMilestones = async (invoiceId: string, items: EditableScheduleItem[]) => {
    if (invoiceId.startsWith('shipping-')) {
      console.warn('Shipping invoices do not support milestones')
      return false
    }
    return await updateScheduleItems(invoiceId, items)
  }

  // Add attachments to existing payment
  const handleAddPaymentAttachments = async (invoiceId: string, paymentId: string, files: File[]) => {
    if (invoiceId.startsWith('shipping-')) return false
    return await addPaymentAttachments(invoiceId, paymentId, files)
  }

  // Delete payment
  const handleDeletePayment = async (invoiceId: string, paymentId: string) => {
    if (invoiceId.startsWith('shipping-')) return false
    return await deletePayment(invoiceId, paymentId)
  }

  // Refresh all data
  const handleRefresh = useCallback(() => {
    refetchPO()
    refetchShipping()
  }, [refetchPO, refetchShipping])

  // Convert brands to the format expected by the view
  const brandOptions = brands.map(b => ({
    id: b.id,
    name: b.name,
  }))

  const loading = poLoading || shippingLoading
  const error = poError || shippingError

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error.message}</p>
          <button
            onClick={handleRefresh}
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
      <InvoicesPaymentsView
        invoices={allInvoices}
        payments={paymentsWithInvoice}
        invoiceTypes={INVOICE_TYPES}
        paymentMethods={PAYMENT_METHODS}
        paymentStatuses={PAYMENT_STATUSES}
        brands={brandOptions}
        summary={combinedSummary}
        loading={loading}
        error={error}
        selectedInvoiceId={selectedInvoiceId}
        onRecordPayment={handleRecordPayment}
        onUpdateMilestones={handleUpdateMilestones}
        onAddPaymentAttachments={handleAddPaymentAttachments}
        onDeletePayment={handleDeletePayment}
        onViewLinkedEntity={handleViewLinkedEntity}
        onRefresh={handleRefresh}
      />

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

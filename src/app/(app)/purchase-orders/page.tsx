'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { PurchaseOrdersView } from '@/sections/purchase-orders/PurchaseOrdersView'
import { POViewTabs } from '@/sections/purchase-orders/POViewTabs'
import { LineItemsView } from '@/sections/purchase-orders/LineItemsView'
import { POFormModal } from '@/sections/purchase-orders/POFormModal'
import { PODetailModal } from '@/sections/purchase-orders/PODetailModal'
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal'
import { downloadPOPDF } from '@/sections/purchase-orders/POPDFDocument'
import { useRouter, useSearchParams } from 'next/navigation'
import { usePurchaseOrders, useSuppliers, useProducts, useSendPO, usePaymentTermsTemplates, useBatches } from '@/lib/supabase/hooks'
import type { Batch } from '@/sections/inventory/types'
import type { PurchaseOrder, POStatus, POStatusOption, POFormData, Product } from '@/sections/purchase-orders/types'

// Static PO status options
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

export default function PurchaseOrdersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Data hooks
  const {
    purchaseOrders,
    flatLineItems,
    lineItemsSummary,
    loading: posLoading,
    createPurchaseOrder,
    updatePurchaseOrder,
    updateStatus,
    deletePurchaseOrder,
    duplicatePurchaseOrder,
    refetch: refetchPOs,
  } = usePurchaseOrders()

  const { fetchBatchesByPO } = useBatches()


  const { suppliers, loading: suppliersLoading } = useSuppliers()
  const { products, loading: productsLoading } = useProducts()
  const { templates: paymentTermsTemplates, loading: templatesLoading } = usePaymentTermsTemplates()
  const { sendToSupplier, resendToSupplier, sending: sendingPO } = useSendPO()

  // Convert suppliers to the format expected by PO components
  const supplierOptions = useMemo(() =>
    suppliers.map(s => ({
      id: s.id,
      name: s.name,
      contactEmail: s.contactEmail,
      leadTimeDays: s.leadTimeDays,
      paymentTerms: s.paymentTerms,
      paymentTermsTemplateId: s.paymentTermsTemplateId,
    })),
    [suppliers]
  )

  // Convert payment terms templates to the format expected by PO form
  const paymentTermsOptions = useMemo(() =>
    paymentTermsTemplates.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
    })),
    [paymentTermsTemplates]
  )

  // Convert products to the format expected by PO form
  const productOptions: Product[] = useMemo(() =>
    products.map(p => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      unitCost: p.unitCost,
    })),
    [products]
  )

  // Tab state
  const [activeTab, setActiveTab] = useState<'orders' | 'line-items'>('orders')

  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Edit/View state
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null)
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    poNumber: string
  } | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [linkedBatches, setLinkedBatches] = useState<Batch[]>([])
  const [loadingBatches, setLoadingBatches] = useState(false)

  // URL param helpers for deep linking
  const updateUrlParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
    window.history.replaceState(null, '', newUrl)
  }, [searchParams])

  // State for suggestion prefill data
  const [prefillData, setPrefillData] = useState<{
    supplierId?: string
    lineItems?: { productId: string; sku: string; quantity: number }[]
    suggestionId?: string
  } | null>(null)

  // Handle URL params for deep linking
  useEffect(() => {
    const viewId = searchParams.get('view')
    const editId = searchParams.get('edit')
    const action = searchParams.get('action')

    // Redirect ?view= URLs to full page view
    if (viewId) {
      router.replace(`/purchase-orders/${viewId}`)
      return
    }

    // Handle create action from inventory intelligence
    if (action === 'create') {
      // Check for PO prefill data from inventory intelligence
      const storedPrefill = sessionStorage.getItem('poPrefill')
      if (storedPrefill) {
        try {
          const prefill = JSON.parse(storedPrefill)
          setPrefillData(prefill)
          sessionStorage.removeItem('poPrefill')
        } catch {
          console.error('Failed to parse PO prefill data')
        }
      }
      // Open the form
      setIsFormModalOpen(true)
      // Clear the URL param
      router.replace('/purchase-orders')
      return
    }

    if (posLoading || purchaseOrders.length === 0) return

    // Handle edit modal
    if (editId && !isFormModalOpen) {
      const po = purchaseOrders.find(p => p.id === editId)
      if (po) {
        setEditingPO(po)
        setIsFormModalOpen(true)
      }
    }
  }, [searchParams, purchaseOrders, posLoading, isFormModalOpen, router])

  // Handlers
  const handleCreatePO = useCallback(() => {
    setEditingPO(null)
    setIsFormModalOpen(true)
  }, [])

  const handleViewPO = useCallback((id: string) => {
    // Navigate to full page view
    router.push(`/purchase-orders/${id}`)
  }, [router])

  const handleEditPO = useCallback((id: string) => {
    const po = purchaseOrders.find((p) => p.id === id)
    if (po) {
      setEditingPO(po)
      setIsFormModalOpen(true)
      updateUrlParam('edit', id)
    }
  }, [purchaseOrders, updateUrlParam])

  const handleDeletePO = useCallback((id: string) => {
    const po = purchaseOrders.find((p) => p.id === id)
    if (po) {
      setDeleteTarget({
        id: po.id,
        poNumber: po.poNumber,
      })
      setIsDeleteModalOpen(true)
    }
  }, [purchaseOrders])

  const handleConfirmDelete = useCallback(async () => {
    if (deleteTarget) {
      await deletePurchaseOrder(deleteTarget.id)
      setDeleteTarget(null)
      setIsDeleteModalOpen(false)
    }
  }, [deleteTarget, deletePurchaseOrder])

  const handleDuplicatePO = useCallback(async (id: string) => {
    await duplicatePurchaseOrder(id)
  }, [duplicatePurchaseOrder])

  const handleExportPDF = useCallback(async (id: string) => {
    const po = purchaseOrders.find((p) => p.id === id)
    if (po) {
      try {
        await downloadPOPDF(po, PO_STATUSES)
      } catch (error) {
        console.error('Failed to export PDF:', error)
        alert('Failed to export PDF. Please try again.')
      }
    }
  }, [purchaseOrders])

  const handleSendToSupplier = useCallback(async (id: string, customMessage?: string) => {
    const po = purchaseOrders.find((p) => p.id === id)
    if (!po) return

    if (po.status !== 'draft') {
      alert('Only draft POs can be sent to supplier')
      return
    }

    const result = await sendToSupplier(id, customMessage)
    if (result.success) {
      alert(result.message || 'Purchase order sent successfully!')
      // Refresh to get updated status
      await refetchPOs()
      // Update the viewing PO if modal is open
      if (viewingPO?.id === id) {
        const updatedPO = purchaseOrders.find(p => p.id === id)
        if (updatedPO) {
          setViewingPO({ ...updatedPO, status: 'awaiting_invoice' })
        }
      }
    } else {
      alert(`Failed to send PO: ${result.error}`)
    }
  }, [purchaseOrders, sendToSupplier, refetchPOs, viewingPO])

  const handleResendToSupplier = useCallback(async (id: string) => {
    const po = purchaseOrders.find((p) => p.id === id)
    if (!po) return

    if (po.status !== 'awaiting_invoice') {
      alert('Can only resend reminders for orders awaiting invoice')
      return
    }

    const result = await resendToSupplier(id)
    if (result.success) {
      alert(result.message || 'Reminder sent successfully!')
    } else {
      alert(`Failed to resend reminder: ${result.error}`)
    }
  }, [purchaseOrders, resendToSupplier])

  const handleUpdateStatus = useCallback(async (id: string, newStatus: POStatus): Promise<boolean> => {
    setUpdatingStatus(true)
    try {
      const success = await updateStatus(id, newStatus)
      if (!success) {
        alert('Failed to update status. Please try again.')
        return false
      }
      // Refetch to get updated status history
      await refetchPOs()
      return true
    } catch (err) {
      console.error('Status update error:', err)
      alert(`Failed to update status: ${err instanceof Error ? err.message : 'Unknown error'}`)
      return false
    } finally {
      setUpdatingStatus(false)
    }
  }, [updateStatus, refetchPOs])

  const handleScheduleInspection = useCallback((id: string) => {
    // Placeholder - inspection section not built yet
    alert('Inspection scheduling coming soon!')
  }, [])

  const handleCreateTransferFromPO = useCallback((batchIds: string[]) => {
    // Store batch IDs in sessionStorage for the transfers page to pick up
    sessionStorage.setItem('preselectedBatchIds', JSON.stringify(batchIds))
    // Navigate to transfers page
    router.push('/transfers?action=create')
  }, [router])

  const handleAddToInspection = useCallback((poIds: string[]) => {
    // Store PO IDs in sessionStorage for the inspections page to pick up
    sessionStorage.setItem('preselectedPOIds', JSON.stringify(poIds))
    // Navigate to inspections page with create action
    router.push('/inspections?action=create')
  }, [router])

  const handleViewInspection = useCallback((inspectionId: string) => {
    router.push(`/inspections?view=${inspectionId}`)
  }, [router])

  const handleReviewInvoice = useCallback((poId: string) => {
    // Navigate to supplier invoices page with the PO filter and return URL
    const returnUrl = `/purchase-orders?view=${poId}`
    router.push(`/supplier-invoices?poId=${poId}&returnUrl=${encodeURIComponent(returnUrl)}`)
  }, [router])

  const handleFormSubmit = useCallback(async (data: POFormData, poId?: string) => {
    if (poId) {
      await updatePurchaseOrder(poId, data)
    } else {
      await createPurchaseOrder(data)
    }
    setIsFormModalOpen(false)
    setEditingPO(null)
  }, [createPurchaseOrder, updatePurchaseOrder])

  // Legacy form submit handler for POFormModal
  const handlePOSubmit = useCallback(async (
    poData: Omit<PurchaseOrder, 'id' | 'statusHistory'> & { id?: string }
  ) => {
    const formData: POFormData = {
      supplierId: poData.supplierId,
      orderDate: poData.orderDate,
      expectedDate: poData.expectedDate,
      paymentTerms: poData.paymentTerms,
      paymentTermsTemplateId: poData.paymentTermsTemplateId,
      notes: poData.notes,
      lineItems: poData.lineItems.map(item => ({
        productId: item.productId,
        sku: item.sku,
        productName: item.productName,
        quantity: item.quantity,
        unitCost: item.unitCost,
      })),
    }

    await handleFormSubmit(formData, poData.id)
  }, [handleFormSubmit])

  // Loading state
  const loading = posLoading || suppliersLoading || productsLoading || templatesLoading

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading purchase orders...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Tab Navigation */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6">
          <POViewTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            orderCount={purchaseOrders.length}
            lineItemCount={flatLineItems.length}
          />
        </div>

        {/* Content */}
        {activeTab === 'orders' ? (
          <PurchaseOrdersView
            purchaseOrders={purchaseOrders}
            poStatuses={PO_STATUSES}
            suppliers={supplierOptions}
            products={productOptions}
            onCreatePO={handleCreatePO}
            onViewPO={handleViewPO}
            onEditPO={handleEditPO}
            onDeletePO={handleDeletePO}
            onDuplicatePO={handleDuplicatePO}
            onExportPDF={handleExportPDF}
            onSendToSupplier={handleSendToSupplier}
            onUpdateStatus={handleUpdateStatus}
            onScheduleInspection={handleScheduleInspection}
            onAddToInspection={handleAddToInspection}
            onViewInspection={handleViewInspection}
            onRefresh={refetchPOs}
            loading={posLoading}
          />
        ) : (
          <div className="p-6">
            <LineItemsView
              lineItems={flatLineItems}
              summary={lineItemsSummary}
              poStatuses={PO_STATUSES}
              suppliers={supplierOptions}
              onViewPO={handleViewPO}
            />
          </div>
        )}
      </div>

      {/* PO Form Modal */}
      <POFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setEditingPO(null)
          setPrefillData(null)
          updateUrlParam('edit', null)
        }}
        onSubmit={handlePOSubmit}
        purchaseOrder={editingPO}
        suppliers={supplierOptions}
        products={productOptions}
        paymentTermsOptions={paymentTermsOptions}
        initialSupplierId={prefillData?.supplierId}
        initialLineItems={prefillData?.lineItems}
      />

      {/* PO Detail Modal */}
      <PODetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setViewingPO(null)
          setLinkedBatches([])
          updateUrlParam('view', null)
        }}
        purchaseOrder={viewingPO}
        poStatuses={PO_STATUSES}
        linkedBatches={linkedBatches}
        loadingBatches={loadingBatches}
        onEdit={() => {
          if (viewingPO) {
            setIsDetailModalOpen(false)
            handleEditPO(viewingPO.id)
          }
        }}
        onUpdateStatus={async (id, newStatus) => {
          const success = await handleUpdateStatus(id, newStatus)
          if (success) {
            // Refresh viewingPO with new status from the updated list
            const updatedPO = purchaseOrders.find(p => p.id === id)
            if (updatedPO) {
              setViewingPO({ ...updatedPO, status: newStatus })
            }
            // Refetch batches if status moved to production_complete or later
            if (['production_complete', 'partially-received', 'received'].includes(newStatus)) {
              setLoadingBatches(true)
              try {
                const batches = await fetchBatchesByPO(id)
                setLinkedBatches(batches)
              } catch (err) {
                console.error('Failed to fetch batches:', err)
              } finally {
                setLoadingBatches(false)
              }
            }
          }
        }}
        onCreateTransfer={handleCreateTransferFromPO}
        onSendToSupplier={handleSendToSupplier}
        onResendToSupplier={handleResendToSupplier}
        onReviewInvoice={handleReviewInvoice}
        updating={updatingStatus}
        sendingToSupplier={sendingPO}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setDeleteTarget(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Purchase Order"
        message="Are you sure you want to delete this purchase order?"
        itemName={deleteTarget?.poNumber}
      />

    </>
  )
}

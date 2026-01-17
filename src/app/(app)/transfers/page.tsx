'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTransfers } from '@/lib/supabase/hooks/useTransfers'
import { useShippingAgents } from '@/lib/supabase/hooks/useShippingAgents'
import { useAmazonShipments } from '@/lib/supabase/hooks/useAmazonShipments'
import { useLocations } from '@/lib/supabase/hooks/useLocations'
import {
  TransfersView,
  TransferDetail,
  TransferForm,
  ShippingAgentForm,
  ShippingAgentDetail,
} from '@/sections/transfers/components'
import { RequestQuotesDialog } from '@/sections/transfers/RequestQuotesDialog'
import type {
  Transfer,
  TransferStatus,
  ShippingAgent,
} from '@/sections/transfers/types'
import type { TransferFormData } from '@/sections/transfers/components/TransferForm'
import type { ShippingAgentFormData } from '@/sections/transfers/components/ShippingAgentForm'
import {
  TRANSFER_STATUS_OPTIONS,
  SHIPPING_METHOD_OPTIONS,
  SHIPPING_SERVICE_OPTIONS,
} from '@/sections/transfers/types'
import { downloadTransferManifestPDF } from '@/sections/transfers/TransferManifestPDF'

export default function TransfersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Hooks
  const {
    transfers,
    availableStock,
    flatLineItems,
    lineItemsSummary,
    quoteStatuses,
    loading: transfersLoading,
    createTransfer,
    updateTransfer,
    updateStatus,
    deleteTransfer,
    fetchAvailableStock,
    refetchQuoteStatuses,
  } = useTransfers()

  const {
    shippingAgents,
    loading: agentsLoading,
    createShippingAgent,
    updateShippingAgent,
    deleteShippingAgent,
    toggleActive,
  } = useShippingAgents()

  const {
    shipments: amazonShipments,
    loading: amazonLoading,
    refreshShipment,
    linkToTransfer,
  } = useAmazonShipments()

  const { locations, loading: locationsLoading } = useLocations()

  // Modal states
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTransfer, setEditingTransfer] = useState<Transfer | undefined>(undefined)

  const [selectedAgent, setSelectedAgent] = useState<ShippingAgent | null>(null)
  const [isAgentDetailOpen, setIsAgentDetailOpen] = useState(false)
  const [isAgentFormOpen, setIsAgentFormOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<ShippingAgent | undefined>(undefined)
  const [preselectedBatchIds, setPreselectedBatchIds] = useState<string[]>([])

  // Prefill data from Inventory Intelligence
  const [prefillSourceLocationId, setPrefillSourceLocationId] = useState<string | undefined>(undefined)
  const [prefillDestinationLocationId, setPrefillDestinationLocationId] = useState<string | undefined>(undefined)
  const [prefillLineItems, setPrefillLineItems] = useState<Array<{ productId: string; sku: string; quantity: number }>>([])
  const [suggestionId, setSuggestionId] = useState<string | undefined>(undefined)

  // Request Quotes dialog state
  const [isRequestQuotesOpen, setIsRequestQuotesOpen] = useState(false)

  // Check for create action from URL params (e.g., from PO page or Inventory Intelligence)
  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'create') {
      const prefillParam = searchParams.get('prefill')

      if (prefillParam === 'true') {
        // Prefill from Inventory Intelligence
        const sourceLocationId = searchParams.get('sourceLocationId')
        const destinationLocationId = searchParams.get('destinationLocationId')
        const productId = searchParams.get('productId')
        const sku = searchParams.get('sku')
        const quantity = searchParams.get('quantity')
        const suggestionIdParam = searchParams.get('suggestionId')

        if (sourceLocationId) setPrefillSourceLocationId(sourceLocationId)
        if (destinationLocationId) setPrefillDestinationLocationId(destinationLocationId)
        if (suggestionIdParam) setSuggestionId(suggestionIdParam)

        if (productId && sku && quantity) {
          setPrefillLineItems([{
            productId,
            sku,
            quantity: parseInt(quantity, 10) || 0,
          }])
        }

        // Fetch available stock for the source location
        if (sourceLocationId) {
          fetchAvailableStock(sourceLocationId)
        } else {
          fetchAvailableStock()
        }
      } else {
        // Check for preselected batch IDs in sessionStorage (legacy path)
        const storedBatchIds = sessionStorage.getItem('preselectedBatchIds')
        if (storedBatchIds) {
          try {
            const batchIds = JSON.parse(storedBatchIds)
            setPreselectedBatchIds(batchIds)
            sessionStorage.removeItem('preselectedBatchIds')
          } catch {
            console.error('Failed to parse preselected batch IDs')
          }
        }
        fetchAvailableStock()
      }

      // Open the form
      setIsFormOpen(true)
      // Clear the URL params
      router.replace('/transfers')
    }
  }, [searchParams, router, fetchAvailableStock])

  // Transfer handlers
  const handleViewTransfer = useCallback((id: string) => {
    const transfer = transfers.find(t => t.id === id)
    if (transfer) {
      setSelectedTransfer(transfer)
      setIsDetailOpen(true)
    }
  }, [transfers])

  const handleEditTransfer = useCallback((id: string) => {
    const transfer = transfers.find(t => t.id === id)
    if (transfer) {
      setEditingTransfer(transfer)
      // Fetch available stock for the source location
      fetchAvailableStock(transfer.sourceLocationId)
      setIsFormOpen(true)
    }
  }, [transfers, fetchAvailableStock])

  const handleDeleteTransfer = useCallback(async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transfer?')) {
      await deleteTransfer(id)
    }
  }, [deleteTransfer])

  const handleCreateTransfer = useCallback(async () => {
    setEditingTransfer(undefined)
    // Fetch available stock for all locations
    await fetchAvailableStock()
    setIsFormOpen(true)
  }, [fetchAvailableStock])

  const handleUpdateStatus = useCallback(async (id: string, newStatus: TransferStatus) => {
    await updateStatus(id, newStatus)
    // Refresh the selected transfer if it's open
    if (selectedTransfer?.id === id) {
      const updatedTransfer = transfers.find(t => t.id === id)
      if (updatedTransfer) {
        setSelectedTransfer({ ...updatedTransfer, status: newStatus })
      }
    }
  }, [updateStatus, selectedTransfer, transfers])

  const handleSubmitTransfer = useCallback(async (data: TransferFormData) => {
    if (editingTransfer) {
      await updateTransfer(editingTransfer.id, data)
    } else {
      await createTransfer(data)
    }
    setIsFormOpen(false)
    setEditingTransfer(undefined)
  }, [editingTransfer, createTransfer, updateTransfer])

  const handleCloseTransferForm = useCallback(() => {
    setIsFormOpen(false)
    setEditingTransfer(undefined)
    setPreselectedBatchIds([])
    // Clear prefill state from Inventory Intelligence
    setPrefillSourceLocationId(undefined)
    setPrefillDestinationLocationId(undefined)
    setPrefillLineItems([])
    setSuggestionId(undefined)
  }, [])

  const handleCloseTransferDetail = useCallback(() => {
    setIsDetailOpen(false)
    setSelectedTransfer(null)
  }, [])

  const handleGenerateManifest = useCallback(async () => {
    if (selectedTransfer) {
      await downloadTransferManifestPDF(
        selectedTransfer,
        TRANSFER_STATUS_OPTIONS,
        SHIPPING_METHOD_OPTIONS
      )
    }
  }, [selectedTransfer])

  // Shipping Agent handlers
  const handleViewAgent = useCallback((id: string) => {
    const agent = shippingAgents.find(a => a.id === id)
    if (agent) {
      setSelectedAgent(agent)
      setIsAgentDetailOpen(true)
    }
  }, [shippingAgents])

  const handleEditAgent = useCallback((id: string) => {
    const agent = shippingAgents.find(a => a.id === id)
    if (agent) {
      setEditingAgent(agent)
      setIsAgentFormOpen(true)
    }
  }, [shippingAgents])

  const handleDeleteAgent = useCallback(async (id: string) => {
    if (window.confirm('Are you sure you want to delete this shipping agent?')) {
      await deleteShippingAgent(id)
    }
  }, [deleteShippingAgent])

  const handleCreateAgent = useCallback(() => {
    setEditingAgent(undefined)
    setIsAgentFormOpen(true)
  }, [])

  const handleToggleAgentActive = useCallback(async (id: string) => {
    await toggleActive(id)
  }, [toggleActive])

  const handleSubmitAgent = useCallback(async (data: ShippingAgentFormData) => {
    if (editingAgent) {
      await updateShippingAgent(editingAgent.id, data)
    } else {
      await createShippingAgent(data)
    }
    setIsAgentFormOpen(false)
    setEditingAgent(undefined)
  }, [editingAgent, createShippingAgent, updateShippingAgent])

  const handleCloseAgentForm = useCallback(() => {
    setIsAgentFormOpen(false)
    setEditingAgent(undefined)
  }, [])

  const handleCloseAgentDetail = useCallback(() => {
    setIsAgentDetailOpen(false)
    setSelectedAgent(null)
  }, [])

  // Amazon Shipment handlers
  const handleRefreshAmazonShipment = useCallback(async (shipmentId: string) => {
    await refreshShipment(shipmentId)
  }, [refreshShipment])

  const handleViewAmazonShipmentDetails = useCallback((shipmentId: string) => {
    // Could open a detail modal, for now just log
    console.log('View Amazon shipment:', shipmentId)
  }, [])

  const handleLinkAmazonToTransfer = useCallback(async (shipmentId: string) => {
    // Would typically show a modal to select which transfer to link to
    console.log('Link Amazon shipment to transfer:', shipmentId)
  }, [])

  const handleNavigateToAmazonShipment = useCallback((shipmentId: string) => {
    // Just log for now - could scroll to or highlight the shipment in the Amazon tab
    console.log('Navigate to Amazon shipment:', shipmentId)
  }, [])

  const handleManageLocations = useCallback(() => {
    router.push('/locations')
  }, [router])

  // Request Quotes handler
  const handleRequestQuotes = useCallback(() => {
    setIsRequestQuotesOpen(true)
  }, [])

  const loading = transfersLoading || agentsLoading || amazonLoading || locationsLoading

  return (
    <>
      <TransfersView
        transfers={transfers}
        locations={locations}
        transferStatuses={TRANSFER_STATUS_OPTIONS}
        shippingMethods={SHIPPING_METHOD_OPTIONS}
        shippingAgents={shippingAgents}
        shippingServices={SHIPPING_SERVICE_OPTIONS}
        amazonShipments={amazonShipments}
        lineItems={flatLineItems}
        lineItemsSummary={lineItemsSummary}
        quoteStatuses={quoteStatuses}
        onViewTransfer={handleViewTransfer}
        onEditTransfer={handleEditTransfer}
        onDeleteTransfer={handleDeleteTransfer}
        onCreateTransfer={handleCreateTransfer}
        onUpdateStatus={handleUpdateStatus}
        onManageLocations={handleManageLocations}
        onViewAgent={handleViewAgent}
        onEditAgent={handleEditAgent}
        onDeleteAgent={handleDeleteAgent}
        onCreateAgent={handleCreateAgent}
        onToggleAgentActive={handleToggleAgentActive}
        onRefreshAmazonShipment={handleRefreshAmazonShipment}
        onViewAmazonShipmentDetails={handleViewAmazonShipmentDetails}
        onLinkAmazonToTransfer={handleLinkAmazonToTransfer}
        onNavigateToAmazonShipment={handleNavigateToAmazonShipment}
      />

      {/* Transfer Detail Panel */}
      {selectedTransfer && isDetailOpen && (
        <TransferDetail
          transfer={selectedTransfer}
          locations={locations}
          quoteStatus={quoteStatuses.get(selectedTransfer.id)?.quoteStatus}
          selectedQuoteAmount={quoteStatuses.get(selectedTransfer.id)?.selectedQuoteAmount ?? undefined}
          onClose={handleCloseTransferDetail}
          onEdit={() => {
            handleCloseTransferDetail()
            handleEditTransfer(selectedTransfer.id)
          }}
          onUpdateStatus={(newStatus) => handleUpdateStatus(selectedTransfer.id, newStatus)}
          onGenerateManifest={handleGenerateManifest}
          onRequestQuotes={handleRequestQuotes}
          onQuoteSelected={() => refetchQuoteStatuses()}
        />
      )}

      {/* Transfer Form Modal */}
      <TransferForm
        transfer={editingTransfer}
        locations={locations}
        availableStock={availableStock}
        shippingMethods={SHIPPING_METHOD_OPTIONS}
        shippingAgents={shippingAgents}
        isOpen={isFormOpen}
        preSelectedStockIds={
          preselectedBatchIds.length > 0
            ? availableStock.filter(s => preselectedBatchIds.includes(s.batchId)).map(s => s.id)
            : prefillLineItems.length > 0
              // Match stock by product SKU and source location for Inventory Intelligence prefill
              ? availableStock.filter(stock =>
                  prefillLineItems.some(item =>
                    stock.sku === item.sku &&
                    stock.locationId === prefillSourceLocationId
                  )
                ).map(s => s.id)
              : undefined
        }
        initialLineItems={
          prefillLineItems.length > 0
            ? prefillLineItems.map(item => {
                const matchingStock = availableStock.find(s => s.sku === item.sku && s.locationId === prefillSourceLocationId)
                return {
                  batchId: matchingStock?.batchId || '',
                  sku: item.sku,
                  productName: matchingStock?.productName || item.sku,
                  quantity: item.quantity,
                  availableQuantity: matchingStock?.availableQuantity || item.quantity,
                  unitCost: matchingStock?.unitCost || 0,
                }
              })
            : undefined
        }
        initialSourceLocationId={
          prefillSourceLocationId ||
          (preselectedBatchIds.length > 0
            ? availableStock.find(s => preselectedBatchIds.includes(s.batchId))?.locationId
            : undefined)
        }
        onSubmit={handleSubmitTransfer}
        onCancel={handleCloseTransferForm}
        onClose={handleCloseTransferForm}
      />

      {/* Shipping Agent Detail Panel */}
      {selectedAgent && isAgentDetailOpen && (
        <ShippingAgentDetail
          agent={selectedAgent}
          shippingServices={SHIPPING_SERVICE_OPTIONS}
          onClose={handleCloseAgentDetail}
          onEdit={() => {
            handleCloseAgentDetail()
            handleEditAgent(selectedAgent.id)
          }}
        />
      )}

      {/* Shipping Agent Form Modal */}
      <ShippingAgentForm
        agent={editingAgent}
        shippingServices={SHIPPING_SERVICE_OPTIONS}
        isOpen={isAgentFormOpen}
        onSubmit={handleSubmitAgent}
        onCancel={handleCloseAgentForm}
      />

      {/* Request Quotes Dialog */}
      {selectedTransfer && (
        <RequestQuotesDialog
          isOpen={isRequestQuotesOpen}
          transferId={selectedTransfer.id}
          transferInfo={{
            transferNumber: selectedTransfer.transferNumber,
            sourceLocationName: locations.find(l => l.id === selectedTransfer.sourceLocationId)?.name || 'Unknown',
            destinationLocationName: locations.find(l => l.id === selectedTransfer.destinationLocationId)?.name || 'Unknown',
          }}
          onClose={() => setIsRequestQuotesOpen(false)}
        />
      )}
    </>
  )
}

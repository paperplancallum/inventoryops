'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '../client'
import type {
  Transfer,
  TransferLineItem,
  TransferStatusHistoryEntry,
  TrackingNumber,
  TransferDocument,
  TransferCosts,
  CustomsInfo,
  AmazonReceiving,
  TransferStatus,
  TransferDocumentType,
  TransferFormData,
  TransfersSummary,
  AvailableStock,
} from '@/sections/transfers/types'
import type {
  TransferLineItemFlat,
  TransferLineItemsSummary,
} from '@/sections/transfers/components/TransferLineItemsView'

// Database row types (snake_case)
interface DbTransfer {
  id: string
  transfer_number: string
  status: TransferStatus
  source_location_id: string
  destination_location_id: string
  shipping_agent_id: string | null
  carrier: string | null
  carrier_account_number: string | null
  shipping_method: string | null
  container_numbers: string[]
  scheduled_departure_date: string | null
  actual_departure_date: string | null
  scheduled_arrival_date: string | null
  actual_arrival_date: string | null
  incoterms: string | null
  cost_freight: number
  cost_insurance: number
  cost_duties: number
  cost_taxes: number
  cost_handling: number
  cost_other: number
  cost_currency: string
  total_cost: number
  customs_hs_code: string | null
  customs_broker: string | null
  customs_status: string
  customs_entry_number: string | null
  customs_clearance_date: string | null
  customs_notes: string | null
  amazon_receiving_status: string | null
  amazon_checked_in_date: string | null
  amazon_receiving_started_date: string | null
  amazon_received_date: string | null
  amazon_closed_date: string | null
  amazon_discrepancy: number | null
  amazon_receiving_notes: string | null
  amazon_shipment_id: string | null
  quote_confirmed_at: string | null
  notes: string | null
  created_by: string | null
  created_by_name: string | null
  created_at: string
  updated_at: string
  // Joined data
  source_location?: { name: string; type: string } | null
  destination_location?: { name: string; type: string } | null
  shipping_agent?: { name: string } | null
  transfer_line_items?: DbTransferLineItem[]
  transfer_tracking_numbers?: DbTrackingNumber[]
  transfer_documents?: DbTransferDocument[]
  transfer_status_history?: DbStatusHistory[]
}

interface DbTransferLineItem {
  id: string
  transfer_id: string
  batch_id: string
  sku: string
  product_name: string
  quantity: number
  unit_cost: number
  total_cost: number
  status: string
  received_quantity: number | null
  discrepancy: number | null
  received_at: string | null
  received_notes: string | null
  debit_ledger_entry_id: string | null
  credit_ledger_entry_id: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

interface DbTrackingNumber {
  id: string
  transfer_id: string
  carrier: string
  tracking_number: string
  tracking_url: string | null
  created_at: string
}

interface DbTransferDocument {
  id: string
  transfer_id: string
  document_type: TransferDocumentType
  name: string
  url: string
  storage_path: string | null
  size: number | null
  uploaded_by: string | null
  uploaded_by_name: string | null
  created_at: string
}

interface DbStatusHistory {
  id: string
  transfer_id: string
  status: TransferStatus
  note: string | null
  changed_by: string | null
  changed_by_name: string | null
  created_at: string
}

interface DbAvailableStock {
  id: string
  batch_id: string
  sku: string
  product_name: string
  location_id: string
  location_name: string
  available_quantity: number
  unit_cost: number
  total_value: number
  po_number: string
  supplier_name: string
}

// Transform functions
function transformTransfer(db: DbTransfer): Transfer {
  return {
    id: db.id,
    transferNumber: db.transfer_number,
    status: db.status,
    sourceLocationId: db.source_location_id,
    sourceLocationName: db.source_location?.name,
    sourceLocationType: db.source_location?.type,
    destinationLocationId: db.destination_location_id,
    destinationLocationName: db.destination_location?.name,
    destinationLocationType: db.destination_location?.type,
    shippingAgentId: db.shipping_agent_id || undefined,
    shippingAgentName: db.shipping_agent?.name,
    carrier: db.carrier || '',
    carrierAccountNumber: db.carrier_account_number || '',
    shippingMethod: db.shipping_method as Transfer['shippingMethod'],
    containerNumbers: db.container_numbers || [],
    scheduledDepartureDate: db.scheduled_departure_date,
    actualDepartureDate: db.actual_departure_date,
    scheduledArrivalDate: db.scheduled_arrival_date,
    actualArrivalDate: db.actual_arrival_date,
    incoterms: db.incoterms || '',
    costs: {
      freight: db.cost_freight,
      insurance: db.cost_insurance,
      duties: db.cost_duties,
      taxes: db.cost_taxes,
      handling: db.cost_handling,
      other: db.cost_other,
      currency: db.cost_currency,
    },
    totalCost: db.total_cost,
    customsInfo: {
      hsCode: db.customs_hs_code || '',
      broker: db.customs_broker || '',
      status: db.customs_status as CustomsInfo['status'],
      entryNumber: db.customs_entry_number || '',
      clearanceDate: db.customs_clearance_date,
      notes: db.customs_notes || '',
    },
    amazonReceiving: db.amazon_receiving_status ? {
      status: db.amazon_receiving_status as AmazonReceiving['status'],
      checkedInDate: db.amazon_checked_in_date,
      receivingStartedDate: db.amazon_receiving_started_date,
      receivedDate: db.amazon_received_date,
      closedDate: db.amazon_closed_date,
      discrepancy: db.amazon_discrepancy || 0,
      notes: db.amazon_receiving_notes || '',
    } : null,
    amazonShipmentId: db.amazon_shipment_id,
    quoteConfirmedAt: db.quote_confirmed_at,
    lineItems: (db.transfer_line_items || []).map(transformLineItem),
    totalUnits: (db.transfer_line_items || []).reduce((sum, li) => sum + li.quantity, 0),
    totalValue: (db.transfer_line_items || []).reduce((sum, li) => sum + li.total_cost, 0),
    trackingNumbers: (db.transfer_tracking_numbers || []).map(transformTrackingNumber),
    documents: (db.transfer_documents || []).map(transformDocument),
    statusHistory: (db.transfer_status_history || []).map(transformStatusHistory),
    notes: db.notes || '',
    createdBy: db.created_by || undefined,
    createdByName: db.created_by_name || undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  }
}

function transformLineItem(db: DbTransferLineItem): TransferLineItem {
  return {
    id: db.id,
    transferId: db.transfer_id,
    batchId: db.batch_id,
    sku: db.sku,
    productName: db.product_name,
    quantity: db.quantity,
    unitCost: db.unit_cost,
    totalCost: db.total_cost,
    status: db.status as TransferLineItem['status'],
    receivedQuantity: db.received_quantity,
    discrepancy: db.discrepancy,
    receivedAt: db.received_at,
    receivedNotes: db.received_notes || '',
    debitLedgerEntryId: db.debit_ledger_entry_id,
    creditLedgerEntryId: db.credit_ledger_entry_id,
    sortOrder: db.sort_order,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  }
}

function transformTrackingNumber(db: DbTrackingNumber): TrackingNumber {
  return {
    id: db.id,
    carrier: db.carrier,
    trackingNumber: db.tracking_number,
    trackingUrl: db.tracking_url,
    createdAt: db.created_at,
  }
}

function transformDocument(db: DbTransferDocument): TransferDocument {
  return {
    id: db.id,
    documentType: db.document_type,
    name: db.name,
    url: db.url,
    storagePath: db.storage_path || undefined,
    size: db.size || undefined,
    uploadedBy: db.uploaded_by || undefined,
    uploadedByName: db.uploaded_by_name || undefined,
    createdAt: db.created_at,
  }
}

function transformStatusHistory(db: DbStatusHistory): TransferStatusHistoryEntry {
  return {
    id: db.id,
    status: db.status,
    note: db.note || '',
    changedBy: db.changed_by || undefined,
    changedByName: db.changed_by_name || undefined,
    createdAt: db.created_at,
  }
}

function transformAvailableStock(db: DbAvailableStock): AvailableStock {
  return {
    id: db.id,
    batchId: db.batch_id,
    sku: db.sku,
    productName: db.product_name,
    locationId: db.location_id,
    locationName: db.location_name,
    availableQuantity: db.available_quantity,
    unitCost: db.unit_cost,
    totalValue: db.total_value,
    poNumber: db.po_number || '',
    supplierName: db.supplier_name || '',
  }
}

// =============================================================================
// Quote Workflow Helpers
// =============================================================================

// Statuses that require a confirmed quote before allowing transition
const QUOTE_REQUIRED_STATUSES: TransferStatus[] = ['in-transit', 'delivered', 'completed']

/**
 * Check if a transfer can move to a physical movement status (in-transit, delivered, etc.)
 * Returns true if the transfer has a confirmed quote or if the target status doesn't require one
 */
export function canTransferMoveToStatus(transfer: Transfer, targetStatus: TransferStatus): boolean {
  // Cancelled is always allowed
  if (targetStatus === 'cancelled') return true

  // Draft and booked don't require a quote
  if (!QUOTE_REQUIRED_STATUSES.includes(targetStatus)) return true

  // Physical movement statuses require a confirmed quote
  return transfer.quoteConfirmedAt !== null
}

/**
 * Get list of blockers preventing a transfer from moving to the target status
 * Returns empty array if transfer can move, or array of blocker messages
 */
export function getTransferBlockers(transfer: Transfer, targetStatus: TransferStatus): string[] {
  const blockers: string[] = []

  // Check quote requirement for physical movement statuses
  if (QUOTE_REQUIRED_STATUSES.includes(targetStatus) && !transfer.quoteConfirmedAt) {
    blockers.push('A shipping quote must be selected before the transfer can move to ' + targetStatus)
  }

  return blockers
}

// Quote status type for transfers
export type TransferQuoteStatus = 'no_quotes' | 'awaiting_quotes' | 'quotes_received' | 'confirmed'

// Quote status data from the view
export interface TransferQuoteStatusData {
  transferId: string
  quoteStatus: TransferQuoteStatus
  totalQuotes: number
  submittedQuotes: number
  selectedQuoteAmount: number | null
  selectedQuoteId: string | null
}

export function useTransfers() {
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [availableStock, setAvailableStock] = useState<AvailableStock[]>([])
  const [quoteStatuses, setQuoteStatuses] = useState<Map<string, TransferQuoteStatusData>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Fetch quote statuses from the view
  const fetchQuoteStatuses = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('transfer_quote_status')
        .select('*')

      if (fetchError) throw fetchError

      const statusMap = new Map<string, TransferQuoteStatusData>()
      for (const row of data || []) {
        statusMap.set(row.transfer_id, {
          transferId: row.transfer_id,
          quoteStatus: row.quote_status as TransferQuoteStatus,
          totalQuotes: row.total_quotes,
          submittedQuotes: row.submitted_quotes,
          selectedQuoteAmount: row.selected_quote_amount,
          selectedQuoteId: row.selected_quote_id,
        })
      }
      setQuoteStatuses(statusMap)
      return statusMap
    } catch (err) {
      console.error('Failed to fetch quote statuses:', err)
      return new Map<string, TransferQuoteStatusData>()
    }
  }, [supabase])

  // Fetch all transfers with related data
  const fetchTransfers = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch transfers and quote statuses in parallel
      const [transfersResult, _quoteStatuses] = await Promise.all([
        supabase
          .from('transfers')
          .select(`
            *,
            source_location:locations!transfers_source_location_id_fkey(name, type),
            destination_location:locations!transfers_destination_location_id_fkey(name, type),
            shipping_agent:shipping_agents(name),
            transfer_line_items(*),
            transfer_tracking_numbers(*),
            transfer_documents(*),
            transfer_status_history(*)
          `)
          .order('created_at', { ascending: false }),
        fetchQuoteStatuses(),
      ])

      if (transfersResult.error) throw transfersResult.error

      const transformedTransfers = (transfersResult.data || []).map(transformTransfer)
      setTransfers(transformedTransfers)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch transfers'))
    } finally {
      setLoading(false)
    }
  }, [supabase, fetchQuoteStatuses])

  // Fetch draft transfer allocations (stock reserved by draft transfers)
  const fetchDraftAllocations = useCallback(async (): Promise<Map<string, number>> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('transfer_line_items')
        .select(`
          batch_id,
          quantity,
          transfer:transfers!inner(
            source_location_id,
            status
          )
        `)
        .eq('transfer.status', 'draft')

      if (fetchError) throw fetchError

      // Build allocation map: batchId-locationId -> total allocated quantity
      const allocations = new Map<string, number>()

      for (const item of data || []) {
        const transfer = item.transfer as unknown as { source_location_id: string; status: string }
        if (!transfer?.source_location_id) continue

        const key = `${item.batch_id}-${transfer.source_location_id}`
        const current = allocations.get(key) || 0
        allocations.set(key, current + item.quantity)
      }

      return allocations
    } catch (err) {
      console.error('Failed to fetch draft allocations:', err)
      return new Map()
    }
  }, [supabase])

  // Fetch available stock for transfer form
  const fetchAvailableStock = useCallback(async (locationId?: string) => {
    try {
      // Fetch stock and draft allocations in parallel
      let stockQuery = supabase
        .from('available_stock_for_transfer')
        .select('*')

      if (locationId) {
        stockQuery = stockQuery.eq('location_id', locationId)
      }

      const [stockResult, allocations] = await Promise.all([
        stockQuery,
        fetchDraftAllocations(),
      ])

      if (stockResult.error) throw stockResult.error

      // Transform stock and subtract draft allocations
      const stockWithAllocations = (stockResult.data || []).map(db => {
        const allocationKey = `${db.batch_id}-${db.location_id}`
        const allocated = allocations.get(allocationKey) || 0
        const trueAvailable = Math.max(0, db.available_quantity - allocated)

        return {
          id: db.id,
          batchId: db.batch_id,
          sku: db.sku,
          productName: db.product_name,
          locationId: db.location_id,
          locationName: db.location_name,
          availableQuantity: trueAvailable,
          allocatedQuantity: allocated,
          totalQuantity: db.available_quantity,
          unitCost: db.unit_cost,
          totalValue: db.total_value,
          poNumber: db.po_number || '',
          supplierName: db.supplier_name || '',
        }
      }) // Keep all stock (including fully allocated) for allocation display and location lookup

      setAvailableStock(stockWithAllocations)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch available stock'))
    }
  }, [supabase, fetchDraftAllocations])

  // Fetch single transfer with full details
  const fetchTransfer = useCallback(async (id: string): Promise<Transfer | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('transfers')
        .select(`
          *,
          source_location:locations!transfers_source_location_id_fkey(name, type),
          destination_location:locations!transfers_destination_location_id_fkey(name, type),
          shipping_agent:shipping_agents(name),
          transfer_line_items(*),
          transfer_tracking_numbers(*),
          transfer_documents(*),
          transfer_status_history(*)
        `)
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      return transformTransfer(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch transfer'))
      return null
    }
  }, [supabase])

  // Create transfer
  const createTransfer = useCallback(async (data: TransferFormData): Promise<Transfer | null> => {
    try {
      // Create transfer record
      const { data: newTransfer, error: transferError } = await supabase
        .from('transfers')
        .insert({
          source_location_id: data.sourceLocationId,
          destination_location_id: data.destinationLocationId,
          shipping_agent_id: data.shippingAgentId || null,
          carrier: data.carrier || null,
          carrier_account_number: data.carrierAccountNumber || null,
          shipping_method: data.shippingMethod,
          container_numbers: data.containerNumbers || [],
          scheduled_departure_date: data.scheduledDepartureDate || null,
          scheduled_arrival_date: data.scheduledArrivalDate || null,
          incoterms: data.incoterms || null,
          cost_freight: data.costs.freight,
          cost_insurance: data.costs.insurance,
          cost_duties: data.costs.duties,
          cost_taxes: data.costs.taxes,
          cost_handling: data.costs.handling,
          cost_other: data.costs.other,
          cost_currency: data.costs.currency,
          customs_hs_code: data.customsInfo.hsCode || null,
          customs_broker: data.customsInfo.broker || null,
          customs_status: data.customsInfo.status || 'pending',
          amazon_shipment_id: data.amazonShipmentId || null,
          notes: data.notes || null,
        })
        .select()
        .single()

      if (transferError) throw transferError

      // Create line items
      if (data.lineItems.length > 0) {
        const lineItemsToInsert = data.lineItems.map((li, index) => ({
          transfer_id: newTransfer.id,
          batch_id: li.batchId,
          sku: li.sku,
          product_name: li.productName,
          quantity: li.quantity,
          unit_cost: li.unitCost,
          sort_order: index,
        }))

        const { error: lineItemsError } = await supabase
          .from('transfer_line_items')
          .insert(lineItemsToInsert)

        if (lineItemsError) throw lineItemsError
      }

      // Refetch to get all related data
      const freshTransfer = await fetchTransfer(newTransfer.id)
      if (freshTransfer) {
        setTransfers(prev => [freshTransfer, ...prev])
      }

      return freshTransfer
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create transfer'))
      return null
    }
  }, [supabase, fetchTransfer])

  // Update transfer
  const updateTransfer = useCallback(async (id: string, data: Partial<TransferFormData>): Promise<Transfer | null> => {
    try {
      const updateData: Record<string, unknown> = {}

      if (data.sourceLocationId !== undefined) updateData.source_location_id = data.sourceLocationId
      if (data.destinationLocationId !== undefined) updateData.destination_location_id = data.destinationLocationId
      if (data.shippingAgentId !== undefined) updateData.shipping_agent_id = data.shippingAgentId || null
      if (data.carrier !== undefined) updateData.carrier = data.carrier || null
      if (data.carrierAccountNumber !== undefined) updateData.carrier_account_number = data.carrierAccountNumber || null
      if (data.shippingMethod !== undefined) updateData.shipping_method = data.shippingMethod
      if (data.containerNumbers !== undefined) updateData.container_numbers = data.containerNumbers
      if (data.scheduledDepartureDate !== undefined) updateData.scheduled_departure_date = data.scheduledDepartureDate || null
      if (data.scheduledArrivalDate !== undefined) updateData.scheduled_arrival_date = data.scheduledArrivalDate || null
      if (data.incoterms !== undefined) updateData.incoterms = data.incoterms || null
      if (data.costs !== undefined) {
        updateData.cost_freight = data.costs.freight
        updateData.cost_insurance = data.costs.insurance
        updateData.cost_duties = data.costs.duties
        updateData.cost_taxes = data.costs.taxes
        updateData.cost_handling = data.costs.handling
        updateData.cost_other = data.costs.other
        updateData.cost_currency = data.costs.currency
      }
      if (data.customsInfo !== undefined) {
        if (data.customsInfo.hsCode !== undefined) updateData.customs_hs_code = data.customsInfo.hsCode || null
        if (data.customsInfo.broker !== undefined) updateData.customs_broker = data.customsInfo.broker || null
        if (data.customsInfo.status !== undefined) updateData.customs_status = data.customsInfo.status
        if (data.customsInfo.entryNumber !== undefined) updateData.customs_entry_number = data.customsInfo.entryNumber || null
        if (data.customsInfo.clearanceDate !== undefined) updateData.customs_clearance_date = data.customsInfo.clearanceDate
        if (data.customsInfo.notes !== undefined) updateData.customs_notes = data.customsInfo.notes || null
      }
      if (data.amazonShipmentId !== undefined) updateData.amazon_shipment_id = data.amazonShipmentId || null
      if (data.notes !== undefined) updateData.notes = data.notes || null

      const { error: updateError } = await supabase
        .from('transfers')
        .update(updateData)
        .eq('id', id)

      if (updateError) throw updateError

      // Refetch to get updated data
      const freshTransfer = await fetchTransfer(id)
      if (freshTransfer) {
        setTransfers(prev => prev.map(t => t.id === id ? freshTransfer : t))
      }

      return freshTransfer
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update transfer'))
      return null
    }
  }, [supabase, fetchTransfer])

  // Update transfer status
  const updateStatus = useCallback(async (id: string, newStatus: TransferStatus, note?: string): Promise<{ success: boolean; error?: string }> => {
    // Find the transfer to check blockers
    const transfer = transfers.find(t => t.id === id)
    if (!transfer) {
      return { success: false, error: 'Transfer not found' }
    }

    // Check if transfer can move to the new status
    const blockers = getTransferBlockers(transfer, newStatus)
    if (blockers.length > 0) {
      setError(new Error(blockers[0]))
      return { success: false, error: blockers[0] }
    }

    // Optimistic update
    const previousTransfers = transfers
    setTransfers(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))

    try {
      const updateData: Record<string, unknown> = { status: newStatus }

      // Set actual dates based on status
      if (newStatus === 'in-transit') {
        updateData.actual_departure_date = new Date().toISOString().split('T')[0]
      } else if (newStatus === 'delivered') {
        updateData.actual_arrival_date = new Date().toISOString().split('T')[0]
      }

      const { error: updateError } = await supabase
        .from('transfers')
        .update(updateData)
        .eq('id', id)

      if (updateError) throw updateError

      // Update status history note if provided
      if (note) {
        await supabase
          .from('transfer_status_history')
          .update({ note })
          .eq('transfer_id', id)
          .eq('status', newStatus)
          .order('created_at', { ascending: false })
          .limit(1)
      }

      // Refetch to get updated data
      const freshTransfer = await fetchTransfer(id)
      if (freshTransfer) {
        setTransfers(prev => prev.map(t => t.id === id ? freshTransfer : t))
      }

      return { success: true }
    } catch (err) {
      // Rollback optimistic update
      setTransfers(previousTransfers)
      const errorMsg = err instanceof Error ? err.message : 'Failed to update status'
      setError(new Error(errorMsg))
      return { success: false, error: errorMsg }
    }
  }, [supabase, fetchTransfer, transfers])

  // Delete transfer
  const deleteTransfer = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('transfers')
        .delete()
        .eq('id', id)

      if (error) throw error

      setTransfers(prev => prev.filter(t => t.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete transfer'))
      return false
    }
  }, [supabase])

  // Add tracking number
  const addTrackingNumber = useCallback(async (
    transferId: string,
    tracking: { carrier: string; trackingNumber: string; trackingUrl?: string | null }
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('transfer_tracking_numbers')
        .insert({
          transfer_id: transferId,
          carrier: tracking.carrier,
          tracking_number: tracking.trackingNumber,
          tracking_url: tracking.trackingUrl || null,
        })

      if (error) throw error

      // Refetch transfer to get updated tracking numbers
      const freshTransfer = await fetchTransfer(transferId)
      if (freshTransfer) {
        setTransfers(prev => prev.map(t => t.id === transferId ? freshTransfer : t))
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add tracking number'))
      return false
    }
  }, [supabase, fetchTransfer])

  // Remove tracking number
  const removeTrackingNumber = useCallback(async (transferId: string, trackingId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('transfer_tracking_numbers')
        .delete()
        .eq('id', trackingId)

      if (error) throw error

      // Refetch transfer
      const freshTransfer = await fetchTransfer(transferId)
      if (freshTransfer) {
        setTransfers(prev => prev.map(t => t.id === transferId ? freshTransfer : t))
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to remove tracking number'))
      return false
    }
  }, [supabase, fetchTransfer])

  // Add document
  const addDocument = useCallback(async (
    transferId: string,
    file: File,
    documentType: TransferDocumentType
  ): Promise<boolean> => {
    try {
      // Upload to storage
      const fileName = `${transferId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('transfer-documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('transfer-documents')
        .getPublicUrl(fileName)

      // Create document record
      const { error: insertError } = await supabase
        .from('transfer_documents')
        .insert({
          transfer_id: transferId,
          document_type: documentType,
          name: file.name,
          url: publicUrl,
          storage_path: fileName,
          size: file.size,
        })

      if (insertError) throw insertError

      // Refetch transfer
      const freshTransfer = await fetchTransfer(transferId)
      if (freshTransfer) {
        setTransfers(prev => prev.map(t => t.id === transferId ? freshTransfer : t))
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add document'))
      return false
    }
  }, [supabase, fetchTransfer])

  // Remove document
  const removeDocument = useCallback(async (transferId: string, documentId: string): Promise<boolean> => {
    try {
      // Get document to find storage path
      const { data: document, error: fetchError } = await supabase
        .from('transfer_documents')
        .select('storage_path')
        .eq('id', documentId)
        .single()

      if (fetchError) throw fetchError

      // Delete from storage if path exists
      if (document?.storage_path) {
        await supabase.storage
          .from('transfer-documents')
          .remove([document.storage_path])
      }

      // Delete document record
      const { error: deleteError } = await supabase
        .from('transfer_documents')
        .delete()
        .eq('id', documentId)

      if (deleteError) throw deleteError

      // Refetch transfer
      const freshTransfer = await fetchTransfer(transferId)
      if (freshTransfer) {
        setTransfers(prev => prev.map(t => t.id === transferId ? freshTransfer : t))
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to remove document'))
      return false
    }
  }, [supabase, fetchTransfer])

  // Update Amazon receiving
  const updateAmazonReceiving = useCallback(async (
    transferId: string,
    update: Partial<AmazonReceiving>
  ): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = {}

      if (update.status !== undefined) updateData.amazon_receiving_status = update.status
      if (update.checkedInDate !== undefined) updateData.amazon_checked_in_date = update.checkedInDate
      if (update.receivingStartedDate !== undefined) updateData.amazon_receiving_started_date = update.receivingStartedDate
      if (update.receivedDate !== undefined) updateData.amazon_received_date = update.receivedDate
      if (update.closedDate !== undefined) updateData.amazon_closed_date = update.closedDate
      if (update.discrepancy !== undefined) updateData.amazon_discrepancy = update.discrepancy
      if (update.notes !== undefined) updateData.amazon_receiving_notes = update.notes

      const { error } = await supabase
        .from('transfers')
        .update(updateData)
        .eq('id', transferId)

      if (error) throw error

      // Refetch transfer
      const freshTransfer = await fetchTransfer(transferId)
      if (freshTransfer) {
        setTransfers(prev => prev.map(t => t.id === transferId ? freshTransfer : t))
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update Amazon receiving'))
      return false
    }
  }, [supabase, fetchTransfer])

  // Update line item receiving
  const updateLineItemReceiving = useCallback(async (
    transferId: string,
    lineItemId: string,
    receivedQuantity: number,
    notes?: string
  ): Promise<boolean> => {
    try {
      const { data: lineItem, error: fetchError } = await supabase
        .from('transfer_line_items')
        .select('quantity')
        .eq('id', lineItemId)
        .single()

      if (fetchError) throw fetchError

      const discrepancy = receivedQuantity - lineItem.quantity

      const { error } = await supabase
        .from('transfer_line_items')
        .update({
          received_quantity: receivedQuantity,
          discrepancy: discrepancy,
          received_at: new Date().toISOString(),
          received_notes: notes || null,
          status: discrepancy < 0 ? 'partial' : 'received',
        })
        .eq('id', lineItemId)

      if (error) throw error

      // Refetch transfer
      const freshTransfer = await fetchTransfer(transferId)
      if (freshTransfer) {
        setTransfers(prev => prev.map(t => t.id === transferId ? freshTransfer : t))
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update line item receiving'))
      return false
    }
  }, [supabase, fetchTransfer])

  // Compute summary statistics
  const summary: TransfersSummary = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    return {
      total: transfers.length,
      draft: transfers.filter(t => t.status === 'draft').length,
      booked: transfers.filter(t => t.status === 'booked').length,
      inTransit: transfers.filter(t => t.status === 'in-transit').length,
      delivered: transfers.filter(t => t.status === 'delivered').length,
      completed: transfers.filter(t => t.status === 'completed').length,
      cancelled: transfers.filter(t => t.status === 'cancelled').length,
      monthlyFreightCost: transfers
        .filter(t => new Date(t.createdAt) >= startOfMonth && t.status !== 'cancelled')
        .reduce((sum, t) => sum + t.costs.freight, 0),
    }
  }, [transfers])

  // Compute flat line items across all transfers
  const flatLineItems: TransferLineItemFlat[] = useMemo(() => {
    return transfers.flatMap(transfer =>
      transfer.lineItems.map(li => ({
        id: li.id,
        transferId: transfer.id,
        transferNumber: transfer.transferNumber,
        transferStatus: transfer.status,
        sourceLocationName: transfer.sourceLocationName || '',
        destinationLocationName: transfer.destinationLocationName || '',
        shippingAgentId: transfer.shippingAgentId || null,
        shippingAgentName: transfer.shippingAgentName || null,
        batchId: li.batchId,
        sku: li.sku,
        productName: li.productName,
        quantity: li.quantity,
        unitCost: li.unitCost,
        totalCost: li.totalCost,
        status: li.status,
        receivedQuantity: li.receivedQuantity,
        scheduledDepartureDate: transfer.scheduledDepartureDate,
        scheduledArrivalDate: transfer.scheduledArrivalDate,
      }))
    )
  }, [transfers])

  // Compute line items summary
  const lineItemsSummary: TransferLineItemsSummary = useMemo(() => {
    const uniqueSkus = new Set(flatLineItems.map(li => li.sku))

    // Group by transfer status
    const byStatus = (['draft', 'booked', 'in-transit', 'delivered', 'completed', 'cancelled'] as TransferStatus[])
      .map(status => {
        const items = flatLineItems.filter(li => li.transferStatus === status)
        return {
          status,
          count: items.length,
          value: items.reduce((sum, li) => sum + li.totalCost, 0),
        }
      })
      .filter(s => s.count > 0)

    return {
      totalItems: flatLineItems.length,
      totalUnits: flatLineItems.reduce((sum, li) => sum + li.quantity, 0),
      totalValue: flatLineItems.reduce((sum, li) => sum + li.totalCost, 0),
      uniqueProducts: uniqueSkus.size,
      byStatus,
    }
  }, [flatLineItems])

  // Initial fetch
  useEffect(() => {
    fetchTransfers()
    fetchAvailableStock()
  }, [fetchTransfers, fetchAvailableStock])

  // Helper to get quote status for a specific transfer
  const getQuoteStatusForTransfer = useCallback((transferId: string): TransferQuoteStatusData | undefined => {
    return quoteStatuses.get(transferId)
  }, [quoteStatuses])

  return {
    transfers,
    availableStock,
    quoteStatuses,
    summary,
    flatLineItems,
    lineItemsSummary,
    loading,
    error,
    refetch: fetchTransfers,
    refetchQuoteStatuses: fetchQuoteStatuses,
    fetchTransfer,
    fetchAvailableStock,
    createTransfer,
    updateTransfer,
    updateStatus,
    deleteTransfer,
    addTrackingNumber,
    removeTrackingNumber,
    addDocument,
    removeDocument,
    updateAmazonReceiving,
    updateLineItemReceiving,
    getQuoteStatusForTransfer,
    // Quote workflow helpers
    canTransferMoveToStatus,
    getTransferBlockers,
  }
}

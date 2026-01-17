'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '../client'
import type {
  AmazonShipment,
  AmazonShipmentItem,
  AmazonShipmentStatus,
  AmazonShipmentType,
  AmazonInboundType,
} from '@/sections/transfers/types'

// Database row types
interface DbAmazonShipment {
  id: string
  shipment_id: string
  shipment_confirmation_id: string | null
  shipment_name: string
  inbound_type: AmazonInboundType
  status: AmazonShipmentStatus
  created_date: string
  last_updated_date: string
  destination_fc_id: string
  destination_address_name: string | null
  destination_address_line1: string | null
  destination_address_city: string | null
  destination_address_state: string | null
  destination_address_postal_code: string | null
  destination_address_country: string | null
  shipment_type: AmazonShipmentType | null
  carrier_name: string | null
  tracking_ids: string[]
  box_count: number
  estimated_box_contents_fee: number | null
  delivery_window_start: string | null
  delivery_window_end: string | null
  freight_ready_date: string | null
  labels_prep_type: string | null
  are_cases_required: boolean
  total_units: number
  total_skus: number
  linked_transfer_id: string | null
  last_synced_at: string
  created_at: string
  updated_at: string
  amazon_shipment_items?: DbAmazonShipmentItem[]
}

interface DbAmazonShipmentItem {
  id: string
  amazon_shipment_id: string
  seller_sku: string
  fn_sku: string
  asin: string | null
  product_name: string
  quantity_shipped: number
  quantity_received: number
  quantity_in_case: number | null
  prep_details: string[]
  created_at: string
  updated_at: string
}

// Transform functions
function transformAmazonShipment(db: DbAmazonShipment): AmazonShipment {
  return {
    id: db.id,
    shipmentId: db.shipment_id,
    shipmentConfirmationId: db.shipment_confirmation_id || undefined,
    shipmentName: db.shipment_name,
    inboundType: db.inbound_type,
    status: db.status,
    createdDate: db.created_date,
    lastUpdatedDate: db.last_updated_date,
    destinationFcId: db.destination_fc_id,
    destinationAddressName: db.destination_address_name || undefined,
    destinationAddressLine1: db.destination_address_line1 || undefined,
    destinationAddressCity: db.destination_address_city || undefined,
    destinationAddressState: db.destination_address_state || undefined,
    destinationAddressPostalCode: db.destination_address_postal_code || undefined,
    destinationAddressCountry: db.destination_address_country || undefined,
    shipmentType: db.shipment_type || undefined,
    carrierName: db.carrier_name || undefined,
    trackingIds: db.tracking_ids || [],
    boxCount: db.box_count,
    estimatedBoxContentsFee: db.estimated_box_contents_fee || undefined,
    deliveryWindowStart: db.delivery_window_start || undefined,
    deliveryWindowEnd: db.delivery_window_end || undefined,
    freightReadyDate: db.freight_ready_date || undefined,
    labelsPrepType: db.labels_prep_type || undefined,
    areCasesRequired: db.are_cases_required,
    totalUnits: db.total_units,
    totalSkus: db.total_skus,
    items: (db.amazon_shipment_items || []).map(transformShipmentItem),
    linkedTransferId: db.linked_transfer_id || undefined,
    lastSyncedAt: db.last_synced_at,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  }
}

function transformShipmentItem(db: DbAmazonShipmentItem): AmazonShipmentItem {
  return {
    id: db.id,
    sellerSku: db.seller_sku,
    fnSku: db.fn_sku,
    asin: db.asin || undefined,
    productName: db.product_name,
    quantityShipped: db.quantity_shipped,
    quantityReceived: db.quantity_received,
    quantityInCase: db.quantity_in_case || undefined,
    prepDetails: db.prep_details || [],
  }
}

export interface AmazonShipmentsSummary {
  total: number
  working: number
  shipped: number
  inTransit: number
  receiving: number
  closed: number
  linkedCount: number
  unlinkedCount: number
}

export function useAmazonShipments() {
  const [shipments, setShipments] = useState<AmazonShipment[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Fetch all Amazon shipments
  const fetchShipments = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('amazon_shipments')
        .select(`
          *,
          amazon_shipment_items(*)
        `)
        .order('last_updated_date', { ascending: false })

      if (fetchError) throw fetchError

      const transformedShipments = (data || []).map(transformAmazonShipment)
      setShipments(transformedShipments)

      // Update last sync time
      if (transformedShipments.length > 0) {
        const latestSync = transformedShipments.reduce((latest, s) =>
          new Date(s.lastSyncedAt) > new Date(latest) ? s.lastSyncedAt : latest,
          transformedShipments[0].lastSyncedAt
        )
        setLastSyncAt(latestSync)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch Amazon shipments'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Fetch single shipment
  const fetchShipment = useCallback(async (id: string): Promise<AmazonShipment | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('amazon_shipments')
        .select(`
          *,
          amazon_shipment_items(*)
        `)
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      return transformAmazonShipment(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch shipment'))
      return null
    }
  }, [supabase])

  // Sync shipments from Amazon SP-API
  // This would typically call an API route that handles the SP-API integration
  const syncFromAmazon = useCallback(async (): Promise<boolean> => {
    setSyncing(true)
    setError(null)

    try {
      // Call API route to sync from Amazon
      const response = await fetch('/api/amazon/sync-shipments', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to sync from Amazon')
      }

      // Refetch shipments
      await fetchShipments()
      setLastSyncAt(new Date().toISOString())

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sync from Amazon'))
      return false
    } finally {
      setSyncing(false)
    }
  }, [fetchShipments])

  // Link shipment to transfer
  const linkToTransfer = useCallback(async (shipmentId: string, transferId: string): Promise<boolean> => {
    try {
      // Get the shipment to find its DB id
      const shipment = shipments.find(s => s.shipmentId === shipmentId)
      if (!shipment) {
        throw new Error('Shipment not found')
      }

      const { error } = await supabase
        .from('amazon_shipments')
        .update({ linked_transfer_id: transferId })
        .eq('id', shipment.id)

      if (error) throw error

      // Also update the transfer with the Amazon shipment ID
      await supabase
        .from('transfers')
        .update({ amazon_shipment_id: shipmentId })
        .eq('id', transferId)

      // Update local state
      setShipments(prev => prev.map(s =>
        s.id === shipment.id ? { ...s, linkedTransferId: transferId } : s
      ))

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to link shipment'))
      return false
    }
  }, [supabase, shipments])

  // Unlink shipment from transfer
  const unlinkFromTransfer = useCallback(async (shipmentId: string): Promise<boolean> => {
    try {
      const shipment = shipments.find(s => s.shipmentId === shipmentId)
      if (!shipment) {
        throw new Error('Shipment not found')
      }

      const { error } = await supabase
        .from('amazon_shipments')
        .update({ linked_transfer_id: null })
        .eq('id', shipment.id)

      if (error) throw error

      // Update local state
      setShipments(prev => prev.map(s =>
        s.id === shipment.id ? { ...s, linkedTransferId: undefined } : s
      ))

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to unlink shipment'))
      return false
    }
  }, [supabase, shipments])

  // Refresh single shipment from Amazon
  const refreshShipment = useCallback(async (shipmentId: string): Promise<boolean> => {
    setSyncing(true)
    setError(null)

    try {
      const response = await fetch(`/api/amazon/refresh-shipment/${shipmentId}`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to refresh shipment')
      }

      // Refetch all shipments
      await fetchShipments()

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh shipment'))
      return false
    } finally {
      setSyncing(false)
    }
  }, [fetchShipments])

  // Compute summary
  const summary: AmazonShipmentsSummary = useMemo(() => {
    return {
      total: shipments.length,
      working: shipments.filter(s => s.status === 'WORKING').length,
      shipped: shipments.filter(s => s.status === 'SHIPPED').length,
      inTransit: shipments.filter(s => s.status === 'IN_TRANSIT').length,
      receiving: shipments.filter(s => ['CHECKED_IN', 'RECEIVING'].includes(s.status)).length,
      closed: shipments.filter(s => s.status === 'CLOSED').length,
      linkedCount: shipments.filter(s => s.linkedTransferId).length,
      unlinkedCount: shipments.filter(s => !s.linkedTransferId).length,
    }
  }, [shipments])

  // Get unlinked shipments (for linking UI)
  const unlinkedShipments = useMemo(() =>
    shipments.filter(s => !s.linkedTransferId && !['CANCELLED', 'DELETED', 'CLOSED'].includes(s.status)),
    [shipments]
  )

  // Initial fetch
  useEffect(() => {
    fetchShipments()
  }, [fetchShipments])

  return {
    shipments,
    unlinkedShipments,
    summary,
    loading,
    syncing,
    lastSyncAt,
    error,
    refetch: fetchShipments,
    fetchShipment,
    syncFromAmazon,
    refreshShipment,
    linkToTransfer,
    unlinkFromTransfer,
  }
}

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '../client'

// Local type definitions (not exported from database.types)
export type AmazonMarketplace = 'US' | 'CA' | 'MX' | 'UK' | 'DE' | 'FR' | 'IT' | 'ES' | 'JP' | 'AU' | 'IN'
export type AmazonMappingStatus = 'pending' | 'mapped' | 'unmapped' | 'ignored'
export type ReconciliationStatus = 'pending' | 'matched' | 'discrepancy' | 'resolved'

interface DbAmazonInventory {
  id: string
  asin: string
  fnsku: string | null
  seller_sku: string
  product_name: string
  condition: string
  marketplace: AmazonMarketplace
  fba_fulfillable: number
  fba_reserved: number
  fba_inbound_working: number
  fba_inbound_shipped: number
  fba_inbound_receiving: number
  fba_unfulfillable: number
  awd_quantity: number
  awd_inbound_quantity: number
  last_synced_at: string
}

interface DbAmazonSkuMapping {
  id: string
  amazon_seller_sku: string
  asin: string | null
  fnsku: string | null
  internal_sku_id: string | null
  internal_product_id: string | null
  status: AmazonMappingStatus
  created_at: string
  created_by: string | null
}

interface DbAmazonReconciliation {
  id: string
  batch_id: string | null
  sku: string
  expected_quantity: number
  amazon_quantity: number
  discrepancy: number
  status: ReconciliationStatus
  reconciled_at: string | null
  notes: string | null
}

export interface AmazonInventoryItem {
  id: string
  asin: string
  fnsku: string | null
  sellerSku: string
  productName: string
  condition: string
  marketplace: AmazonMarketplace
  fbaFulfillable: number
  fbaReserved: number
  fbaInboundWorking: number
  fbaInboundShipped: number
  fbaInboundReceiving: number
  fbaUnfulfillable: number
  awdQuantity: number
  awdInboundQuantity: number
  totalFba: number
  lastSyncedAt: string
  // Mapping info (if mapped)
  mappingStatus?: AmazonMappingStatus
  internalSkuId?: string
  internalProductId?: string
}

export interface AmazonInventorySummary {
  totalItems: number
  totalFbaFulfillable: number
  totalFbaReserved: number
  totalFbaInbound: number
  totalFbaUnfulfillable: number
  totalAwd: number
  totalAwdInbound: number
  mappedCount: number
  unmappedCount: number
}

export interface AmazonSkuMapping {
  id: string
  amazonSellerSku: string
  asin: string | null
  fnsku: string | null
  internalSkuId: string | null
  internalProductId: string | null
  createdAt: string
  createdBy: string | null
}

export interface AmazonReconciliation {
  id: string
  batchId: string | null
  sku: string
  expectedQuantity: number
  amazonQuantity: number
  discrepancy: number
  status: ReconciliationStatus
  reconciledAt: string | null
  notes: string | null
}

function transformInventoryItem(
  dbItem: DbAmazonInventory,
  mapping?: DbAmazonSkuMapping | null
): AmazonInventoryItem {
  const totalFba = (dbItem.fba_fulfillable || 0) +
    (dbItem.fba_reserved || 0) +
    (dbItem.fba_inbound_working || 0) +
    (dbItem.fba_inbound_shipped || 0) +
    (dbItem.fba_inbound_receiving || 0)

  return {
    id: dbItem.id,
    asin: dbItem.asin,
    fnsku: dbItem.fnsku,
    sellerSku: dbItem.seller_sku,
    productName: dbItem.product_name,
    condition: dbItem.condition,
    marketplace: dbItem.marketplace,
    fbaFulfillable: dbItem.fba_fulfillable || 0,
    fbaReserved: dbItem.fba_reserved || 0,
    fbaInboundWorking: dbItem.fba_inbound_working || 0,
    fbaInboundShipped: dbItem.fba_inbound_shipped || 0,
    fbaInboundReceiving: dbItem.fba_inbound_receiving || 0,
    fbaUnfulfillable: dbItem.fba_unfulfillable || 0,
    awdQuantity: dbItem.awd_quantity || 0,
    awdInboundQuantity: dbItem.awd_inbound_quantity || 0,
    totalFba,
    lastSyncedAt: dbItem.last_synced_at,
    mappingStatus: mapping ? 'mapped' : 'unmapped',
    internalSkuId: mapping?.internal_sku_id || undefined,
    internalProductId: mapping?.internal_product_id || undefined,
  }
}

function transformMapping(dbMapping: DbAmazonSkuMapping): AmazonSkuMapping {
  return {
    id: dbMapping.id,
    amazonSellerSku: dbMapping.amazon_seller_sku,
    asin: dbMapping.asin,
    fnsku: dbMapping.fnsku,
    internalSkuId: dbMapping.internal_sku_id,
    internalProductId: dbMapping.internal_product_id,
    createdAt: dbMapping.created_at,
    createdBy: dbMapping.created_by,
  }
}

function transformReconciliation(dbRec: DbAmazonReconciliation): AmazonReconciliation {
  return {
    id: dbRec.id,
    batchId: dbRec.batch_id,
    sku: dbRec.sku,
    expectedQuantity: dbRec.expected_quantity,
    amazonQuantity: dbRec.amazon_quantity,
    discrepancy: dbRec.discrepancy || 0,
    status: dbRec.status,
    reconciledAt: dbRec.reconciled_at,
    notes: dbRec.notes,
  }
}

export function useAmazonInventory() {
  const [inventory, setInventory] = useState<AmazonInventoryItem[]>([])
  const [mappings, setMappings] = useState<AmazonSkuMapping[]>([])
  const [reconciliations, setReconciliations] = useState<AmazonReconciliation[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)

  const supabase = createClient()

  // Fetch Amazon inventory with mappings
  const fetchInventory = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch inventory items
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('amazon_inventory')
        .select('*')
        .order('product_name', { ascending: true })

      if (inventoryError) throw inventoryError

      // Fetch mappings
      const { data: mappingsData, error: mappingsError } = await supabase
        .from('amazon_sku_mappings')
        .select('*')

      if (mappingsError) throw mappingsError

      // Create mapping lookup
      const mappingLookup = new Map<string, DbAmazonSkuMapping>()
      for (const m of mappingsData || []) {
        mappingLookup.set(m.amazon_seller_sku, m)
      }

      // Transform inventory with mapping info
      const transformedInventory = (inventoryData || []).map(item =>
        transformInventoryItem(item, mappingLookup.get(item.seller_sku))
      )

      setInventory(transformedInventory)
      setMappings((mappingsData || []).map(transformMapping))

      // Update last sync time
      if (transformedInventory.length > 0) {
        const latestSync = transformedInventory.reduce((latest, item) => {
          return item.lastSyncedAt > latest ? item.lastSyncedAt : latest
        }, transformedInventory[0].lastSyncedAt)
        setLastSyncAt(latestSync)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch Amazon inventory'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Fetch reconciliation records
  const fetchReconciliations = useCallback(async () => {
    try {
      const { data, error: recError } = await supabase
        .from('amazon_reconciliations')
        .select('*')
        .order('created_at', { ascending: false })

      if (recError) {
        // Silently ignore if table is empty or has no data
        if (recError.code !== 'PGRST116') {
          console.warn('Reconciliations fetch warning:', recError.message || 'Unknown error')
        }
        return
      }

      setReconciliations((data || []).map(transformReconciliation))
    } catch {
      // Silently ignore reconciliation fetch errors - feature may not be fully set up
    }
  }, [supabase])

  // Initial fetch
  useEffect(() => {
    fetchInventory()
    fetchReconciliations()
  }, [fetchInventory, fetchReconciliations])

  // Sync inventory from Amazon SP-API
  const syncFromAmazon = useCallback(async (): Promise<boolean> => {
    setSyncing(true)
    setError(null)

    try {
      const response = await fetch('/api/amazon/sync', {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to sync from Amazon')
      }

      const { syncedCount, lastSyncAt: newSyncAt } = await response.json()

      // Refresh inventory data
      await fetchInventory()
      setLastSyncAt(newSyncAt)

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sync from Amazon'))
      return false
    } finally {
      setSyncing(false)
    }
  }, [fetchInventory])

  // Map Amazon SKU to internal SKU
  const mapSku = useCallback(async (
    amazonSellerSku: string,
    internalSkuId: string,
    internalProductId: string
  ): Promise<boolean> => {
    setError(null)

    try {
      // Get ASIN/FNSKU from inventory
      const inventoryItem = inventory.find(i => i.sellerSku === amazonSellerSku)

      const { error: insertError } = await supabase
        .from('amazon_sku_mappings')
        .insert({
          amazon_seller_sku: amazonSellerSku,
          asin: inventoryItem?.asin || null,
          fnsku: inventoryItem?.fnsku || null,
          internal_sku_id: internalSkuId,
          internal_product_id: internalProductId,
        })

      if (insertError) throw insertError

      // Refresh data
      await fetchInventory()
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to map SKU'))
      return false
    }
  }, [supabase, inventory, fetchInventory])

  // Unmap Amazon SKU
  const unmapSku = useCallback(async (amazonSellerSku: string): Promise<boolean> => {
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('amazon_sku_mappings')
        .delete()
        .eq('amazon_seller_sku', amazonSellerSku)

      if (deleteError) throw deleteError

      // Refresh data
      await fetchInventory()
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to unmap SKU'))
      return false
    }
  }, [supabase, fetchInventory])

  // Reconcile batch with Amazon inventory
  const reconcileBatch = useCallback(async (
    batchId: string,
    sku: string,
    expectedQuantity: number
  ): Promise<AmazonReconciliation | null> => {
    setError(null)

    try {
      // Find Amazon inventory for this SKU
      const amazonItem = inventory.find(i => i.sellerSku === sku)
      const amazonQuantity = amazonItem?.fbaFulfillable || 0

      const { data, error: insertError } = await supabase
        .from('amazon_reconciliations')
        .insert({
          batch_id: batchId,
          sku,
          expected_quantity: expectedQuantity,
          amazon_quantity: amazonQuantity,
          status: expectedQuantity === amazonQuantity ? 'matched' : 'discrepancy',
          reconciled_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (insertError) throw insertError

      const reconciliation = transformReconciliation(data)
      setReconciliations(prev => [reconciliation, ...prev])
      return reconciliation
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to reconcile batch'))
      return null
    }
  }, [supabase, inventory])

  // Compute summary
  const summary = useMemo((): AmazonInventorySummary => {
    const mappedItems = inventory.filter(i => i.mappingStatus === 'mapped')
    const unmappedItems = inventory.filter(i => i.mappingStatus === 'unmapped')

    return {
      totalItems: inventory.length,
      totalFbaFulfillable: inventory.reduce((sum, i) => sum + i.fbaFulfillable, 0),
      totalFbaReserved: inventory.reduce((sum, i) => sum + i.fbaReserved, 0),
      totalFbaInbound: inventory.reduce((sum, i) =>
        sum + i.fbaInboundWorking + i.fbaInboundShipped + i.fbaInboundReceiving, 0),
      totalFbaUnfulfillable: inventory.reduce((sum, i) => sum + i.fbaUnfulfillable, 0),
      totalAwd: inventory.reduce((sum, i) => sum + i.awdQuantity, 0),
      totalAwdInbound: inventory.reduce((sum, i) => sum + i.awdInboundQuantity, 0),
      mappedCount: mappedItems.length,
      unmappedCount: unmappedItems.length,
    }
  }, [inventory])

  // Get inventory by mapping status
  const mappedInventory = useMemo(() =>
    inventory.filter(i => i.mappingStatus === 'mapped'), [inventory])

  const unmappedInventory = useMemo(() =>
    inventory.filter(i => i.mappingStatus === 'unmapped'), [inventory])

  return {
    inventory,
    mappedInventory,
    unmappedInventory,
    mappings,
    reconciliations,
    summary,
    loading,
    syncing,
    error,
    lastSyncAt,
    refetch: fetchInventory,
    syncFromAmazon,
    mapSku,
    unmapSku,
    reconcileBatch,
  }
}

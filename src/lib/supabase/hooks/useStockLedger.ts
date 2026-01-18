'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '../client'
import type { Database } from '../database.types'

// Derive types from Database
type DbStockLedgerEntry = Database['public']['Tables']['stock_ledger_entries']['Row']
type DbStockByLocation = Database['public']['Views']['stock_by_location']['Row']
type DbStockByProduct = Database['public']['Views']['stock_by_product']['Row']
type StockMovementType = Database['public']['Enums']['stock_movement_type']
import type {
  Stock,
  StockLedgerEntry,
  ProductStockGroup,
  LocationStockGroup,
} from '@/sections/inventory/types'

// Allocation tracking for draft transfers
interface DraftAllocation {
  batchId: string
  locationId: string
  allocatedQuantity: number
}

// Transform database stock position to frontend stock
function transformStockByLocation(
  dbStock: DbStockByLocation,
  allocations: Map<string, number> = new Map()
): Stock {
  // Key for allocation lookup: batchId-locationId
  const allocationKey = `${dbStock.batch_id}-${dbStock.location_id}`
  const reservedQuantity = allocations.get(allocationKey) || 0
  const totalQuantity = Number(dbStock.total_quantity) || 0

  return {
    id: `${dbStock.batch_id}-${dbStock.location_id}`,
    batchId: dbStock.batch_id || '',
    sku: dbStock.sku || '',
    productName: dbStock.product_name || '',
    locationId: dbStock.location_id || '',
    locationName: dbStock.location_name || '',
    locationType: dbStock.location_type || '',
    totalQuantity,
    availableQuantity: Math.max(0, totalQuantity - reservedQuantity),
    reservedQuantity,
    unitCost: Number(dbStock.unit_cost) || 0,
    totalValue: Number(dbStock.total_value) || 0,
    firstReceivedAt: dbStock.first_received_at || '',
    lastReceivedAt: dbStock.last_movement_at || '',
    poNumber: dbStock.po_number || '',
    supplierName: dbStock.supplier_name || '',
  }
}

// Transform database ledger entry to frontend
function transformLedgerEntry(
  dbEntry: DbStockLedgerEntry & {
    location?: { name: string } | null
  }
): StockLedgerEntry {
  return {
    id: dbEntry.id,
    batchId: dbEntry.batch_id,
    sku: dbEntry.sku,
    productName: dbEntry.product_name,
    locationId: dbEntry.location_id,
    locationName: dbEntry.location?.name || '',
    quantity: dbEntry.quantity,
    movementType: dbEntry.movement_type,
    status: 'confirmed', // Auto-confirmed in this implementation
    unitCost: dbEntry.unit_cost,
    totalCost: dbEntry.total_cost,
    transferId: dbEntry.transfer_id,
    transferLineItemId: dbEntry.transfer_line_item_id,
    reason: dbEntry.reason,
    notes: dbEntry.notes || '',
    createdAt: dbEntry.created_at,
    createdBy: dbEntry.created_by,
    confirmedAt: dbEntry.created_at, // Auto-confirmed
    confirmedBy: dbEntry.created_by,
  }
}

export interface LedgerEntryInput {
  batchId: string
  sku: string
  productName: string
  locationId: string
  quantity: number
  movementType: StockMovementType
  unitCost: number
  reason: string
  notes?: string
  transferId?: string
  transferLineItemId?: string
}

export function useStockLedger() {
  const [ledgerEntries, setLedgerEntries] = useState<StockLedgerEntry[]>([])
  const [stockPositions, setStockPositions] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Fetch all ledger entries
  const fetchLedgerEntries = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('stock_ledger_entries')
        .select(`
          *,
          location:locations(name)
        `)
        .order('created_at', { ascending: false })
        .limit(500) // Limit for performance

      if (fetchError) throw fetchError

      const transformed = (data || []).map(transformLedgerEntry)
      setLedgerEntries(transformed)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch ledger entries'))
    }
  }, [supabase])

  // Fetch draft transfer allocations
  const fetchDraftAllocations = useCallback(async (): Promise<Map<string, number>> => {
    try {
      // Get all line items from draft transfers with their source location
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

  // Fetch stock positions from view
  const fetchStockPositions = useCallback(async () => {
    try {
      // Fetch stock and allocations in parallel
      const [stockResult, allocations] = await Promise.all([
        supabase
          .from('stock_by_location')
          .select('*')
          .gt('total_quantity', 0),
        fetchDraftAllocations(),
      ])

      if (stockResult.error) throw stockResult.error

      const transformed = (stockResult.data || []).map(stock =>
        transformStockByLocation(stock, allocations)
      )
      setStockPositions(transformed)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch stock positions'))
    }
  }, [supabase, fetchDraftAllocations])

  // Fetch all data
  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      await Promise.all([
        fetchLedgerEntries(),
        fetchStockPositions(),
      ])
    } finally {
      setLoading(false)
    }
  }, [fetchLedgerEntries, fetchStockPositions])

  // Fetch ledger entries for a specific batch
  const fetchEntriesForBatch = useCallback(async (batchId: string): Promise<StockLedgerEntry[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('stock_ledger_entries')
        .select(`
          *,
          location:locations(name)
        `)
        .eq('batch_id', batchId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      return (data || []).map(transformLedgerEntry)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch batch entries'))
      return []
    }
  }, [supabase])

  // Create a ledger entry
  const createEntry = useCallback(async (input: LedgerEntryInput): Promise<StockLedgerEntry | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('stock_ledger_entries')
        .insert({
          batch_id: input.batchId,
          sku: input.sku,
          product_name: input.productName,
          location_id: input.locationId,
          quantity: input.quantity,
          movement_type: input.movementType,
          unit_cost: input.unitCost,
          reason: input.reason,
          notes: input.notes || null,
          transfer_id: input.transferId || null,
          transfer_line_item_id: input.transferLineItemId || null,
        })
        .select(`
          *,
          location:locations(name)
        `)
        .single()

      if (insertError) throw insertError

      const transformed = transformLedgerEntry(data)
      setLedgerEntries(prev => [transformed, ...prev])

      // Refetch stock positions as they may have changed
      await fetchStockPositions()

      return transformed
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create ledger entry'))
      return null
    }
  }, [supabase, fetchStockPositions])

  // Get stock at a specific location
  const getStockAtLocation = useCallback(async (locationId: string): Promise<Stock[]> => {
    try {
      const [stockResult, allocations] = await Promise.all([
        supabase
          .from('stock_by_location')
          .select('*')
          .eq('location_id', locationId)
          .gt('total_quantity', 0),
        fetchDraftAllocations(),
      ])

      if (stockResult.error) throw stockResult.error

      return (stockResult.data || []).map(stock =>
        transformStockByLocation(stock, allocations)
      )
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get stock at location'))
      return []
    }
  }, [supabase, fetchDraftAllocations])

  // Get stock for a specific product (SKU)
  const getStockForProduct = useCallback(async (sku: string): Promise<Stock[]> => {
    try {
      const [stockResult, allocations] = await Promise.all([
        supabase
          .from('stock_by_location')
          .select('*')
          .eq('sku', sku)
          .gt('total_quantity', 0)
          .order('first_received_at', { ascending: true }), // FIFO ordering
        fetchDraftAllocations(),
      ])

      if (stockResult.error) throw stockResult.error

      return (stockResult.data || []).map(stock =>
        transformStockByLocation(stock, allocations)
      )
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get stock for product'))
      return []
    }
  }, [supabase, fetchDraftAllocations])

  // Get stock for a specific batch
  const getStockForBatch = useCallback(async (batchId: string): Promise<Stock[]> => {
    try {
      const [stockResult, allocations] = await Promise.all([
        supabase
          .from('stock_by_location')
          .select('*')
          .eq('batch_id', batchId),
        fetchDraftAllocations(),
      ])

      if (stockResult.error) throw stockResult.error

      return (stockResult.data || []).map(stock =>
        transformStockByLocation(stock, allocations)
      )
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get stock for batch'))
      return []
    }
  }, [supabase, fetchDraftAllocations])

  // Group stock by product (for "By Product" view)
  const stockByProduct: ProductStockGroup[] = useMemo(() => {
    const grouped: Record<string, ProductStockGroup> = {}

    stockPositions.forEach(stock => {
      if (!grouped[stock.sku]) {
        grouped[stock.sku] = {
          sku: stock.sku,
          productName: stock.productName,
          totalQuantity: 0,
          availableQuantity: 0,
          reservedQuantity: 0,
          totalValue: 0,
          locationsCount: 0,
          locationGroups: [],
        }
      }

      const productGroup = grouped[stock.sku]
      productGroup.totalQuantity += stock.totalQuantity
      productGroup.availableQuantity += stock.availableQuantity
      productGroup.reservedQuantity += stock.reservedQuantity
      productGroup.totalValue += stock.totalValue

      // Find or create location group
      let locationGroup = productGroup.locationGroups.find(
        lg => lg.locationId === stock.locationId
      )

      if (!locationGroup) {
        locationGroup = {
          locationId: stock.locationId,
          locationName: stock.locationName,
          locationType: stock.locationType,
          totalQuantity: 0,
          availableQuantity: 0,
          reservedQuantity: 0,
          totalValue: 0,
          stocks: [],
        }
        productGroup.locationGroups.push(locationGroup)
        productGroup.locationsCount++
      }

      locationGroup.totalQuantity += stock.totalQuantity
      locationGroup.availableQuantity += stock.availableQuantity
      locationGroup.reservedQuantity += stock.reservedQuantity
      locationGroup.totalValue += stock.totalValue
      locationGroup.stocks.push(stock)
    })

    return Object.values(grouped).sort((a, b) => a.sku.localeCompare(b.sku))
  }, [stockPositions])

  // Group stock by location (for "By Location" view)
  const stockByLocation: LocationStockGroup[] = useMemo(() => {
    const grouped: Record<string, LocationStockGroup> = {}

    stockPositions.forEach(stock => {
      if (!grouped[stock.locationId]) {
        grouped[stock.locationId] = {
          locationId: stock.locationId,
          locationName: stock.locationName,
          locationType: stock.locationType,
          totalQuantity: 0,
          availableQuantity: 0,
          reservedQuantity: 0,
          totalValue: 0,
          productsCount: 0,
          productGroups: [],
        }
      }

      const locationGroup = grouped[stock.locationId]
      locationGroup.totalQuantity += stock.totalQuantity
      locationGroup.availableQuantity += stock.availableQuantity
      locationGroup.reservedQuantity += stock.reservedQuantity
      locationGroup.totalValue += stock.totalValue

      // Find or create product group
      let productGroup = locationGroup.productGroups.find(
        pg => pg.sku === stock.sku
      )

      if (!productGroup) {
        productGroup = {
          sku: stock.sku,
          productName: stock.productName,
          totalQuantity: 0,
          availableQuantity: 0,
          reservedQuantity: 0,
          totalValue: 0,
          stocks: [],
        }
        locationGroup.productGroups.push(productGroup)
        locationGroup.productsCount++
      }

      productGroup.totalQuantity += stock.totalQuantity
      productGroup.availableQuantity += stock.availableQuantity
      productGroup.reservedQuantity += stock.reservedQuantity
      productGroup.totalValue += stock.totalValue
      productGroup.stocks.push(stock)
    })

    return Object.values(grouped).sort((a, b) => a.locationName.localeCompare(b.locationName))
  }, [stockPositions])

  // Compute summary statistics
  const summary = useMemo(() => {
    const totalUnits = stockPositions.reduce((sum, s) => sum + s.totalQuantity, 0)
    const totalValue = stockPositions.reduce((sum, s) => sum + s.totalValue, 0)
    const uniqueProducts = new Set(stockPositions.map(s => s.sku)).size
    const uniqueLocations = new Set(stockPositions.map(s => s.locationId)).size

    return {
      totalUnits,
      totalValue,
      uniqueProducts,
      uniqueLocations,
    }
  }, [stockPositions])

  // Initial fetch
  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return {
    ledgerEntries,
    stockPositions,
    stockByProduct,
    stockByLocation,
    summary,
    loading,
    error,
    refetch: fetchAll,
    fetchEntriesForBatch,
    createEntry,
    getStockAtLocation,
    getStockForProduct,
    getStockForBatch,
  }
}

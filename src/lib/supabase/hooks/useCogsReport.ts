'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '../client'

export interface CogsEntry {
  id: string
  batchId: string
  batchNumber: string
  sku: string
  productName: string
  locationId: string
  locationName: string
  quantity: number
  unitCost: number
  totalCost: number
  movementType: string
  createdAt: string
  reason: string
}

export interface CogsSummary {
  totalCogs: number
  totalUnits: number
  uniqueProducts: number
  avgCostPerUnit: number
  monthlyTrend: { month: string; cogs: number; units: number }[]
}

export interface CogsFilters {
  dateFrom: string | null
  dateTo: string | null
  movementType: string | null
  productSearch: string
}

export function useCogsReport(filters: CogsFilters = { dateFrom: null, dateTo: null, movementType: null, productSearch: '' }) {
  const [entries, setEntries] = useState<CogsEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  const fetchCogsData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch stock ledger entries that represent COGS (outbound movements)
      // COGS = transfer_out + adjustment_remove + amazon_reconcile where quantity < 0
      let query = supabase
        .from('stock_ledger_entries')
        .select('*')
        .in('movement_type', ['transfer_out', 'adjustment_remove', 'amazon_reconcile'])
        .lt('quantity', 0)
        .order('created_at', { ascending: false })

      // Apply date filters
      if (filters.dateFrom) {
        query = query.gte('created_at', `${filters.dateFrom}T00:00:00`)
      }
      if (filters.dateTo) {
        query = query.lte('created_at', `${filters.dateTo}T23:59:59`)
      }

      // Apply movement type filter
      if (filters.movementType && filters.movementType !== 'all') {
        query = query.eq('movement_type', filters.movementType)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      // Fetch batches and locations for enrichment
      const batchIds = [...new Set((data || []).map(e => e.batch_id))]
      const locationIds = [...new Set((data || []).map(e => e.location_id))]

      const [batchesResult, locationsResult] = await Promise.all([
        batchIds.length > 0
          ? supabase.from('batches').select('id, batch_number').in('id', batchIds)
          : { data: [], error: null },
        locationIds.length > 0
          ? supabase.from('locations').select('id, name').in('id', locationIds)
          : { data: [], error: null }
      ])

      const batchMap = new Map((batchesResult.data || []).map(b => [b.id, b.batch_number]))
      const locationMap = new Map((locationsResult.data || []).map(l => [l.id, l.name]))

      // Transform data
      const transformedData: CogsEntry[] = (data || []).map((entry: any) => ({
        id: entry.id,
        batchId: entry.batch_id,
        batchNumber: batchMap.get(entry.batch_id) || 'Unknown',
        sku: entry.sku,
        productName: entry.product_name,
        locationId: entry.location_id,
        locationName: locationMap.get(entry.location_id) || 'Unknown',
        quantity: Math.abs(entry.quantity), // Convert to positive for display
        unitCost: entry.unit_cost,
        totalCost: Math.abs(entry.quantity) * entry.unit_cost,
        movementType: entry.movement_type,
        createdAt: entry.created_at,
        reason: entry.reason,
      }))

      // Apply product search filter
      const filteredData = filters.productSearch
        ? transformedData.filter(
            e =>
              e.sku.toLowerCase().includes(filters.productSearch.toLowerCase()) ||
              e.productName.toLowerCase().includes(filters.productSearch.toLowerCase())
          )
        : transformedData

      setEntries(filteredData)
    } catch (err) {
      console.error('Error fetching COGS data:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch COGS data'))
    } finally {
      setLoading(false)
    }
  }, [supabase, filters.dateFrom, filters.dateTo, filters.movementType, filters.productSearch])

  useEffect(() => {
    fetchCogsData()
  }, [fetchCogsData])

  // Calculate summary statistics
  const summary = useMemo<CogsSummary>(() => {
    const totalCogs = entries.reduce((sum, e) => sum + e.totalCost, 0)
    const totalUnits = entries.reduce((sum, e) => sum + e.quantity, 0)
    const uniqueProducts = new Set(entries.map(e => e.sku)).size
    const avgCostPerUnit = totalUnits > 0 ? totalCogs / totalUnits : 0

    // Calculate monthly trend
    const monthlyData = entries.reduce((acc, entry) => {
      const date = new Date(entry.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!acc[monthKey]) {
        acc[monthKey] = { cogs: 0, units: 0 }
      }
      acc[monthKey].cogs += entry.totalCost
      acc[monthKey].units += entry.quantity
      return acc
    }, {} as Record<string, { cogs: number; units: number }>)

    const monthlyTrend = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        cogs: data.cogs,
        units: data.units,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    return {
      totalCogs,
      totalUnits,
      uniqueProducts,
      avgCostPerUnit,
      monthlyTrend,
    }
  }, [entries])

  // Group by product for product-level COGS analysis
  const productSummary = useMemo(() => {
    const grouped = entries.reduce((acc, entry) => {
      if (!acc[entry.sku]) {
        acc[entry.sku] = {
          sku: entry.sku,
          productName: entry.productName,
          totalUnits: 0,
          totalCogs: 0,
          avgUnitCost: 0,
          entries: [],
        }
      }
      acc[entry.sku].totalUnits += entry.quantity
      acc[entry.sku].totalCogs += entry.totalCost
      acc[entry.sku].entries.push(entry)
      return acc
    }, {} as Record<string, { sku: string; productName: string; totalUnits: number; totalCogs: number; avgUnitCost: number; entries: CogsEntry[] }>)

    // Calculate average unit cost
    return Object.values(grouped)
      .map(product => ({
        ...product,
        avgUnitCost: product.totalUnits > 0 ? product.totalCogs / product.totalUnits : 0,
      }))
      .sort((a, b) => b.totalCogs - a.totalCogs)
  }, [entries])

  return {
    entries,
    summary,
    productSummary,
    loading,
    error,
    refetch: fetchCogsData,
  }
}

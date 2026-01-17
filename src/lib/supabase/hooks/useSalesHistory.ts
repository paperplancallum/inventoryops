'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../client'
import type {
  SalesHistoryEntry,
  SalesHistorySource,
} from '@/sections/inventory-intelligence/types'

interface DbSalesHistoryEntry {
  id: string
  product_id: string
  location_id: string
  date: string
  units_sold: number
  revenue: number
  currency: string
  source: SalesHistorySource
  created_at: string
  product?: { id: string; sku: string; name: string }
  location?: { id: string; name: string }
}

function transformEntry(db: DbSalesHistoryEntry): SalesHistoryEntry {
  return {
    id: db.id,
    productId: db.product_id,
    sku: db.product?.sku || '',
    productName: db.product?.name || 'Unknown',
    locationId: db.location_id,
    locationName: db.location?.name || 'Unknown',
    date: db.date,
    unitsSold: db.units_sold,
    revenue: db.revenue,
    currency: db.currency,
    source: db.source,
    createdAt: db.created_at,
  }
}

interface UseSalesHistoryOptions {
  productId?: string
  locationId?: string
  startDate?: string
  endDate?: string
  limit?: number
}

export function useSalesHistory(options: UseSalesHistoryOptions = {}) {
  const [entries, setEntries] = useState<SalesHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('sales_history')
        .select(`
          *,
          product:products(id, sku, name),
          location:locations(id, name)
        `)
        .order('date', { ascending: false })

      if (options.productId) {
        query = query.eq('product_id', options.productId)
      }
      if (options.locationId) {
        query = query.eq('location_id', options.locationId)
      }
      if (options.startDate) {
        query = query.gte('date', options.startDate)
      }
      if (options.endDate) {
        query = query.lte('date', options.endDate)
      }
      if (options.limit) {
        query = query.limit(options.limit)
      }

      const { data, error: historyError } = await query

      if (historyError) throw historyError

      setEntries((data || []).map(transformEntry))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch sales history'))
    } finally {
      setLoading(false)
    }
  }, [supabase, options.productId, options.locationId, options.startDate, options.endDate, options.limit])

  const addEntry = useCallback(async (data: {
    productId: string
    locationId: string
    date: string
    unitsSold: number
    revenue?: number
    currency?: string
    source?: SalesHistorySource
  }): Promise<SalesHistoryEntry | null> => {
    try {
      const { data: newEntry, error: entryError } = await supabase
        .from('sales_history')
        .insert({
          product_id: data.productId,
          location_id: data.locationId,
          date: data.date,
          units_sold: data.unitsSold,
          revenue: data.revenue || 0,
          currency: data.currency || 'USD',
          source: data.source || 'manual',
        })
        .select(`
          *,
          product:products(id, sku, name),
          location:locations(id, name)
        `)
        .single()

      if (entryError) throw entryError

      const entry = transformEntry(newEntry)
      setEntries(prev => [entry, ...prev].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ))
      return entry
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add sales history entry'))
      return null
    }
  }, [supabase])

  const bulkAddEntries = useCallback(async (data: {
    productId: string
    locationId: string
    date: string
    unitsSold: number
    revenue?: number
    currency?: string
    source?: SalesHistorySource
  }[]): Promise<number> => {
    try {
      const { data: newEntries, error: entriesError } = await supabase
        .from('sales_history')
        .upsert(
          data.map(d => ({
            product_id: d.productId,
            location_id: d.locationId,
            date: d.date,
            units_sold: d.unitsSold,
            revenue: d.revenue || 0,
            currency: d.currency || 'USD',
            source: d.source || 'imported',
          })),
          { onConflict: 'product_id,location_id,date' }
        )
        .select()

      if (entriesError) throw entriesError

      await fetchHistory()
      return newEntries?.length || 0
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to bulk add sales history'))
      return 0
    }
  }, [supabase, fetchHistory])

  const deleteEntry = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('sales_history')
        .delete()
        .eq('id', id)

      if (error) throw error

      setEntries(prev => prev.filter(e => e.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete sales history entry'))
      return false
    }
  }, [supabase])

  // Calculate daily average over a period
  const calculateDailyAverage = useCallback((
    productId: string,
    locationId: string,
    days: number = 30
  ): number => {
    const relevantEntries = entries.filter(e =>
      e.productId === productId &&
      e.locationId === locationId
    ).slice(0, days)

    if (relevantEntries.length === 0) return 0

    const total = relevantEntries.reduce((sum, e) => sum + e.unitsSold, 0)
    return total / relevantEntries.length
  }, [entries])

  // Get entries for a specific product/location
  const getEntriesForProductLocation = useCallback((
    productId: string,
    locationId: string
  ): SalesHistoryEntry[] => {
    return entries.filter(e =>
      e.productId === productId &&
      e.locationId === locationId
    )
  }, [entries])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  return {
    entries,
    loading,
    error,
    refetch: fetchHistory,
    addEntry,
    bulkAddEntries,
    deleteEntry,
    calculateDailyAverage,
    getEntriesForProductLocation,
  }
}

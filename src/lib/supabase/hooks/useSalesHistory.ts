'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type SalesHistorySource = 'amazon-api' | 'manual' | 'imported'

export interface SalesHistoryEntry {
  id: string
  productId: string
  sku: string
  productName: string
  locationId: string
  locationName: string
  date: string
  unitsSold: number
  revenue: number
  currency: string
  source: SalesHistorySource
  createdAt: string
}

export interface SalesHistoryInsert {
  productId: string
  locationId: string
  date: string
  unitsSold: number
  revenue?: number
  currency?: string
  source?: SalesHistorySource
}

export interface SalesHistoryFilters {
  productId?: string
  locationId?: string
  startDate?: string
  endDate?: string
}

export function useSalesHistory(filters?: SalesHistoryFilters) {
  const [history, setHistory] = useState<SalesHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('sales_history')
        .select(`
          *,
          product:products(id, sku, name),
          location:locations(id, name)
        `)
        .order('date', { ascending: false })

      if (filters?.productId) {
        query = query.eq('product_id', filters.productId)
      }
      if (filters?.locationId) {
        query = query.eq('location_id', filters.locationId)
      }
      if (filters?.startDate) {
        query = query.gte('date', filters.startDate)
      }
      if (filters?.endDate) {
        query = query.lte('date', filters.endDate)
      }

      const { data, error: fetchError } = await query.limit(365) // Last year

      if (fetchError) throw fetchError

      const mapped: SalesHistoryEntry[] = (data || []).map((row) => ({
        id: row.id,
        productId: row.product_id,
        sku: row.product?.sku || '',
        productName: row.product?.name || '',
        locationId: row.location_id,
        locationName: row.location?.name || '',
        date: row.date,
        unitsSold: row.units_sold,
        revenue: parseFloat(row.revenue) || 0,
        currency: row.currency,
        source: row.source as SalesHistorySource,
        createdAt: row.created_at,
      }))

      setHistory(mapped)
    } catch (err) {
      console.error('Error fetching sales history:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch history')
    } finally {
      setLoading(false)
    }
  }, [supabase, filters])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const createEntry = useCallback(async (entry: SalesHistoryInsert): Promise<SalesHistoryEntry | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('sales_history')
        .insert({
          product_id: entry.productId,
          location_id: entry.locationId,
          date: entry.date,
          units_sold: entry.unitsSold,
          revenue: entry.revenue || 0,
          currency: entry.currency || 'USD',
          source: entry.source || 'manual',
        })
        .select()
        .single()

      if (insertError) throw insertError

      await fetchHistory()
      return data as unknown as SalesHistoryEntry
    } catch (err) {
      console.error('Error creating sales history entry:', err)
      throw err
    }
  }, [supabase, fetchHistory])

  const bulkImport = useCallback(async (entries: SalesHistoryInsert[]): Promise<void> => {
    try {
      const rows = entries.map((entry) => ({
        product_id: entry.productId,
        location_id: entry.locationId,
        date: entry.date,
        units_sold: entry.unitsSold,
        revenue: entry.revenue || 0,
        currency: entry.currency || 'USD',
        source: entry.source || 'imported',
      }))

      const { error: insertError } = await supabase
        .from('sales_history')
        .upsert(rows, { onConflict: 'product_id,location_id,date' })

      if (insertError) throw insertError

      await fetchHistory()
    } catch (err) {
      console.error('Error bulk importing sales history:', err)
      throw err
    }
  }, [supabase, fetchHistory])

  const deleteEntry = useCallback(async (id: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase
        .from('sales_history')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      await fetchHistory()
    } catch (err) {
      console.error('Error deleting sales history entry:', err)
      throw err
    }
  }, [supabase, fetchHistory])

  // Calculate daily average from history
  const calculateDailyAverage = useCallback((productId: string, locationId: string, days: number = 30): number => {
    const relevantEntries = history.filter(
      (h) => h.productId === productId && h.locationId === locationId
    ).slice(0, days)

    if (relevantEntries.length === 0) return 0

    const total = relevantEntries.reduce((sum, h) => sum + h.unitsSold, 0)
    return total / relevantEntries.length
  }, [history])

  // Sync sales history from Amazon
  const syncFromAmazon = useCallback(async (options?: {
    startDate?: string
    endDate?: string
    locationId?: string
  }): Promise<{ success: boolean; message: string; syncedCount?: number }> => {
    try {
      setLoading(true)
      const response = await fetch('/api/amazon/sales-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options || {}),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          message: data.message || data.error || 'Failed to sync from Amazon',
        }
      }

      await fetchHistory()
      return {
        success: true,
        message: `Successfully synced ${data.syncedCount || 0} sales records`,
        syncedCount: data.syncedCount,
      }
    } catch (err) {
      console.error('Error syncing from Amazon:', err)
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to sync from Amazon',
      }
    } finally {
      setLoading(false)
    }
  }, [fetchHistory])

  // Check Amazon sync status
  const checkAmazonSyncStatus = useCallback(async (): Promise<{
    connected: boolean
    lastConnectionSync?: string
    latestSalesDate?: string
  }> => {
    try {
      const response = await fetch('/api/amazon/sales-history')
      if (!response.ok) {
        return { connected: false }
      }
      return await response.json()
    } catch (err) {
      console.error('Error checking Amazon sync status:', err)
      return { connected: false }
    }
  }, [])

  return {
    history,
    loading,
    error,
    refetch: fetchHistory,
    createEntry,
    bulkImport,
    deleteEntry,
    calculateDailyAverage,
    syncFromAmazon,
    checkAmazonSyncStatus,
  }
}

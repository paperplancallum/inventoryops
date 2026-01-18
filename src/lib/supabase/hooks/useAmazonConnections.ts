'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../client'
import type { Database } from '../database.types'

// Types from database
type DbAmazonConnection = Database['public']['Tables']['amazon_connections']['Row']
type AmazonMarketplace = Database['public']['Enums']['amazon_marketplace']
type AmazonConnectionStatus = Database['public']['Enums']['amazon_connection_status']

// Frontend-safe type (excludes sensitive credentials)
export interface AmazonConnection {
  id: string
  sellerId: string
  sellerName: string | null
  marketplaces: AmazonMarketplace[]
  status: AmazonConnectionStatus
  lastSyncAt: string | null
  lastSyncError: string | null
  createdAt: string
  updatedAt: string
}

// North America marketplaces only (as specified - US, CA, MX per database enum)
export const NA_MARKETPLACES: { id: AmazonMarketplace; name: string; domain: string }[] = [
  { id: 'US', name: 'United States', domain: 'amazon.com' },
  { id: 'CA', name: 'Canada', domain: 'amazon.ca' },
  { id: 'MX', name: 'Mexico', domain: 'amazon.com.mx' },
]

// Type for selected fields from query
interface DbAmazonConnectionPublic {
  id: string
  seller_id: string
  seller_name: string | null
  marketplaces: AmazonMarketplace[]
  status: AmazonConnectionStatus
  last_sync_at: string | null
  last_sync_error: string | null
  created_at: string
  updated_at: string
}

// Transform DB row to frontend-safe type (exclude sensitive fields)
function transformConnection(db: DbAmazonConnectionPublic): AmazonConnection {
  return {
    id: db.id,
    sellerId: db.seller_id,
    sellerName: db.seller_name,
    marketplaces: db.marketplaces,
    status: db.status,
    lastSyncAt: db.last_sync_at,
    lastSyncError: db.last_sync_error,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  }
}

export function useAmazonConnections() {
  const [connections, setConnections] = useState<AmazonConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Fetch all connections (excludes sensitive fields via transform)
  const fetchConnections = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('amazon_connections')
        .select('id, seller_id, seller_name, marketplaces, status, last_sync_at, last_sync_error, created_at, updated_at')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setConnections((data || []).map(transformConnection))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch Amazon connections'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Initiate OAuth flow - redirects to Amazon
  const initiateOAuth = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/amazon/auth', {
        method: 'GET',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to initiate OAuth')
      }

      const { authUrl } = await response.json()
      return authUrl
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to initiate OAuth'))
      return null
    }
  }, [])

  // Refresh token for a connection
  const refreshToken = useCallback(async (connectionId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/amazon/token/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to refresh token')
      }

      // Refetch to get updated status
      await fetchConnections()
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh token'))
      return false
    }
  }, [fetchConnections])

  // Update enabled marketplaces
  const updateMarketplaces = useCallback(async (
    connectionId: string,
    marketplaces: AmazonMarketplace[]
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('amazon_connections')
        .update({ marketplaces })
        .eq('id', connectionId)

      if (updateError) throw updateError

      // Optimistic update
      setConnections(prev =>
        prev.map(c => c.id === connectionId ? { ...c, marketplaces } : c)
      )

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update marketplaces'))
      return false
    }
  }, [supabase])

  // Disconnect (delete) a connection
  const disconnect = useCallback(async (connectionId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('amazon_connections')
        .delete()
        .eq('id', connectionId)

      if (deleteError) throw deleteError

      // Optimistic update
      setConnections(prev => prev.filter(c => c.id !== connectionId))

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to disconnect Amazon account'))
      return false
    }
  }, [supabase])

  // Initial fetch
  useEffect(() => {
    fetchConnections()
  }, [fetchConnections])

  return {
    connections,
    loading,
    error,
    refetch: fetchConnections,
    initiateOAuth,
    refreshToken,
    updateMarketplaces,
    disconnect,
    // Utility
    naMarketplaces: NA_MARKETPLACES,
  }
}

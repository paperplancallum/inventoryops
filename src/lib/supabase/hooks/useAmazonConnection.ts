'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../client'

// Type for Amazon connection status
export type AmazonConnectionStatus = 'active' | 'connected' | 'disconnected' | 'error' | 'pending' | 'expired' | 'revoked'

// Database row type for Amazon connections
interface DbAmazonConnection {
  id: string
  seller_id: string
  marketplaces: string[] | null
  status: AmazonConnectionStatus
  last_sync_at: string | null
  created_at: string
  updated_at: string
}

export interface AmazonConnection {
  id: string
  sellerId: string
  marketplaces: string[]
  status: AmazonConnectionStatus
  lastSyncAt: string | null
  createdAt: string
  updatedAt: string
}

function transformConnection(dbConnection: DbAmazonConnection): AmazonConnection {
  return {
    id: dbConnection.id,
    sellerId: dbConnection.seller_id,
    marketplaces: dbConnection.marketplaces || ['US'],
    status: dbConnection.status,
    lastSyncAt: dbConnection.last_sync_at,
    createdAt: dbConnection.created_at,
    updatedAt: dbConnection.updated_at,
  }
}

export function useAmazonConnection() {
  const [connection, setConnection] = useState<AmazonConnection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  const supabase = createClient()

  // Fetch the current Amazon connection
  const fetchConnection = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('amazon_connections')
        .select('*')
        .limit(1)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No connection found
          setConnection(null)
        } else {
          throw fetchError
        }
      } else {
        setConnection(transformConnection(data))
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch Amazon connection'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Initial fetch
  useEffect(() => {
    fetchConnection()
  }, [fetchConnection])

  // Get OAuth authorization URL
  const getAuthUrl = useCallback(async (): Promise<string | null> => {
    setIsConnecting(true)
    setError(null)

    try {
      const response = await fetch('/api/amazon/auth', {
        method: 'GET',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get auth URL')
      }

      const { authUrl } = await response.json()
      return authUrl
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get auth URL'))
      return null
    } finally {
      setIsConnecting(false)
    }
  }, [])

  // Exchange authorization code for tokens
  const exchangeCode = useCallback(async (code: string): Promise<boolean> => {
    setIsConnecting(true)
    setError(null)

    try {
      const response = await fetch('/api/amazon/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to exchange code')
      }

      // Refresh connection data
      await fetchConnection()
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to exchange code'))
      return false
    } finally {
      setIsConnecting(false)
    }
  }, [fetchConnection])

  // Refresh access token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    setError(null)

    try {
      const response = await fetch('/api/amazon/token/refresh', {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to refresh token')
      }

      await fetchConnection()
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh token'))
      return false
    }
  }, [fetchConnection])

  // Disconnect Amazon account
  const disconnect = useCallback(async (): Promise<boolean> => {
    if (!connection) return false

    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('amazon_connections')
        .delete()
        .eq('id', connection.id)

      if (deleteError) throw deleteError

      setConnection(null)
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to disconnect'))
      return false
    }
  }, [supabase, connection])

  // Update connection status
  const updateStatus = useCallback(async (status: AmazonConnectionStatus): Promise<boolean> => {
    if (!connection) return false

    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('amazon_connections')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', connection.id)

      if (updateError) throw updateError

      setConnection(prev => prev ? { ...prev, status } : null)
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update status'))
      return false
    }
  }, [supabase, connection])

  const isConnected = connection?.status === 'active'
  const isPending = connection?.status === 'pending'
  const needsReauth = connection?.status === 'expired' || connection?.status === 'revoked'

  return {
    connection,
    isConnected,
    isPending,
    needsReauth,
    loading,
    error,
    isConnecting,
    refetch: fetchConnection,
    getAuthUrl,
    exchangeCode,
    refreshToken,
    disconnect,
    updateStatus,
  }
}

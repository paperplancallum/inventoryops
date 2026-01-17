'use client'

import { useState, useCallback } from 'react'

interface SendPOResult {
  success: boolean
  message?: string
  magicLinkId?: string
  expiresAt?: string
  error?: string
}

export function useSendPO() {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Send PO to supplier - creates magic link and sends email
  const sendToSupplier = useCallback(async (
    poId: string,
    customMessage?: string
  ): Promise<SendPOResult> => {
    setSending(true)
    setError(null)

    try {
      const response = await fetch(`/api/purchase-orders/${poId}/send-to-supplier`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customMessage }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send PO to supplier')
      }

      return {
        success: true,
        message: data.message,
        magicLinkId: data.magicLinkId,
        expiresAt: data.expiresAt,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send PO'
      setError(new Error(errorMessage))
      return {
        success: false,
        error: errorMessage,
      }
    } finally {
      setSending(false)
    }
  }, [])

  // Resend reminder to supplier - regenerates magic link and sends reminder email
  const resendToSupplier = useCallback(async (poId: string): Promise<SendPOResult> => {
    setSending(true)
    setError(null)

    try {
      const response = await fetch(`/api/purchase-orders/${poId}/resend`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend reminder')
      }

      return {
        success: true,
        message: data.message,
        magicLinkId: data.magicLinkId,
        expiresAt: data.expiresAt,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend reminder'
      setError(new Error(errorMessage))
      return {
        success: false,
        error: errorMessage,
      }
    } finally {
      setSending(false)
    }
  }, [])

  return {
    sendToSupplier,
    resendToSupplier,
    sending,
    error,
  }
}

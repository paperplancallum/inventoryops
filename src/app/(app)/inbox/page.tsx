'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useInboxMessages, useSuppliers, useShippingAgents } from '@/lib/supabase/hooks'
import { InboxView } from '@/sections/inbox'
import type { ShippingAgent } from '@/sections/inbox/types'

export default function InboxPage() {
  const router = useRouter()

  // Fetch inbox messages
  const {
    messages,
    summary,
    loading,
    error,
    fetchMessages,
    markAsRead,
    markAsUnread,
    clearMessage,
    restoreMessage,
  } = useInboxMessages()

  // Fetch suppliers for filter dropdown
  const { suppliers, loading: suppliersLoading } = useSuppliers()

  // Fetch shipping agents for filter dropdown
  const { shippingAgents: rawAgents, loading: agentsLoading } = useShippingAgents()

  // Transform shipping agents to match the InboxView expected type
  const shippingAgents: ShippingAgent[] = rawAgents.map(agent => ({
    id: agent.id,
    name: agent.name,
    contactName: agent.contactName,
    email: agent.email,
  }))

  // Load messages on mount
  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // Navigation handlers
  const handleViewPO = useCallback((poId: string) => {
    router.push(`/purchase-orders/${poId}`)
  }, [router])

  const handleViewTransfer = useCallback((transferId: string) => {
    router.push(`/transfers?transfer=${transferId}`)
  }, [router])

  // Loading state
  if (loading && messages.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400">Failed to load inbox</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{error.message}</p>
          <button
            onClick={() => fetchMessages()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <InboxView
      messages={messages}
      summary={summary}
      suppliers={suppliers}
      shippingAgents={shippingAgents}
      onViewPO={handleViewPO}
      onViewTransfer={handleViewTransfer}
      onMarkRead={markAsRead}
      onMarkUnread={markAsUnread}
      onClearMessage={clearMessage}
      onRestoreMessage={restoreMessage}
    />
  )
}

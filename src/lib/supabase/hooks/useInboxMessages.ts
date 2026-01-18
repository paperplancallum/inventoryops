'use client'

import { useState, useCallback } from 'react'
import { createClient } from '../client'
import type { InboxMessage, InboxSummary, InboxSourceType } from '@/sections/inbox/types'

interface UseInboxMessagesOptions {
  sourceType?: InboxSourceType | 'all'
  showCleared?: boolean
}

export function useInboxMessages(options: UseInboxMessagesOptions = {}) {
  const { sourceType = 'all', showCleared = false } = options

  const [messages, setMessages] = useState<InboxMessage[]>([])
  const [summary, setSummary] = useState<InboxSummary>({
    totalMessages: 0,
    unreadCount: 0,
    awaitingReply: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Fetch and aggregate messages from both sources
  const fetchMessages = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const allMessages: InboxMessage[] = []

      // Fetch PO messages if needed
      if (sourceType === 'all' || sourceType === 'purchase-order') {
        let poQuery = supabase
          .from('po_messages')
          .select(`
            id,
            direction,
            sender_name,
            sender_email,
            content,
            is_read,
            is_cleared,
            created_at,
            purchase_order_id,
            po_attachments(id, name, type, url, size, storage_path),
            purchase_orders!inner(
              id,
              po_number,
              status,
              supplier_id,
              suppliers(id, name)
            )
          `)
          .order('created_at', { ascending: false })

        if (!showCleared) {
          poQuery = poQuery.eq('is_cleared', false)
        }

        const { data: poMessages, error: poError } = await poQuery

        if (poError) throw poError

        // Transform PO messages
        for (const msg of poMessages || []) {
          const po = msg.purchase_orders as unknown as {
            id: string
            po_number: string
            status: string
            supplier_id: string
            suppliers: { id: string; name: string }
          }

          allMessages.push({
            messageId: msg.id,
            direction: msg.direction as 'inbound' | 'outbound' | 'note',
            senderName: msg.sender_name,
            senderEmail: msg.sender_email || undefined,
            timestamp: msg.created_at,
            content: msg.content,
            attachments: (msg.po_attachments || []).map((att: { id: string; name: string; type: string; url: string; size?: number; storage_path?: string }) => ({
              id: att.id,
              name: att.name,
              type: att.type,
              url: att.url,
              size: att.size,
              storagePath: att.storage_path,
            })),
            isRead: msg.is_read,
            isCleared: msg.is_cleared,
            sourceType: 'purchase-order',
            poId: po.id,
            poNumber: po.po_number,
            supplierId: po.suppliers?.id,
            supplierName: po.suppliers?.name,
            poStatus: po.status as InboxMessage['poStatus'],
          })
        }
      }

      // Fetch Shipping Agent messages if needed
      if (sourceType === 'all' || sourceType === 'shipping-agent') {
        let agentQuery = supabase
          .from('shipping_agent_messages')
          .select(`
            id,
            direction,
            sender_name,
            sender_email,
            content,
            is_read,
            is_cleared,
            created_at,
            shipping_agent_id,
            transfer_id,
            shipping_agent_message_attachments(id, name, type, url, size, storage_path),
            shipping_agents!inner(id, name),
            transfers(id, transfer_number)
          `)
          .order('created_at', { ascending: false })

        if (!showCleared) {
          agentQuery = agentQuery.eq('is_cleared', false)
        }

        const { data: agentMessages, error: agentError } = await agentQuery

        if (agentError) throw agentError

        // Transform Shipping Agent messages
        for (const msg of agentMessages || []) {
          const agent = msg.shipping_agents as unknown as { id: string; name: string }
          const transfer = msg.transfers as unknown as { id: string; transfer_number: string } | null

          allMessages.push({
            messageId: msg.id,
            direction: msg.direction as 'inbound' | 'outbound' | 'note',
            senderName: msg.sender_name,
            senderEmail: msg.sender_email || undefined,
            timestamp: msg.created_at,
            content: msg.content,
            attachments: (msg.shipping_agent_message_attachments || []).map((att: { id: string; name: string; type: string; url: string; size?: number; storage_path?: string }) => ({
              id: att.id,
              name: att.name,
              type: att.type,
              url: att.url,
              size: att.size,
              storagePath: att.storage_path,
            })),
            isRead: msg.is_read,
            isCleared: msg.is_cleared,
            sourceType: 'shipping-agent',
            agentId: agent.id,
            agentName: agent.name,
            transferId: transfer?.id,
            transferNumber: transfer?.transfer_number,
          })
        }
      }

      // Sort all messages by timestamp (newest first)
      allMessages.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      // Calculate summary stats (only for non-cleared inbound messages)
      const inboundMessages = allMessages.filter(m => m.direction === 'inbound' && !m.isCleared)
      const unreadInbound = inboundMessages.filter(m => !m.isRead)

      // Calculate awaiting reply: inbound messages without a subsequent outbound reply
      // Group messages by source entity and check if last message is inbound
      const messagesBySource = new Map<string, InboxMessage[]>()
      for (const msg of allMessages.filter(m => !m.isCleared)) {
        const key = msg.sourceType === 'purchase-order'
          ? `po-${msg.poId}`
          : `agent-${msg.agentId}`
        const existing = messagesBySource.get(key) || []
        existing.push(msg)
        messagesBySource.set(key, existing)
      }

      let awaitingReply = 0
      for (const [, msgs] of messagesBySource) {
        // Sort by timestamp ascending to get the latest
        const sorted = [...msgs].sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        const latest = sorted[0]
        if (latest && latest.direction === 'inbound') {
          awaitingReply++
        }
      }

      setMessages(allMessages)
      setSummary({
        totalMessages: inboundMessages.length,
        unreadCount: unreadInbound.length,
        awaitingReply,
      })
    } catch (err) {
      console.error('Inbox fetch error:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch messages'))
    } finally {
      setLoading(false)
    }
  }, [supabase, sourceType, showCleared])

  // Mark a message as read
  const markAsRead = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const message = messages.find(m => m.messageId === messageId)
      if (!message || message.isRead) return true

      const table = message.sourceType === 'purchase-order'
        ? 'po_messages'
        : 'shipping_agent_messages'

      const { error } = await supabase
        .from(table)
        .update({ is_read: true })
        .eq('id', messageId)

      if (error) throw error

      // Update parent entity's unread_count
      if (message.sourceType === 'purchase-order' && message.poId) {
        const { data: po } = await supabase
          .from('purchase_orders')
          .select('unread_count')
          .eq('id', message.poId)
          .single()

        if (po && po.unread_count > 0) {
          await supabase
            .from('purchase_orders')
            .update({ unread_count: po.unread_count - 1 })
            .eq('id', message.poId)
        }
      } else if (message.sourceType === 'shipping-agent' && message.agentId) {
        const { data: agent } = await supabase
          .from('shipping_agents')
          .select('unread_count')
          .eq('id', message.agentId)
          .single()

        if (agent && agent.unread_count > 0) {
          await supabase
            .from('shipping_agents')
            .update({ unread_count: agent.unread_count - 1 })
            .eq('id', message.agentId)
        }
      }

      // Update local state
      setMessages(prev => prev.map(m =>
        m.messageId === messageId ? { ...m, isRead: true } : m
      ))
      setSummary(prev => ({
        ...prev,
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }))

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to mark as read'))
      return false
    }
  }, [supabase, messages])

  // Mark a message as unread
  const markAsUnread = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const message = messages.find(m => m.messageId === messageId)
      if (!message || !message.isRead) return true

      const table = message.sourceType === 'purchase-order'
        ? 'po_messages'
        : 'shipping_agent_messages'

      const { error } = await supabase
        .from(table)
        .update({ is_read: false })
        .eq('id', messageId)

      if (error) throw error

      // Update parent entity's unread_count
      if (message.sourceType === 'purchase-order' && message.poId) {
        const { data: po } = await supabase
          .from('purchase_orders')
          .select('unread_count')
          .eq('id', message.poId)
          .single()

        if (po) {
          await supabase
            .from('purchase_orders')
            .update({ unread_count: (po.unread_count || 0) + 1 })
            .eq('id', message.poId)
        }
      } else if (message.sourceType === 'shipping-agent' && message.agentId) {
        const { data: agent } = await supabase
          .from('shipping_agents')
          .select('unread_count')
          .eq('id', message.agentId)
          .single()

        if (agent) {
          await supabase
            .from('shipping_agents')
            .update({ unread_count: (agent.unread_count || 0) + 1 })
            .eq('id', message.agentId)
        }
      }

      // Update local state
      setMessages(prev => prev.map(m =>
        m.messageId === messageId ? { ...m, isRead: false } : m
      ))
      setSummary(prev => ({
        ...prev,
        unreadCount: prev.unreadCount + 1,
      }))

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to mark as unread'))
      return false
    }
  }, [supabase, messages])

  // Clear a message from inbox (soft-delete)
  const clearMessage = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const message = messages.find(m => m.messageId === messageId)
      if (!message) return false

      const table = message.sourceType === 'purchase-order'
        ? 'po_messages'
        : 'shipping_agent_messages'

      const { error } = await supabase
        .from(table)
        .update({ is_cleared: true })
        .eq('id', messageId)

      if (error) throw error

      // Update local state
      setMessages(prev => prev.map(m =>
        m.messageId === messageId ? { ...m, isCleared: true } : m
      ))

      // Update summary if message was unread inbound
      if (message.direction === 'inbound' && !message.isRead) {
        setSummary(prev => ({
          ...prev,
          totalMessages: prev.totalMessages - 1,
          unreadCount: Math.max(0, prev.unreadCount - 1),
        }))
      } else if (message.direction === 'inbound') {
        setSummary(prev => ({
          ...prev,
          totalMessages: prev.totalMessages - 1,
        }))
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to clear message'))
      return false
    }
  }, [supabase, messages])

  // Restore a cleared message
  const restoreMessage = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const message = messages.find(m => m.messageId === messageId)
      if (!message) return false

      const table = message.sourceType === 'purchase-order'
        ? 'po_messages'
        : 'shipping_agent_messages'

      const { error } = await supabase
        .from(table)
        .update({ is_cleared: false })
        .eq('id', messageId)

      if (error) throw error

      // Update local state
      setMessages(prev => prev.map(m =>
        m.messageId === messageId ? { ...m, isCleared: false } : m
      ))

      // Update summary if message was inbound
      if (message.direction === 'inbound') {
        setSummary(prev => ({
          ...prev,
          totalMessages: prev.totalMessages + 1,
          unreadCount: message.isRead ? prev.unreadCount : prev.unreadCount + 1,
        }))
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to restore message'))
      return false
    }
  }, [supabase, messages])

  return {
    messages,
    summary,
    loading,
    error,
    fetchMessages,
    markAsRead,
    markAsUnread,
    clearMessage,
    restoreMessage,
  }
}

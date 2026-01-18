'use client'

import { useState, useCallback } from 'react'
import { createClient } from '../client'
import type { DbShippingAgentMessage, DbShippingAgentMessageAttachment } from '../database.types'

export interface ShippingAgentMessage {
  id: string
  direction: 'inbound' | 'outbound' | 'note'
  senderName: string
  senderEmail?: string
  content: string
  attachments: ShippingAgentAttachment[]
  isRead: boolean
  isCleared: boolean
  createdAt: string
  transferId?: string
  transferNumber?: string
}

export interface ShippingAgentAttachment {
  id: string
  name: string
  type: string
  url: string
  size?: number
  storagePath?: string
}

function transformAttachment(dbAttachment: DbShippingAgentMessageAttachment): ShippingAgentAttachment {
  return {
    id: dbAttachment.id,
    name: dbAttachment.name,
    type: dbAttachment.type,
    url: dbAttachment.url,
    size: dbAttachment.size || undefined,
    storagePath: dbAttachment.storage_path || undefined,
  }
}

function transformMessage(
  dbMessage: DbShippingAgentMessage & {
    shipping_agent_message_attachments?: DbShippingAgentMessageAttachment[]
    transfers?: { id: string; transfer_number: string } | null
  }
): ShippingAgentMessage {
  return {
    id: dbMessage.id,
    direction: dbMessage.direction as 'inbound' | 'outbound' | 'note',
    senderName: dbMessage.sender_name,
    senderEmail: dbMessage.sender_email || undefined,
    content: dbMessage.content,
    attachments: (dbMessage.shipping_agent_message_attachments || []).map(transformAttachment),
    isRead: dbMessage.is_read,
    isCleared: dbMessage.is_cleared,
    createdAt: dbMessage.created_at,
    transferId: dbMessage.transfers?.id,
    transferNumber: dbMessage.transfers?.transfer_number,
  }
}

export function useShippingAgentMessages(shippingAgentId: string, transferId?: string) {
  const [messages, setMessages] = useState<ShippingAgentMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Fetch messages for a shipping agent (optionally filtered by transfer)
  const fetchMessages = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('shipping_agent_messages')
        .select(`
          *,
          shipping_agent_message_attachments(*),
          transfers(id, transfer_number)
        `)
        .eq('shipping_agent_id', shippingAgentId)
        .order('created_at', { ascending: true })

      if (transferId) {
        query = query.eq('transfer_id', transferId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      const transformedMessages = (data || []).map(transformMessage)
      setMessages(transformedMessages)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch messages'))
    } finally {
      setLoading(false)
    }
  }, [supabase, shippingAgentId, transferId])

  // Send a message
  const sendMessage = useCallback(async (
    content: string,
    attachments?: File[],
    direction: 'inbound' | 'outbound' | 'note' = 'outbound',
    senderName?: string,
    senderEmail?: string
  ): Promise<ShippingAgentMessage | null> => {
    setSending(true)
    setError(null)

    try {
      // Get current user info if not provided
      const { data: { user } } = await supabase.auth.getUser()
      const userName = senderName || user?.user_metadata?.name || user?.email || 'Unknown User'
      const userEmail = senderEmail || user?.email || undefined

      // Create message
      const { data: newMessage, error: messageError } = await supabase
        .from('shipping_agent_messages')
        .insert({
          shipping_agent_id: shippingAgentId,
          transfer_id: transferId || null,
          direction,
          sender_name: userName,
          sender_email: userEmail || null,
          content,
        })
        .select()
        .single()

      if (messageError) throw messageError

      // Upload and attach files if any
      const uploadedAttachments: ShippingAgentAttachment[] = []
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          const storagePath = `shipping-agent-messages/${shippingAgentId}/${newMessage.id}/${file.name}`

          // Upload file to storage
          const { error: uploadError } = await supabase.storage
            .from('shipping-agent-documents')
            .upload(storagePath, file)

          if (uploadError) {
            console.error('Failed to upload file:', uploadError)
            continue
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('shipping-agent-documents')
            .getPublicUrl(storagePath)

          // Create attachment record
          const { data: attachmentData, error: attachmentError } = await supabase
            .from('shipping_agent_message_attachments')
            .insert({
              message_id: newMessage.id,
              name: file.name,
              type: file.type,
              url: urlData.publicUrl,
              size: file.size,
              storage_path: storagePath,
            })
            .select()
            .single()

          if (!attachmentError && attachmentData) {
            uploadedAttachments.push(transformAttachment(attachmentData))
          }
        }
      }

      // Update unread count for inbound messages
      if (direction === 'inbound') {
        const { data: agent } = await supabase
          .from('shipping_agents')
          .select('unread_count')
          .eq('id', shippingAgentId)
          .single()

        if (agent) {
          await supabase
            .from('shipping_agents')
            .update({ unread_count: (agent.unread_count || 0) + 1 })
            .eq('id', shippingAgentId)
        }
      }

      const message: ShippingAgentMessage = {
        id: newMessage.id,
        direction: newMessage.direction as 'inbound' | 'outbound' | 'note',
        senderName: newMessage.sender_name,
        senderEmail: newMessage.sender_email || undefined,
        content: newMessage.content,
        attachments: uploadedAttachments,
        isRead: newMessage.is_read,
        isCleared: newMessage.is_cleared,
        createdAt: newMessage.created_at,
        transferId: transferId,
      }

      setMessages(prev => [...prev, message])
      return message
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to send message'))
      return null
    } finally {
      setSending(false)
    }
  }, [supabase, shippingAgentId, transferId])

  // Add internal note
  const addNote = useCallback(async (content: string): Promise<ShippingAgentMessage | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    const userName = user?.user_metadata?.name || user?.email || 'System'
    return sendMessage(content, undefined, 'note', userName)
  }, [supabase, sendMessage])

  // Mark messages as read (reset unread count)
  const markAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('shipping_agents')
        .update({ unread_count: 0 })
        .eq('id', shippingAgentId)

      if (error) throw error

      // Also mark all messages as read
      await supabase
        .from('shipping_agent_messages')
        .update({ is_read: true })
        .eq('shipping_agent_id', shippingAgentId)
        .eq('is_read', false)

      // Update local state
      setMessages(prev => prev.map(m => ({ ...m, isRead: true })))

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to mark as read'))
      return false
    }
  }, [supabase, shippingAgentId])

  return {
    messages,
    loading,
    sending,
    error,
    fetchMessages,
    sendMessage,
    addNote,
    markAsRead,
  }
}

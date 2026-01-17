'use client'

import { useState, useCallback } from 'react'
import { createClient } from '../client'
import type { DbPOMessage, DbPOAttachment, MessageDirection } from '../database.types'
import type { Message, Attachment } from '@/sections/purchase-orders/types'

function transformAttachment(dbAttachment: DbPOAttachment): Attachment {
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
  dbMessage: DbPOMessage & { po_attachments?: DbPOAttachment[] }
): Message {
  return {
    id: dbMessage.id,
    direction: dbMessage.direction,
    senderName: dbMessage.sender_name,
    senderEmail: dbMessage.sender_email || undefined,
    content: dbMessage.content,
    attachments: (dbMessage.po_attachments || []).map(transformAttachment),
    createdAt: dbMessage.created_at,
  }
}

export function usePOMessages(purchaseOrderId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Fetch messages for a PO
  const fetchMessages = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('po_messages')
        .select(`
          *,
          po_attachments(*)
        `)
        .eq('purchase_order_id', purchaseOrderId)
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError

      const transformedMessages = (data || []).map(transformMessage)
      setMessages(transformedMessages)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch messages'))
    } finally {
      setLoading(false)
    }
  }, [supabase, purchaseOrderId])

  // Send a message
  const sendMessage = useCallback(async (
    content: string,
    attachments?: File[],
    direction: MessageDirection = 'outbound',
    senderName?: string,
    senderEmail?: string
  ): Promise<Message | null> => {
    setSending(true)
    setError(null)

    try {
      // Get current user info if not provided
      const { data: { user } } = await supabase.auth.getUser()
      const userName = senderName || user?.user_metadata?.name || user?.email || 'Unknown User'
      const userEmail = senderEmail || user?.email || undefined

      // Create message
      const { data: newMessage, error: messageError } = await supabase
        .from('po_messages')
        .insert({
          purchase_order_id: purchaseOrderId,
          direction,
          sender_name: userName,
          sender_email: userEmail || null,
          content,
        })
        .select()
        .single()

      if (messageError) throw messageError

      // Upload and attach files if any
      const uploadedAttachments: Attachment[] = []
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          const storagePath = `po-messages/${purchaseOrderId}/${newMessage.id}/${file.name}`

          // Upload file to storage
          const { error: uploadError } = await supabase.storage
            .from('po-documents')
            .upload(storagePath, file)

          if (uploadError) {
            console.error('Failed to upload file:', uploadError)
            continue
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('po-documents')
            .getPublicUrl(storagePath)

          // Create attachment record
          const { data: attachmentData, error: attachmentError } = await supabase
            .from('po_attachments')
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

      const message: Message = {
        id: newMessage.id,
        direction: newMessage.direction,
        senderName: newMessage.sender_name,
        senderEmail: newMessage.sender_email || undefined,
        content: newMessage.content,
        attachments: uploadedAttachments,
        createdAt: newMessage.created_at,
      }

      setMessages(prev => [...prev, message])
      return message
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to send message'))
      return null
    } finally {
      setSending(false)
    }
  }, [supabase, purchaseOrderId])

  // Add internal note
  const addNote = useCallback(async (content: string): Promise<Message | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    const userName = user?.user_metadata?.name || user?.email || 'System'
    return sendMessage(content, undefined, 'note', userName)
  }, [supabase, sendMessage])

  // Mark messages as read (reset unread count)
  const markAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .update({ unread_count: 0 })
        .eq('id', purchaseOrderId)

      if (error) throw error
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to mark as read'))
      return false
    }
  }, [supabase, purchaseOrderId])

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

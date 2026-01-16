'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../client'
import type {
  ShippingAgent,
  ShippingAgentMessage,
  ShippingAgentAddress,
  ShippingService,
  ShippingAgentFormData,
} from '@/sections/transfers/types'

// Database row types
interface DbShippingAgent {
  id: string
  name: string
  contact_name: string
  email: string
  phone: string
  services: ShippingService[]
  address_street: string | null
  address_city: string
  address_state: string | null
  address_country: string
  address_postal_code: string | null
  account_number: string | null
  website: string | null
  notes: string | null
  payment_terms: string | null
  payment_terms_template_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined data
  shipping_agent_messages?: DbShippingAgentMessage[]
}

interface DbShippingAgentMessage {
  id: string
  shipping_agent_id: string
  direction: 'outbound' | 'inbound' | 'note'
  sender_name: string
  sender_email: string | null
  content: string
  is_read: boolean
  created_at: string
  shipping_agent_message_attachments?: DbMessageAttachment[]
}

interface DbMessageAttachment {
  id: string
  message_id: string
  name: string
  type: string
  url: string
  storage_path: string | null
  size: number | null
  created_at: string
}

// Transform functions
function transformShippingAgent(db: DbShippingAgent): ShippingAgent {
  const messages = (db.shipping_agent_messages || []).map(transformMessage)
  const unreadCount = messages.filter(m => !m.isRead && m.direction === 'inbound').length

  return {
    id: db.id,
    name: db.name,
    contactName: db.contact_name,
    email: db.email,
    phone: db.phone,
    services: db.services || [],
    address: db.address_city ? {
      street: db.address_street || undefined,
      city: db.address_city,
      state: db.address_state || undefined,
      country: db.address_country,
      postalCode: db.address_postal_code || undefined,
    } : undefined,
    accountNumber: db.account_number || undefined,
    website: db.website || undefined,
    notes: db.notes || undefined,
    paymentTerms: db.payment_terms || undefined,
    paymentTermsTemplateId: db.payment_terms_template_id || undefined,
    isActive: db.is_active,
    messages,
    unreadCount,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  }
}

function transformMessage(db: DbShippingAgentMessage): ShippingAgentMessage {
  return {
    id: db.id,
    direction: db.direction,
    senderName: db.sender_name,
    senderEmail: db.sender_email || undefined,
    content: db.content,
    isRead: db.is_read,
    attachments: (db.shipping_agent_message_attachments || []).map(att => ({
      id: att.id,
      name: att.name,
      type: att.type,
      url: att.url,
    })),
    createdAt: db.created_at,
  }
}

export function useShippingAgents() {
  const [shippingAgents, setShippingAgents] = useState<ShippingAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Fetch all shipping agents with messages
  const fetchShippingAgents = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('shipping_agents')
        .select(`
          *,
          shipping_agent_messages(
            *,
            shipping_agent_message_attachments(*)
          )
        `)
        .order('name', { ascending: true })

      if (fetchError) throw fetchError

      const transformedAgents = (data || []).map(transformShippingAgent)
      setShippingAgents(transformedAgents)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch shipping agents'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Fetch single shipping agent
  const fetchShippingAgent = useCallback(async (id: string): Promise<ShippingAgent | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('shipping_agents')
        .select(`
          *,
          shipping_agent_messages(
            *,
            shipping_agent_message_attachments(*)
          )
        `)
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      return transformShippingAgent(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch shipping agent'))
      return null
    }
  }, [supabase])

  // Create shipping agent
  const createShippingAgent = useCallback(async (data: ShippingAgentFormData): Promise<ShippingAgent | null> => {
    try {
      const { data: newAgent, error: agentError } = await supabase
        .from('shipping_agents')
        .insert({
          name: data.name,
          contact_name: data.contactName,
          email: data.email,
          phone: data.phone,
          services: data.services,
          address_street: data.address?.street || null,
          address_city: data.address?.city || '',
          address_state: data.address?.state || null,
          address_country: data.address?.country || '',
          address_postal_code: data.address?.postalCode || null,
          account_number: data.accountNumber || null,
          website: data.website || null,
          notes: data.notes || null,
          payment_terms: data.paymentTerms || null,
          payment_terms_template_id: data.paymentTermsTemplateId || null,
        })
        .select()
        .single()

      if (agentError) throw agentError

      const freshAgent = await fetchShippingAgent(newAgent.id)
      if (freshAgent) {
        setShippingAgents(prev => [...prev, freshAgent].sort((a, b) => a.name.localeCompare(b.name)))
      }

      return freshAgent
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create shipping agent'))
      return null
    }
  }, [supabase, fetchShippingAgent])

  // Update shipping agent
  const updateShippingAgent = useCallback(async (id: string, data: Partial<ShippingAgentFormData>): Promise<ShippingAgent | null> => {
    try {
      const updateData: Record<string, unknown> = {}

      if (data.name !== undefined) updateData.name = data.name
      if (data.contactName !== undefined) updateData.contact_name = data.contactName
      if (data.email !== undefined) updateData.email = data.email
      if (data.phone !== undefined) updateData.phone = data.phone
      if (data.services !== undefined) updateData.services = data.services
      if (data.address !== undefined) {
        updateData.address_street = data.address.street || null
        updateData.address_city = data.address.city
        updateData.address_state = data.address.state || null
        updateData.address_country = data.address.country
        updateData.address_postal_code = data.address.postalCode || null
      }
      if (data.accountNumber !== undefined) updateData.account_number = data.accountNumber || null
      if (data.website !== undefined) updateData.website = data.website || null
      if (data.notes !== undefined) updateData.notes = data.notes || null
      if (data.paymentTerms !== undefined) updateData.payment_terms = data.paymentTerms || null
      if (data.paymentTermsTemplateId !== undefined) updateData.payment_terms_template_id = data.paymentTermsTemplateId || null

      const { error: updateError } = await supabase
        .from('shipping_agents')
        .update(updateData)
        .eq('id', id)

      if (updateError) throw updateError

      const freshAgent = await fetchShippingAgent(id)
      if (freshAgent) {
        setShippingAgents(prev => prev.map(a => a.id === id ? freshAgent : a))
      }

      return freshAgent
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update shipping agent'))
      return null
    }
  }, [supabase, fetchShippingAgent])

  // Toggle active status
  const toggleActive = useCallback(async (id: string): Promise<boolean> => {
    try {
      const agent = shippingAgents.find(a => a.id === id)
      if (!agent) return false

      const { error } = await supabase
        .from('shipping_agents')
        .update({ is_active: !agent.isActive })
        .eq('id', id)

      if (error) throw error

      setShippingAgents(prev => prev.map(a =>
        a.id === id ? { ...a, isActive: !a.isActive } : a
      ))

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to toggle active status'))
      return false
    }
  }, [supabase, shippingAgents])

  // Delete shipping agent
  const deleteShippingAgent = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('shipping_agents')
        .delete()
        .eq('id', id)

      if (error) throw error

      setShippingAgents(prev => prev.filter(a => a.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete shipping agent'))
      return false
    }
  }, [supabase])

  // Send message to agent
  const sendMessage = useCallback(async (
    agentId: string,
    content: string,
    attachments?: File[]
  ): Promise<boolean> => {
    try {
      // Get current user info
      const { data: { user } } = await supabase.auth.getUser()

      // Create message
      const { data: message, error: messageError } = await supabase
        .from('shipping_agent_messages')
        .insert({
          shipping_agent_id: agentId,
          direction: 'outbound',
          sender_name: user?.email || 'System',
          sender_email: user?.email || null,
          content,
          is_read: true, // Outbound messages are marked as read
        })
        .select()
        .single()

      if (messageError) throw messageError

      // Upload attachments if any
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          const fileName = `${agentId}/${message.id}/${Date.now()}-${file.name}`
          const { error: uploadError } = await supabase.storage
            .from('shipping-agent-attachments')
            .upload(fileName, file)

          if (uploadError) throw uploadError

          const { data: { publicUrl } } = supabase.storage
            .from('shipping-agent-attachments')
            .getPublicUrl(fileName)

          await supabase
            .from('shipping_agent_message_attachments')
            .insert({
              message_id: message.id,
              name: file.name,
              type: file.type,
              url: publicUrl,
              storage_path: fileName,
              size: file.size,
            })
        }
      }

      // Refetch agent to get updated messages
      const freshAgent = await fetchShippingAgent(agentId)
      if (freshAgent) {
        setShippingAgents(prev => prev.map(a => a.id === agentId ? freshAgent : a))
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to send message'))
      return false
    }
  }, [supabase, fetchShippingAgent])

  // Add internal note
  const addNote = useCallback(async (agentId: string, content: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error: messageError } = await supabase
        .from('shipping_agent_messages')
        .insert({
          shipping_agent_id: agentId,
          direction: 'note',
          sender_name: user?.email || 'System',
          content,
          is_read: true,
        })

      if (messageError) throw messageError

      // Refetch agent
      const freshAgent = await fetchShippingAgent(agentId)
      if (freshAgent) {
        setShippingAgents(prev => prev.map(a => a.id === agentId ? freshAgent : a))
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add note'))
      return false
    }
  }, [supabase, fetchShippingAgent])

  // Mark messages as read
  const markMessagesRead = useCallback(async (agentId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('shipping_agent_messages')
        .update({ is_read: true })
        .eq('shipping_agent_id', agentId)
        .eq('is_read', false)

      if (error) throw error

      setShippingAgents(prev => prev.map(a =>
        a.id === agentId
          ? {
              ...a,
              messages: a.messages?.map(m => ({ ...m, isRead: true })),
              unreadCount: 0,
            }
          : a
      ))

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to mark messages as read'))
      return false
    }
  }, [supabase])

  // Initial fetch
  useEffect(() => {
    fetchShippingAgents()
  }, [fetchShippingAgents])

  // Active agents only
  const activeShippingAgents = shippingAgents.filter(a => a.isActive)

  // Total unread messages
  const totalUnreadMessages = shippingAgents.reduce((sum, a) => sum + (a.unreadCount || 0), 0)

  return {
    shippingAgents,
    activeShippingAgents,
    totalUnreadMessages,
    loading,
    error,
    refetch: fetchShippingAgents,
    fetchShippingAgent,
    createShippingAgent,
    updateShippingAgent,
    toggleActive,
    deleteShippingAgent,
    sendMessage,
    addNote,
    markMessagesRead,
  }
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../client'
import type { DbInspectionAgent, DbInspectionAgentInsert } from '../database.types'
import type { InspectionAgent, InspectionAgentFormData, PaymentMilestone } from '@/sections/inspections/types'

// =============================================================================
// Transform Functions
// =============================================================================

function transformAgent(dbAgent: DbInspectionAgent): InspectionAgent {
  return {
    id: dbAgent.id,
    name: dbAgent.name,
    email: dbAgent.email,
    phone: dbAgent.phone || '',
    company: dbAgent.company || '',
    location: dbAgent.location || '',
    hourlyRate: Number(dbAgent.hourly_rate) || 0,
    specialties: dbAgent.specialties || [],
    notes: dbAgent.notes || '',
    isActive: dbAgent.is_active ?? true,
    paymentTerms: dbAgent.payment_terms || undefined,
    paymentTermsTemplateId: dbAgent.payment_terms_template_id || undefined,
    customPaymentMilestones: dbAgent.custom_payment_milestones
      ? (dbAgent.custom_payment_milestones as unknown as PaymentMilestone[])
      : undefined,
  }
}

// =============================================================================
// Hook
// =============================================================================

export function useInspectionAgents() {
  const [agents, setAgents] = useState<InspectionAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Fetch all agents
  const fetchAgents = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('inspection_agents')
        .select('*')
        .order('name', { ascending: true })

      if (fetchError) throw fetchError

      const transformedAgents = (data || []).map(transformAgent)
      setAgents(transformedAgents)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch agents'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Fetch single agent
  const fetchAgent = useCallback(
    async (id: string): Promise<InspectionAgent | null> => {
      try {
        const { data, error: fetchError } = await supabase
          .from('inspection_agents')
          .select('*')
          .eq('id', id)
          .single()

        if (fetchError) throw fetchError

        return transformAgent(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch agent'))
        return null
      }
    },
    [supabase]
  )

  // Create agent
  const createAgent = useCallback(
    async (data: InspectionAgentFormData): Promise<InspectionAgent | null> => {
      try {
        const insertData: DbInspectionAgentInsert = {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          company: data.company || null,
          location: data.location || null,
          hourly_rate: data.hourlyRate,
          specialties: data.specialties,
          notes: data.notes || null,
          payment_terms: data.paymentTerms || null,
          payment_terms_template_id: data.paymentTermsTemplateId || null,
          custom_payment_milestones: data.customPaymentMilestones
            ? JSON.parse(JSON.stringify(data.customPaymentMilestones))
            : null,
          is_active: true,
        }

        const { data: newAgent, error: insertError } = await supabase
          .from('inspection_agents')
          .insert(insertData)
          .select()
          .single()

        if (insertError) throw insertError

        const transformedAgent = transformAgent(newAgent)
        setAgents(prev => [...prev, transformedAgent].sort((a, b) => a.name.localeCompare(b.name)))

        return transformedAgent
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to create agent'))
        return null
      }
    },
    [supabase]
  )

  // Update agent
  const updateAgent = useCallback(
    async (id: string, data: Partial<InspectionAgentFormData>): Promise<InspectionAgent | null> => {
      try {
        const updateData: Record<string, unknown> = {}

        if (data.name !== undefined) updateData.name = data.name
        if (data.email !== undefined) updateData.email = data.email
        if (data.phone !== undefined) updateData.phone = data.phone || null
        if (data.company !== undefined) updateData.company = data.company || null
        if (data.location !== undefined) updateData.location = data.location || null
        if (data.hourlyRate !== undefined) updateData.hourly_rate = data.hourlyRate
        if (data.specialties !== undefined) updateData.specialties = data.specialties
        if (data.notes !== undefined) updateData.notes = data.notes || null
        if (data.paymentTerms !== undefined) updateData.payment_terms = data.paymentTerms || null
        if (data.paymentTermsTemplateId !== undefined)
          updateData.payment_terms_template_id = data.paymentTermsTemplateId || null
        if (data.customPaymentMilestones !== undefined)
          updateData.custom_payment_milestones = data.customPaymentMilestones
            ? JSON.parse(JSON.stringify(data.customPaymentMilestones))
            : null

        const { data: updatedAgent, error: updateError } = await supabase
          .from('inspection_agents')
          .update(updateData)
          .eq('id', id)
          .select()
          .single()

        if (updateError) throw updateError

        const transformedAgent = transformAgent(updatedAgent)
        setAgents(prev =>
          prev.map(agent => (agent.id === id ? transformedAgent : agent)).sort((a, b) => a.name.localeCompare(b.name))
        )

        return transformedAgent
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to update agent'))
        return null
      }
    },
    [supabase]
  )

  // Toggle agent active status
  const toggleAgentStatus = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const currentAgent = agents.find(a => a.id === id)
        if (!currentAgent) throw new Error('Agent not found')

        const newStatus = !currentAgent.isActive

        const { error: updateError } = await supabase
          .from('inspection_agents')
          .update({ is_active: newStatus })
          .eq('id', id)

        if (updateError) throw updateError

        setAgents(prev => prev.map(agent => (agent.id === id ? { ...agent, isActive: newStatus } : agent)))

        return true
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to toggle agent status'))
        return false
      }
    },
    [supabase, agents]
  )

  // Delete agent
  const deleteAgent = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase.from('inspection_agents').delete().eq('id', id)

        if (error) throw error

        setAgents(prev => prev.filter(agent => agent.id !== id))
        return true
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to delete agent'))
        return false
      }
    },
    [supabase]
  )

  // Get active agents only (for dropdowns)
  const activeAgents = agents.filter(agent => agent.isActive)

  // Initial fetch
  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  return {
    agents,
    activeAgents,
    loading,
    error,
    refetch: fetchAgents,
    fetchAgent,
    createAgent,
    updateAgent,
    toggleAgentStatus,
    deleteAgent,
  }
}

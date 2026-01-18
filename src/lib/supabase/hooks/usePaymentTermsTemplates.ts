'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../client'
import type { Database } from '../database.types'
import type { PaymentTermsTemplate, PaymentMilestoneTrigger } from '@/sections/suppliers/types'

// Derive types from Database
type DbPaymentTermsTemplate = Database['public']['Tables']['payment_terms_templates']['Row']

interface MilestoneJson {
  id: string
  name: string
  percentage: number
  trigger: string
  offsetDays: number
}

// Transform database template to frontend template
function transformTemplate(dbTemplate: DbPaymentTermsTemplate): PaymentTermsTemplate {
  const milestones = (dbTemplate.milestones as MilestoneJson[] | null) || []
  return {
    id: dbTemplate.id,
    name: dbTemplate.name,
    description: dbTemplate.description || '',
    milestones: milestones.map(m => ({
      id: m.id,
      name: m.name,
      percentage: m.percentage,
      trigger: m.trigger as PaymentMilestoneTrigger,
      offsetDays: m.offsetDays,
    })),
    isActive: dbTemplate.is_active,
  }
}

export function usePaymentTermsTemplates() {
  const [templates, setTemplates] = useState<PaymentTermsTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Fetch all active payment terms templates
  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: templatesError } = await supabase
        .from('payment_terms_templates')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (templatesError) throw templatesError

      setTemplates((data || []).map(transformTemplate))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch payment terms templates'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Create template
  const createTemplate = useCallback(async (
    data: Omit<PaymentTermsTemplate, 'id'>
  ): Promise<PaymentTermsTemplate | null> => {
    try {
      const { data: newTemplate, error: templateError } = await supabase
        .from('payment_terms_templates')
        .insert({
          name: data.name,
          description: data.description || null,
          milestones: data.milestones.map(m => ({
            id: m.id,
            name: m.name,
            percentage: m.percentage,
            trigger: m.trigger,
            offsetDays: m.offsetDays,
          })),
          is_active: data.isActive,
        })
        .select()
        .single()

      if (templateError) throw templateError

      const template = transformTemplate(newTemplate)
      setTemplates(prev => [...prev, template].sort((a, b) => a.name.localeCompare(b.name)))
      return template
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create payment terms template'))
      return null
    }
  }, [supabase])

  // Update template
  const updateTemplate = useCallback(async (
    id: string,
    data: Partial<PaymentTermsTemplate>
  ): Promise<PaymentTermsTemplate | null> => {
    try {
      const updateData: Record<string, unknown> = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.description !== undefined) updateData.description = data.description || null
      if (data.milestones !== undefined) {
        updateData.milestones = data.milestones.map(m => ({
          id: m.id,
          name: m.name,
          percentage: m.percentage,
          trigger: m.trigger,
          offsetDays: m.offsetDays,
        }))
      }
      if (data.isActive !== undefined) updateData.is_active = data.isActive

      const { data: updatedTemplate, error: templateError } = await supabase
        .from('payment_terms_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (templateError) throw templateError

      const template = transformTemplate(updatedTemplate)
      setTemplates(prev => prev.map(t => t.id === id ? template : t))
      return template
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update payment terms template'))
      return null
    }
  }, [supabase])

  // Delete template (soft delete by setting is_active = false)
  const deleteTemplate = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('payment_terms_templates')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      setTemplates(prev => prev.filter(t => t.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete payment terms template'))
      return false
    }
  }, [supabase])

  // Initial fetch
  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  }
}

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '../client'
import type {
  DbInvoice,
  DbInvoicePayment,
  DbInvoicePaymentScheduleItem,
  DbInvoicePaymentAttachment,
  DbFinancialSummary,
} from '../database.types'
import type {
  Invoice,
  Payment,
  PaymentScheduleItem,
  PaymentAttachment,
  PaymentWithInvoice,
  NewPayment,
  InvoiceFormData,
  FinancialSummary,
  EditableScheduleItem,
} from '@/sections/invoices-payments/types'

// =============================================================================
// Transform Functions
// =============================================================================

function transformPaymentAttachment(dbAttachment: DbInvoicePaymentAttachment): PaymentAttachment {
  return {
    id: dbAttachment.id,
    name: dbAttachment.name,
    type: dbAttachment.type,
    url: dbAttachment.url,
    storagePath: dbAttachment.storage_path,
    size: dbAttachment.size || 0,
  }
}

function transformPayment(
  dbPayment: DbInvoicePayment & { invoice_payment_attachments?: DbInvoicePaymentAttachment[] }
): Payment {
  return {
    id: dbPayment.id,
    date: dbPayment.date,
    amount: dbPayment.amount,
    method: dbPayment.method,
    reference: dbPayment.reference,
    notes: dbPayment.notes,
    scheduleItemId: dbPayment.schedule_item_id,
    attachments: (dbPayment.invoice_payment_attachments || []).map(transformPaymentAttachment),
  }
}

function transformScheduleItem(dbItem: DbInvoicePaymentScheduleItem): PaymentScheduleItem {
  return {
    id: dbItem.id,
    milestoneName: dbItem.milestone_name,
    percentage: dbItem.percentage,
    amount: dbItem.amount,
    trigger: dbItem.trigger,
    triggerStatus: dbItem.trigger_status,
    triggerDate: dbItem.trigger_date,
    dueDate: dbItem.due_date,
    offsetDays: dbItem.offset_days,
    paidDate: dbItem.paid_date,
    paidAmount: dbItem.paid_amount,
    sortOrder: dbItem.sort_order,
  }
}

function transformInvoice(
  dbInvoice: DbInvoice & {
    invoice_payment_schedule_items?: DbInvoicePaymentScheduleItem[]
    invoice_payments?: (DbInvoicePayment & { invoice_payment_attachments?: DbInvoicePaymentAttachment[] })[]
  }
): Invoice {
  return {
    id: dbInvoice.id,
    invoiceNumber: dbInvoice.invoice_number,
    invoiceDate: dbInvoice.invoice_date,
    description: dbInvoice.description,
    type: dbInvoice.type,
    linkedEntityType: dbInvoice.linked_entity_type,
    linkedEntityId: dbInvoice.linked_entity_id,
    linkedEntityName: dbInvoice.linked_entity_name,
    amount: dbInvoice.amount,
    paidAmount: dbInvoice.paid_amount,
    balance: dbInvoice.balance,
    status: dbInvoice.status,
    dueDate: dbInvoice.due_date,
    notes: dbInvoice.notes,
    creationMethod: dbInvoice.creation_method,
    paymentTermsTemplateId: dbInvoice.payment_terms_template_id,
    brandId: dbInvoice.brand_id,
    brandName: dbInvoice.brand_name,
    paymentSchedule: (dbInvoice.invoice_payment_schedule_items || [])
      .map(transformScheduleItem)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    payments: (dbInvoice.invoice_payments || [])
      .map(transformPayment)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    createdAt: dbInvoice.created_at,
    updatedAt: dbInvoice.updated_at,
  }
}

function transformFinancialSummary(dbSummary: DbFinancialSummary | null): FinancialSummary {
  return {
    totalInvoices: dbSummary?.total_invoices ?? 0,
    totalPaid: dbSummary?.total_paid ?? 0,
    outstanding: dbSummary?.outstanding ?? 0,
    upcomingThisWeek: dbSummary?.upcoming_this_week ?? 0,
    overdueCount: dbSummary?.overdue_count ?? 0,
  }
}

// =============================================================================
// Hook
// =============================================================================

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [summary, setSummary] = useState<FinancialSummary>({
    totalInvoices: 0,
    totalPaid: 0,
    outstanding: 0,
    upcomingThisWeek: 0,
    overdueCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Fetch all invoices with related data
  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // First, check for overdue invoices
      await supabase.rpc('check_overdue_invoices')

      // Fetch invoices with schedule items and payments
      const { data, error: fetchError } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_payment_schedule_items(*),
          invoice_payments(*, invoice_payment_attachments(*))
        `)
        .order('invoice_date', { ascending: false })

      if (fetchError) throw fetchError

      const transformedInvoices = (data || []).map(transformInvoice)
      setInvoices(transformedInvoices)

      // Fetch financial summary from view
      const { data: summaryData, error: summaryError } = await supabase
        .from('financial_summary')
        .select('*')
        .single()

      if (summaryError && summaryError.code !== 'PGRST116') {
        // PGRST116 = no rows returned (empty invoices)
        console.error('Summary fetch error:', summaryError)
      }

      setSummary(transformFinancialSummary(summaryData))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch invoices'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Fetch single invoice with full details
  const fetchInvoice = useCallback(async (id: string): Promise<Invoice | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_payment_schedule_items(*),
          invoice_payments(*, invoice_payment_attachments(*))
        `)
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      return transformInvoice(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch invoice'))
      return null
    }
  }, [supabase])

  // Create invoice (manual creation)
  const createInvoice = useCallback(async (data: InvoiceFormData): Promise<Invoice | null> => {
    try {
      const { data: newInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_date: data.invoiceDate,
          description: data.description,
          type: data.type,
          linked_entity_type: data.linkedEntityType,
          linked_entity_id: data.linkedEntityId,
          linked_entity_name: data.linkedEntityName,
          amount: data.amount,
          due_date: data.dueDate || null,
          notes: data.notes || null,
          payment_terms_template_id: data.paymentTermsTemplateId || null,
          brand_id: data.brandId || null,
          brand_name: data.brandName || null,
          creation_method: 'manual',
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError

      // Refetch to get full details
      const freshInvoice = await fetchInvoice(newInvoice.id)
      if (freshInvoice) {
        setInvoices(prev => [freshInvoice, ...prev])
      }

      // Refresh summary
      const { data: summaryData } = await supabase
        .from('financial_summary')
        .select('*')
        .single()
      setSummary(transformFinancialSummary(summaryData))

      return freshInvoice
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create invoice'))
      return null
    }
  }, [supabase, fetchInvoice])

  // Update invoice
  const updateInvoice = useCallback(async (
    id: string,
    data: Partial<InvoiceFormData>
  ): Promise<Invoice | null> => {
    try {
      const updateData: Record<string, unknown> = {}
      if (data.invoiceDate !== undefined) updateData.invoice_date = data.invoiceDate
      if (data.description !== undefined) updateData.description = data.description
      if (data.type !== undefined) updateData.type = data.type
      if (data.dueDate !== undefined) updateData.due_date = data.dueDate || null
      if (data.notes !== undefined) updateData.notes = data.notes || null

      const { error: updateError } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id)

      if (updateError) throw updateError

      const freshInvoice = await fetchInvoice(id)
      if (freshInvoice) {
        setInvoices(prev => prev.map(inv => inv.id === id ? freshInvoice : inv))
      }

      return freshInvoice
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update invoice'))
      return null
    }
  }, [supabase, fetchInvoice])

  // Record payment (supports multiple milestones)
  const recordPayment = useCallback(async (
    invoiceId: string,
    payment: NewPayment
  ): Promise<boolean> => {
    try {
      // Get the invoice to access milestone amounts
      const invoice = invoices.find(inv => inv.id === invoiceId)

      // Determine which milestones to pay
      const scheduleItemIds = payment.scheduleItemIds ||
        (payment.scheduleItemId ? [payment.scheduleItemId] : [])

      // If multiple milestones selected, create one payment per milestone
      if (scheduleItemIds.length > 1 && invoice) {
        let firstPaymentId: string | null = null

        for (const scheduleItemId of scheduleItemIds) {
          // Find the milestone to get its remaining amount
          const milestone = invoice.paymentSchedule.find(m => m.id === scheduleItemId)
          if (!milestone) continue

          const remainingAmount = Math.max(0, milestone.amount - milestone.paidAmount)
          if (remainingAmount <= 0) continue

          const { data: newPayment, error: paymentError } = await supabase
            .from('invoice_payments')
            .insert({
              invoice_id: invoiceId,
              date: payment.date,
              amount: remainingAmount,
              method: payment.method,
              reference: payment.reference || null,
              notes: payment.notes || null,
              schedule_item_id: scheduleItemId,
            })
            .select()
            .single()

          if (paymentError) throw paymentError

          // Store first payment ID for attachments
          if (!firstPaymentId) {
            firstPaymentId = newPayment.id
          }
        }

        // Upload attachments to the first payment only
        if (firstPaymentId && payment.attachments && payment.attachments.length > 0) {
          for (const file of payment.attachments) {
            const filePath = `${invoiceId}/${firstPaymentId}/${Date.now()}-${file.name}`

            const { error: uploadError } = await supabase.storage
              .from('payment-attachments')
              .upload(filePath, file)

            if (uploadError) {
              console.error('Upload error:', uploadError)
              continue
            }

            const { data: urlData } = supabase.storage
              .from('payment-attachments')
              .getPublicUrl(filePath)

            await supabase
              .from('invoice_payment_attachments')
              .insert({
                payment_id: firstPaymentId,
                name: file.name,
                type: file.type,
                url: urlData.publicUrl,
                storage_path: filePath,
                size: file.size,
              })
          }
        }
      } else {
        // Single milestone or no milestones - create one payment
        const { data: newPayment, error: paymentError } = await supabase
          .from('invoice_payments')
          .insert({
            invoice_id: invoiceId,
            date: payment.date,
            amount: payment.amount,
            method: payment.method,
            reference: payment.reference || null,
            notes: payment.notes || null,
            schedule_item_id: scheduleItemIds[0] || null,
          })
          .select()
          .single()

        if (paymentError) throw paymentError

        // Upload attachments if any
        if (payment.attachments && payment.attachments.length > 0) {
          for (const file of payment.attachments) {
            const filePath = `${invoiceId}/${newPayment.id}/${Date.now()}-${file.name}`

            const { error: uploadError } = await supabase.storage
              .from('payment-attachments')
              .upload(filePath, file)

            if (uploadError) {
              console.error('Upload error:', uploadError)
              continue
            }

            const { data: urlData } = supabase.storage
              .from('payment-attachments')
              .getPublicUrl(filePath)

            await supabase
              .from('invoice_payment_attachments')
              .insert({
                payment_id: newPayment.id,
                name: file.name,
                type: file.type,
                url: urlData.publicUrl,
                storage_path: filePath,
                size: file.size,
              })
          }
        }
      }

      // Refetch invoice to get updated totals
      const freshInvoice = await fetchInvoice(invoiceId)
      if (freshInvoice) {
        setInvoices(prev => prev.map(inv => inv.id === invoiceId ? freshInvoice : inv))
      }

      // Refresh summary
      const { data: summaryData } = await supabase
        .from('financial_summary')
        .select('*')
        .single()
      setSummary(transformFinancialSummary(summaryData))

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to record payment'))
      return false
    }
  }, [supabase, fetchInvoice, invoices])

  // Update schedule items (milestones)
  const updateScheduleItems = useCallback(async (
    invoiceId: string,
    items: EditableScheduleItem[]
  ): Promise<boolean> => {
    try {
      // Get the invoice to know the total amount
      const invoice = invoices.find(inv => inv.id === invoiceId)
      if (!invoice) {
        throw new Error('Invoice not found')
      }

      // Separate items into: delete, update, create
      const toDelete = items.filter(item => item.isDeleted && !item.isNew)
      const toUpdate = items.filter(item => !item.isDeleted && !item.isNew)
      const toCreate = items.filter(item => !item.isDeleted && item.isNew)

      // Delete items
      if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('invoice_payment_schedule_items')
          .delete()
          .in('id', toDelete.map(item => item.id))

        if (deleteError) throw deleteError
      }

      // Update existing items
      for (let i = 0; i < toUpdate.length; i++) {
        const item = toUpdate[i]
        const { error: updateError } = await supabase
          .from('invoice_payment_schedule_items')
          .update({
            milestone_name: item.milestoneName,
            percentage: item.percentage,
            amount: invoice.amount * item.percentage / 100,
            trigger: item.trigger,
            offset_days: item.offsetDays,
            sort_order: i,
          })
          .eq('id', item.id)

        if (updateError) throw updateError
      }

      // Create new items
      if (toCreate.length > 0) {
        const newItems = toCreate.map((item, idx) => ({
          invoice_id: invoiceId,
          milestone_name: item.milestoneName,
          percentage: item.percentage,
          amount: invoice.amount * item.percentage / 100,
          trigger: item.trigger,
          offset_days: item.offsetDays,
          trigger_status: item.trigger === 'upfront' ? 'triggered' : 'pending' as const,
          trigger_date: item.trigger === 'upfront' ? new Date().toISOString() : null,
          due_date: item.trigger === 'upfront'
            ? new Date(Date.now() + item.offsetDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : null,
          sort_order: toUpdate.length + idx,
        }))

        const { error: createError } = await supabase
          .from('invoice_payment_schedule_items')
          .insert(newItems)

        if (createError) throw createError
      }

      // Refetch invoice to get updated data
      const freshInvoice = await fetchInvoice(invoiceId)
      if (freshInvoice) {
        setInvoices(prev => prev.map(inv => inv.id === invoiceId ? freshInvoice : inv))
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update milestones'))
      return false
    }
  }, [supabase, invoices, fetchInvoice])

  // Add attachments to existing payment
  const addPaymentAttachments = useCallback(async (
    invoiceId: string,
    paymentId: string,
    files: File[]
  ): Promise<boolean> => {
    try {
      for (const file of files) {
        const filePath = `${invoiceId}/${paymentId}/${Date.now()}-${file.name}`

        const { error: uploadError } = await supabase.storage
          .from('payment-attachments')
          .upload(filePath, file)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          continue
        }

        const { data: urlData } = supabase.storage
          .from('payment-attachments')
          .getPublicUrl(filePath)

        await supabase
          .from('invoice_payment_attachments')
          .insert({
            payment_id: paymentId,
            name: file.name,
            type: file.type,
            url: urlData.publicUrl,
            storage_path: filePath,
            size: file.size,
          })
      }

      // Refetch invoice to get updated data
      const freshInvoice = await fetchInvoice(invoiceId)
      if (freshInvoice) {
        setInvoices(prev => prev.map(inv => inv.id === invoiceId ? freshInvoice : inv))
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to upload attachments'))
      return false
    }
  }, [supabase, fetchInvoice])

  // Delete payment
  const deletePayment = useCallback(async (
    invoiceId: string,
    paymentId: string
  ): Promise<boolean> => {
    try {
      // Find the invoice and payment to get attachments
      const invoice = invoices.find(inv => inv.id === invoiceId)
      const payment = invoice?.payments.find(p => p.id === paymentId)

      // Delete payment attachments from storage first
      if (payment) {
        for (const attachment of payment.attachments) {
          if (attachment.storagePath) {
            await supabase.storage
              .from('payment-attachments')
              .remove([attachment.storagePath])
          }
        }
      }

      // Delete attachment records (cascade should handle this, but being explicit)
      await supabase
        .from('invoice_payment_attachments')
        .delete()
        .eq('payment_id', paymentId)

      // Delete the payment
      const { error } = await supabase
        .from('invoice_payments')
        .delete()
        .eq('id', paymentId)

      if (error) throw error

      // Refetch invoice to get updated totals
      const freshInvoice = await fetchInvoice(invoiceId)
      if (freshInvoice) {
        setInvoices(prev => prev.map(inv => inv.id === invoiceId ? freshInvoice : inv))
      }

      // Refresh summary
      const { data: summaryData } = await supabase
        .from('financial_summary')
        .select('*')
        .single()
      setSummary(transformFinancialSummary(summaryData))

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete payment'))
      return false
    }
  }, [supabase, invoices, fetchInvoice])

  // Delete invoice
  const deleteInvoice = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Delete payment attachments from storage first
      const invoice = invoices.find(inv => inv.id === id)
      if (invoice) {
        for (const payment of invoice.payments) {
          for (const attachment of payment.attachments) {
            if (attachment.storagePath) {
              await supabase.storage
                .from('payment-attachments')
                .remove([attachment.storagePath])
            }
          }
        }
      }

      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)

      if (error) throw error

      setInvoices(prev => prev.filter(inv => inv.id !== id))

      // Refresh summary
      const { data: summaryData } = await supabase
        .from('financial_summary')
        .select('*')
        .single()
      setSummary(transformFinancialSummary(summaryData))

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete invoice'))
      return false
    }
  }, [supabase, invoices])

  // Compute payments with invoice context for Payments tab
  const paymentsWithInvoice: PaymentWithInvoice[] = useMemo(() => {
    return invoices.flatMap(invoice =>
      invoice.payments.map(payment => ({
        ...payment,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDescription: invoice.description,
      }))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [invoices])

  // Initial fetch
  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  return {
    invoices,
    paymentsWithInvoice,
    summary,
    loading,
    error,
    refetch: fetchInvoices,
    fetchInvoice,
    createInvoice,
    updateInvoice,
    recordPayment,
    updateScheduleItems,
    addPaymentAttachments,
    deletePayment,
    deleteInvoice,
  }
}

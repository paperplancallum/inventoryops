'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '../client'
import type {
  ShippingInvoice,
  ShippingInvoiceLineItem,
  ShippingInvoiceStatus,
  ShippingInvoiceWithVariance,
  VarianceInfo,
  CreateShippingInvoiceInput,
  UpdateShippingInvoiceInput,
  ShippingInvoiceSummary,
  ShippingInvoiceStats,
} from '@/sections/shipping-quotes/invoice-types'

// Database row types (snake_case)
interface DbShippingInvoice {
  id: string
  shipping_quote_id: string
  invoice_number: string
  invoice_date: string
  due_date: string | null
  currency: string
  total_amount: number
  notes: string | null
  pdf_path: string | null
  status: ShippingInvoiceStatus
  created_at: string
  updated_at: string
  // Joined data
  shipping_quote?: {
    id: string
    total_amount: number | null
    currency: string
    shipping_agent_id: string
    shipping_agent?: { id: string; name: string } | null
    shipping_quote_transfers?: Array<{
      transfer_id: string
      transfer?: { id: string; transfer_number: string } | null
    }>
  } | null
  shipping_invoice_line_items?: DbShippingInvoiceLineItem[]
}

interface DbShippingInvoiceLineItem {
  id: string
  shipping_invoice_id: string
  description: string
  amount: number
  sort_order: number
  created_at: string
}

// Calculate variance between quoted and actual amounts
function calculateVariance(quotedAmount: number | null, actualAmount: number): VarianceInfo {
  const quoted = quotedAmount || 0
  const varianceAmount = actualAmount - quoted
  const variancePercent = quoted > 0 ? ((varianceAmount / quoted) * 100) : 0

  return {
    quotedAmount: quoted,
    actualAmount,
    varianceAmount,
    variancePercent: Math.round(variancePercent * 100) / 100,
    isOverBudget: varianceAmount > 0,
  }
}

// Transform functions
function transformInvoice(db: DbShippingInvoice): ShippingInvoice {
  return {
    id: db.id,
    shippingQuoteId: db.shipping_quote_id,
    invoiceNumber: db.invoice_number,
    invoiceDate: db.invoice_date,
    dueDate: db.due_date,
    currency: db.currency,
    totalAmount: db.total_amount,
    notes: db.notes,
    pdfPath: db.pdf_path,
    status: db.status,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    lineItems: (db.shipping_invoice_line_items || []).map(transformLineItem),
  }
}

function transformLineItem(db: DbShippingInvoiceLineItem): ShippingInvoiceLineItem {
  return {
    id: db.id,
    shippingInvoiceId: db.shipping_invoice_id,
    description: db.description,
    amount: db.amount,
    sortOrder: db.sort_order,
    createdAt: db.created_at,
  }
}

function transformInvoiceWithVariance(db: DbShippingInvoice): ShippingInvoiceWithVariance {
  const invoice = transformInvoice(db)
  const quotedAmount = db.shipping_quote?.total_amount || null

  return {
    ...invoice,
    variance: calculateVariance(quotedAmount, db.total_amount),
    quote: {
      id: db.shipping_quote?.id || '',
      totalAmount: quotedAmount || 0,
      currency: db.shipping_quote?.currency || 'USD',
      shippingAgentId: db.shipping_quote?.shipping_agent_id || '',
      shippingAgentName: db.shipping_quote?.shipping_agent?.name || '',
    },
    transfers: (db.shipping_quote?.shipping_quote_transfers || []).map(t => ({
      id: t.transfer_id,
      transferNumber: t.transfer?.transfer_number || '',
    })),
  }
}

export function useShippingInvoices() {
  const [invoices, setInvoices] = useState<ShippingInvoiceWithVariance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Base select query with joins
  const baseSelectQuery = `
    *,
    shipping_quote:shipping_quotes(
      id,
      total_amount,
      currency,
      shipping_agent_id,
      shipping_agent:shipping_agents(id, name),
      shipping_quote_transfers(
        transfer_id,
        transfer:transfers(id, transfer_number)
      )
    ),
    shipping_invoice_line_items(*)
  `

  // Fetch all shipping invoices
  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('shipping_invoices')
        .select(baseSelectQuery)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setInvoices((data || []).map(transformInvoiceWithVariance))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch shipping invoices'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Fetch single invoice
  const fetchInvoice = useCallback(async (id: string): Promise<ShippingInvoiceWithVariance | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('shipping_invoices')
        .select(baseSelectQuery)
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      return transformInvoiceWithVariance(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch invoice'))
      return null
    }
  }, [supabase])

  // Fetch invoice for a quote
  const fetchInvoiceForQuote = useCallback(async (quoteId: string): Promise<ShippingInvoiceWithVariance | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('shipping_invoices')
        .select(baseSelectQuery)
        .eq('shipping_quote_id', quoteId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError // PGRST116 = no rows

      return data ? transformInvoiceWithVariance(data) : null
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch invoice for quote'))
      return null
    }
  }, [supabase])

  // Create invoice
  const createInvoice = useCallback(async (input: CreateShippingInvoiceInput): Promise<ShippingInvoiceWithVariance | null> => {
    try {
      // Create invoice record
      const { data: invoice, error: invoiceError } = await supabase
        .from('shipping_invoices')
        .insert({
          shipping_quote_id: input.shippingQuoteId,
          invoice_number: input.invoiceNumber,
          invoice_date: input.invoiceDate,
          due_date: input.dueDate || null,
          currency: input.currency,
          total_amount: input.totalAmount,
          notes: input.notes || null,
          pdf_path: input.pdfPath || null,
        })
        .select('id')
        .single()

      if (invoiceError) throw invoiceError

      // Add line items if provided
      if (input.lineItems && input.lineItems.length > 0) {
        const lineItemsToInsert = input.lineItems.map((li, index) => ({
          shipping_invoice_id: invoice.id,
          description: li.description,
          amount: li.amount,
          sort_order: index,
        }))

        const { error: lineItemsError } = await supabase
          .from('shipping_invoice_line_items')
          .insert(lineItemsToInsert)

        if (lineItemsError) throw lineItemsError
      }

      // Fetch and return the created invoice
      const freshInvoice = await fetchInvoice(invoice.id)
      if (freshInvoice) {
        setInvoices(prev => [freshInvoice, ...prev])
      }

      return freshInvoice
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create shipping invoice'))
      return null
    }
  }, [supabase, fetchInvoice])

  // Update invoice
  const updateInvoice = useCallback(async (id: string, input: UpdateShippingInvoiceInput): Promise<ShippingInvoiceWithVariance | null> => {
    try {
      const updateData: Record<string, unknown> = {}

      if (input.invoiceNumber !== undefined) updateData.invoice_number = input.invoiceNumber
      if (input.invoiceDate !== undefined) updateData.invoice_date = input.invoiceDate
      if (input.dueDate !== undefined) updateData.due_date = input.dueDate
      if (input.totalAmount !== undefined) updateData.total_amount = input.totalAmount
      if (input.notes !== undefined) updateData.notes = input.notes
      if (input.pdfPath !== undefined) updateData.pdf_path = input.pdfPath
      if (input.status !== undefined) updateData.status = input.status

      const { error: updateError } = await supabase
        .from('shipping_invoices')
        .update(updateData)
        .eq('id', id)

      if (updateError) throw updateError

      // Update line items if provided
      if (input.lineItems) {
        // Delete existing line items
        await supabase
          .from('shipping_invoice_line_items')
          .delete()
          .eq('shipping_invoice_id', id)

        // Insert new line items
        if (input.lineItems.length > 0) {
          const lineItemsToInsert = input.lineItems.map((li, index) => ({
            shipping_invoice_id: id,
            description: li.description,
            amount: li.amount,
            sort_order: index,
          }))

          const { error: lineItemsError } = await supabase
            .from('shipping_invoice_line_items')
            .insert(lineItemsToInsert)

          if (lineItemsError) throw lineItemsError
        }
      }

      // Fetch and return updated invoice
      const freshInvoice = await fetchInvoice(id)
      if (freshInvoice) {
        setInvoices(prev => prev.map(i => i.id === id ? freshInvoice : i))
      }

      return freshInvoice
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update shipping invoice'))
      return null
    }
  }, [supabase, fetchInvoice])

  // Update invoice status
  const updateInvoiceStatus = useCallback(async (id: string, status: ShippingInvoiceStatus): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('shipping_invoices')
        .update({ status })
        .eq('id', id)

      if (error) throw error

      // Update local state
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i))

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update invoice status'))
      return false
    }
  }, [supabase])

  // Upload invoice PDF
  const uploadInvoicePdf = useCallback(async (invoiceId: string, file: File): Promise<string | null> => {
    try {
      const fileName = `invoices/${invoiceId}/${Date.now()}-${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('shipping-documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Update invoice with PDF path
      const { error: updateError } = await supabase
        .from('shipping_invoices')
        .update({ pdf_path: fileName })
        .eq('id', invoiceId)

      if (updateError) throw updateError

      // Refresh the invoice
      const freshInvoice = await fetchInvoice(invoiceId)
      if (freshInvoice) {
        setInvoices(prev => prev.map(i => i.id === invoiceId ? freshInvoice : i))
      }

      return fileName
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to upload PDF'))
      return null
    }
  }, [supabase, fetchInvoice])

  // Delete invoice
  const deleteInvoice = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('shipping_invoices')
        .delete()
        .eq('id', id)

      if (error) throw error

      setInvoices(prev => prev.filter(i => i.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete shipping invoice'))
      return false
    }
  }, [supabase])

  // Compute invoice summaries for list view
  const invoiceSummaries: ShippingInvoiceSummary[] = useMemo(() => {
    const now = new Date()

    return invoices.map(invoice => {
      const isOverdue = invoice.dueDate
        ? new Date(invoice.dueDate) < now && invoice.status !== 'paid'
        : false

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        totalAmount: invoice.totalAmount,
        currency: invoice.currency,
        status: invoice.status,
        varianceAmount: invoice.variance.varianceAmount,
        variancePercent: invoice.variance.variancePercent,
        shippingAgentName: invoice.quote.shippingAgentName,
        transferNumbers: invoice.transfers.map(t => t.transferNumber),
        isOverdue,
      }
    })
  }, [invoices])

  // Compute aggregate stats
  const stats: ShippingInvoiceStats = useMemo(() => {
    const now = new Date()

    const byStatus = {
      received: invoices.filter(i => i.status === 'received').length,
      approved: invoices.filter(i => i.status === 'approved').length,
      paid: invoices.filter(i => i.status === 'paid').length,
    }

    const overdueInvoices = invoices.filter(i =>
      i.dueDate && new Date(i.dueDate) < now && i.status !== 'paid'
    )

    const totalVariance = invoices.reduce((sum, i) => sum + i.variance.varianceAmount, 0)
    const averageVariancePercent = invoices.length > 0
      ? invoices.reduce((sum, i) => sum + i.variance.variancePercent, 0) / invoices.length
      : 0

    return {
      totalInvoices: invoices.length,
      totalAmount: invoices.reduce((sum, i) => sum + i.totalAmount, 0),
      totalVariance,
      averageVariancePercent: Math.round(averageVariancePercent * 100) / 100,
      byStatus,
      overdueCount: overdueInvoices.length,
      overdueAmount: overdueInvoices.reduce((sum, i) => sum + i.totalAmount, 0),
    }
  }, [invoices])

  // Initial fetch
  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  return {
    invoices,
    invoiceSummaries,
    stats,
    loading,
    error,
    refetch: fetchInvoices,
    fetchInvoice,
    fetchInvoiceForQuote,
    createInvoice,
    updateInvoice,
    updateInvoiceStatus,
    uploadInvoicePdf,
    deleteInvoice,
    calculateVariance,
  }
}

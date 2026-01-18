'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '../client'
import type { Database } from '../database.types'

// Derive types from Database
type DbPurchaseOrder = Database['public']['Tables']['purchase_orders']['Row']
type DbPOLineItem = Database['public']['Tables']['po_line_items']['Row']
type DbPOStatusHistory = Database['public']['Tables']['po_status_history']['Row']
type DbPOMessage = Database['public']['Tables']['po_messages']['Row']
type DbPOAttachment = Database['public']['Tables']['po_attachments']['Row']
type DbPODocument = Database['public']['Tables']['po_documents']['Row']
type POStatus = Database['public']['Enums']['po_status']
import type {
  PurchaseOrder,
  LineItem,
  StatusHistoryEntry,
  Message,
  Attachment,
  PODocument,
  POFormData,
  POLineItemFlat,
  LineItemsSummary,
} from '@/sections/purchase-orders/types'

// Transform database PO to frontend PO
function transformPurchaseOrder(
  dbPO: DbPurchaseOrder & {
    supplier: { name: string } | null
    po_line_items?: DbPOLineItem[]
    po_status_history?: DbPOStatusHistory[]
    po_messages?: (DbPOMessage & { po_attachments?: DbPOAttachment[] })[]
    po_documents?: DbPODocument[]
  }
): PurchaseOrder {
  return {
    id: dbPO.id,
    poNumber: dbPO.po_number,
    supplierId: dbPO.supplier_id,
    supplierName: dbPO.supplier?.name || 'Unknown Supplier',
    status: dbPO.status,
    orderDate: dbPO.order_date,
    expectedDate: dbPO.expected_date || '',
    receivedDate: dbPO.received_date,
    paymentTerms: dbPO.payment_terms || '',
    paymentTermsTemplateId: dbPO.payment_terms_template_id || undefined,
    notes: dbPO.notes || '',
    subtotal: dbPO.subtotal,
    total: dbPO.total,
    lineItems: (dbPO.po_line_items || []).map(transformLineItem),
    statusHistory: (dbPO.po_status_history || []).map(transformStatusHistory),
    requiresInspection: dbPO.requires_inspection ?? undefined,
    inspectionStatus: dbPO.inspection_status ?? undefined,
    inspectionId: dbPO.inspection_id || undefined,
    supplierInvoiceStatus: dbPO.supplier_invoice_status ?? undefined,
    supplierInvoiceId: dbPO.supplier_invoice_id || undefined,
    invoiceLinkSentAt: dbPO.invoice_link_sent_at || undefined,
    invoiceSubmittedAt: dbPO.invoice_submitted_at || undefined,
    invoiceReviewedAt: dbPO.invoice_reviewed_at || undefined,
    invoiceVariance: dbPO.invoice_variance || undefined,
    invoiceVariancePercent: dbPO.invoice_variance_percent || undefined,
    unreadCount: dbPO.unread_count,
    messages: (dbPO.po_messages || []).map(transformMessage),
    documents: (dbPO.po_documents || []).map(transformDocument),
    createdById: dbPO.created_by_id || undefined,
    createdByName: dbPO.created_by_name || undefined,
    createdAt: dbPO.created_at,
    updatedAt: dbPO.updated_at,
  }
}

function transformLineItem(dbLineItem: DbPOLineItem): LineItem {
  return {
    id: dbLineItem.id,
    productId: dbLineItem.product_id || undefined,
    sku: dbLineItem.sku,
    productName: dbLineItem.product_name,
    quantity: dbLineItem.quantity,
    unitCost: dbLineItem.unit_cost,
    subtotal: dbLineItem.subtotal,
    sortOrder: dbLineItem.sort_order,
  }
}

function transformStatusHistory(dbHistory: DbPOStatusHistory): StatusHistoryEntry {
  return {
    id: dbHistory.id,
    status: dbHistory.status,
    date: dbHistory.created_at,
    note: dbHistory.note || '',
    changedById: dbHistory.changed_by_id || undefined,
    changedByName: dbHistory.changed_by_name || undefined,
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

function transformDocument(dbDocument: DbPODocument): PODocument {
  return {
    id: dbDocument.id,
    fileName: dbDocument.file_name,
    fileUrl: dbDocument.file_url,
    storagePath: dbDocument.storage_path || undefined,
    fileSize: dbDocument.file_size || undefined,
    version: dbDocument.version,
    snapshotData: (dbDocument.snapshot_data as Record<string, unknown>) || undefined,
    generatedById: dbDocument.generated_by_id || undefined,
    generatedByName: dbDocument.generated_by_name || undefined,
    createdAt: dbDocument.created_at,
  }
}

export function usePurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Fetch all purchase orders with related data
  const fetchPurchaseOrders = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(name),
          po_line_items(*),
          po_status_history(*)
        `)
        .order('order_date', { ascending: false })

      if (fetchError) throw fetchError

      const transformedPOs = (data || []).map(transformPurchaseOrder)
      setPurchaseOrders(transformedPOs)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch purchase orders'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Fetch single PO with full details (messages, documents)
  const fetchPurchaseOrder = useCallback(async (id: string): Promise<PurchaseOrder | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(name),
          po_line_items(*),
          po_status_history(*),
          po_messages(*, po_attachments(*)),
          po_documents(*)
        `)
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      return transformPurchaseOrder(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch purchase order'))
      return null
    }
  }, [supabase])

  // Create purchase order
  const createPurchaseOrder = useCallback(async (data: POFormData): Promise<PurchaseOrder | null> => {
    try {
      // Insert PO (po_number is auto-generated by trigger)
      const { data: newPO, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          supplier_id: data.supplierId,
          order_date: data.orderDate,
          expected_date: data.expectedDate || null,
          payment_terms: data.paymentTerms || null,
          payment_terms_template_id: data.paymentTermsTemplateId || null,
          notes: data.notes || null,
          status: 'draft' as POStatus,
        })
        .select(`
          *,
          supplier:suppliers(name)
        `)
        .single()

      if (poError) throw poError

      // Insert line items
      if (data.lineItems && data.lineItems.length > 0) {
        const lineItemsToInsert = data.lineItems.map((item, index) => ({
          purchase_order_id: newPO.id,
          product_id: item.productId || null,
          sku: item.sku,
          product_name: item.productName,
          quantity: item.quantity,
          unit_cost: item.unitCost,
          sort_order: index,
        }))

        const { error: lineItemsError } = await supabase
          .from('po_line_items')
          .insert(lineItemsToInsert)

        if (lineItemsError) throw lineItemsError
      }

      // Refetch to get updated totals and all relations
      const freshPO = await fetchPurchaseOrder(newPO.id)
      if (freshPO) {
        setPurchaseOrders(prev => [freshPO, ...prev])
      }

      return freshPO
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create purchase order'))
      return null
    }
  }, [supabase, fetchPurchaseOrder])

  // Update purchase order
  const updatePurchaseOrder = useCallback(async (id: string, data: Partial<POFormData>): Promise<PurchaseOrder | null> => {
    try {
      // Update PO fields
      const updateData: Record<string, unknown> = {}
      if (data.supplierId !== undefined) updateData.supplier_id = data.supplierId
      if (data.orderDate !== undefined) updateData.order_date = data.orderDate
      if (data.expectedDate !== undefined) updateData.expected_date = data.expectedDate || null
      if (data.paymentTerms !== undefined) updateData.payment_terms = data.paymentTerms || null
      if (data.paymentTermsTemplateId !== undefined) updateData.payment_terms_template_id = data.paymentTermsTemplateId || null
      if (data.notes !== undefined) updateData.notes = data.notes || null

      const { error: poError } = await supabase
        .from('purchase_orders')
        .update(updateData)
        .eq('id', id)

      if (poError) throw poError

      // Update line items if provided
      if (data.lineItems !== undefined) {
        // Delete existing line items
        const { error: deleteError } = await supabase
          .from('po_line_items')
          .delete()
          .eq('purchase_order_id', id)

        if (deleteError) throw deleteError

        // Insert new line items
        if (data.lineItems.length > 0) {
          const lineItemsToInsert = data.lineItems.map((item, index) => ({
            purchase_order_id: id,
            product_id: item.productId || null,
            sku: item.sku,
            product_name: item.productName,
            quantity: item.quantity,
            unit_cost: item.unitCost,
            sort_order: index,
          }))

          const { error: insertError } = await supabase
            .from('po_line_items')
            .insert(lineItemsToInsert)

          if (insertError) throw insertError
        }
      }

      // Refetch to get updated data
      const freshPO = await fetchPurchaseOrder(id)
      if (freshPO) {
        setPurchaseOrders(prev => prev.map(po => po.id === id ? freshPO : po))
      }

      return freshPO
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update purchase order'))
      return null
    }
  }, [supabase, fetchPurchaseOrder])

  // Update PO status
  const updateStatus = useCallback(async (id: string, newStatus: POStatus, note?: string): Promise<boolean> => {
    try {
      const { data, error: updateError } = await supabase
        .from('purchase_orders')
        .update({ status: newStatus })
        .eq('id', id)
        .select()

      if (updateError) {
        console.error('Supabase update error:', JSON.stringify(updateError))
        console.error('Error message:', updateError.message)
        console.error('Error code:', updateError.code)
        console.error('Error details:', updateError.details)
        console.error('Error hint:', updateError.hint)
        throw new Error(updateError.message || 'Failed to update status')
      }

      console.log('Update successful, data:', data)

      // Status history is auto-created by trigger, but we can add a custom note
      if (note) {
        await supabase
          .from('po_status_history')
          .update({ note })
          .eq('purchase_order_id', id)
          .eq('status', newStatus)
          .order('created_at', { ascending: false })
          .limit(1)
      }

      setPurchaseOrders(prev => prev.map(po =>
        po.id === id ? { ...po, status: newStatus } : po
      ))

      return true
    } catch (err) {
      console.error('Status update error:', err)
      setError(err instanceof Error ? err : new Error('Failed to update status'))
      return false
    }
  }, [supabase])

  // Delete purchase order
  const deletePurchaseOrder = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', id)

      if (error) throw error

      setPurchaseOrders(prev => prev.filter(po => po.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete purchase order'))
      return false
    }
  }, [supabase])

  // Duplicate purchase order
  const duplicatePurchaseOrder = useCallback(async (id: string): Promise<PurchaseOrder | null> => {
    try {
      const existingPO = purchaseOrders.find(po => po.id === id)
      if (!existingPO) throw new Error('Purchase order not found')

      const formData: POFormData = {
        supplierId: existingPO.supplierId,
        orderDate: new Date().toISOString().split('T')[0],
        expectedDate: '',
        paymentTerms: existingPO.paymentTerms,
        paymentTermsTemplateId: existingPO.paymentTermsTemplateId,
        notes: `Duplicated from ${existingPO.poNumber}`,
        lineItems: existingPO.lineItems.map(item => ({
          productId: item.productId,
          sku: item.sku,
          productName: item.productName,
          quantity: item.quantity,
          unitCost: item.unitCost,
        })),
      }

      return await createPurchaseOrder(formData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to duplicate purchase order'))
      return null
    }
  }, [purchaseOrders, createPurchaseOrder])

  // Compute flat line items for aggregated view
  const flatLineItems: POLineItemFlat[] = useMemo(() => {
    return purchaseOrders.flatMap(po =>
      po.lineItems.map(item => ({
        id: item.id,
        poId: po.id,
        poNumber: po.poNumber,
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        poStatus: po.status,
        productId: item.productId,
        sku: item.sku,
        productName: item.productName,
        quantity: item.quantity,
        unitCost: item.unitCost,
        subtotal: item.subtotal,
        orderDate: po.orderDate,
        expectedDate: po.expectedDate,
      }))
    )
  }, [purchaseOrders])

  // Compute summary for line items view
  const lineItemsSummary: LineItemsSummary = useMemo(() => {
    const bySupplier: Record<string, { supplierId: string; supplierName: string; count: number; value: number }> = {}
    const byStatus: Record<string, { status: POStatus; count: number; value: number }> = {}
    const uniqueSkus = new Set<string>()

    flatLineItems.forEach(item => {
      // Supplier breakdown
      if (!bySupplier[item.supplierId]) {
        bySupplier[item.supplierId] = { supplierId: item.supplierId, supplierName: item.supplierName, count: 0, value: 0 }
      }
      bySupplier[item.supplierId].count++
      bySupplier[item.supplierId].value += item.subtotal

      // Status breakdown
      if (!byStatus[item.poStatus]) {
        byStatus[item.poStatus] = { status: item.poStatus, count: 0, value: 0 }
      }
      byStatus[item.poStatus].count++
      byStatus[item.poStatus].value += item.subtotal

      uniqueSkus.add(item.sku)
    })

    return {
      totalItems: flatLineItems.length,
      totalUnits: flatLineItems.reduce((sum, item) => sum + item.quantity, 0),
      totalValue: flatLineItems.reduce((sum, item) => sum + item.subtotal, 0),
      uniqueProducts: uniqueSkus.size,
      bySupplier: Object.values(bySupplier),
      byStatus: Object.values(byStatus),
    }
  }, [flatLineItems])

  // Initial fetch
  useEffect(() => {
    fetchPurchaseOrders()
  }, [fetchPurchaseOrders])

  return {
    purchaseOrders,
    flatLineItems,
    lineItemsSummary,
    loading,
    error,
    refetch: fetchPurchaseOrders,
    fetchPurchaseOrder,
    createPurchaseOrder,
    updatePurchaseOrder,
    updateStatus,
    deletePurchaseOrder,
    duplicatePurchaseOrder,
  }
}

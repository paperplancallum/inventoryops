import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { POPDFDocument } from '@/sections/purchase-orders/POPDFDocument'
import { TransferManifestPDFDocument } from '@/sections/transfers/TransferManifestPDF'
import { InspectionBriefPDFDocument } from '@/sections/documents/pdf/InspectionBriefPDF'
import { PackingListPDFDocument } from '@/sections/documents/pdf/PackingListPDF'
import type {
  GeneratedDocumentType,
  DocumentSourceType,
  PODocumentSnapshot,
  InspectionBriefSnapshot,
  TransferDocumentSnapshot,
  PackingListDocumentSnapshot,
} from '@/sections/documents/types'
import type { PurchaseOrder, POStatusOption } from '@/sections/purchase-orders/types'
import {
  TRANSFER_STATUS_OPTIONS,
  SHIPPING_METHOD_OPTIONS,
} from '@/sections/transfers/types'
import type { Transfer } from '@/sections/transfers/types'
import React from 'react'

// Status options for PDF rendering
const PO_STATUS_OPTIONS: POStatusOption[] = [
  { id: 'draft', label: 'Draft', order: 1 },
  { id: 'sent', label: 'Sent', order: 2 },
  { id: 'awaiting_invoice', label: 'Awaiting Invoice', order: 3 },
  { id: 'invoice_received', label: 'Invoice Received', order: 4 },
  { id: 'confirmed', label: 'Confirmed', order: 5 },
  { id: 'production_complete', label: 'Production Complete', order: 6 },
  { id: 'ready-to-ship', label: 'Ready to Ship', order: 7 },
  { id: 'partially-received', label: 'Partially Received', order: 8 },
  { id: 'received', label: 'Received', order: 9 },
  { id: 'cancelled', label: 'Cancelled', order: 10 },
]

export interface GenerateDocumentParams {
  sourceEntityType: DocumentSourceType
  sourceEntityId: string
  documentType: GeneratedDocumentType
  trigger: 'auto' | 'manual'
  notes?: string
}

export interface GeneratedDocumentResult {
  id: string
  sourceEntityType: string
  sourceEntityId: string
  sourceEntityRef: string
  documentType: string
  documentName: string
  generatedAt: string
  generatedById: string | null
  generatedByName: string | null
  pdfUrl: string
  storagePath: string
  fileSize: number
  dataSnapshot: Record<string, unknown>
  generationTrigger: string
  notes: string | null
  brandId: string | null
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

/**
 * Generate and save a document directly (for use in server-side code).
 * This avoids the need to make HTTP requests to our own API.
 */
export async function generateAndSaveDocument(
  supabase: SupabaseClient,
  userId: string,
  userName: string,
  params: GenerateDocumentParams
): Promise<GeneratedDocumentResult> {
  const { sourceEntityType, sourceEntityId, documentType, trigger, notes } = params

  let pdfBuffer: Buffer
  let documentName: string
  let sourceEntityRef: string
  let dataSnapshot: Record<string, unknown>
  let brandId: string | null = null

  // Generate PDF based on document type
  if (documentType === 'purchase-order-pdf') {
    const result = await generatePOPDF(supabase, sourceEntityId)
    pdfBuffer = result.buffer
    documentName = `${result.ref}.pdf`
    sourceEntityRef = result.ref
    dataSnapshot = result.snapshot as unknown as Record<string, unknown>
    brandId = result.brandId
  } else if (documentType === 'inspection-brief') {
    const result = await generateInspectionBriefPDF(supabase, sourceEntityId)
    pdfBuffer = result.buffer
    documentName = `Inspection-Brief-${result.ref}.pdf`
    sourceEntityRef = result.ref
    dataSnapshot = result.snapshot as unknown as Record<string, unknown>
    brandId = result.brandId
  } else if (documentType === 'shipping-manifest') {
    const result = await generateShippingManifestPDF(supabase, sourceEntityId)
    pdfBuffer = result.buffer
    documentName = `Manifest-${result.ref}.pdf`
    sourceEntityRef = result.ref
    dataSnapshot = result.snapshot as unknown as Record<string, unknown>
    brandId = result.brandId
  } else if (documentType === 'packing-list') {
    const result = await generatePackingListPDF(supabase, sourceEntityId)
    pdfBuffer = result.buffer
    documentName = `Packing-List-${result.ref}.pdf`
    sourceEntityRef = result.ref
    dataSnapshot = result.snapshot as unknown as Record<string, unknown>
    brandId = result.brandId
  } else {
    throw new Error('Invalid document type')
  }

  // Generate unique storage path
  const timestamp = Date.now()
  const storagePath = `${sourceEntityType}/${sourceEntityId}/${documentType}-${timestamp}.pdf`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('generated-documents')
    .upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    throw new Error('Failed to upload document to storage')
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('generated-documents')
    .getPublicUrl(storagePath)

  // Insert document record
  const { data: document, error: insertError } = await supabase
    .from('generated_documents')
    .insert({
      source_entity_type: sourceEntityType,
      source_entity_id: sourceEntityId,
      source_entity_ref: sourceEntityRef,
      document_type: documentType,
      document_name: documentName,
      storage_path: storagePath,
      file_url: urlData.publicUrl,
      file_size: pdfBuffer.length,
      data_snapshot: dataSnapshot,
      generated_by_id: userId,
      generated_by_name: userName,
      generation_trigger: trigger,
      notes: notes || null,
      brand_id: brandId,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Database insert error:', insertError)
    // Try to clean up uploaded file
    await supabase.storage.from('generated-documents').remove([storagePath])
    throw new Error('Failed to save document record')
  }

  return {
    id: document.id,
    sourceEntityType: document.source_entity_type,
    sourceEntityId: document.source_entity_id,
    sourceEntityRef: document.source_entity_ref,
    documentType: document.document_type,
    documentName: document.document_name,
    generatedAt: document.created_at,
    generatedById: document.generated_by_id,
    generatedByName: document.generated_by_name,
    pdfUrl: document.file_url,
    storagePath: document.storage_path,
    fileSize: document.file_size,
    dataSnapshot: document.data_snapshot,
    generationTrigger: document.generation_trigger,
    notes: document.notes,
    brandId: document.brand_id,
  }
}

// Helper: Generate PO PDF
async function generatePOPDF(supabase: SupabaseClient, poId: string) {
  const { data: po, error } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      suppliers:supplier_id (
        id, name, contact_name, contact_email, address, city, country
      ),
      po_line_items (
        id, sku, product_name, quantity, unit_cost, subtotal
      )
    `)
    .eq('id', poId)
    .single()

  if (error || !po) {
    throw new Error('Purchase order not found')
  }

  const supplier = po.suppliers as { name: string; address?: string; city?: string; country?: string } | null
  const lineItems = (po.po_line_items || []) as Array<{
    id: string
    sku: string
    product_name: string
    quantity: number
    unit_cost: number
    subtotal: number
  }>

  const snapshot: PODocumentSnapshot = {
    poNumber: po.po_number,
    supplierName: supplier?.name || 'Unknown Supplier',
    supplierAddress: [supplier?.address, supplier?.city, supplier?.country].filter(Boolean).join(', ') || undefined,
    orderDate: po.order_date,
    expectedDate: po.expected_date,
    paymentTerms: po.payment_terms || '',
    lineItems: lineItems.map(item => ({
      sku: item.sku,
      productName: item.product_name,
      quantity: item.quantity,
      unitCost: item.unit_cost,
      subtotal: item.subtotal,
    })),
    subtotal: po.subtotal || 0,
    total: po.total || 0,
    notes: po.notes || '',
  }

  // Build PurchaseOrder object for PDF component
  const purchaseOrder: PurchaseOrder = {
    id: po.id,
    poNumber: po.po_number,
    supplierId: po.supplier_id,
    supplierName: supplier?.name || 'Unknown',
    status: po.status,
    orderDate: po.order_date,
    expectedDate: po.expected_date,
    receivedDate: po.received_date || null,
    paymentTerms: po.payment_terms || '',
    lineItems: lineItems.map(item => ({
      id: item.id,
      productId: '',
      sku: item.sku,
      productName: item.product_name,
      quantity: item.quantity,
      unitCost: item.unit_cost,
      subtotal: item.subtotal,
    })),
    subtotal: po.subtotal || 0,
    total: po.total || 0,
    notes: po.notes || '',
    statusHistory: [],
    createdAt: po.created_at,
    updatedAt: po.updated_at,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(
    React.createElement(POPDFDocument, {
      purchaseOrder,
      poStatuses: PO_STATUS_OPTIONS,
    }) as any
  )

  return {
    buffer,
    ref: po.po_number,
    snapshot,
    brandId: po.brand_id || null,
  }
}

// Helper: Generate Inspection Brief PDF
async function generateInspectionBriefPDF(supabase: SupabaseClient, inspectionId: string) {
  const { data: inspection, error } = await supabase
    .from('inspections')
    .select(`
      *,
      inspection_agents:agent_id (
        id, name, email, phone, company
      ),
      inspection_line_items (
        id, product_sku, product_name, ordered_quantity, sample_size
      ),
      purchase_orders:purchase_order_id (
        id, po_number, supplier_id, brand_id,
        suppliers:supplier_id (
          id, name, address, city, country, phone, contact_name
        )
      )
    `)
    .eq('id', inspectionId)
    .single()

  if (error || !inspection) {
    throw new Error('Inspection not found')
  }

  const agent = inspection.inspection_agents as { name: string; email?: string; phone?: string; company?: string } | null
  const po = inspection.purchase_orders as {
    po_number: string
    brand_id?: string
    suppliers?: { name: string; address?: string; city?: string; country?: string; phone?: string; contact_name?: string }
  } | null
  const supplier = po?.suppliers
  const lineItems = (inspection.inspection_line_items || []) as Array<{
    product_sku: string
    product_name: string
    ordered_quantity: number
    sample_size?: number
  }>

  const snapshot: InspectionBriefSnapshot = {
    inspectionNumber: inspection.inspection_number,
    purchaseOrderNumber: po?.po_number || inspection.purchase_order_number || 'N/A',
    supplierName: supplier?.name || inspection.supplier_name || 'Unknown Supplier',
    supplierAddress: [supplier?.address, supplier?.city, supplier?.country].filter(Boolean).join(', ') || undefined,
    supplierPhone: supplier?.phone || undefined,
    supplierContactPerson: supplier?.contact_name || undefined,
    scheduledDate: inspection.scheduled_date,
    inspectionType: 'Pre-Shipment Inspection (PSI)',
    agentName: agent?.name || inspection.agent_name || 'Unassigned',
    agentCompany: agent?.company || undefined,
    agentEmail: agent?.email || undefined,
    agentPhone: agent?.phone || undefined,
    lineItems: lineItems.map(item => ({
      productSku: item.product_sku,
      productName: item.product_name,
      orderedQuantity: item.ordered_quantity,
      sampleSize: item.sample_size,
    })),
    specialInstructions: inspection.notes || undefined,
    notes: inspection.notes || '',
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(
    React.createElement(InspectionBriefPDFDocument, {
      snapshot,
    }) as any
  )

  return {
    buffer,
    ref: inspection.inspection_number,
    snapshot,
    brandId: po?.brand_id || null,
  }
}

// Helper: Generate Shipping Manifest PDF
async function generateShippingManifestPDF(supabase: SupabaseClient, transferId: string) {
  const { data: transfer, error } = await supabase
    .from('transfers')
    .select(`
      *,
      source_location:source_location_id (id, name, type, address),
      destination_location:destination_location_id (id, name, type, address),
      transfer_line_items (
        id, sku, product_name, quantity, unit_cost, total_cost, product_id
      ),
      transfer_tracking_numbers (id, carrier, tracking_number),
      products:transfer_line_items(product_id(brand_id))
    `)
    .eq('id', transferId)
    .single()

  if (error || !transfer) {
    throw new Error('Transfer not found')
  }

  const sourceLocation = transfer.source_location as { name: string; type?: string; address?: string } | null
  const destLocation = transfer.destination_location as { name: string; type?: string; address?: string } | null
  const lineItems = (transfer.transfer_line_items || []) as Array<{
    id: string
    sku: string
    product_name: string
    quantity: number
    unit_cost: number
    total_cost: number
  }>
  const trackingNumbers = (transfer.transfer_tracking_numbers || []) as Array<{
    id: string
    carrier: string
    tracking_number: string
  }>

  // Get brand_id from first line item's product
  let brandId: string | null = null
  if (lineItems.length > 0) {
    const { data: product } = await supabase
      .from('products')
      .select('brand_id')
      .eq('sku', lineItems[0].sku)
      .single()
    brandId = product?.brand_id || null
  }

  const snapshot: TransferDocumentSnapshot = {
    transferNumber: transfer.transfer_number,
    sourceLocationName: sourceLocation?.name || 'Unknown',
    sourceLocationAddress: sourceLocation?.address || undefined,
    destinationLocationName: destLocation?.name || 'Unknown',
    destinationLocationAddress: destLocation?.address || undefined,
    carrier: transfer.carrier || '',
    shippingMethod: transfer.shipping_method || '',
    scheduledDepartureDate: transfer.scheduled_departure_date || '',
    scheduledArrivalDate: transfer.scheduled_arrival_date || '',
    incoterms: transfer.incoterms || undefined,
    lineItems: lineItems.map(item => ({
      sku: item.sku,
      productName: item.product_name,
      quantity: item.quantity,
      unitCost: item.unit_cost,
      totalCost: item.total_cost,
    })),
    totalUnits: transfer.total_units || lineItems.reduce((sum, i) => sum + i.quantity, 0),
    totalValue: transfer.total_value || lineItems.reduce((sum, i) => sum + i.total_cost, 0),
    trackingNumbers: trackingNumbers.map(t => ({ carrier: t.carrier, number: t.tracking_number })),
    containerNumbers: transfer.container_numbers || [],
    notes: transfer.notes || '',
  }

  // Build Transfer object for PDF component (partial - only includes fields needed for rendering)
  const transferObj = {
    id: transfer.id,
    transferNumber: transfer.transfer_number,
    sourceLocationId: transfer.source_location_id,
    sourceLocationName: sourceLocation?.name || 'Unknown',
    sourceLocationType: sourceLocation?.type || '',
    destinationLocationId: transfer.destination_location_id,
    destinationLocationName: destLocation?.name || 'Unknown',
    destinationLocationType: destLocation?.type || '',
    status: transfer.status,
    scheduledDepartureDate: transfer.scheduled_departure_date,
    scheduledArrivalDate: transfer.scheduled_arrival_date,
    actualDepartureDate: transfer.actual_departure_date,
    actualArrivalDate: transfer.actual_arrival_date,
    carrier: transfer.carrier || '',
    shippingMethod: transfer.shipping_method || null,
    incoterms: transfer.incoterms || '',
    containerNumbers: transfer.container_numbers || [],
    carrierAccountNumber: transfer.carrier_account_number || '',
    lineItems: lineItems.map(item => ({
      id: item.id,
      transferId: transfer.id,
      batchId: '',
      sku: item.sku,
      productName: item.product_name,
      quantity: item.quantity,
      unitCost: item.unit_cost,
      totalCost: item.total_cost,
      status: 'pending' as const,
      receivedQuantity: null,
      discrepancy: null,
      receivedAt: null,
      receivedNotes: '',
      debitLedgerEntryId: null,
      creditLedgerEntryId: null,
      sortOrder: 0,
      createdAt: '',
      updatedAt: '',
    })),
    totalUnits: transfer.total_units || 0,
    totalValue: transfer.total_value || 0,
    totalCost: transfer.total_cost || 0,
    costs: {
      freight: transfer.freight_cost || 0,
      insurance: transfer.insurance_cost || 0,
      duties: transfer.duties_cost || 0,
      taxes: transfer.taxes_cost || 0,
      handling: transfer.handling_cost || 0,
      other: transfer.other_cost || 0,
      currency: 'USD',
    },
    trackingNumbers: trackingNumbers.map(t => ({
      id: t.id,
      carrier: t.carrier,
      trackingNumber: t.tracking_number,
      trackingUrl: null,
      createdAt: '',
    })),
    customsInfo: {
      hsCode: transfer.hs_code || '',
      broker: transfer.customs_broker || '',
      status: 'pending' as const,
      entryNumber: transfer.entry_number || '',
      clearanceDate: null,
      notes: '',
    },
    amazonReceiving: null,
    amazonShipmentId: null,
    notes: transfer.notes || '',
    createdAt: transfer.created_at,
    updatedAt: transfer.updated_at,
  } as Transfer

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(
    React.createElement(TransferManifestPDFDocument, {
      transfer: transferObj,
      transferStatuses: TRANSFER_STATUS_OPTIONS,
      shippingMethods: SHIPPING_METHOD_OPTIONS,
    }) as any
  )

  return {
    buffer,
    ref: transfer.transfer_number,
    snapshot,
    brandId,
  }
}

// Helper: Generate Packing List PDF
async function generatePackingListPDF(supabase: SupabaseClient, transferId: string) {
  const { data: transfer, error } = await supabase
    .from('transfers')
    .select(`
      *,
      source_location:source_location_id (id, name, type, address),
      destination_location:destination_location_id (id, name, type, address),
      transfer_line_items (
        id, sku, product_name, quantity, unit_cost, total_cost
      ),
      transfer_tracking_numbers (id, carrier, tracking_number)
    `)
    .eq('id', transferId)
    .single()

  if (error || !transfer) {
    throw new Error('Transfer not found')
  }

  const sourceLocation = transfer.source_location as { name: string; address?: string } | null
  const destLocation = transfer.destination_location as { name: string; address?: string } | null
  const lineItems = (transfer.transfer_line_items || []) as Array<{
    sku: string
    product_name: string
    quantity: number
  }>
  const trackingNumbers = (transfer.transfer_tracking_numbers || []) as Array<{
    carrier: string
    tracking_number: string
  }>

  // Get brand_id from first line item's product
  let brandId: string | null = null
  if (lineItems.length > 0) {
    const { data: product } = await supabase
      .from('products')
      .select('brand_id')
      .eq('sku', lineItems[0].sku)
      .single()
    brandId = product?.brand_id || null
  }

  // Estimate cartons (roughly 20 units per carton)
  const estimateCartons = (qty: number) => Math.ceil(qty / 20)

  const snapshot: PackingListDocumentSnapshot = {
    transferNumber: transfer.transfer_number,
    sourceLocationName: sourceLocation?.name || 'Unknown',
    destinationLocationName: destLocation?.name || 'Unknown',
    destinationAddress: destLocation?.address || undefined,
    scheduledArrivalDate: transfer.scheduled_arrival_date || '',
    carrier: transfer.carrier || undefined,
    trackingNumber: trackingNumbers[0]?.tracking_number || undefined,
    lineItems: lineItems.map(item => ({
      sku: item.sku,
      productName: item.product_name,
      quantity: item.quantity,
      cartonCount: estimateCartons(item.quantity),
    })),
    totalCartons: lineItems.reduce((sum, item) => sum + estimateCartons(item.quantity), 0),
    totalUnits: lineItems.reduce((sum, item) => sum + item.quantity, 0),
    receivingInstructions: 'Count all cartons upon arrival. Check for damage. Sign BOL with any exceptions noted.',
    notes: transfer.notes || '',
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(
    React.createElement(PackingListPDFDocument, {
      snapshot,
    }) as any
  )

  return {
    buffer,
    ref: transfer.transfer_number,
    snapshot,
    brandId,
  }
}

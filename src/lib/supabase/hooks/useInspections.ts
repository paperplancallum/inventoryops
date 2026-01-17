'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '../client'
import type {
  DbInspection,
  DbInspectionLineItem,
  DbInspectionDefect,
  DbInspectionMeasurement,
  DbInspectionPhoto,
  DbReworkRequest,
  DbInspectionMessage,
  DbInspectionMessageAttachment,
  InspectionStatus,
} from '../database.types'
import type {
  Inspection,
  InspectionLineItem,
  InspectionSummary,
  ReworkRequest,
  Defect,
  MeasurementCheck,
  PackagingCheck,
  InspectionPhoto,
  InspectionMessage,
  Attachment,
  ScheduleInspectionFormData,
  LineItemResult,
  InspectionPurchaseOrder,
} from '@/sections/inspections/types'
import { nanoid } from 'nanoid'

// =============================================================================
// Transform Functions
// =============================================================================

function transformDefect(dbDefect: DbInspectionDefect): Defect {
  return {
    id: dbDefect.id,
    type: dbDefect.type as Defect['type'],
    description: dbDefect.description,
    quantity: dbDefect.quantity ?? 1,
    severity: dbDefect.severity as Defect['severity'],
    photoIds: [], // Photos are linked separately
  }
}

function transformMeasurement(dbMeasurement: DbInspectionMeasurement): MeasurementCheck {
  return {
    id: dbMeasurement.id,
    name: dbMeasurement.name,
    specValue: dbMeasurement.spec_value,
    actualValue: dbMeasurement.actual_value || '',
    passed: dbMeasurement.passed ?? false,
  }
}

function transformPhoto(dbPhoto: DbInspectionPhoto): InspectionPhoto {
  return {
    id: dbPhoto.id,
    url: dbPhoto.url,
    storagePath: dbPhoto.storage_path || undefined,
    caption: dbPhoto.caption || '',
    type: dbPhoto.type as InspectionPhoto['type'],
  }
}

function transformAttachment(dbAttachment: DbInspectionMessageAttachment): Attachment {
  return {
    id: dbAttachment.id,
    name: dbAttachment.name,
    type: dbAttachment.type,
    url: dbAttachment.url,
    storagePath: dbAttachment.storage_path || undefined,
    size: dbAttachment.size || undefined,
  }
}

function transformMessage(
  dbMessage: DbInspectionMessage & { inspection_message_attachments?: DbInspectionMessageAttachment[] }
): InspectionMessage {
  return {
    id: dbMessage.id,
    direction: dbMessage.direction as InspectionMessage['direction'],
    senderName: dbMessage.sender_name,
    senderEmail: dbMessage.sender_email || undefined,
    timestamp: dbMessage.created_at ?? new Date().toISOString(),
    content: dbMessage.content,
    attachments: (dbMessage.inspection_message_attachments || []).map(transformAttachment),
  }
}

function transformReworkRequest(dbRework: DbReworkRequest): ReworkRequest {
  return {
    id: dbRework.id,
    createdDate: dbRework.created_date || dbRework.created_at || new Date().toISOString(),
    instructions: dbRework.instructions,
    supplierResponse: dbRework.supplier_response,
    completedDate: dbRework.completed_date,
    status: dbRework.status as ReworkRequest['status'],
  }
}

function transformLineItem(
  dbLineItem: DbInspectionLineItem & {
    inspection_defects?: DbInspectionDefect[]
    inspection_measurements?: DbInspectionMeasurement[]
    inspection_photos?: DbInspectionPhoto[]
  }
): InspectionLineItem {
  // Extract packaging info from the line item fields
  const packaging: PackagingCheck | null =
    dbLineItem.box_condition || dbLineItem.labeling_accuracy != null || dbLineItem.barcode_scans != null
      ? {
          boxCondition: (dbLineItem.box_condition as PackagingCheck['boxCondition']) || 'good',
          labelingAccuracy: dbLineItem.labeling_accuracy ?? false,
          barcodeScans: dbLineItem.barcode_scans ?? false,
          notes: dbLineItem.packaging_notes || '',
        }
      : null

  return {
    id: dbLineItem.id,
    productId: dbLineItem.product_id || undefined,
    poLineItemId: dbLineItem.po_line_item_id || undefined,
    productName: dbLineItem.product_name,
    productSku: dbLineItem.product_sku,
    orderedQuantity: dbLineItem.ordered_quantity,
    sampleSize: dbLineItem.sample_size ?? 0,
    defectsFound: dbLineItem.defects_found ?? 0,
    defectRate: dbLineItem.defect_rate ?? 0,
    result: dbLineItem.result as LineItemResult,
    defects: (dbLineItem.inspection_defects || []).map(transformDefect),
    measurements: (dbLineItem.inspection_measurements || []).map(transformMeasurement),
    packaging,
    photos: (dbLineItem.inspection_photos || []).map(transformPhoto),
  }
}

// Type for junction table row
interface DbInspectionPurchaseOrder {
  id: string
  inspection_id: string
  purchase_order_id: string
  purchase_orders?: {
    id: string
    po_number: string
    suppliers?: { name: string } | { name: string }[] | null
  }
}

function transformInspection(
  dbInspection: DbInspection & {
    inspection_line_items?: (DbInspectionLineItem & {
      inspection_defects?: DbInspectionDefect[]
      inspection_measurements?: DbInspectionMeasurement[]
      inspection_photos?: DbInspectionPhoto[]
    })[]
    rework_requests?: DbReworkRequest[]
    inspection_messages?: (DbInspectionMessage & { inspection_message_attachments?: DbInspectionMessageAttachment[] })[]
    inspection_photos?: DbInspectionPhoto[]
    inspection_purchase_orders?: DbInspectionPurchaseOrder[]
  }
): Inspection {
  // Get the active rework request (most recent non-completed)
  const reworkRequest = dbInspection.rework_requests?.find(r => r.status !== 'completed') || dbInspection.rework_requests?.[0]

  // Transform junction table data to purchaseOrders array
  const purchaseOrders: InspectionPurchaseOrder[] = (dbInspection.inspection_purchase_orders || [])
    .filter(ipo => ipo.purchase_orders)
    .map(ipo => {
      const po = ipo.purchase_orders!
      const supplierData = po.suppliers
      const supplierName = supplierData
        ? (Array.isArray(supplierData) ? (supplierData[0]?.name || 'Unknown') : (supplierData.name || 'Unknown'))
        : 'Unknown'
      return {
        id: po.id,
        poNumber: po.po_number,
        supplierName,
      }
    })

  return {
    id: dbInspection.id,
    inspectionNumber: (dbInspection as DbInspection & { inspection_number?: string }).inspection_number || '',
    purchaseOrderId: dbInspection.purchase_order_id || null,
    purchaseOrderNumber: dbInspection.purchase_order_number || null,
    supplierName: dbInspection.supplier_name || null,
    purchaseOrders: purchaseOrders.length > 0 ? purchaseOrders : undefined,
    scheduledDate: dbInspection.scheduled_date,
    confirmedDate: dbInspection.confirmed_date,
    completedDate: dbInspection.completed_date,
    agentId: dbInspection.agent_id,
    agentName: dbInspection.agent_name ?? 'Unassigned',
    status: dbInspection.status as InspectionStatus,
    lineItems: (dbInspection.inspection_line_items || []).map(transformLineItem),
    result: (dbInspection.result as LineItemResult) || 'pending',
    overallDefectRate: dbInspection.overall_defect_rate ?? 0,
    totalSampleSize: dbInspection.total_sample_size ?? 0,
    reworkRequest: reworkRequest ? transformReworkRequest(reworkRequest) : null,
    notes: dbInspection.notes || '',
    invoiceId: dbInspection.invoice_id,
    invoiceAmount: dbInspection.invoice_amount,
    magicLinkToken: dbInspection.magic_link_token ?? undefined,
    magicLinkExpiresAt: dbInspection.magic_link_expires_at ?? undefined,
    originalInspectionId: dbInspection.original_inspection_id ?? undefined,
    messages: (dbInspection.inspection_messages || []).map(transformMessage),
    createdAt: dbInspection.created_at ?? undefined,
    updatedAt: dbInspection.updated_at ?? undefined,
  }
}

// =============================================================================
// Hook
// =============================================================================

export function useInspections() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Fetch all inspections with related data
  const fetchInspections = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('inspections')
        .select(`
          *,
          inspection_line_items(
            *,
            inspection_defects(*),
            inspection_measurements(*)
          ),
          rework_requests(*),
          inspection_photos(*),
          inspection_purchase_orders(
            *,
            purchase_orders(id, po_number, suppliers(name))
          )
        `)
        .order('scheduled_date', { ascending: false })

      if (fetchError) throw fetchError

      const transformedInspections = (data || []).map(transformInspection)
      setInspections(transformedInspections)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch inspections'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Fetch single inspection with full details (messages, all photos)
  const fetchInspection = useCallback(
    async (id: string): Promise<Inspection | null> => {
      try {
        const { data, error: fetchError } = await supabase
          .from('inspections')
          .select(`
            *,
            inspection_line_items(
              *,
              inspection_defects(*),
              inspection_measurements(*),
              inspection_photos(*)
            ),
            rework_requests(*),
            inspection_messages(*, inspection_message_attachments(*)),
            inspection_photos(*),
            inspection_purchase_orders(
              *,
              purchase_orders(id, po_number, suppliers(name))
            )
          `)
          .eq('id', id)
          .single()

        if (fetchError) throw fetchError

        return transformInspection(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch inspection'))
        return null
      }
    },
    [supabase]
  )

  // Schedule a new inspection
  const scheduleInspection = useCallback(
    async (data: ScheduleInspectionFormData): Promise<Inspection | null> => {
      try {
        console.log('scheduleInspection: Starting with data:', data)

        // Get PO details for denormalized fields
        const { data: poData, error: poError } = await supabase
          .from('purchase_orders')
          .select(`
            id,
            po_number,
            supplier:suppliers(name),
            po_line_items(*)
          `)
          .eq('id', data.purchaseOrderId)
          .single()

        if (poError) {
          console.error('scheduleInspection: PO fetch error:', poError)
          throw new Error(`Failed to fetch purchase order: ${poError.message}`)
        }

        console.log('scheduleInspection: PO data:', poData)

        // Get agent name if assigned
        let agentName = 'Unassigned'
        if (data.agentId) {
          const { data: agentData } = await supabase
            .from('inspection_agents')
            .select('name')
            .eq('id', data.agentId)
            .single()
          if (agentData) {
            agentName = agentData.name
          }
        }

        // Generate magic link token
        const magicLinkToken = nanoid(32)
        const magicLinkExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days

        // Get supplier name from join result (could be object or array depending on Supabase version)
        const supplierData = poData.supplier as { name: string } | { name: string }[] | null
        const supplierName = supplierData
          ? (Array.isArray(supplierData) ? (supplierData[0]?.name || 'Unknown') : (supplierData.name || 'Unknown'))
          : 'Unknown'

        // Create inspection
        const insertData = {
          purchase_order_id: data.purchaseOrderId,
          purchase_order_number: poData.po_number,
          supplier_name: supplierName,
          scheduled_date: data.scheduledDate,
          agent_id: data.agentId || null,
          agent_name: agentName,
          status: 'scheduled' as const,
          notes: data.notes || null,
          magic_link_token: magicLinkToken,
          magic_link_expires_at: magicLinkExpiresAt,
        }

        console.log('scheduleInspection: Creating inspection with:', insertData)

        let newInspection
        try {
          const result = await supabase
            .from('inspections')
            .insert(insertData)
            .select()
            .single()

          console.log('scheduleInspection: Insert result:', {
            data: result.data,
            error: result.error,
            status: result.status,
            statusText: result.statusText,
          })

          if (result.error) {
            console.error('scheduleInspection: Supabase error object:', {
              name: result.error.name,
              message: result.error.message,
              code: result.error.code,
              details: result.error.details,
              hint: result.error.hint,
            })
            throw new Error(`Database error: ${result.error.message || result.error.code || 'Unknown'}`)
          }

          newInspection = result.data
        } catch (insertErr) {
          console.error('scheduleInspection: Insert threw exception:', insertErr)
          throw insertErr
        }

        if (!newInspection) {
          console.error('scheduleInspection: No inspection returned but no error either')
          throw new Error('Failed to create inspection: No data returned')
        }

        console.log('scheduleInspection: Created inspection:', newInspection.id)

        // Create line items
        const lineItemsToCreate = data.selectedLineItemIds?.length
          ? poData.po_line_items.filter((li: { id: string }) => data.selectedLineItemIds!.includes(li.id))
          : poData.po_line_items

        console.log('scheduleInspection: Creating line items, count:', lineItemsToCreate.length)

        if (lineItemsToCreate.length > 0) {
          const lineItemRecords = lineItemsToCreate.map((li: { id: string; product_id?: string; product_name: string; sku: string; quantity: number }, index: number) => ({
            inspection_id: newInspection.id,
            po_line_item_id: li.id,
            product_id: li.product_id || null,
            product_name: li.product_name,
            product_sku: li.sku,
            ordered_quantity: li.quantity,
            sort_order: index,
          }))

          console.log('scheduleInspection: Line item records:', lineItemRecords)

          const { error: lineItemsError } = await supabase.from('inspection_line_items').insert(lineItemRecords)

          if (lineItemsError) {
            console.error('scheduleInspection: Line items insert error:', lineItemsError)
            throw new Error(`Failed to create inspection line items: ${lineItemsError.message}`)
          }

          console.log('scheduleInspection: Line items created successfully')
        }

        // Refetch to get full inspection
        console.log('scheduleInspection: Fetching fresh inspection data')
        const freshInspection = await fetchInspection(newInspection.id)
        if (freshInspection) {
          console.log('scheduleInspection: Success, adding to state')
          setInspections(prev => [freshInspection, ...prev])
        } else {
          console.log('scheduleInspection: Fresh inspection fetch returned null')
        }

        return freshInspection
      } catch (err: unknown) {
        // Log detailed error info
        console.error('scheduleInspection error:', {
          error: err,
          message: err instanceof Error ? err.message : 'Unknown error',
          // Supabase errors have code, message, details, hint
          code: (err as { code?: string })?.code,
          details: (err as { details?: string })?.details,
          hint: (err as { hint?: string })?.hint,
          stack: err instanceof Error ? err.stack : undefined,
        })

        const errorMessage = err instanceof Error
          ? err.message
          : (err as { message?: string })?.message || 'Failed to schedule inspection'
        setError(new Error(errorMessage))
        return null
      }
    },
    [supabase, fetchInspection]
  )

  // Schedule inspections for multiple POs, grouping by supplier + location
  const scheduleInspectionBatch = useCallback(
    async (
      poIds: string[],
      agentId: string | null,
      scheduledDate: string,
      notes?: string
    ): Promise<Inspection[]> => {
      try {
        console.log('scheduleInspectionBatch: Starting with poIds:', poIds)

        // Fetch all selected POs with supplier info and line items
        const { data: posData, error: posError } = await supabase
          .from('purchase_orders')
          .select(`
            id,
            po_number,
            supplier_id,
            supplier:suppliers(id, name, country, factory_location_id),
            po_line_items(*)
          `)
          .in('id', poIds)

        if (posError) {
          console.error('scheduleInspectionBatch: PO fetch error:', posError)
          throw new Error(`Failed to fetch purchase orders: ${posError.message}`)
        }

        if (!posData || posData.length === 0) {
          throw new Error('No purchase orders found')
        }

        console.log('scheduleInspectionBatch: Fetched POs:', posData.length)

        // Group POs by supplier_id + factory_location_id
        type POData = typeof posData[0]
        type SupplierData = { id: string; name: string; country?: string; factory_location_id?: string | null }

        const groups = new Map<string, { supplier: SupplierData; pos: POData[] }>()

        for (const po of posData) {
          const supplierData = po.supplier as SupplierData | SupplierData[] | null
          const supplier = supplierData
            ? (Array.isArray(supplierData) ? supplierData[0] : supplierData)
            : null

          if (!supplier) continue

          // Create grouping key: supplier_id + factory_location_id (null treated as empty string)
          const groupKey = `${supplier.id}:${supplier.factory_location_id || ''}`

          if (!groups.has(groupKey)) {
            groups.set(groupKey, { supplier, pos: [] })
          }
          groups.get(groupKey)!.pos.push(po)
        }

        console.log('scheduleInspectionBatch: Created groups:', groups.size)

        // Get agent name if assigned
        let agentName = 'Unassigned'
        if (agentId) {
          const { data: agentData } = await supabase
            .from('inspection_agents')
            .select('name')
            .eq('id', agentId)
            .single()
          if (agentData) {
            agentName = agentData.name
          }
        }

        const createdInspections: Inspection[] = []

        // Create one inspection per group
        for (const [groupKey, { supplier, pos }] of groups) {
          console.log(`scheduleInspectionBatch: Creating inspection for group ${groupKey} with ${pos.length} POs`)

          // Generate magic link token
          const magicLinkToken = nanoid(32)
          const magicLinkExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

          // Create inspection (purchase_order_id is null for multi-PO inspections)
          const { data: newInspection, error: insertError } = await supabase
            .from('inspections')
            .insert({
              purchase_order_id: null, // Multi-PO: use junction table
              purchase_order_number: null,
              supplier_name: supplier.name,
              scheduled_date: scheduledDate,
              agent_id: agentId || null,
              agent_name: agentName,
              status: 'scheduled' as const,
              notes: notes || null,
              magic_link_token: magicLinkToken,
              magic_link_expires_at: magicLinkExpiresAt,
            })
            .select()
            .single()

          if (insertError) {
            console.error('scheduleInspectionBatch: Insert error:', insertError)
            throw new Error(`Failed to create inspection: ${insertError.message}`)
          }

          console.log('scheduleInspectionBatch: Created inspection:', newInspection.id)

          // Insert into junction table for each PO
          const junctionRecords = pos.map(po => ({
            inspection_id: newInspection.id,
            purchase_order_id: po.id,
          }))

          const { error: junctionError } = await supabase
            .from('inspection_purchase_orders')
            .insert(junctionRecords)

          if (junctionError) {
            console.error('scheduleInspectionBatch: Junction insert error:', junctionError)
            throw new Error(`Failed to link POs to inspection: ${junctionError.message}`)
          }

          console.log('scheduleInspectionBatch: Linked POs to inspection')

          // Collect all line items from all POs in this group
          const allLineItems: { po_line_item_id: string; product_id: string | null; product_name: string; sku: string; quantity: number }[] = []
          for (const po of pos) {
            for (const li of (po.po_line_items || [])) {
              allLineItems.push({
                po_line_item_id: li.id,
                product_id: li.product_id || null,
                product_name: li.product_name,
                sku: li.sku,
                quantity: li.quantity,
              })
            }
          }

          console.log('scheduleInspectionBatch: Total line items:', allLineItems.length)

          if (allLineItems.length > 0) {
            const lineItemRecords = allLineItems.map((li, index) => ({
              inspection_id: newInspection.id,
              po_line_item_id: li.po_line_item_id,
              product_id: li.product_id,
              product_name: li.product_name,
              product_sku: li.sku,
              ordered_quantity: li.quantity,
              sort_order: index,
            }))

            const { error: lineItemsError } = await supabase
              .from('inspection_line_items')
              .insert(lineItemRecords)

            if (lineItemsError) {
              console.error('scheduleInspectionBatch: Line items insert error:', lineItemsError)
              throw new Error(`Failed to create inspection line items: ${lineItemsError.message}`)
            }

            console.log('scheduleInspectionBatch: Line items created successfully')
          }

          // Refetch to get full inspection with all relations
          const freshInspection = await fetchInspection(newInspection.id)
          if (freshInspection) {
            createdInspections.push(freshInspection)
          }
        }

        // Update local state
        if (createdInspections.length > 0) {
          setInspections(prev => [...createdInspections, ...prev])
        }

        console.log('scheduleInspectionBatch: Completed, created', createdInspections.length, 'inspections')
        return createdInspections
      } catch (err: unknown) {
        console.error('scheduleInspectionBatch error:', err)
        const errorMessage = err instanceof Error
          ? err.message
          : (err as { message?: string })?.message || 'Failed to schedule inspections'
        setError(new Error(errorMessage))
        return []
      }
    },
    [supabase, fetchInspection]
  )

  // Update inspection status
  const updateStatus = useCallback(
    async (id: string, newStatus: InspectionStatus, additionalData?: Partial<DbInspection>): Promise<boolean> => {
      try {
        const updateData: Record<string, unknown> = {
          status: newStatus,
          ...additionalData,
        }

        // Set dates based on status
        if (newStatus === 'confirmed' && !additionalData?.confirmed_date) {
          updateData.confirmed_date = new Date().toISOString().split('T')[0]
        }
        if (['passed', 'failed'].includes(newStatus) && !additionalData?.completed_date) {
          updateData.completed_date = new Date().toISOString().split('T')[0]
        }

        const { error: updateError } = await supabase.from('inspections').update(updateData).eq('id', id)

        if (updateError) throw updateError

        setInspections(prev =>
          prev.map(insp =>
            insp.id === id
              ? {
                  ...insp,
                  status: newStatus,
                  confirmedDate:
                    newStatus === 'confirmed' ? (updateData.confirmed_date as string) || insp.confirmedDate : insp.confirmedDate,
                  completedDate: ['passed', 'failed'].includes(newStatus)
                    ? (updateData.completed_date as string) || insp.completedDate
                    : insp.completedDate,
                }
              : insp
          )
        )

        return true
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to update status'))
        return false
      }
    },
    [supabase]
  )

  // Mark inspection as passed/failed
  const markResult = useCallback(
    async (id: string, result: 'pass' | 'fail'): Promise<boolean> => {
      const newStatus = result === 'pass' ? 'passed' : 'failed'
      return updateStatus(id, newStatus, { result })
    },
    [updateStatus]
  )

  // Send inspection request to agent (update status and send magic link)
  const sendToAgent = useCallback(
    async (id: string): Promise<boolean> => {
      return updateStatus(id, 'pending-confirmation')
    },
    [updateStatus]
  )

  // Confirm inspection (agent confirmed via magic link)
  const confirmInspection = useCallback(
    async (id: string, confirmedDate: string, invoiceAmount: number): Promise<boolean> => {
      return updateStatus(id, 'confirmed', {
        confirmed_date: confirmedDate,
        invoice_amount: invoiceAmount,
      })
    },
    [updateStatus]
  )

  // Mark as paid
  const markPaid = useCallback(
    async (id: string, invoiceId?: string): Promise<boolean> => {
      return updateStatus(id, 'paid', invoiceId ? { invoice_id: invoiceId } : undefined)
    },
    [updateStatus]
  )

  // Create rework request
  const createReworkRequest = useCallback(
    async (inspectionId: string, instructions: string): Promise<boolean> => {
      try {
        const { error: reworkError } = await supabase.from('rework_requests').insert({
          inspection_id: inspectionId,
          instructions,
          status: 'pending',
        })

        if (reworkError) throw reworkError

        // Update inspection status
        await updateStatus(inspectionId, 'pending-rework')

        // Refetch inspection to get updated data
        const freshInspection = await fetchInspection(inspectionId)
        if (freshInspection) {
          setInspections(prev => prev.map(insp => (insp.id === inspectionId ? freshInspection : insp)))
        }

        return true
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to create rework request'))
        return false
      }
    },
    [supabase, updateStatus, fetchInspection]
  )

  // Complete rework (mark rework as completed)
  const completeRework = useCallback(
    async (inspectionId: string): Promise<boolean> => {
      try {
        const { error: reworkError } = await supabase
          .from('rework_requests')
          .update({
            status: 'completed',
            completed_date: new Date().toISOString().split('T')[0],
          })
          .eq('inspection_id', inspectionId)
          .neq('status', 'completed')

        if (reworkError) throw reworkError

        // Refetch inspection
        const freshInspection = await fetchInspection(inspectionId)
        if (freshInspection) {
          setInspections(prev => prev.map(insp => (insp.id === inspectionId ? freshInspection : insp)))
        }

        return true
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to complete rework'))
        return false
      }
    },
    [supabase, fetchInspection]
  )

  // Schedule re-inspection
  const scheduleReinspection = useCallback(
    async (originalInspectionId: string, scheduledDate: string, agentId: string | null): Promise<Inspection | null> => {
      try {
        const originalInspection = inspections.find(i => i.id === originalInspectionId)
        if (!originalInspection) throw new Error('Original inspection not found')

        // Get agent name if assigned
        let agentName = 'Unassigned'
        if (agentId) {
          const { data: agentData } = await supabase
            .from('inspection_agents')
            .select('name')
            .eq('id', agentId)
            .single()
          if (agentData) {
            agentName = agentData.name
          }
        }

        // Generate new magic link
        const magicLinkToken = nanoid(32)
        const magicLinkExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

        // Create new inspection linked to original
        const { data: newInspection, error: inspectionError } = await supabase
          .from('inspections')
          .insert({
            purchase_order_id: originalInspection.purchaseOrderId,
            purchase_order_number: originalInspection.purchaseOrderNumber,
            supplier_name: originalInspection.supplierName,
            scheduled_date: scheduledDate,
            agent_id: agentId,
            agent_name: agentName,
            status: 're-inspection',
            original_inspection_id: originalInspectionId,
            magic_link_token: magicLinkToken,
            magic_link_expires_at: magicLinkExpiresAt,
          })
          .select()
          .single()

        if (inspectionError) throw inspectionError

        // Copy line items from original inspection
        const lineItemsToCreate = originalInspection.lineItems.map((li, index) => ({
          inspection_id: newInspection.id,
          po_line_item_id: li.poLineItemId || null,
          product_id: li.productId || null,
          product_name: li.productName,
          product_sku: li.productSku,
          ordered_quantity: li.orderedQuantity,
          sort_order: index,
        }))

        if (lineItemsToCreate.length > 0) {
          const { error: lineItemsError } = await supabase.from('inspection_line_items').insert(lineItemsToCreate)
          if (lineItemsError) throw lineItemsError
        }

        // Refetch to get full inspection
        const freshInspection = await fetchInspection(newInspection.id)
        if (freshInspection) {
          setInspections(prev => [freshInspection, ...prev])
        }

        return freshInspection
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to schedule re-inspection'))
        return null
      }
    },
    [supabase, inspections, fetchInspection]
  )

  // Delete inspection
  const deleteInspection = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase.from('inspections').delete().eq('id', id)

        if (error) throw error

        setInspections(prev => prev.filter(insp => insp.id !== id))
        return true
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to delete inspection'))
        return false
      }
    },
    [supabase]
  )

  // Send message
  const sendMessage = useCallback(
    async (inspectionId: string, content: string, direction: 'outbound' | 'note' = 'outbound'): Promise<boolean> => {
      try {
        const { error: messageError } = await supabase.from('inspection_messages').insert({
          inspection_id: inspectionId,
          direction,
          sender_name: 'System', // TODO: Get from auth
          content,
        })

        if (messageError) throw messageError

        // Refetch inspection to get updated messages
        const freshInspection = await fetchInspection(inspectionId)
        if (freshInspection) {
          setInspections(prev => prev.map(insp => (insp.id === inspectionId ? freshInspection : insp)))
        }

        return true
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to send message'))
        return false
      }
    },
    [supabase, fetchInspection]
  )

  // Compute summary
  const summary: InspectionSummary = useMemo(() => {
    const completedInspections = inspections.filter(i => i.status === 'passed' || i.status === 'failed')
    const avgDefectRate =
      completedInspections.length > 0
        ? completedInspections.reduce((sum, i) => sum + i.overallDefectRate, 0) / completedInspections.length
        : 0

    return {
      total: inspections.length,
      scheduled: inspections.filter(i => i.status === 'scheduled').length,
      pendingConfirmation: inspections.filter(i => i.status === 'pending-confirmation').length,
      confirmed: inspections.filter(i => i.status === 'confirmed').length,
      paid: inspections.filter(i => i.status === 'paid').length,
      inProgress: inspections.filter(i => i.status === 'in-progress').length,
      reportSubmitted: inspections.filter(i => i.status === 'report-submitted').length,
      passed: inspections.filter(i => i.status === 'passed').length,
      failed: inspections.filter(i => i.status === 'failed').length,
      pendingRework: inspections.filter(i => i.status === 'pending-rework').length,
      reInspection: inspections.filter(i => i.status === 're-inspection').length,
      avgDefectRate,
    }
  }, [inspections])

  // Initial fetch
  useEffect(() => {
    fetchInspections()
  }, [fetchInspections])

  return {
    inspections,
    summary,
    loading,
    error,
    refetch: fetchInspections,
    fetchInspection,
    scheduleInspection,
    scheduleInspectionBatch,
    updateStatus,
    markResult,
    sendToAgent,
    confirmInspection,
    markPaid,
    createReworkRequest,
    completeRework,
    scheduleReinspection,
    deleteInspection,
    sendMessage,
  }
}

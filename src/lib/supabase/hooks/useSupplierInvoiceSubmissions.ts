'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '../client'

// =============================================================================
// Types
// =============================================================================

export type SubmissionReviewStatus = 'pending' | 'approved' | 'rejected' | 'partially_approved'
export type AdditionalCostType = 'handling' | 'rush' | 'tooling' | 'shipping' | 'inspection' | 'packaging' | 'other'

export interface SubmissionLineItem {
  id: string
  submissionId: string
  poLineItemId: string
  productId: string | null
  productName: string
  sku: string
  quantity: number
  expectedUnitCost: number
  submittedUnitCost: number
  expectedLineTotal: number
  submittedLineTotal: number
  varianceAmount: number
  isApproved: boolean | null
  approvedUnitCost: number | null
  notes: string | null
  sortOrder: number
}

export interface SubmissionAdditionalCost {
  id: string
  submissionId: string
  costType: AdditionalCostType
  description: string
  amount: number
  isApproved: boolean | null
  approvedAmount: number | null
  sortOrder: number
}

export interface SupplierInvoiceSubmission {
  id: string
  magicLinkId: string
  purchaseOrderId: string
  poNumber: string
  supplierId: string | null
  supplierName: string
  submittedByName: string
  submittedByEmail: string
  submittedAt: string
  expectedTotal: number
  submittedTotal: number
  varianceAmount: number
  variancePercentage: number
  reviewStatus: SubmissionReviewStatus
  reviewedByUserId: string | null
  reviewedByUserName: string | null
  reviewedAt: string | null
  reviewNotes: string | null
  supplierNotes: string | null
  // Revision tracking
  revisionNumber: number
  previousSubmissionId: string | null
  lineItems?: SubmissionLineItem[]
  additionalCosts?: SubmissionAdditionalCost[]
}

export interface SubmissionsSummary {
  pendingReview: number
  approved: number
  rejected: number
  partiallyApproved: number
  pendingVarianceTotal: number
}

// =============================================================================
// Database Row Types
// =============================================================================

interface DbSubmissionRow {
  id: string
  magic_link_id: string
  purchase_order_id: string
  po_number: string
  supplier_id: string | null
  supplier_name: string
  submitted_by_name: string
  submitted_by_email: string
  submitted_at: string
  expected_total: number
  submitted_total: number
  variance_amount: number
  variance_percentage: number
  review_status: SubmissionReviewStatus
  reviewed_by_user_id: string | null
  reviewed_by_user_name: string | null
  reviewed_at: string | null
  review_notes: string | null
  supplier_notes: string | null
  // Revision tracking
  revision_number: number
  previous_submission_id: string | null
}

interface DbSubmissionLineItemRow {
  id: string
  submission_id: string
  po_line_item_id: string
  product_id: string | null
  product_name: string
  sku: string
  quantity: number
  expected_unit_cost: number
  submitted_unit_cost: number
  expected_line_total: number
  submitted_line_total: number
  variance_amount: number
  is_approved: boolean | null
  approved_unit_cost: number | null
  notes: string | null
  sort_order: number
}

interface DbSubmissionCostRow {
  id: string
  submission_id: string
  cost_type: AdditionalCostType
  description: string
  amount: number
  is_approved: boolean | null
  approved_amount: number | null
  sort_order: number
}

// =============================================================================
// Constants
// =============================================================================

export const REVIEW_STATUS_OPTIONS: { id: SubmissionReviewStatus; label: string }[] = [
  { id: 'pending', label: 'Pending Review' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'partially_approved', label: 'Partially Approved' },
]

export const COST_TYPE_OPTIONS: { id: AdditionalCostType; label: string }[] = [
  { id: 'handling', label: 'Handling' },
  { id: 'rush', label: 'Rush Fee' },
  { id: 'tooling', label: 'Tooling' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'inspection', label: 'Inspection' },
  { id: 'packaging', label: 'Packaging' },
  { id: 'other', label: 'Other' },
]

// =============================================================================
// Transform Functions
// =============================================================================

function transformSubmission(row: DbSubmissionRow): SupplierInvoiceSubmission {
  return {
    id: row.id,
    magicLinkId: row.magic_link_id,
    purchaseOrderId: row.purchase_order_id,
    poNumber: row.po_number,
    supplierId: row.supplier_id,
    supplierName: row.supplier_name,
    submittedByName: row.submitted_by_name,
    submittedByEmail: row.submitted_by_email,
    submittedAt: row.submitted_at,
    expectedTotal: row.expected_total,
    submittedTotal: row.submitted_total,
    varianceAmount: row.variance_amount,
    variancePercentage: row.variance_percentage,
    reviewStatus: row.review_status,
    reviewedByUserId: row.reviewed_by_user_id,
    reviewedByUserName: row.reviewed_by_user_name,
    reviewedAt: row.reviewed_at,
    reviewNotes: row.review_notes,
    supplierNotes: row.supplier_notes,
    revisionNumber: row.revision_number ?? 1,
    previousSubmissionId: row.previous_submission_id,
  }
}

function transformLineItem(row: DbSubmissionLineItemRow): SubmissionLineItem {
  return {
    id: row.id,
    submissionId: row.submission_id,
    poLineItemId: row.po_line_item_id,
    productId: row.product_id,
    productName: row.product_name,
    sku: row.sku,
    quantity: row.quantity,
    expectedUnitCost: row.expected_unit_cost,
    submittedUnitCost: row.submitted_unit_cost,
    expectedLineTotal: row.expected_line_total,
    submittedLineTotal: row.submitted_line_total,
    varianceAmount: row.variance_amount,
    isApproved: row.is_approved,
    approvedUnitCost: row.approved_unit_cost,
    notes: row.notes,
    sortOrder: row.sort_order,
  }
}

function transformCost(row: DbSubmissionCostRow): SubmissionAdditionalCost {
  return {
    id: row.id,
    submissionId: row.submission_id,
    costType: row.cost_type,
    description: row.description,
    amount: row.amount,
    isApproved: row.is_approved,
    approvedAmount: row.approved_amount,
    sortOrder: row.sort_order,
  }
}

// =============================================================================
// Hook
// =============================================================================

export function useSupplierInvoiceSubmissions(initialStatusFilter?: SubmissionReviewStatus[]) {
  const [submissions, setSubmissions] = useState<SupplierInvoiceSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [statusFilter, setStatusFilter] = useState<SubmissionReviewStatus[]>(initialStatusFilter || [])

  const supabase = createClient()

  // Fetch submissions
  const fetchSubmissions = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('supplier_invoice_submissions')
        .select('*')
        .order('submitted_at', { ascending: false })

      if (statusFilter.length > 0) {
        query = query.in('review_status', statusFilter)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        const isTableMissing = fetchError.code === '42P01' ||
          fetchError.message?.includes('relation') ||
          fetchError.message?.includes('does not exist')

        if (isTableMissing) {
          console.warn('Supplier invoice submissions table not found. Run migrations.')
          setSubmissions([])
          return
        }
        throw fetchError
      }

      setSubmissions((data || []).map(transformSubmission))
    } catch (err) {
      console.error('Fetch submissions error:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch submissions'))
    } finally {
      setLoading(false)
    }
  }, [supabase, statusFilter])

  // Fetch single submission with details
  const fetchSubmission = useCallback(async (id: string): Promise<SupplierInvoiceSubmission | null> => {
    try {
      const { data: submissionData, error: submissionError } = await supabase
        .from('supplier_invoice_submissions')
        .select('*')
        .eq('id', id)
        .single()

      if (submissionError) throw submissionError

      const { data: lineItemsData, error: lineItemsError } = await supabase
        .from('supplier_invoice_submission_line_items')
        .select('*')
        .eq('submission_id', id)
        .order('sort_order', { ascending: true })

      if (lineItemsError) throw lineItemsError

      const { data: costsData, error: costsError } = await supabase
        .from('supplier_invoice_submission_costs')
        .select('*')
        .eq('submission_id', id)
        .order('sort_order', { ascending: true })

      if (costsError) throw costsError

      const submission = transformSubmission(submissionData)
      submission.lineItems = (lineItemsData || []).map(transformLineItem)
      submission.additionalCosts = (costsData || []).map(transformCost)

      return submission
    } catch (err) {
      console.error('Failed to fetch submission:', err)
      return null
    }
  }, [supabase])

  // Approve line item
  const approveLineItem = useCallback(async (
    lineItemId: string,
    approvedUnitCost?: number
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('supplier_invoice_submission_line_items')
        .update({
          is_approved: true,
          approved_unit_cost: approvedUnitCost || null,
        })
        .eq('id', lineItemId)

      if (updateError) throw updateError
      return true
    } catch (err) {
      console.error('Failed to approve line item:', err)
      return false
    }
  }, [supabase])

  // Reject line item
  const rejectLineItem = useCallback(async (lineItemId: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('supplier_invoice_submission_line_items')
        .update({ is_approved: false })
        .eq('id', lineItemId)

      if (updateError) throw updateError
      return true
    } catch (err) {
      console.error('Failed to reject line item:', err)
      return false
    }
  }, [supabase])

  // Approve additional cost
  const approveCost = useCallback(async (
    costId: string,
    approvedAmount?: number
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('supplier_invoice_submission_costs')
        .update({
          is_approved: true,
          approved_amount: approvedAmount || null,
        })
        .eq('id', costId)

      if (updateError) throw updateError
      return true
    } catch (err) {
      console.error('Failed to approve cost:', err)
      return false
    }
  }, [supabase])

  // Reject additional cost
  const rejectCost = useCallback(async (costId: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('supplier_invoice_submission_costs')
        .update({ is_approved: false })
        .eq('id', costId)

      if (updateError) throw updateError
      return true
    } catch (err) {
      console.error('Failed to reject cost:', err)
      return false
    }
  }, [supabase])

  // Complete review (approve/reject/partial)
  const completeReview = useCallback(async (
    submissionId: string,
    status: SubmissionReviewStatus,
    reviewNotes: string,
    userId?: string,
    userName?: string
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('supplier_invoice_submissions')
        .update({
          review_status: status,
          reviewed_by_user_id: userId || null,
          reviewed_by_user_name: userName || null,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
        })
        .eq('id', submissionId)

      if (updateError) throw updateError

      // If approved, apply to PO
      if (status === 'approved' || status === 'partially_approved') {
        const { error: applyError } = await supabase
          .rpc('apply_submission_to_po', { submission_id: submissionId })

        if (applyError) {
          console.error('Failed to apply submission to PO:', applyError)
          // Don't fail the whole operation, just log
        }
      }

      // Update local state
      setSubmissions(prev =>
        prev.map(s =>
          s.id === submissionId
            ? {
                ...s,
                reviewStatus: status,
                reviewedByUserId: userId || null,
                reviewedByUserName: userName || null,
                reviewedAt: new Date().toISOString(),
                reviewNotes: reviewNotes || null,
              }
            : s
        )
      )

      return true
    } catch (err) {
      console.error('Failed to complete review:', err)
      return false
    }
  }, [supabase])

  // Reject for revision - creates new magic link with rejection notes
  const rejectForRevision = useCallback(async (
    submissionId: string,
    rejectionNotes: string,
    userId?: string,
    userName?: string
  ): Promise<{ success: boolean; magicLinkUrl?: string; error?: string }> => {
    try {
      // First, update the submission status to rejected
      const { error: updateError } = await supabase
        .from('supplier_invoice_submissions')
        .update({
          review_status: 'rejected',
          reviewed_by_user_id: userId || null,
          reviewed_by_user_name: userName || null,
          reviewed_at: new Date().toISOString(),
          review_notes: rejectionNotes,
        })
        .eq('id', submissionId)

      if (updateError) throw updateError

      // Call the database function to create a new magic link
      const { data, error: rpcError } = await supabase
        .rpc('create_revision_magic_link', {
          p_submission_id: submissionId,
          p_rejection_notes: rejectionNotes,
        })

      if (rpcError) throw rpcError

      if (!data || data.length === 0) {
        throw new Error('Failed to create revision magic link')
      }

      const { new_token, new_revision_number } = data[0]

      // Build the magic link URL
      const baseUrl = typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || ''
      const magicLinkUrl = `${baseUrl}/forms/invoice/${new_token}`

      // Update local state
      setSubmissions(prev =>
        prev.map(s =>
          s.id === submissionId
            ? {
                ...s,
                reviewStatus: 'rejected' as SubmissionReviewStatus,
                reviewedByUserId: userId || null,
                reviewedByUserName: userName || null,
                reviewedAt: new Date().toISOString(),
                reviewNotes: rejectionNotes,
              }
            : s
        )
      )

      return {
        success: true,
        magicLinkUrl,
      }
    } catch (err) {
      console.error('Failed to reject for revision:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create revision link',
      }
    }
  }, [supabase])

  // Summary computed from local data
  const summary = useMemo<SubmissionsSummary>(() => ({
    pendingReview: submissions.filter(s => s.reviewStatus === 'pending').length,
    approved: submissions.filter(s => s.reviewStatus === 'approved').length,
    rejected: submissions.filter(s => s.reviewStatus === 'rejected').length,
    partiallyApproved: submissions.filter(s => s.reviewStatus === 'partially_approved').length,
    pendingVarianceTotal: submissions
      .filter(s => s.reviewStatus === 'pending')
      .reduce((sum, s) => sum + s.varianceAmount, 0),
  }), [submissions])

  // Initial fetch
  useEffect(() => {
    fetchSubmissions()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch when filter changes
  useEffect(() => {
    fetchSubmissions()
  }, [statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    submissions,
    loading,
    error,
    summary,
    statusFilter,
    setStatusFilter,
    reviewStatusOptions: REVIEW_STATUS_OPTIONS,
    costTypeOptions: COST_TYPE_OPTIONS,
    fetchSubmission,
    approveLineItem,
    rejectLineItem,
    approveCost,
    rejectCost,
    completeReview,
    rejectForRevision,
    refetch: fetchSubmissions,
  }
}

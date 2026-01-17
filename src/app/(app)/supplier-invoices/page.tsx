'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useEffect } from 'react'
import { useSupplierInvoiceSubmissions, type SupplierInvoiceSubmission, type SubmissionReviewStatus } from '@/lib/supabase/hooks'
import { SubmissionsReviewView, SubmissionReviewPanel } from '@/sections/supplier-submissions/components'

export default function SupplierInvoicesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedSubmission, setSelectedSubmission] = useState<SupplierInvoiceSubmission | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [returnUrl, setReturnUrl] = useState<string | null>(null)

  const {
    submissions,
    loading,
    error,
    summary,
    statusFilter,
    setStatusFilter,
    fetchSubmission,
    approveLineItem,
    rejectLineItem,
    approveCost,
    rejectCost,
    completeReview,
    rejectForRevision,
    refetch,
  } = useSupplierInvoiceSubmissions()

  // Handle view submission details
  const handleViewSubmission = useCallback(async (id: string) => {
    setDetailLoading(true)
    try {
      const submission = await fetchSubmission(id)
      if (submission) {
        setSelectedSubmission(submission)
      }
    } finally {
      setDetailLoading(false)
    }
  }, [fetchSubmission])

  // Handle URL params for deep linking
  useEffect(() => {
    const poId = searchParams.get('poId')
    const returnUrlParam = searchParams.get('returnUrl')

    if (returnUrlParam) {
      setReturnUrl(returnUrlParam)
    }

    // If poId is provided, find and open the submission for that PO
    if (poId && submissions.length > 0 && !selectedSubmission) {
      const submission = submissions.find(s => s.purchaseOrderId === poId)
      if (submission) {
        handleViewSubmission(submission.id)
      }
    }
  }, [searchParams, submissions, selectedSubmission, handleViewSubmission])

  // Handle close detail panel
  const handleCloseDetail = useCallback(() => {
    setSelectedSubmission(null)
    // If there's a return URL, navigate back to it
    if (returnUrl) {
      router.push(returnUrl)
      setReturnUrl(null)
    }
  }, [returnUrl, router])

  // Handle view PO
  const handleViewPO = useCallback((poId: string) => {
    router.push(`/purchase-orders/${poId}`)
  }, [router])

  // Handle complete review
  const handleCompleteReview = useCallback(async (
    status: SubmissionReviewStatus,
    notes: string
  ) => {
    if (!selectedSubmission) return false

    const success = await completeReview(
      selectedSubmission.id,
      status,
      notes
    )

    if (success) {
      refetch()
    }

    return success
  }, [selectedSubmission, completeReview, refetch])

  // Handle reject for revision
  const handleRejectForRevision = useCallback(async (notes: string) => {
    if (!selectedSubmission) {
      return { success: false, error: 'No submission selected' }
    }

    const result = await rejectForRevision(selectedSubmission.id, notes)

    if (result.success) {
      refetch()
    }

    return result
  }, [selectedSubmission, rejectForRevision, refetch])

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400">Failed to load submissions</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <SubmissionsReviewView
        submissions={submissions}
        summary={summary}
        isLoading={loading}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onViewSubmission={handleViewSubmission}
        onViewPO={handleViewPO}
      />

      {/* Review Panel */}
      {selectedSubmission && (
        <SubmissionReviewPanel
          submission={selectedSubmission}
          isLoading={detailLoading}
          onClose={handleCloseDetail}
          onApproveLineItem={approveLineItem}
          onRejectLineItem={rejectLineItem}
          onApproveCost={approveCost}
          onRejectCost={rejectCost}
          onCompleteReview={handleCompleteReview}
          onRejectForRevision={handleRejectForRevision}
          onViewPO={() => handleViewPO(selectedSubmission.purchaseOrderId)}
        />
      )}
    </>
  )
}

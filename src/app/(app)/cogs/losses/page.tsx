'use client'

import { useInventoryLosses } from '@/lib/supabase/hooks'
import { InventoryLossesView } from '@/sections/cogs'

export default function InventoryLossesPage() {
  const {
    losses,
    summary,
    pendingReimbursements,
    isLoading,
    error,
    fetchLosses,
    createLoss,
    updateLoss,
    recordReimbursement,
    deleteLoss,
  } = useInventoryLosses()

  return (
    <InventoryLossesView
      losses={losses}
      summary={summary}
      pendingReimbursements={pendingReimbursements}
      isLoading={isLoading}
      error={error}
      onCreateLoss={createLoss}
      onUpdateLoss={updateLoss}
      onDeleteLoss={deleteLoss}
      onRecordReimbursement={recordReimbursement}
      onRefresh={fetchLosses}
    />
  )
}

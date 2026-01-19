'use client'

import { useAmazonFees } from '@/lib/supabase/hooks'
import { AmazonFeesView } from '@/sections/cogs'

export default function AmazonFeesPage() {
  const {
    fees,
    summary,
    feesByType,
    feesByMonth,
    isLoading,
    error,
    fetchFees,
    createFee,
    createFeesBatch,
    updateFee,
    deleteFee,
  } = useAmazonFees()

  return (
    <AmazonFeesView
      fees={fees}
      summary={summary}
      feesByType={feesByType}
      feesByMonth={feesByMonth}
      isLoading={isLoading}
      error={error}
      onCreateFee={createFee}
      onCreateFeesBatch={createFeesBatch}
      onUpdateFee={updateFee}
      onDeleteFee={deleteFee}
      onRefresh={fetchFees}
    />
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { WorkOrderDetail } from '@/sections/assembly/WorkOrderDetail'
import { useWorkOrders } from '@/lib/supabase/hooks/useWorkOrders'
import type { WorkOrder, WorkOrderStatus } from '@/lib/supabase/hooks/useWorkOrders'

export default function WorkOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const {
    fetchWorkOrder,
    updateStatus,
    completeWorkOrder,
    cancelWorkOrder,
    addCost,
  } = useWorkOrders()

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const wo = await fetchWorkOrder(id)
      setWorkOrder(wo)
      setLoading(false)
    }
    load()
  }, [id, fetchWorkOrder])

  const handleStatusChange = useCallback(async (status: WorkOrderStatus, note?: string) => {
    if (!workOrder) return
    await updateStatus(workOrder.id, status, note)
    const updated = await fetchWorkOrder(workOrder.id)
    setWorkOrder(updated)
  }, [workOrder, updateStatus, fetchWorkOrder])

  const handleStart = useCallback(async () => {
    if (!workOrder) return
    await updateStatus(workOrder.id, 'in_progress')
    const updated = await fetchWorkOrder(workOrder.id)
    setWorkOrder(updated)
  }, [workOrder, updateStatus, fetchWorkOrder])

  const handleComplete = useCallback(async (actualOutput: number, scrap: number) => {
    if (!workOrder) return
    await completeWorkOrder(workOrder.id, actualOutput, scrap)
    const updated = await fetchWorkOrder(workOrder.id)
    setWorkOrder(updated)
  }, [workOrder, completeWorkOrder, fetchWorkOrder])

  const handleCancel = useCallback(async (reason?: string) => {
    if (!workOrder) return
    await cancelWorkOrder(workOrder.id, reason)
    const updated = await fetchWorkOrder(workOrder.id)
    setWorkOrder(updated)
  }, [workOrder, cancelWorkOrder, fetchWorkOrder])

  const handleAddCost = useCallback(async (
    costType: 'kitting_per_unit' | 'kitting_flat' | 'assembly_per_unit' | 'assembly_flat' | 'packaging' | 'labor' | 'other',
    description: string,
    amount: number,
    isPerUnit: boolean,
    perUnitRate?: number,
    quantity?: number
  ) => {
    if (!workOrder) return
    await addCost(workOrder.id, {
      costType,
      description,
      amount,
      isPerUnit,
      perUnitRate,
      quantity,
    })
    const updated = await fetchWorkOrder(workOrder.id)
    setWorkOrder(updated)
  }, [workOrder, addCost, fetchWorkOrder])

  const handleBack = useCallback(() => {
    router.push('/assembly/work-orders')
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!workOrder) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
          Work Order Not Found
        </h2>
        <button
          onClick={handleBack}
          className="text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Back to Work Orders
        </button>
      </div>
    )
  }

  return (
    <WorkOrderDetail
      workOrder={workOrder}
      onBack={handleBack}
      onStatusChange={handleStatusChange}
      onStart={handleStart}
      onComplete={handleComplete}
      onCancel={handleCancel}
      onAddCost={handleAddCost}
    />
  )
}

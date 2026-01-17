'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { WorkOrderList } from '@/sections/assembly/WorkOrderList'
import { WorkOrderFormModal } from '@/sections/assembly/WorkOrderFormModal'
import { useWorkOrders } from '@/lib/supabase/hooks/useWorkOrders'
import { useBOMs } from '@/lib/supabase/hooks/useBOMs'
import { useLocations } from '@/lib/supabase/hooks/useLocations'
import type { WorkOrderFormData } from '@/lib/supabase/hooks/useWorkOrders'

export default function WorkOrdersPage() {
  const router = useRouter()
  const {
    workOrders,
    loading,
    createWorkOrder,
    updateWorkOrder,
    updateStatus,
    fetchWorkOrders,
  } = useWorkOrders()

  const { boms, fetchBOMs } = useBOMs()
  const { locations } = useLocations()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingWorkOrderId, setEditingWorkOrderId] = useState<string | null>(null)

  const handleCreate = useCallback(() => {
    setEditingWorkOrderId(null)
    setIsFormOpen(true)
  }, [])

  const handleEdit = useCallback((id: string) => {
    setEditingWorkOrderId(id)
    setIsFormOpen(true)
  }, [])

  const handleView = useCallback((id: string) => {
    router.push(`/assembly/work-orders/${id}`)
  }, [router])

  const handleFormSubmit = useCallback(async (data: WorkOrderFormData) => {
    if (editingWorkOrderId) {
      await updateWorkOrder(editingWorkOrderId, data)
    } else {
      await createWorkOrder(data)
    }
    setIsFormOpen(false)
    setEditingWorkOrderId(null)
    await fetchWorkOrders()
  }, [editingWorkOrderId, createWorkOrder, updateWorkOrder, fetchWorkOrders])

  const handleFormCancel = useCallback(() => {
    setIsFormOpen(false)
    setEditingWorkOrderId(null)
  }, [])

  const editingWorkOrder = editingWorkOrderId
    ? workOrders.find(wo => wo.id === editingWorkOrderId)
    : undefined

  return (
    <div className="h-full flex flex-col">
      <WorkOrderList
        workOrders={workOrders}
        loading={loading}
        onCreateWorkOrder={handleCreate}
        onEditWorkOrder={handleEdit}
        onViewWorkOrder={handleView}
        onRefresh={() => fetchWorkOrders()}
      />

      {isFormOpen && (
        <WorkOrderFormModal
          workOrder={editingWorkOrder}
          boms={boms}
          locations={locations}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  )
}

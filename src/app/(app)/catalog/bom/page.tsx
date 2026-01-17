'use client'

import { useState, useCallback } from 'react'
import { BOMList } from '@/sections/catalog/BOMList'
import { BOMFormModal } from '@/sections/catalog/BOMFormModal'
import { useBOMs } from '@/lib/supabase/hooks/useBOMs'
import type { BOMFormData } from '@/lib/supabase/hooks/useBOMs'

export default function BOMsPage() {
  const {
    boms,
    loading,
    error,
    fetchBOMs,
    createBOM,
    updateBOM,
    archiveBOM,
    fetchFinishedGoods,
    fetchComponents,
  } = useBOMs()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBomId, setEditingBomId] = useState<string | null>(null)

  const handleCreate = useCallback(() => {
    setEditingBomId(null)
    setIsFormOpen(true)
  }, [])

  const handleEdit = useCallback((id: string) => {
    setEditingBomId(id)
    setIsFormOpen(true)
  }, [])

  const handleArchive = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to archive this BOM? It will no longer be available for work orders.')) {
      await archiveBOM(id)
    }
  }, [archiveBOM])

  const handleFormSubmit = useCallback(async (data: BOMFormData) => {
    if (editingBomId) {
      await updateBOM(editingBomId, data)
    } else {
      await createBOM(data)
    }
    setIsFormOpen(false)
    setEditingBomId(null)
    await fetchBOMs()
  }, [editingBomId, createBOM, updateBOM, fetchBOMs])

  const handleFormCancel = useCallback(() => {
    setIsFormOpen(false)
    setEditingBomId(null)
  }, [])

  const editingBom = editingBomId ? boms.find(b => b.id === editingBomId) : undefined

  return (
    <div className="h-full flex flex-col">
      <BOMList
        boms={boms}
        loading={loading}
        onCreateBOM={handleCreate}
        onEditBOM={handleEdit}
        onArchiveBOM={handleArchive}
        onRefresh={() => fetchBOMs()}
      />

      {isFormOpen && (
        <BOMFormModal
          bom={editingBom}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          fetchFinishedGoods={fetchFinishedGoods}
          fetchComponents={fetchComponents}
        />
      )}
    </div>
  )
}

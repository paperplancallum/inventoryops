'use client'

import { useState, useCallback } from 'react'
import { SuppliersView, SupplierForm } from '@/sections/suppliers'
import { useSuppliers, useLocations, usePaymentTermsTemplates } from '@/lib/supabase/hooks'
import type { Supplier, SupplierFormData } from '@/sections/suppliers/types'

export default function SuppliersPage() {
  const {
    suppliers,
    loading: suppliersLoading,
    createSupplier,
    updateSupplier,
    archiveSupplier,
    deleteSupplier,
    refetch: refetchSuppliers,
  } = useSuppliers()

  const { factoryOptions, loading: locationsLoading } = useLocations('factory')
  const { templates, loading: templatesLoading } = usePaymentTermsTemplates()

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>()

  // Handler: View supplier details
  const handleViewSupplier = useCallback((id: string) => {
    const supplier = suppliers.find(s => s.id === id)
    if (supplier) {
      setEditingSupplier(supplier)
      setShowForm(true)
    }
  }, [suppliers])

  // Handler: Create new supplier
  const handleCreateSupplier = useCallback(() => {
    setEditingSupplier(undefined)
    setShowForm(true)
  }, [])

  // Handler: Edit supplier
  const handleEditSupplier = useCallback((id: string) => {
    const supplier = suppliers.find(s => s.id === id)
    if (supplier) {
      setEditingSupplier(supplier)
      setShowForm(true)
    }
  }, [suppliers])

  // Handler: Delete or archive supplier
  const handleDeleteSupplier = useCallback(async (id: string) => {
    const supplier = suppliers.find(s => s.id === id)
    if (!supplier) return

    if (supplier.productCount > 0) {
      // Has products - archive instead
      if (confirm(`"${supplier.name}" has ${supplier.productCount} products linked. Archive this supplier instead?`)) {
        await archiveSupplier(id)
      }
    } else {
      // No products - can delete
      if (confirm(`Are you sure you want to delete "${supplier.name}"?`)) {
        await deleteSupplier(id)
      }
    }
  }, [suppliers, archiveSupplier, deleteSupplier])

  // Handler: Form submit
  const handleFormSubmit = useCallback(async (data: SupplierFormData) => {
    if (editingSupplier) {
      await updateSupplier(editingSupplier.id, data)
    } else {
      await createSupplier(data)
    }
    setShowForm(false)
    setEditingSupplier(undefined)
  }, [editingSupplier, createSupplier, updateSupplier])

  // Handler: Form cancel
  const handleFormCancel = useCallback(() => {
    setShowForm(false)
    setEditingSupplier(undefined)
  }, [])

  // Loading state
  if (suppliersLoading || locationsLoading || templatesLoading) {
    return (
      <div className="min-h-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading suppliers...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <SuppliersView
        suppliers={suppliers}
        onViewSupplier={handleViewSupplier}
        onEditSupplier={handleEditSupplier}
        onDeleteSupplier={handleDeleteSupplier}
        onCreateSupplier={handleCreateSupplier}
        onRefresh={refetchSuppliers}
        loading={suppliersLoading}
      />

      {showForm && (
        <SupplierForm
          supplier={editingSupplier}
          paymentTermsTemplates={templates}
          factoryLocations={factoryOptions}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
    </>
  )
}

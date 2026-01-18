'use client'

import { useState, useCallback } from 'react'
import { useBrands, type Brand } from '@/lib/supabase/hooks/useBrands'
import { BrandsView, BrandForm, type BrandFormData } from '@/sections/brands'

export default function BrandsPage() {
  const { brands, loading, createBrand, updateBrand, deleteBrand, refetch } = useBrands()

  const [showForm, setShowForm] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | undefined>()
  const [formLoading, setFormLoading] = useState(false)

  const handleCreate = useCallback(() => {
    setEditingBrand(undefined)
    setShowForm(true)
  }, [])

  const handleEdit = useCallback(
    (id: string) => {
      const brand = brands.find((b) => b.id === id)
      if (brand) {
        setEditingBrand(brand)
        setShowForm(true)
      }
    },
    [brands]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      const brand = brands.find((b) => b.id === id)
      if (!brand) return

      const confirmed = window.confirm(
        `Are you sure you want to delete "${brand.name}"? This action cannot be undone.`
      )
      if (confirmed) {
        await deleteBrand(id)
      }
    },
    [brands, deleteBrand]
  )

  const handleFormSubmit = useCallback(
    async (data: BrandFormData) => {
      setFormLoading(true)
      try {
        if (editingBrand) {
          await updateBrand(editingBrand.id, {
            name: data.name,
            description: data.description || null,
          })
        } else {
          await createBrand({ name: data.name, description: data.description || null })
        }
        setShowForm(false)
        setEditingBrand(undefined)
      } finally {
        setFormLoading(false)
      }
    },
    [editingBrand, createBrand, updateBrand]
  )

  const handleFormCancel = useCallback(() => {
    setShowForm(false)
    setEditingBrand(undefined)
  }, [])

  return (
    <>
      <BrandsView
        brands={brands}
        loading={loading}
        onCreateBrand={handleCreate}
        onEditBrand={handleEdit}
        onDeleteBrand={handleDelete}
        onRefresh={refetch}
      />
      {showForm && (
        <BrandForm
          brand={editingBrand}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          loading={formLoading}
        />
      )}
    </>
  )
}

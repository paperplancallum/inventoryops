'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Upload, Trash2, Check, Image } from 'lucide-react'
import type { Brand, AmazonConnection } from './types'
import type { BrandFormData } from '@/lib/supabase/hooks/useBrands'

interface BrandFormModalProps {
  brand?: Brand | null
  amazonConnections: AmazonConnection[]
  isOpen: boolean
  uploading?: boolean
  onClose: () => void
  onSave: (data: BrandFormData & { removeLogo?: boolean }) => Promise<void>
}

export function BrandFormModal({
  brand,
  amazonConnections,
  isOpen,
  uploading,
  onClose,
  onSave,
}: BrandFormModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedConnections, setSelectedConnections] = useState<string[]>([])
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [removeLogo, setRemoveLogo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditing = !!brand

  // Reset form when brand changes
  useEffect(() => {
    if (brand) {
      setName(brand.name)
      setDescription(brand.description || '')
      setSelectedConnections(brand.amazonConnectionIds)
      setLogoPreview(brand.logoUrl)
      setLogoFile(null)
      setRemoveLogo(false)
    } else {
      setName('')
      setDescription('')
      setSelectedConnections([])
      setLogoPreview(null)
      setLogoFile(null)
      setRemoveLogo(false)
    }
    setError(null)
  }, [brand])

  if (!isOpen) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Logo must be less than 5MB')
      return
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      setError('Logo must be PNG, JPEG, GIF, WebP, or SVG')
      return
    }

    setLogoFile(file)
    setRemoveLogo(false)
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    setRemoveLogo(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const toggleConnection = (id: string) => {
    setSelectedConnections((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Brand name is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || null,
        amazonConnectionIds: selectedConnections,
        logoFile: logoFile || undefined,
        removeLogo,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save brand')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {isEditing ? 'Edit Brand' : 'Create Brand'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Error message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Logo upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Brand Logo
              </label>
              <div className="flex items-start gap-4">
                {/* Preview */}
                <div className="h-20 w-20 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-600">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                  ) : (
                    <Image className="h-8 w-8 text-slate-400" />
                  )}
                </div>

                {/* Upload/Remove buttons */}
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    {logoPreview ? 'Change' : 'Upload'}
                  </button>
                  {logoPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    PNG, JPG, GIF, WebP or SVG. Max 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Name input */}
            <div>
              <label htmlFor="brand-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Brand Name <span className="text-red-500">*</span>
              </label>
              <input
                id="brand-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter brand name"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            {/* Description input */}
            <div>
              <label htmlFor="brand-description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description
              </label>
              <textarea
                id="brand-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Amazon Connections */}
            {amazonConnections.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Sold via Amazon Accounts
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Select which Amazon accounts sell this brand
                </p>
                <div className="space-y-2">
                  {amazonConnections.map((connection) => {
                    const isSelected = selectedConnections.includes(connection.id)
                    return (
                      <button
                        key={connection.id}
                        type="button"
                        onClick={() => toggleConnection(connection.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                        }`}
                      >
                        <span className={`text-sm font-medium ${isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-700 dark:text-slate-300'}`}>
                          {connection.sellerName || 'Amazon Account'}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-indigo-500 text-white'
                              : 'border-2 border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {saving || uploading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Brand'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

'use client'

import { useState, useRef } from 'react'
import { Upload, Image as ImageIcon, X, Loader2, AlertCircle, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ProductImageUploadProps {
  productId: string
  productName: string
  currentImageUrl?: string | null
  currentStoragePath?: string | null
  onUpload: (imageUrl: string, storagePath: string) => void
  onRemove: () => void
  size?: 'sm' | 'md' | 'lg'
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function ProductImageUpload({
  productId,
  productName,
  currentImageUrl,
  currentStoragePath,
  onUpload,
  onRemove,
  size = 'md'
}: ProductImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Only JPEG, PNG, WebP, or GIF images are accepted'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB'
    }
    return null
  }

  const handleFileSelect = async (selectedFile: File) => {
    setError(null)

    const validationError = validateFile(selectedFile)
    if (validationError) {
      setError(validationError)
      return
    }

    setUploading(true)

    try {
      // Remove existing image if present
      if (currentStoragePath) {
        await supabase.storage
          .from('product-images')
          .remove([currentStoragePath])
      }

      // Generate unique filename
      const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const storagePath = `${productId}/${Date.now()}-${sanitizedName}`

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(storagePath, selectedFile, {
          contentType: selectedFile.type,
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(storagePath)

      onUpload(urlData.publicUrl, storagePath)
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const openDeleteModal = () => {
    setConfirmText('')
    setShowDeleteModal(true)
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setConfirmText('')
  }

  const handleConfirmDelete = async () => {
    if (confirmText !== productName) return

    setDeleting(true)

    if (currentStoragePath) {
      try {
        await supabase.storage
          .from('product-images')
          .remove([currentStoragePath])
      } catch (err) {
        console.error('Error removing image:', err)
      }
    }

    onRemove()
    if (inputRef.current) {
      inputRef.current.value = ''
    }

    setDeleting(false)
    closeDeleteModal()
  }

  const isConfirmValid = confirmText === productName

  // Show uploading state
  if (uploading) {
    return (
      <div className={`${sizeClasses[size]} border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800`}>
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    )
  }

  // Show current image
  if (currentImageUrl) {
    return (
      <>
        <div className="relative group">
          <img
            src={currentImageUrl}
            alt="Product"
            className={`${sizeClasses[size]} object-cover rounded-lg border border-gray-200 dark:border-gray-700`}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="p-1.5 bg-white/90 hover:bg-white rounded-full text-gray-700"
              title="Replace image"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={openDeleteModal}
              className="p-1.5 bg-white/90 hover:bg-white rounded-full text-red-600"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleInputChange}
            className="hidden"
          />
          {error && (
            <div className="absolute -bottom-6 left-0 right-0 text-xs text-red-600 text-center">
              {error}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={closeDeleteModal} />
            <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-md mx-4 w-full">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Delete Product Image
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    This action cannot be undone. The image will be permanently removed from this product.
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Type <span className="font-semibold text-slate-900 dark:text-white">{productName}</span> to confirm
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Enter product name"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={!isConfirmValid || deleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Image'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // Show drop zone
  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`${sizeClasses[size]} border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-800'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleInputChange}
          className="hidden"
        />
        <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
        <span className="text-[10px] text-gray-500 text-center px-1">
          Add image
        </span>
      </div>

      {error && (
        <div className="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDocuments } from '@/lib/supabase/hooks'
import { DocumentsView } from '@/sections/documents/components'
import type { DocumentsFilters, DocumentSourceType } from '@/sections/documents/types'
import { Files, AlertCircle } from 'lucide-react'

export default function DocumentsPage() {
  const router = useRouter()
  const {
    documents,
    summary,
    loading,
    error,
    fetchDocuments,
    downloadDocument,
    deleteDocument,
  } = useDocuments()

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleFilterChange = (filters: DocumentsFilters) => {
    fetchDocuments(filters)
  }

  const handleViewDocument = async (id: string) => {
    // Open document in new tab (using signed URL)
    try {
      const response = await fetch(`/api/documents/${id}/download`)
      if (response.ok) {
        const { url } = await response.json()
        window.open(url, '_blank')
      }
    } catch (err) {
      console.error('Failed to view document:', err)
    }
  }

  const handleDownloadDocument = async (id: string) => {
    try {
      await downloadDocument(id)
    } catch (err) {
      console.error('Failed to download document:', err)
    }
  }

  const handleDeleteClick = (id: string) => {
    setDocumentToDelete(id)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return
    setDeleting(true)
    try {
      await deleteDocument(documentToDelete)
      setDeleteModalOpen(false)
      setDocumentToDelete(null)
    } catch (err) {
      console.error('Failed to delete document:', err)
    } finally {
      setDeleting(false)
    }
  }

  const handleViewSourceRecord = (sourceType: DocumentSourceType, sourceId: string) => {
    // Navigate to source record
    switch (sourceType) {
      case 'purchase-order':
        router.push(`/purchase-orders/${sourceId}`)
        break
      case 'inspection':
        router.push(`/inspections?selected=${sourceId}`)
        break
      case 'transfer':
        router.push(`/transfers?selected=${sourceId}`)
        break
    }
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <div>
            <p className="font-medium text-red-800 dark:text-red-200">Error loading documents</p>
            <p className="text-sm text-red-600 dark:text-red-400">{error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-lime-100 dark:bg-lime-900/30 rounded-lg">
          <Files className="w-6 h-6 text-lime-600 dark:text-lime-400" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
            Documents
          </h1>
          <p className="text-stone-500 dark:text-stone-400">
            Browse, search, and download all generated PDFs
          </p>
        </div>
      </div>

      {/* Documents View */}
      <DocumentsView
        documents={documents}
        summary={summary}
        loading={loading}
        onViewDocument={handleViewDocument}
        onDownloadDocument={handleDownloadDocument}
        onDeleteDocument={handleDeleteClick}
        onViewSourceRecord={handleViewSourceRecord}
        onFilterChange={handleFilterChange}
      />

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDeleteModalOpen(false)}
          />
          <div className="relative bg-white dark:bg-stone-900 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
              Delete Document
            </h3>
            <p className="text-stone-600 dark:text-stone-400 mb-6">
              Are you sure you want to delete this document? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="px-4 py-2 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

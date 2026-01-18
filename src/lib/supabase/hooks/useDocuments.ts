'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '../client'
import type {
  GeneratedDocument,
  DocumentsSummary,
  DocumentsFilters,
  DocumentSourceType,
  GeneratedDocumentType,
} from '@/sections/documents/types'

// =============================================================================
// Database Types (will be auto-generated after migration)
// =============================================================================

interface DbGeneratedDocument {
  id: string
  source_entity_type: string
  source_entity_id: string
  source_entity_ref: string
  document_type: string
  document_name: string
  storage_path: string
  file_url: string
  file_size: number
  data_snapshot: Record<string, unknown>
  generated_by_id: string | null
  generated_by_name: string | null
  generation_trigger: string | null
  notes: string | null
  brand_id: string | null
  created_at: string
}

interface DbDocumentsSummary {
  total: number
  purchase_orders: number
  inspections: number
  transfers: number
  this_month: number
}

// =============================================================================
// Transform Functions
// =============================================================================

function transformDocument(dbDoc: DbGeneratedDocument): GeneratedDocument {
  return {
    id: dbDoc.id,
    sourceEntityType: dbDoc.source_entity_type as DocumentSourceType,
    sourceEntityId: dbDoc.source_entity_id,
    sourceEntityRef: dbDoc.source_entity_ref,
    documentType: dbDoc.document_type as GeneratedDocumentType,
    documentName: dbDoc.document_name,
    generatedAt: dbDoc.created_at,
    generatedById: dbDoc.generated_by_id,
    generatedByName: dbDoc.generated_by_name,
    pdfUrl: dbDoc.file_url,
    storagePath: dbDoc.storage_path,
    fileSize: dbDoc.file_size,
    dataSnapshot: dbDoc.data_snapshot,
    generationTrigger: (dbDoc.generation_trigger as 'auto' | 'manual') || 'manual',
    notes: dbDoc.notes,
    brandId: dbDoc.brand_id,
  }
}

function transformSummary(dbSummary: DbDocumentsSummary): DocumentsSummary {
  return {
    total: dbSummary.total,
    purchaseOrders: dbSummary.purchase_orders,
    inspections: dbSummary.inspections,
    transfers: dbSummary.transfers,
    thisMonth: dbSummary.this_month,
  }
}

// =============================================================================
// Hook
// =============================================================================

export function useDocuments() {
  const [documents, setDocuments] = useState<GeneratedDocument[]>([])
  const [summary, setSummary] = useState<DocumentsSummary>({
    total: 0,
    purchaseOrders: 0,
    inspections: 0,
    transfers: 0,
    thisMonth: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = useMemo(() => createClient(), [])

  // Fetch documents with optional filters
  const fetchDocuments = useCallback(async (filters?: DocumentsFilters) => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('generated_documents')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters?.sourceType) {
        query = query.eq('source_entity_type', filters.sourceType)
      }

      if (filters?.documentType) {
        query = query.eq('document_type', filters.documentType)
      }

      if (filters?.dateRange?.from) {
        query = query.gte('created_at', filters.dateRange.from)
      }

      if (filters?.dateRange?.to) {
        query = query.lte('created_at', filters.dateRange.to)
      }

      if (filters?.searchQuery) {
        query = query.or(`source_entity_ref.ilike.%${filters.searchQuery}%,document_name.ilike.%${filters.searchQuery}%`)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        // Extract detailed error info from Supabase error
        const errorDetails = {
          message: fetchError.message,
          code: fetchError.code,
          details: fetchError.details,
          hint: fetchError.hint,
        }
        console.error('[Documents] Supabase query error:', errorDetails)
        throw new Error(fetchError.message || 'Database query failed')
      }

      setDocuments((data || []).map(transformDocument))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('[Documents] Error fetching documents:', errorMessage)
      setError(err instanceof Error ? err : new Error('Failed to fetch documents'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('generated_documents_summary')
        .select('*')
        .single()

      if (fetchError) {
        // View might not exist yet, use fallback
        console.warn('Summary view not available, using fallback')
        return
      }

      if (data) {
        setSummary(transformSummary(data as DbDocumentsSummary))
      }
    } catch (err) {
      console.error('Error fetching summary:', err)
    }
  }, [supabase])

  // Fetch documents for a specific entity
  const fetchDocumentsByEntity = useCallback(async (
    sourceType: DocumentSourceType,
    sourceId: string
  ): Promise<GeneratedDocument[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('generated_documents')
        .select('*')
        .eq('source_entity_type', sourceType)
        .eq('source_entity_id', sourceId)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      return (data || []).map(transformDocument)
    } catch (err) {
      console.error('Error fetching documents by entity:', err)
      throw err
    }
  }, [supabase])

  // Generate a new document
  const generateDocument = useCallback(async (params: {
    sourceEntityType: DocumentSourceType
    sourceEntityId: string
    documentType: GeneratedDocumentType
    trigger?: 'auto' | 'manual'
    notes?: string
  }): Promise<GeneratedDocument> => {
    try {
      const response = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceEntityType: params.sourceEntityType,
          sourceEntityId: params.sourceEntityId,
          documentType: params.documentType,
          trigger: params.trigger || 'manual',
          notes: params.notes,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate document')
      }

      const { document } = await response.json()

      // Refresh document list and summary
      await Promise.all([fetchDocuments(), fetchSummary()])

      return document as GeneratedDocument
    } catch (err) {
      console.error('Error generating document:', err)
      throw err
    }
  }, [fetchDocuments, fetchSummary])

  // Download a document
  const downloadDocument = useCallback(async (documentId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get download URL')
      }

      const { url, fileName } = await response.json()

      // Trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Error downloading document:', err)
      throw err
    }
  }, [])

  // Delete a document
  const deleteDocument = useCallback(async (documentId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete document')
      }

      // Refresh document list and summary
      await Promise.all([fetchDocuments(), fetchSummary()])
    } catch (err) {
      console.error('Error deleting document:', err)
      throw err
    }
  }, [fetchDocuments, fetchSummary])

  // Get a single document by ID
  const getDocument = useCallback(async (documentId: string): Promise<GeneratedDocument | null> => {
    try {
      const response = await fetch(`/api/documents/${documentId}`)

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch document')
      }

      const { document } = await response.json()
      return document as GeneratedDocument
    } catch (err) {
      console.error('Error fetching document:', err)
      throw err
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchDocuments()
    fetchSummary()
  }, [fetchDocuments, fetchSummary])

  return {
    documents,
    summary,
    loading,
    error,
    fetchDocuments,
    fetchSummary,
    fetchDocumentsByEntity,
    generateDocument,
    downloadDocument,
    deleteDocument,
    getDocument,
  }
}

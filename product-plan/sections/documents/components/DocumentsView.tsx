import { useState } from 'react'
import type {
  GeneratedDocument,
  DocumentsSummary,
  DocumentsFilters,
  DocumentSourceType,
  GeneratedDocumentType,
} from '../../../../product/sections/documents/types'
import { DocumentsSummaryCards } from './DocumentsSummaryCards'
import { DocumentRow } from './DocumentRow'
import { Search, X, FileText, ChevronDown } from 'lucide-react'

export interface DocumentsViewProps {
  documents: GeneratedDocument[]
  summary: DocumentsSummary
  filters?: DocumentsFilters
  onViewDocument?: (id: string) => void
  onDownloadDocument?: (id: string) => void
  onDeleteDocument?: (id: string) => void
  onViewSourceRecord?: (sourceType: DocumentSourceType, sourceId: string) => void
  onFilterChange?: (filters: DocumentsFilters) => void
}

const documentTypeOptions: { value: GeneratedDocumentType | ''; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'purchase-order-pdf', label: 'Purchase Orders' },
  { value: 'inspection-brief', label: 'Inspection Briefs' },
  { value: 'shipping-manifest', label: 'Shipping Manifests' },
  { value: 'packing-list', label: 'Packing Lists' },
]

export function DocumentsView({
  documents,
  summary,
  filters = {},
  onViewDocument,
  onDownloadDocument,
  onDeleteDocument,
  onViewSourceRecord,
  onFilterChange,
}: DocumentsViewProps) {
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery || '')
  const [selectedType, setSelectedType] = useState<GeneratedDocumentType | ''>(
    filters.documentType || ''
  )

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onFilterChange?.({ ...filters, searchQuery: value })
  }

  const handleTypeChange = (value: GeneratedDocumentType | '') => {
    setSelectedType(value)
    onFilterChange?.({
      ...filters,
      documentType: value || undefined,
    })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedType('')
    onFilterChange?.({})
  }

  const hasActiveFilters = searchQuery || selectedType

  // Filter documents based on current filters
  const filteredDocuments = documents.filter((doc) => {
    if (selectedType && doc.documentType !== selectedType) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        doc.documentName.toLowerCase().includes(query) ||
        doc.sourceEntityRef.toLowerCase().includes(query) ||
        doc.generatedByName.toLowerCase().includes(query)
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <DocumentsSummaryCards summary={summary} />

      {/* Filters */}
      <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search by name, reference, or user..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400"
            />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value as GeneratedDocumentType | '')}
              className="appearance-none pl-4 pr-10 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400 cursor-pointer"
            >
              {documentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden">
        {filteredDocuments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    Generated
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    document={doc}
                    onView={() => onViewDocument?.(doc.id)}
                    onDownload={() => onDownloadDocument?.(doc.id)}
                    onDelete={() => onDeleteDocument?.(doc.id)}
                    onViewSource={() =>
                      onViewSourceRecord?.(doc.sourceEntityType, doc.sourceEntityId)
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">
              {hasActiveFilters ? 'No matching documents' : 'No documents yet'}
            </h3>
            <p className="text-stone-500 dark:text-stone-400 text-center max-w-sm">
              {hasActiveFilters
                ? 'Try adjusting your filters to find what you\'re looking for.'
                : 'Generate PDFs from Purchase Orders, Inspections, or Transfers to see them here.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 text-lime-600 dark:text-lime-400 hover:bg-lime-50 dark:hover:bg-lime-900/20 rounded-lg transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      {filteredDocuments.length > 0 && (
        <div className="text-sm text-stone-500 dark:text-stone-400">
          Showing {filteredDocuments.length} of {documents.length} documents
        </div>
      )}
    </div>
  )
}

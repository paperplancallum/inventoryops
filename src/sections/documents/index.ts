// Components
export { DocumentsView, DocumentRow, DocumentsSummaryCards } from './components'

// Props types come from components (avoid duplicate exports)
export type { DocumentsViewProps, DocumentRowProps, DocumentsSummaryCardsProps } from './components'

// Types (excluding props that are defined in components)
export type {
  DocumentSourceType,
  GeneratedDocumentType,
  GeneratedDocument,
  PODocumentSnapshot,
  InspectionBriefSnapshot,
  TransferDocumentSnapshot,
  PackingListDocumentSnapshot,
  DocumentsSummary,
  DocumentsFilters,
  DocumentHistoryProps,
  GenerateDocumentModalProps,
  DocumentTypeInfo,
  SourceTypeInfo,
  GenerateDocumentRequest,
  GenerateDocumentResponse,
} from './types'

export { DOCUMENT_TYPES, SOURCE_TYPES } from './types'

// PDF exports
export * from './pdf'

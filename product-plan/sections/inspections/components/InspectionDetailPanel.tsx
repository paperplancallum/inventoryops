import { useState, useRef } from 'react'
import type { InspectionDetailPanelProps, InspectionMessage, InspectionLineItem, DefectSeverity, InspectionStatus } from '@/../product/sections/inspections/types'
import type { GeneratedDocument } from '@/../product/sections/documents/types'
import { MessageThread } from '../../purchase-orders/components/MessageThread'
import { MessageComposer } from '../../purchase-orders/components/MessageComposer'
import { DocumentHistoryPanel } from '@/components/DocumentHistoryPanel'

// Icons
const XIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const ExternalLinkIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const XCircleIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const CurrencyDollarIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const CheckCircleIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const statusLabels: Record<InspectionStatus, string> = {
  'scheduled': 'Scheduled',
  'in-progress': 'In Progress',
  'passed': 'Passed',
  'failed': 'Failed',
  'pending-rework': 'Pending Rework',
  're-inspection': 'Re-inspection',
}

const statusColors: Record<InspectionStatus, string> = {
  'scheduled': 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  'passed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  'failed': 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  'pending-rework': 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  're-inspection': 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
}

const severityColors: Record<DefectSeverity, string> = {
  'minor': 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  'major': 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  'critical': 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
}

// Line Item Detail Component
function LineItemDetail({ item, defaultExpanded = false }: { item: InspectionLineItem; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const hasDetails = item.defects.length > 0 || item.measurements.length > 0 || item.packaging || item.photos.length > 0

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-slate-400 dark:text-slate-500">
            {expanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </span>
          <div className="min-w-0 text-left">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {item.productName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {item.productSku} • {item.orderedQuantity.toLocaleString()} ordered • {item.sampleSize} sampled
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {item.result !== 'pending' && (
            <span className={`text-sm font-medium ${
              item.defectRate > 2.5
                ? 'text-red-600 dark:text-red-400'
                : item.defectRate > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {item.defectRate}%
            </span>
          )}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            item.result === 'pass'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
              : item.result === 'fail'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
          }`}>
            {item.result === 'pass' ? <CheckIcon /> : item.result === 'fail' ? <XCircleIcon /> : null}
            {item.result === 'pass' ? 'Pass' : item.result === 'fail' ? 'Fail' : 'Pending'}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-4 space-y-4 bg-slate-50/50 dark:bg-slate-800/50">
          {/* No data message for pending items */}
          {!hasDetails && (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic text-center py-2">
              No inspection data recorded yet
            </p>
          )}

          {/* Defects */}
          {item.defects.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                Defects ({item.defects.length})
              </h5>
              <div className="space-y-2">
                {item.defects.map((defect) => (
                  <div key={defect.id} className="bg-white dark:bg-slate-700 rounded p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900 dark:text-white capitalize">{defect.type}</span>
                      <span className={`px-1.5 py-0.5 text-xs font-medium rounded capitalize ${severityColors[defect.severity]}`}>
                        {defect.severity}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">{defect.description} ({defect.quantity})</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Measurements */}
          {item.measurements.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                Measurements
              </h5>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 dark:text-slate-400">
                    <th className="text-left py-1">Name</th>
                    <th className="text-left py-1">Spec</th>
                    <th className="text-left py-1">Actual</th>
                    <th className="text-center py-1">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {item.measurements.map((m) => (
                    <tr key={m.id} className="text-slate-700 dark:text-slate-300">
                      <td className="py-1">{m.name}</td>
                      <td className="py-1">{m.specValue}</td>
                      <td className="py-1">{m.actualValue}</td>
                      <td className="py-1 text-center">
                        <span className={m.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                          {m.passed ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Packaging */}
          {item.packaging && (
            <div>
              <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                Packaging
              </h5>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center justify-between bg-white dark:bg-slate-700 rounded p-2">
                  <span className="text-slate-600 dark:text-slate-400">Box</span>
                  <span className={`capitalize ${
                    item.packaging.boxCondition === 'good' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  }`}>{item.packaging.boxCondition}</span>
                </div>
                <div className="flex items-center justify-between bg-white dark:bg-slate-700 rounded p-2">
                  <span className="text-slate-600 dark:text-slate-400">Labels</span>
                  <span className={item.packaging.labelingAccuracy ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                    {item.packaging.labelingAccuracy ? 'Pass' : 'Fail'}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white dark:bg-slate-700 rounded p-2">
                  <span className="text-slate-600 dark:text-slate-400">Barcode</span>
                  <span className={item.packaging.barcodeScans ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                    {item.packaging.barcodeScans ? 'Pass' : 'Fail'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Photos */}
          {item.photos.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                Photos ({item.photos.length})
              </h5>
              <div className="flex gap-2 flex-wrap">
                {item.photos.map((photo) => (
                  <div key={photo.id} className="relative w-16 h-16 rounded bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                    <span className={`absolute top-0.5 left-0.5 px-1 py-0.5 text-[9px] font-medium rounded capitalize ${
                      photo.type === 'defect' ? 'bg-red-500/90 text-white' : 'bg-slate-500/90 text-white'
                    }`}>
                      {photo.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Extended props to include document-related callbacks
interface ExtendedInspectionDetailPanelProps extends InspectionDetailPanelProps {
  /** Generated documents for this inspection (for document history) */
  documents?: GeneratedDocument[]
  /** Called when user wants to generate an inspection report PDF */
  onGenerateReport?: () => void
  /** Called when user wants to download a document */
  onDownloadDocument?: (documentId: string) => void
}

export function InspectionDetailPanel({
  inspection,
  isOpen,
  hasInspectionInvoice,
  inspectionInvoiceId,
  documents = [],
  onClose,
  onEdit,
  onSendMessage,
  onAddNote,
  onViewBatch,
  onCreateRework,
  onScheduleReinspection,
  onCreateInspectionInvoice,
  onViewInspectionInvoice,
  onGenerateReport,
  onDownloadDocument,
}: ExtendedInspectionDetailPanelProps) {
  const messageCount = inspection.messages?.length || 0
  const [messagesExpanded, setMessagesExpanded] = useState(messageCount <= 5)
  const [lineItemsExpanded, setLineItemsExpanded] = useState(true)
  const composerRef = useRef<HTMLDivElement>(null)

  if (!isOpen) return null

  const scrollToComposer = () => {
    setMessagesExpanded(true)
    setTimeout(() => {
      composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Convert InspectionMessage to Message type for MessageThread
  const messages = (inspection.messages || []).map((msg: InspectionMessage) => ({
    id: msg.id,
    direction: msg.direction,
    senderName: msg.senderName,
    senderEmail: msg.senderEmail,
    timestamp: msg.timestamp,
    content: msg.content,
    attachments: msg.attachments,
  }))

  // Calculate line item stats
  const passedItems = inspection.lineItems.filter(li => li.result === 'pass').length
  const failedItems = inspection.lineItems.filter(li => li.result === 'fail').length
  const totalDefects = inspection.lineItems.reduce((sum, li) => sum + li.defectsFound, 0)

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-slate-800 shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm font-semibold flex-shrink-0">
                QC
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">
                    {inspection.purchaseOrderNumber}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[inspection.status]}`}>
                    {statusLabels[inspection.status]}
                  </span>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {inspection.supplierName}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                >
                  Edit
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <XIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Overview Section */}
          <section>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Overview</h3>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Result</span>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${
                      inspection.result === 'pass'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                        : inspection.result === 'fail'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-300'
                    }`}>
                      {inspection.result === 'pass' ? 'Pass' : inspection.result === 'fail' ? 'Fail' : 'Pending'}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Defect Rate</span>
                  <p className={`mt-1 text-lg font-semibold ${
                    inspection.overallDefectRate > 2.5
                      ? 'text-red-600 dark:text-red-400'
                      : inspection.overallDefectRate > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {inspection.overallDefectRate}%
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Line Items</span>
                  <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                    {passedItems > 0 && <span className="text-emerald-600 dark:text-emerald-400">{passedItems} pass</span>}
                    {passedItems > 0 && failedItems > 0 && <span className="text-slate-400 mx-1">/</span>}
                    {failedItems > 0 && <span className="text-red-600 dark:text-red-400">{failedItems} fail</span>}
                    {passedItems === 0 && failedItems === 0 && <span className="text-slate-500">{inspection.lineItems.length} pending</span>}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-600">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Scheduled:</span>
                    <span className="ml-1 text-slate-900 dark:text-white">{formatDate(inspection.scheduledDate)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <UserIcon />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Agent:</span>
                    <span className={`ml-1 ${inspection.agentId ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 italic'}`}>
                      {inspection.agentName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-600">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Sample</span>
                  <p className="mt-1 text-slate-900 dark:text-white font-medium">{inspection.totalSampleSize} units</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Defects</span>
                  <p className="mt-1 text-slate-900 dark:text-white font-medium">{totalDefects}</p>
                </div>
              </div>

              {onViewBatch && (
                <button
                  onClick={() => onViewBatch(inspection.purchaseOrderId)}
                  className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View Purchase Order <ExternalLinkIcon />
                </button>
              )}
            </div>
          </section>

          {/* Line Items Section */}
          <section className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setLineItemsExpanded(!lineItemsExpanded)}
              className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400">
                  {lineItemsExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                </span>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Line Items
                </h3>
                <span className="px-2 py-0.5 text-xs font-medium bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 rounded-full">
                  {inspection.lineItems.length}
                </span>
              </div>
            </button>

            {lineItemsExpanded && (
              <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-3">
                {inspection.lineItems.map((item, index) => (
                  <LineItemDetail
                    key={item.id}
                    item={item}
                    defaultExpanded={index === 0 && inspection.lineItems.length <= 3}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Notes Section */}
          {inspection.notes && (
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Notes</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                {inspection.notes}
              </p>
            </section>
          )}

          {/* Document History (Reports) */}
          <section>
            <DocumentHistoryPanel
              documents={documents}
              sourceType="inspection"
              sourceId={inspection.id}
              sourceRef={inspection.purchaseOrderNumber}
              onGenerateNew={onGenerateReport}
              onDownloadDocument={onDownloadDocument}
            />
          </section>

          {/* Inspection Invoice */}
          <section>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <CurrencyDollarIcon />
              Inspection Invoice
            </h3>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              {hasInspectionInvoice ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                      <CheckCircleIcon />
                      Invoice Created
                    </span>
                  </div>
                  {inspectionInvoiceId && onViewInspectionInvoice && (
                    <button
                      onClick={() => onViewInspectionInvoice(inspectionInvoiceId)}
                      className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      View Invoice <ExternalLinkIcon />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {inspection.status !== 'scheduled'
                      ? 'Invoice can only be created for scheduled inspections'
                      : !inspection.agentId
                      ? 'Assign an agent before creating invoice'
                      : 'Payment required before inspection begins'}
                  </p>
                  <button
                    onClick={() => onCreateInspectionInvoice?.(inspection.id)}
                    disabled={inspection.status !== 'scheduled' || !inspection.agentId}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      inspection.status !== 'scheduled' || !inspection.agentId
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-600 dark:text-slate-500'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                    }`}
                  >
                    Create Invoice
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Rework Request Section */}
          {inspection.reworkRequest && (
            <section className="border-2 border-amber-300 dark:border-amber-600 rounded-lg overflow-hidden">
              <div className="bg-amber-50 dark:bg-amber-900/30 px-4 py-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                    Rework Request
                  </h3>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${
                    inspection.reworkRequest.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                      : inspection.reworkRequest.status === 'in-progress'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                  }`}>
                    {inspection.reworkRequest.status.replace('-', ' ')}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3 bg-amber-50/50 dark:bg-amber-900/10">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Instructions</span>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{inspection.reworkRequest.instructions}</p>
                </div>
                {inspection.reworkRequest.supplierResponse && (
                  <div className="pt-3 border-t border-amber-200 dark:border-amber-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Supplier Response</span>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{inspection.reworkRequest.supplierResponse}</p>
                  </div>
                )}
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Created: {formatDate(inspection.reworkRequest.createdDate)}
                  {inspection.reworkRequest.completedDate && (
                    <span> • Completed: {formatDate(inspection.reworkRequest.completedDate)}</span>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Action Buttons */}
          {(inspection.result === 'fail' && !inspection.reworkRequest && onCreateRework) ||
           (inspection.reworkRequest?.status === 'completed' && onScheduleReinspection) ? (
            <div className="flex gap-3">
              {inspection.result === 'fail' && !inspection.reworkRequest && onCreateRework && (
                <button
                  onClick={onCreateRework}
                  className="flex-1 px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 rounded-lg transition-colors"
                >
                  Create Rework Request
                </button>
              )}
              {inspection.reworkRequest?.status === 'completed' && onScheduleReinspection && (
                <button
                  onClick={onScheduleReinspection}
                  className="flex-1 px-4 py-2 text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
                >
                  Schedule Re-inspection
                </button>
              )}
            </div>
          ) : null}

          {/* Messages Section */}
          <section className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            {/* Collapsible header */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50">
              <button
                onClick={() => setMessagesExpanded(!messagesExpanded)}
                className="flex-1 flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="text-slate-500 dark:text-slate-400">
                  {messagesExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                </span>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Messages {messageCount > 0 && `(${messageCount})`}
                </h3>
              </button>
              {!messagesExpanded && (
                <button
                  onClick={scrollToComposer}
                  className="flex items-center gap-1.5 px-3 py-1.5 mr-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                >
                  <PlusIcon />
                  New
                </button>
              )}
            </div>

            {/* Collapsible content */}
            {messagesExpanded && (
              <div className="border-t border-slate-200 dark:border-slate-700">
                <div className="p-4 space-y-4">
                  <MessageThread messages={messages} />
                  <div ref={composerRef}>
                    <MessageComposer
                      onSend={(content, attachments) => {
                        onSendMessage?.(inspection.id, content, attachments)
                      }}
                      onAddNote={(content) => {
                        onAddNote?.(inspection.id, content)
                      }}
                      placeholder={`Write a message about ${inspection.purchaseOrderNumber}...`}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

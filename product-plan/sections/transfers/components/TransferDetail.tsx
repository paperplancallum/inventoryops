import { useState } from 'react'
import type { TransferDetailProps, TransferStatus, TransferLineItemStatus } from '@/../product/sections/transfers/types'
import type { GeneratedDocument } from '@/../product/sections/documents/types'
import { TransferTimeline } from './TransferTimeline'
import { AmazonReceiving } from './AmazonReceiving'
import { DocumentHistoryPanel } from '@/components/DocumentHistoryPanel'

// Icons
const XIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const ArrowRightIcon = () => (
  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
)

const TruckIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
)

const ExternalLinkIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
)

const DocumentIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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

const PencilIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
)

const LinkIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
)

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

const statusColors: Record<TransferStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  booked: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
  'in-transit': 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  delivered: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
}

const statusLabels: Record<TransferStatus, string> = {
  draft: 'Draft',
  booked: 'Booked',
  'in-transit': 'In Transit',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const lineItemStatusColors: Record<TransferLineItemStatus, string> = {
  pending: 'bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-300',
  in_transit: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  received: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  partial: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
}

const lineItemStatusLabels: Record<TransferLineItemStatus, string> = {
  pending: 'Pending',
  in_transit: 'In Transit',
  received: 'Received',
  partial: 'Partial',
  cancelled: 'Cancelled',
}

// Extended props to include document-related callbacks
interface ExtendedTransferDetailProps extends TransferDetailProps {
  /** Generated documents for this transfer (for document history) */
  documents?: GeneratedDocument[]
  /** Called when user wants to generate a shipping manifest PDF */
  onGenerateManifest?: () => void
  /** Called when user wants to download a document */
  onDownloadDocument?: (documentId: string) => void
  /** Called when user updates the Amazon Shipment ID */
  onUpdateAmazonShipmentId?: (shipmentId: string | null) => void
  /** Called when user wants to navigate to the linked Amazon Shipment */
  onNavigateToAmazonShipment?: () => void
}

export function TransferDetail({
  transfer,
  locations,
  hasInvoice,
  invoiceId,
  documents = [],
  onEdit,
  onClose,
  onUpdateStatus: _onUpdateStatus,
  onUpdateAmazonReceiving,
  onCreateInvoice,
  onViewInvoice,
  onGenerateManifest,
  onDownloadDocument,
  onUpdateAmazonShipmentId,
  onNavigateToAmazonShipment,
}: ExtendedTransferDetailProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const totalCost = transfer.costs.freight + transfer.costs.insurance + transfer.costs.duties +
    transfer.costs.taxes + transfer.costs.handling + transfer.costs.other

  const destLocation = locations.find(l => l.id === transfer.destinationLocationId)
  const isAmazonDest = destLocation?.type === 'amazon-fba' || destLocation?.type === 'amazon-awd'

  // State for editing Amazon Shipment ID inline
  const [isEditingShipmentId, setIsEditingShipmentId] = useState(false)
  const [editedShipmentId, setEditedShipmentId] = useState(transfer.amazonShipmentId || '')

  const handleSaveShipmentId = () => {
    onUpdateAmazonShipmentId?.(editedShipmentId || null)
    setIsEditingShipmentId(false)
  }

  const handleCancelEditShipmentId = () => {
    setEditedShipmentId(transfer.amazonShipmentId || '')
    setIsEditingShipmentId(false)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-slate-800 shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-slate-900 dark:text-white">
                {transfer.transferNumber}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[transfer.status]}`}>
                {statusLabels[transfer.status]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onEdit}
                className="px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              >
                Edit
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <XIcon />
              </button>
            </div>
          </div>
          {/* Route */}
          <div className="mt-3 flex items-center gap-3 text-sm">
            <span className="text-slate-700 dark:text-slate-300">{transfer.sourceLocationName}</span>
            <ArrowRightIcon />
            <span className="text-slate-700 dark:text-slate-300">{transfer.destinationLocationName}</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Timeline */}
          <section>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Status Timeline</h3>
            <TransferTimeline history={transfer.statusHistory} />
          </section>

          {/* Line Items */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Line Items ({transfer.lineItems.length})
              </h3>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {transfer.totalUnits.toLocaleString()} units · ${transfer.totalValue.toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-600">
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">SKU</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Product</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Qty</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Rcvd</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Value</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                  {transfer.lineItems.map(item => {
                    const hasDiscrepancy = item.discrepancy !== null && item.discrepancy !== 0
                    return (
                      <tr key={item.id}>
                        <td className="px-3 py-2">
                          <span className="text-indigo-600 dark:text-indigo-400 font-medium">{item.sku}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400 max-w-[150px] truncate" title={item.productName}>
                          {item.productName}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                          {item.quantity.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {item.receivedQuantity !== null ? (
                            <span className={hasDiscrepancy ? 'text-orange-600 dark:text-orange-400' : 'text-slate-700 dark:text-slate-300'}>
                              {item.receivedQuantity.toLocaleString()}
                              {hasDiscrepancy && (
                                <span className="ml-1 text-xs">
                                  ({item.discrepancy! > 0 ? '+' : ''}{item.discrepancy})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                          ${item.totalCost.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${lineItemStatusColors[item.status]}`}>
                            {lineItemStatusLabels[item.status]}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="border-t border-slate-200 dark:border-slate-600">
                  <tr>
                    <td colSpan={2} className="px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Totals</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900 dark:text-white">
                      {transfer.lineItems.reduce((sum, i) => sum + i.quantity, 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900 dark:text-white">
                      {transfer.lineItems.reduce((sum, i) => sum + (i.receivedQuantity || 0), 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900 dark:text-white">
                      ${transfer.lineItems.reduce((sum, i) => sum + i.totalCost, 0).toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* Logistics */}
          <section>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              <TruckIcon className="inline w-4 h-4 mr-2" />
              Logistics
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Carrier</span>
                <p className="text-slate-900 dark:text-white font-medium">{transfer.carrier || '-'}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Shipping Method</span>
                <p className="text-slate-900 dark:text-white font-medium capitalize">{transfer.shippingMethod.replace('-', ' ')}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Incoterms</span>
                <p className="text-slate-900 dark:text-white font-medium">{transfer.incoterms || '-'}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Container #</span>
                <p className="text-slate-900 dark:text-white font-medium">{transfer.containerNumbers.join(', ') || '-'}</p>
              </div>
            </div>
            {/* Tracking Numbers */}
            {transfer.trackingNumbers.length > 0 && (
              <div className="mt-4">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Tracking Numbers</span>
                <div className="mt-2 space-y-2">
                  {transfer.trackingNumbers.map(tracking => (
                    <div key={tracking.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 rounded px-3 py-2">
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{tracking.carrier}</span>
                        <p className="text-sm font-mono text-slate-900 dark:text-white">{tracking.number}</p>
                      </div>
                      {tracking.url && (
                        <a
                          href={tracking.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Track <ExternalLinkIcon />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Dates */}
          <section>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Dates</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Scheduled Departure</span>
                <p className="text-slate-900 dark:text-white font-medium">{formatDate(transfer.scheduledDepartureDate)}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Actual Departure</span>
                <p className={`font-medium ${transfer.actualDepartureDate ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                  {formatDate(transfer.actualDepartureDate)}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Scheduled Arrival</span>
                <p className="text-slate-900 dark:text-white font-medium">{formatDate(transfer.scheduledArrivalDate)}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Actual Arrival</span>
                <p className={`font-medium ${transfer.actualArrivalDate ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                  {formatDate(transfer.actualArrivalDate)}
                </p>
              </div>
            </div>
          </section>

          {/* Costs */}
          <section>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Costs</h3>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                {transfer.costs.freight > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Freight</span>
                    <span className="text-slate-900 dark:text-white">${transfer.costs.freight.toLocaleString()}</span>
                  </div>
                )}
                {transfer.costs.insurance > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Insurance</span>
                    <span className="text-slate-900 dark:text-white">${transfer.costs.insurance.toLocaleString()}</span>
                  </div>
                )}
                {transfer.costs.duties > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Duties</span>
                    <span className="text-slate-900 dark:text-white">${transfer.costs.duties.toLocaleString()}</span>
                  </div>
                )}
                {transfer.costs.taxes > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Taxes</span>
                    <span className="text-slate-900 dark:text-white">${transfer.costs.taxes.toLocaleString()}</span>
                  </div>
                )}
                {transfer.costs.handling > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Handling</span>
                    <span className="text-slate-900 dark:text-white">${transfer.costs.handling.toLocaleString()}</span>
                  </div>
                )}
                {transfer.costs.other > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Other</span>
                    <span className="text-slate-900 dark:text-white">${transfer.costs.other.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 dark:border-slate-600 pt-2 flex justify-between font-semibold">
                  <span className="text-slate-900 dark:text-white">Total</span>
                  <span className="text-slate-900 dark:text-white">${totalCost.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Customs */}
          {(transfer.customsInfo.hsCode || transfer.customsInfo.customsBroker || transfer.customsInfo.customsStatus !== 'pending') && (
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Customs</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">HS Code</span>
                  <p className="text-slate-900 dark:text-white font-medium">{transfer.customsInfo.hsCode || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Customs Broker</span>
                  <p className="text-slate-900 dark:text-white font-medium">{transfer.customsInfo.customsBroker || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Status</span>
                  <p className="text-slate-900 dark:text-white font-medium capitalize">{transfer.customsInfo.customsStatus.replace('-', ' ')}</p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Entry Number</span>
                  <p className="text-slate-900 dark:text-white font-medium">{transfer.customsInfo.entryNumber || '-'}</p>
                </div>
                {transfer.customsInfo.clearanceDate && (
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Clearance Date</span>
                    <p className="text-slate-900 dark:text-white font-medium">{formatDate(transfer.customsInfo.clearanceDate)}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Invoice */}
          <section>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <CurrencyDollarIcon />
              Invoice
            </h3>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              {hasInvoice ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                      <CheckCircleIcon />
                      Invoice Created
                    </span>
                  </div>
                  {invoiceId && onViewInvoice && (
                    <button
                      onClick={() => onViewInvoice(invoiceId)}
                      className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      View Invoice <ExternalLinkIcon />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {transfer.status === 'draft'
                      ? 'Transfer must be booked before creating invoice'
                      : 'No invoice created yet'}
                  </p>
                  <button
                    onClick={() => onCreateInvoice?.(transfer.id)}
                    disabled={transfer.status === 'draft'}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      transfer.status === 'draft'
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

          {/* Amazon Shipment */}
          {isAmazonDest && (
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Amazon Shipment</h3>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                {isEditingShipmentId ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Amazon Shipment ID
                      </label>
                      <input
                        type="text"
                        value={editedShipmentId}
                        onChange={(e) => setEditedShipmentId(e.target.value.toUpperCase())}
                        placeholder="e.g., FBA17ABC1234"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                        autoFocus
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Enter after creating inbound shipment in Seller Central
                      </p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={handleCancelEditShipmentId}
                        className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 rounded transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveShipmentId}
                        className="px-3 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : transfer.amazonShipmentId ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Shipment ID</span>
                      <p className="text-sm font-mono text-slate-900 dark:text-white">{transfer.amazonShipmentId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {onNavigateToAmazonShipment && (
                        <button
                          onClick={onNavigateToAmazonShipment}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                        >
                          <LinkIcon />
                          View in Shipments
                        </button>
                      )}
                      <button
                        onClick={() => setIsEditingShipmentId(true)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        title="Edit"
                      >
                        <PencilIcon />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No Amazon Shipment ID linked yet
                    </p>
                    <button
                      onClick={() => setIsEditingShipmentId(true)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                    >
                      <PlusIcon />
                      Add Shipment ID
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Amazon Receiving */}
          {isAmazonDest && transfer.amazonReceiving && (
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Amazon Receiving</h3>
              <AmazonReceiving
                receiving={transfer.amazonReceiving}
                onUpdate={onUpdateAmazonReceiving}
              />
            </section>
          )}

          {/* Documents (Uploaded shipping docs) */}
          {transfer.documents.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Shipping Documents ({transfer.documents.length})</h3>
              <div className="space-y-2">
                {transfer.documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 rounded px-3 py-2">
                    <div className="flex items-center gap-2">
                      <DocumentIcon />
                      <div>
                        <p className="text-sm text-slate-900 dark:text-white">{doc.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{doc.type.replace(/-/g, ' ')}</p>
                      </div>
                    </div>
                    <button className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Generated Manifests (Document History) */}
          <section>
            <DocumentHistoryPanel
              documents={documents}
              sourceType="transfer"
              sourceId={transfer.id}
              sourceRef={transfer.transferNumber}
              onGenerateNew={onGenerateManifest}
              onDownloadDocument={onDownloadDocument}
            />
          </section>

          {/* Notes */}
          {transfer.notes && (
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Notes</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                {transfer.notes}
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

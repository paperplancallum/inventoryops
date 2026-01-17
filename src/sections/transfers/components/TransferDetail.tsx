'use client'

import { useState } from 'react'
import {
  X,
  ArrowRight,
  Truck,
  ExternalLink,
  FileText,
  DollarSign,
  CheckCircle,
  Pencil,
  Link,
  Plus,
  Link2
} from 'lucide-react'
import type {
  Transfer,
  TransferStatus,
  TransferLineItemStatus,
  AmazonReceiving as AmazonReceivingType,
} from '../types'
import type { Location } from '@/sections/suppliers/types'
import { TransferTimeline } from './TransferTimeline'
import { AmazonReceiving } from './AmazonReceiving'
import { ShippingQuotesSection } from '../ShippingQuotesSection'
import { ShippingVarianceDisplay } from '@/sections/invoices'
import { canTransferMoveToStatus, getTransferBlockers } from '@/lib/supabase/hooks/useTransfers'
import type { ShippingQuote } from '@/sections/shipping-quotes/types'
import { AlertTriangle, CheckCircle2, Clock, Package } from 'lucide-react'

type QuoteStatus = 'no_quotes' | 'awaiting_quotes' | 'quotes_received' | 'confirmed'

interface TransferDetailProps {
  transfer: Transfer
  locations: Location[]
  hasInvoice?: boolean
  invoiceId?: string
  // Quote info
  quoteStatus?: QuoteStatus
  selectedQuoteAmount?: number | null
  shippingInvoiceAmount?: number | null
  shippingInvoiceId?: string | null
  // Handlers
  onEdit?: () => void
  onClose?: () => void
  onUpdateStatus?: (status: TransferStatus) => void
  onUpdateAmazonReceiving?: (info: Partial<AmazonReceivingType>) => void
  onCreateInvoice?: (transferId: string) => void
  onViewInvoice?: (invoiceId: string) => void
  onViewShippingInvoice?: (invoiceId: string) => void
  onGenerateManifest?: () => void
  onGenerateMagicLink?: () => void
  onUpdateAmazonShipmentId?: (shipmentId: string | null) => void
  onNavigateToAmazonShipment?: () => void
  // Shipping Quotes
  onRequestQuotes?: () => void
  onAddManualQuote?: () => void
  onSelectQuote?: (quoteId: string) => void
  onViewQuoteDetails?: (quote: ShippingQuote) => void
  onQuoteSelected?: () => void
}

const statusColors: Record<TransferStatus, string> = {
  draft: 'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-300',
  booked: 'bg-lime-100 text-lime-700 dark:bg-lime-900/50 dark:text-lime-300',
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
  pending: 'bg-stone-100 text-stone-700 dark:bg-stone-600 dark:text-stone-300',
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

export function TransferDetail({
  transfer,
  locations,
  hasInvoice,
  invoiceId,
  quoteStatus = 'no_quotes',
  selectedQuoteAmount,
  shippingInvoiceAmount,
  shippingInvoiceId,
  onEdit,
  onClose,
  onUpdateAmazonReceiving,
  onCreateInvoice,
  onViewInvoice,
  onViewShippingInvoice,
  onGenerateManifest,
  onGenerateMagicLink,
  onUpdateAmazonShipmentId,
  onNavigateToAmazonShipment,
  onRequestQuotes,
  onAddManualQuote,
  onSelectQuote,
  onViewQuoteDetails,
  onQuoteSelected,
}: TransferDetailProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const totalCost = transfer.costs.freight + transfer.costs.insurance + transfer.costs.duties +
    transfer.costs.taxes + transfer.costs.handling + transfer.costs.other

  const destLocation = locations.find(l => l.id === transfer.destinationLocationId)
  const isAmazonDest = destLocation?.type === 'amazon_fba' || destLocation?.type === 'amazon_awd'

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
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-stone-800 shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-stone-900 dark:text-white">
                {transfer.transferNumber}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[transfer.status]}`}>
                {statusLabels[transfer.status]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onGenerateMagicLink && transfer.status !== 'cancelled' && (
                <button
                  onClick={onGenerateMagicLink}
                  className="px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Link2 className="w-4 h-4" />
                  Magic Link
                </button>
              )}
              <button
                onClick={onEdit}
                className="px-3 py-1.5 text-sm font-medium text-lime-600 dark:text-lime-400 hover:bg-lime-50 dark:hover:bg-lime-900/20 rounded-lg transition-colors"
              >
                Edit
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          {/* Route */}
          <div className="mt-3 flex items-center gap-3 text-sm">
            <span className="text-stone-700 dark:text-stone-300">{transfer.sourceLocationName}</span>
            <ArrowRight className="w-5 h-5 text-stone-400" />
            <span className="text-stone-700 dark:text-stone-300">{transfer.destinationLocationName}</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Quote Status Banner */}
          {(() => {
            const canMoveToTransit = canTransferMoveToStatus(transfer, 'in-transit')
            const blockers = getTransferBlockers(transfer, 'in-transit')
            const needsQuote = !canMoveToTransit && transfer.status !== 'in-transit' && transfer.status !== 'delivered' && transfer.status !== 'completed' && transfer.status !== 'cancelled'

            if (quoteStatus === 'confirmed' || transfer.quoteConfirmedAt) {
              return (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">Quote Confirmed</p>
                      {selectedQuoteAmount !== null && selectedQuoteAmount !== undefined && (
                        <p className="text-xs text-green-700 dark:text-green-300">
                          ${selectedQuoteAmount.toLocaleString()} selected
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            }

            if (quoteStatus === 'quotes_received') {
              return (
                <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Quotes Received</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Review and select a quote below
                      </p>
                    </div>
                  </div>
                </div>
              )
            }

            if (quoteStatus === 'awaiting_quotes') {
              return (
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Awaiting Quotes</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Quotes have been requested from shipping agents
                      </p>
                    </div>
                  </div>
                </div>
              )
            }

            if (needsQuote) {
              return (
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">Quote Required</p>
                      <p className="text-xs text-red-700 dark:text-red-300">
                        A shipping quote must be selected before this transfer can move to in-transit
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onRequestQuotes}
                    className="px-3 py-1.5 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Request Quotes
                  </button>
                </div>
              )
            }

            return null
          })()}

          {/* Shipping Cost Summary with Variance */}
          {(selectedQuoteAmount !== null && selectedQuoteAmount !== undefined) && (
            <section>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Shipping Cost Summary
              </h3>
              <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg p-4">
                <ShippingVarianceDisplay
                  quotedAmount={selectedQuoteAmount}
                  actualAmount={shippingInvoiceAmount ?? null}
                  variant={shippingInvoiceAmount !== null ? 'expanded' : 'standard'}
                  showLabels={true}
                  showPercentage={shippingInvoiceAmount !== null}
                />
                {shippingInvoiceId && onViewShippingInvoice && (
                  <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-600">
                    <button
                      onClick={() => onViewShippingInvoice(shippingInvoiceId)}
                      className="flex items-center gap-1 text-sm text-lime-600 dark:text-lime-400 hover:underline"
                    >
                      View Shipping Invoice <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Timeline */}
          <section>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-3">Status Timeline</h3>
            <TransferTimeline history={transfer.statusHistory} />
          </section>

          {/* Line Items */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-stone-900 dark:text-white">
                Line Items ({transfer.lineItems.length})
              </h3>
              <div className="text-sm text-stone-500 dark:text-stone-400">
                {transfer.totalUnits.toLocaleString()} units · ${transfer.totalValue.toLocaleString()}
              </div>
            </div>
            <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-600">
                    <th className="px-3 py-2 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase">SKU</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase">Product</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-stone-500 dark:text-stone-400 uppercase">Qty</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-stone-500 dark:text-stone-400 uppercase">Rcvd</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-stone-500 dark:text-stone-400 uppercase">Value</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-stone-500 dark:text-stone-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-600">
                  {transfer.lineItems.map(item => {
                    const hasDiscrepancy = item.discrepancy !== null && item.discrepancy !== 0
                    return (
                      <tr key={item.id}>
                        <td className="px-3 py-2">
                          <span className="text-lime-600 dark:text-lime-400 font-medium">{item.sku}</span>
                        </td>
                        <td className="px-3 py-2 text-stone-600 dark:text-stone-400 max-w-[150px] truncate" title={item.productName}>
                          {item.productName}
                        </td>
                        <td className="px-3 py-2 text-right text-stone-700 dark:text-stone-300">
                          {item.quantity.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {item.receivedQuantity !== null ? (
                            <span className={hasDiscrepancy ? 'text-orange-600 dark:text-orange-400' : 'text-stone-700 dark:text-stone-300'}>
                              {item.receivedQuantity.toLocaleString()}
                              {hasDiscrepancy && (
                                <span className="ml-1 text-xs">
                                  ({item.discrepancy! > 0 ? '+' : ''}{item.discrepancy})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-stone-400 dark:text-stone-500">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-stone-700 dark:text-stone-300">
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
                <tfoot className="border-t border-stone-200 dark:border-stone-600">
                  <tr>
                    <td colSpan={2} className="px-3 py-2 text-xs font-medium text-stone-500 dark:text-stone-400 uppercase">Totals</td>
                    <td className="px-3 py-2 text-right font-semibold text-stone-900 dark:text-white">
                      {transfer.lineItems.reduce((sum, i) => sum + i.quantity, 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-stone-900 dark:text-white">
                      {transfer.lineItems.reduce((sum, i) => sum + (i.receivedQuantity || 0), 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-stone-900 dark:text-white">
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
            <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Logistics
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-stone-500 dark:text-stone-400">Carrier</span>
                <p className="text-stone-900 dark:text-white font-medium">{transfer.carrier || '-'}</p>
              </div>
              <div>
                <span className="text-stone-500 dark:text-stone-400">Shipping Method</span>
                <p className="text-stone-900 dark:text-white font-medium capitalize">{transfer.shippingMethod?.replace('-', ' ') || '-'}</p>
              </div>
              <div>
                <span className="text-stone-500 dark:text-stone-400">Incoterms</span>
                <p className="text-stone-900 dark:text-white font-medium">{transfer.incoterms || '-'}</p>
              </div>
              <div>
                <span className="text-stone-500 dark:text-stone-400">Container #</span>
                <p className="text-stone-900 dark:text-white font-medium">{transfer.containerNumbers.join(', ') || '-'}</p>
              </div>
            </div>
            {/* Tracking Numbers */}
            {transfer.trackingNumbers.length > 0 && (
              <div className="mt-4">
                <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase">Tracking Numbers</span>
                <div className="mt-2 space-y-2">
                  {transfer.trackingNumbers.map(tracking => (
                    <div key={tracking.id} className="flex items-center justify-between bg-stone-50 dark:bg-stone-700/50 rounded px-3 py-2">
                      <div>
                        <span className="text-xs text-stone-500 dark:text-stone-400">{tracking.carrier}</span>
                        <p className="text-sm font-mono text-stone-900 dark:text-white">{tracking.trackingNumber}</p>
                      </div>
                      {tracking.trackingUrl && (
                        <a
                          href={tracking.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-lime-600 dark:text-lime-400 hover:underline"
                        >
                          Track <ExternalLink className="w-3.5 h-3.5" />
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
            <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-3">Dates</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-stone-500 dark:text-stone-400">Scheduled Departure</span>
                <p className="text-stone-900 dark:text-white font-medium">{formatDate(transfer.scheduledDepartureDate)}</p>
              </div>
              <div>
                <span className="text-stone-500 dark:text-stone-400">Actual Departure</span>
                <p className={`font-medium ${transfer.actualDepartureDate ? 'text-stone-900 dark:text-white' : 'text-stone-400 dark:text-stone-500'}`}>
                  {formatDate(transfer.actualDepartureDate)}
                </p>
              </div>
              <div>
                <span className="text-stone-500 dark:text-stone-400">Scheduled Arrival</span>
                <p className="text-stone-900 dark:text-white font-medium">{formatDate(transfer.scheduledArrivalDate)}</p>
              </div>
              <div>
                <span className="text-stone-500 dark:text-stone-400">Actual Arrival</span>
                <p className={`font-medium ${transfer.actualArrivalDate ? 'text-stone-900 dark:text-white' : 'text-stone-400 dark:text-stone-500'}`}>
                  {formatDate(transfer.actualArrivalDate)}
                </p>
              </div>
            </div>
          </section>

          {/* Costs */}
          <section>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-3">Costs</h3>
            <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                {transfer.costs.freight > 0 && (
                  <div className="flex justify-between">
                    <span className="text-stone-600 dark:text-stone-400">Freight</span>
                    <span className="text-stone-900 dark:text-white">${transfer.costs.freight.toLocaleString()}</span>
                  </div>
                )}
                {transfer.costs.insurance > 0 && (
                  <div className="flex justify-between">
                    <span className="text-stone-600 dark:text-stone-400">Insurance</span>
                    <span className="text-stone-900 dark:text-white">${transfer.costs.insurance.toLocaleString()}</span>
                  </div>
                )}
                {transfer.costs.duties > 0 && (
                  <div className="flex justify-between">
                    <span className="text-stone-600 dark:text-stone-400">Duties</span>
                    <span className="text-stone-900 dark:text-white">${transfer.costs.duties.toLocaleString()}</span>
                  </div>
                )}
                {transfer.costs.taxes > 0 && (
                  <div className="flex justify-between">
                    <span className="text-stone-600 dark:text-stone-400">Taxes</span>
                    <span className="text-stone-900 dark:text-white">${transfer.costs.taxes.toLocaleString()}</span>
                  </div>
                )}
                {transfer.costs.handling > 0 && (
                  <div className="flex justify-between">
                    <span className="text-stone-600 dark:text-stone-400">Handling</span>
                    <span className="text-stone-900 dark:text-white">${transfer.costs.handling.toLocaleString()}</span>
                  </div>
                )}
                {transfer.costs.other > 0 && (
                  <div className="flex justify-between">
                    <span className="text-stone-600 dark:text-stone-400">Other</span>
                    <span className="text-stone-900 dark:text-white">${transfer.costs.other.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-stone-200 dark:border-stone-600 pt-2 flex justify-between font-semibold">
                  <span className="text-stone-900 dark:text-white">Total</span>
                  <span className="text-stone-900 dark:text-white">${totalCost.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Customs */}
          {(transfer.customsInfo.hsCode || transfer.customsInfo.broker || transfer.customsInfo.status !== 'pending') && (
            <section>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-3">Customs</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-stone-500 dark:text-stone-400">HS Code</span>
                  <p className="text-stone-900 dark:text-white font-medium">{transfer.customsInfo.hsCode || '-'}</p>
                </div>
                <div>
                  <span className="text-stone-500 dark:text-stone-400">Customs Broker</span>
                  <p className="text-stone-900 dark:text-white font-medium">{transfer.customsInfo.broker || '-'}</p>
                </div>
                <div>
                  <span className="text-stone-500 dark:text-stone-400">Status</span>
                  <p className="text-stone-900 dark:text-white font-medium capitalize">{transfer.customsInfo.status.replace('-', ' ')}</p>
                </div>
                <div>
                  <span className="text-stone-500 dark:text-stone-400">Entry Number</span>
                  <p className="text-stone-900 dark:text-white font-medium">{transfer.customsInfo.entryNumber || '-'}</p>
                </div>
                {transfer.customsInfo.clearanceDate && (
                  <div>
                    <span className="text-stone-500 dark:text-stone-400">Clearance Date</span>
                    <p className="text-stone-900 dark:text-white font-medium">{formatDate(transfer.customsInfo.clearanceDate)}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Invoice */}
          <section>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Invoice
            </h3>
            <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg p-4">
              {hasInvoice ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                      <CheckCircle className="w-4 h-4" />
                      Invoice Created
                    </span>
                  </div>
                  {invoiceId && onViewInvoice && (
                    <button
                      onClick={() => onViewInvoice(invoiceId)}
                      className="flex items-center gap-1 text-sm text-lime-600 dark:text-lime-400 hover:underline"
                    >
                      View Invoice <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    {transfer.status === 'draft'
                      ? 'Transfer must be booked before creating invoice'
                      : 'No invoice created yet'}
                  </p>
                  <button
                    onClick={() => onCreateInvoice?.(transfer.id)}
                    disabled={transfer.status === 'draft'}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      transfer.status === 'draft'
                        ? 'bg-stone-100 text-stone-400 cursor-not-allowed dark:bg-stone-600 dark:text-stone-500'
                        : 'bg-lime-600 text-white hover:bg-lime-700 dark:bg-lime-500 dark:hover:bg-lime-600'
                    }`}
                  >
                    Create Invoice
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Shipping Quotes */}
          <ShippingQuotesSection
            transferId={transfer.id}
            onRequestQuotes={onRequestQuotes}
            onAddManualQuote={onAddManualQuote}
            onSelectQuote={onSelectQuote}
            onViewQuoteDetails={onViewQuoteDetails}
            onQuoteSelected={onQuoteSelected}
          />

          {/* Amazon Shipment */}
          {isAmazonDest && (
            <section>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-3">Amazon Shipment</h3>
              <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg p-4">
                {isEditingShipmentId ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">
                        Amazon Shipment ID
                      </label>
                      <input
                        type="text"
                        value={editedShipmentId}
                        onChange={(e) => setEditedShipmentId(e.target.value.toUpperCase())}
                        placeholder="e.g., FBA17ABC1234"
                        className="w-full px-3 py-2 bg-white dark:bg-stone-600 border border-stone-200 dark:border-stone-500 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent font-mono"
                        autoFocus
                      />
                      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                        Enter after creating inbound shipment in Seller Central
                      </p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={handleCancelEditShipmentId}
                        className="px-3 py-1.5 text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-600 rounded transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveShipmentId}
                        className="px-3 py-1.5 text-sm font-medium bg-lime-600 hover:bg-lime-700 text-white rounded transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : transfer.amazonShipmentId ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-stone-500 dark:text-stone-400">Shipment ID</span>
                      <p className="text-sm font-mono text-stone-900 dark:text-white">{transfer.amazonShipmentId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {onNavigateToAmazonShipment && (
                        <button
                          onClick={onNavigateToAmazonShipment}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-lime-600 dark:text-lime-400 hover:bg-lime-50 dark:hover:bg-lime-900/20 rounded transition-colors"
                        >
                          <Link className="w-4 h-4" />
                          View in Shipments
                        </button>
                      )}
                      <button
                        onClick={() => setIsEditingShipmentId(true)}
                        className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                      No Amazon Shipment ID linked yet
                    </p>
                    <button
                      onClick={() => setIsEditingShipmentId(true)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-lime-600 dark:text-lime-400 hover:bg-lime-50 dark:hover:bg-lime-900/20 rounded transition-colors"
                    >
                      <Plus className="w-4 h-4" />
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
              <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-3">Amazon Receiving</h3>
              <AmazonReceiving
                receiving={transfer.amazonReceiving}
                onUpdate={onUpdateAmazonReceiving}
              />
            </section>
          )}

          {/* Documents */}
          {transfer.documents.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-3">Shipping Documents ({transfer.documents.length})</h3>
              <div className="space-y-2">
                {transfer.documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between bg-stone-50 dark:bg-stone-700/50 rounded px-3 py-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-stone-400" />
                      <div>
                        <p className="text-sm text-stone-900 dark:text-white">{doc.name}</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 capitalize">{doc.documentType.replace(/-/g, ' ')}</p>
                      </div>
                    </div>
                    <button className="text-xs text-lime-600 dark:text-lime-400 hover:underline">
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Generate Manifest */}
          {onGenerateManifest && (
            <section>
              <div className="flex items-center justify-between bg-stone-50 dark:bg-stone-700/50 rounded-lg p-4">
                <div>
                  <p className="text-sm font-medium text-stone-900 dark:text-white">Shipping Manifest</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Generate PDF manifest for this transfer</p>
                </div>
                <button
                  onClick={onGenerateManifest}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-lime-600 hover:bg-lime-700 text-white rounded-lg transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Generate PDF
                </button>
              </div>
            </section>
          )}

          {/* Notes */}
          {transfer.notes && (
            <section>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-3">Notes</h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-700/50 rounded-lg p-3">
                {transfer.notes}
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

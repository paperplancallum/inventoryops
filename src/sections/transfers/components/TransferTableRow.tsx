'use client'

import { useState } from 'react'
import { MoreVertical, Package, FileText, CheckCircle, AlertCircle, Link, AlertTriangle, Clock, MessageSquare, Link2 } from 'lucide-react'
import type {
  Transfer,
  TransferStatus,
  TransferStatusOption,
  ShippingMethodOption,
  ShippingAgent,
  AmazonShipment,
} from '../types'
import type { Location } from '@/sections/suppliers/types'

export type QuoteStatus = 'no_quotes' | 'awaiting_quotes' | 'quotes_received' | 'confirmed'

interface TransferTableRowProps {
  transfer: Transfer
  transferStatuses: TransferStatusOption[]
  shippingMethods: ShippingMethodOption[]
  destinationLocation?: Location
  linkedAmazonShipment?: AmazonShipment
  shippingAgent?: ShippingAgent
  quoteStatus?: QuoteStatus
  selectedQuoteAmount?: number | null
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onUpdateStatus?: (newStatus: TransferStatus) => void
  onViewAgent?: () => void
  hasInvoice?: boolean
  invoiceStatus?: 'paid' | 'partial' | 'overdue' | 'unpaid'
  onCreateInvoice?: () => void
  onNavigateToAmazonShipment?: () => void
  onRequestQuotes?: () => void
  onGenerateMagicLink?: () => void
}

const statusColors: Record<TransferStatus, string> = {
  draft: 'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-300',
  booked: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  'in-transit': 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  delivered: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
  completed: 'bg-lime-100 text-lime-700 dark:bg-lime-900/50 dark:text-lime-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
}

const methodColors: Record<string, string> = {
  'ocean-fcl': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  'ocean-lcl': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  'air-freight': 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
  'air-express': 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
  ground: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  rail: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
  courier: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
}

const locationTypeLabels: Record<string, string> = {
  factory: 'Factory',
  warehouse: 'Warehouse',
  '3pl': '3PL',
  amazon_fba: 'Amazon FBA',
  amazon_awd: 'Amazon AWD',
  port: 'Port',
  customs: 'Customs',
}

const locationTypeColors: Record<string, string> = {
  factory: 'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-300',
  warehouse: 'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-300',
  '3pl': 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  amazon_fba: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
  amazon_awd: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  port: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  customs: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
}

export function TransferTableRow({
  transfer,
  transferStatuses,
  shippingMethods,
  destinationLocation,
  linkedAmazonShipment,
  shippingAgent,
  quoteStatus,
  selectedQuoteAmount,
  onView,
  onEdit,
  onDelete,
  onUpdateStatus,
  onViewAgent,
  hasInvoice,
  invoiceStatus,
  onCreateInvoice,
  onNavigateToAmazonShipment,
  onRequestQuotes,
  onGenerateMagicLink,
}: TransferTableRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const statusLabel = transferStatuses.find((s) => s.id === transfer.status)?.label || transfer.status
  const methodLabel = shippingMethods.find((m) => m.id === transfer.shippingMethod)?.label || transfer.shippingMethod

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const renderInvoiceStatus = () => {
    if (!hasInvoice) {
      return <span className="text-xs text-stone-400 dark:text-stone-500">-</span>
    }

    switch (invoiceStatus) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
            <CheckCircle className="w-3 h-3" />
            Paid
          </span>
        )
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
            <FileText className="w-3 h-3" />
            Partial
          </span>
        )
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
            <AlertCircle className="w-3 h-3" />
            Overdue
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-300">
            <FileText className="w-3 h-3" />
            Unpaid
          </span>
        )
    }
  }

  const renderQuoteStatus = () => {
    // Derive status from transfer if not provided
    const effectiveStatus = quoteStatus ?? (transfer.quoteConfirmedAt ? 'confirmed' : 'no_quotes')

    switch (effectiveStatus) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
            <CheckCircle className="w-3 h-3" />
            {selectedQuoteAmount !== null && selectedQuoteAmount !== undefined
              ? `$${selectedQuoteAmount.toLocaleString()}`
              : 'Confirmed'}
          </span>
        )
      case 'quotes_received':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
            <MessageSquare className="w-3 h-3" />
            Review
          </span>
        )
      case 'awaiting_quotes':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
            <Clock className="w-3 h-3" />
            Awaiting
          </span>
        )
      default:
        // Only show "Needs Quote" if transfer can still be edited (draft/booked)
        if (transfer.status === 'draft' || transfer.status === 'booked') {
          return (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRequestQuotes?.()
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/70 transition-colors"
            >
              <AlertTriangle className="w-3 h-3" />
              Needs Quote
            </button>
          )
        }
        return <span className="text-xs text-stone-400 dark:text-stone-500">-</span>
    }
  }

  return (
    <tr className="hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors">
      {/* Transfer Number */}
      <td className="px-4 py-3">
        <button
          onClick={onView}
          className="text-sm font-medium text-lime-600 dark:text-lime-400 hover:text-lime-800 dark:hover:text-lime-300"
        >
          {transfer.transferNumber}
        </button>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[transfer.status]}`}
        >
          {statusLabel}
        </span>
      </td>

      {/* From */}
      <td className="px-4 py-3">
        <span
          className="text-sm text-stone-700 dark:text-stone-300 truncate block max-w-[120px]"
          title={transfer.sourceLocationName}
        >
          {transfer.sourceLocationName || 'Unknown'}
        </span>
      </td>

      {/* To */}
      <td className="px-4 py-3">
        <span
          className="text-sm text-stone-700 dark:text-stone-300 truncate block max-w-[120px]"
          title={transfer.destinationLocationName}
        >
          {transfer.destinationLocationName || 'Unknown'}
        </span>
      </td>

      {/* Destination Type */}
      <td className="px-4 py-3">
        {destinationLocation ? (
          linkedAmazonShipment &&
          (destinationLocation.type === 'amazon_fba' || destinationLocation.type === 'amazon_awd') ? (
            <button
              onClick={onNavigateToAmazonShipment}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors hover:ring-2 hover:ring-lime-500 hover:ring-offset-1 cursor-pointer ${
                locationTypeColors[destinationLocation.type] ||
                'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-300'
              }`}
              title={`View linked shipment: ${linkedAmazonShipment.shipmentId}`}
            >
              {locationTypeLabels[destinationLocation.type] || destinationLocation.type}
              <Link className="w-3 h-3" />
            </button>
          ) : (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                locationTypeColors[destinationLocation.type] ||
                'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-300'
              }`}
            >
              {locationTypeLabels[destinationLocation.type] || destinationLocation.type}
            </span>
          )
        ) : (
          <span className="text-sm text-stone-400">-</span>
        )}
      </td>

      {/* Line Items */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 text-sm text-stone-600 dark:text-stone-400">
          <Package className="w-3.5 h-3.5" />
          <span>
            {transfer.lineItems.length} item{transfer.lineItems.length !== 1 ? 's' : ''}
          </span>
          <span className="text-stone-400 dark:text-stone-500">
            ({transfer.totalUnits.toLocaleString()} units)
          </span>
        </div>
      </td>

      {/* Agent */}
      <td className="px-4 py-3">
        {shippingAgent ? (
          <button
            onClick={onViewAgent}
            className="text-sm font-medium text-lime-600 dark:text-lime-400 hover:text-lime-800 dark:hover:text-lime-300 truncate block max-w-[100px]"
            title={shippingAgent.name}
          >
            {shippingAgent.name}
          </button>
        ) : (
          <span className="text-sm text-stone-400">-</span>
        )}
      </td>

      {/* Carrier */}
      <td className="px-4 py-3">
        <span className="text-sm text-stone-700 dark:text-stone-300">{transfer.carrier || '-'}</span>
      </td>

      {/* Method */}
      <td className="px-4 py-3">
        {transfer.shippingMethod ? (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              methodColors[transfer.shippingMethod] ||
              'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-300'
            }`}
          >
            {methodLabel}
          </span>
        ) : (
          <span className="text-sm text-stone-400">-</span>
        )}
      </td>

      {/* Quote Status */}
      <td className="px-4 py-3">{renderQuoteStatus()}</td>

      {/* Depart Date */}
      <td className="px-4 py-3">
        <div className="text-sm">
          <span
            className={
              transfer.actualDepartureDate
                ? 'text-stone-700 dark:text-stone-300'
                : 'text-stone-400 dark:text-stone-500'
            }
          >
            {formatDate(transfer.actualDepartureDate || transfer.scheduledDepartureDate)}
          </span>
          {!transfer.actualDepartureDate && transfer.scheduledDepartureDate && (
            <span className="text-xs text-stone-400 dark:text-stone-500 ml-1">(sched)</span>
          )}
        </div>
      </td>

      {/* Arrive Date */}
      <td className="px-4 py-3">
        <div className="text-sm">
          <span
            className={
              transfer.actualArrivalDate
                ? 'text-stone-700 dark:text-stone-300'
                : 'text-stone-400 dark:text-stone-500'
            }
          >
            {formatDate(transfer.actualArrivalDate || transfer.scheduledArrivalDate)}
          </span>
          {!transfer.actualArrivalDate && transfer.scheduledArrivalDate && (
            <span className="text-xs text-stone-400 dark:text-stone-500 ml-1">(sched)</span>
          )}
        </div>
      </td>

      {/* Cost */}
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
          {transfer.totalCost > 0 ? `$${transfer.totalCost.toLocaleString()}` : '-'}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-400 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-stone-800 rounded-lg shadow-lg border border-stone-200 dark:border-stone-700 py-1 z-20">
                <button
                  onClick={() => {
                    onView?.()
                    setMenuOpen(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700"
                >
                  View Details
                </button>
                <button
                  onClick={() => {
                    onEdit?.()
                    setMenuOpen(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700"
                >
                  Edit Transfer
                </button>
                {transfer.status === 'draft' && (
                  <button
                    onClick={() => {
                      onUpdateStatus?.('booked')
                      setMenuOpen(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-blue-600 dark:text-blue-400 hover:bg-stone-50 dark:hover:bg-stone-700"
                  >
                    Mark as Booked
                  </button>
                )}
                {transfer.status === 'booked' && (
                  <button
                    onClick={() => {
                      onUpdateStatus?.('in-transit')
                      setMenuOpen(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-amber-600 dark:text-amber-400 hover:bg-stone-50 dark:hover:bg-stone-700"
                  >
                    Mark In Transit
                  </button>
                )}
                {transfer.status === 'in-transit' && (
                  <button
                    onClick={() => {
                      onUpdateStatus?.('delivered')
                      setMenuOpen(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-cyan-600 dark:text-cyan-400 hover:bg-stone-50 dark:hover:bg-stone-700"
                  >
                    Mark Delivered
                  </button>
                )}
                {transfer.status === 'delivered' && (
                  <button
                    onClick={() => {
                      onUpdateStatus?.('completed')
                      setMenuOpen(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-lime-600 dark:text-lime-400 hover:bg-stone-50 dark:hover:bg-stone-700"
                  >
                    Mark Completed
                  </button>
                )}
                {!hasInvoice && transfer.status !== 'draft' && (
                  <button
                    onClick={() => {
                      onCreateInvoice?.()
                      setMenuOpen(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-lime-600 dark:text-lime-400 hover:bg-stone-50 dark:hover:bg-stone-700"
                  >
                    Create Invoice
                  </button>
                )}
                {onGenerateMagicLink && transfer.status !== 'cancelled' && (
                  <button
                    onClick={() => {
                      onGenerateMagicLink()
                      setMenuOpen(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-indigo-600 dark:text-indigo-400 hover:bg-stone-50 dark:hover:bg-stone-700 flex items-center gap-2"
                  >
                    <Link2 className="w-4 h-4" />
                    Generate Magic Link
                  </button>
                )}
                <div className="border-t border-stone-200 dark:border-stone-700 my-1" />
                <button
                  onClick={() => {
                    onDelete?.()
                    setMenuOpen(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-stone-50 dark:hover:bg-stone-700"
                >
                  Delete Transfer
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

import { useState } from 'react'
import type { Transfer, TransferStatus, TransferStatusOption, ShippingMethodOption, Location, AmazonShipment } from '@/../product/sections/transfers/types'
import type { PaymentStatus } from '@/../product/sections/invoices-and-payments/types'

// Icons
const ArrowRightIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
)

const MoreVerticalIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
)

const PackageIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)

const MinusCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className || "w-3 h-3"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className || "w-3 h-3"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const DocumentTextIcon = ({ className }: { className?: string }) => (
  <svg className={className || "w-3 h-3"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const ExclamationCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className || "w-3 h-3"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const DocumentPlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

interface TransferTableRowProps {
  transfer: Transfer
  transferStatuses: TransferStatusOption[]
  shippingMethods: ShippingMethodOption[]
  /** Destination location for displaying type */
  destinationLocation?: Location
  /** Linked Amazon shipment if destination is FBA/AWD */
  linkedAmazonShipment?: AmazonShipment
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onUpdateStatus?: (newStatus: TransferStatus) => void
  /** Whether an invoice exists for this transfer */
  hasInvoice?: boolean
  /** Invoice payment status if exists */
  invoiceStatus?: PaymentStatus
  onCreateInvoice?: () => void
  /** Navigate to linked Amazon shipment */
  onNavigateToAmazonShipment?: () => void
}

const statusColors: Record<TransferStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  booked: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
  'in-transit': 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  delivered: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
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

// Location type labels
const locationTypeLabels: Record<string, string> = {
  'factory': 'Factory',
  'warehouse': 'Warehouse',
  '3pl': '3PL',
  'amazon-fba': 'FBA',
  'amazon-awd': 'AWD',
  'port': 'Port',
  'customs': 'Customs',
}

// Location type colors
const locationTypeColors: Record<string, string> = {
  'factory': 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  'warehouse': 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  '3pl': 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  'amazon-fba': 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
  'amazon-awd': 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  'port': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  'customs': 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
}

// Link icon for Amazon shipments
const LinkIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
)

export function TransferTableRow({
  transfer,
  transferStatuses,
  shippingMethods,
  destinationLocation,
  linkedAmazonShipment,
  onView,
  onEdit,
  onDelete,
  onUpdateStatus,
  hasInvoice,
  invoiceStatus,
  onCreateInvoice,
  onNavigateToAmazonShipment,
}: TransferTableRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const statusLabel = transferStatuses.find(s => s.id === transfer.status)?.label || transfer.status
  const methodLabel = shippingMethods.find(m => m.id === transfer.shippingMethod)?.label || transfer.shippingMethod

  const totalCost = transfer.costs.freight + transfer.costs.insurance + transfer.costs.duties +
    transfer.costs.taxes + transfer.costs.handling + transfer.costs.other

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Render invoice status badge
  const renderInvoiceStatus = () => {
    if (!hasInvoice) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
          <MinusCircleIcon className="w-3.5 h-3.5" />
          —
        </span>
      )
    }

    switch (invoiceStatus) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
            <CheckCircleIcon className="w-3.5 h-3.5" />
            Paid
          </span>
        )
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
            <DocumentTextIcon className="w-3.5 h-3.5" />
            Partial
          </span>
        )
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
            <ExclamationCircleIcon className="w-3.5 h-3.5" />
            Overdue
          </span>
        )
      case 'unpaid':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            <DocumentTextIcon className="w-3.5 h-3.5" />
            Unpaid
          </span>
        )
    }
  }

  const totalUnits = transfer.totalUnits

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
      {/* Transfer Number */}
      <td className="px-4 py-3">
        <button
          onClick={onView}
          className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
        >
          {transfer.transferNumber}
        </button>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[transfer.status]}`}>
          {statusLabel}
        </span>
      </td>

      {/* Route */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-700 dark:text-slate-300 truncate max-w-[120px]" title={transfer.sourceLocationName}>
            {transfer.sourceLocationName.split(' ').slice(0, 2).join(' ')}
          </span>
          <ArrowRightIcon />
          <span className="text-slate-700 dark:text-slate-300 truncate max-w-[120px]" title={transfer.destinationLocationName}>
            {transfer.destinationLocationName.split(' ').slice(0, 2).join(' ')}
          </span>
        </div>
      </td>

      {/* Destination Type */}
      <td className="px-4 py-3">
        {destinationLocation ? (
          linkedAmazonShipment && (destinationLocation.type === 'amazon-fba' || destinationLocation.type === 'amazon-awd') ? (
            <button
              onClick={onNavigateToAmazonShipment}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors hover:ring-2 hover:ring-indigo-500 hover:ring-offset-1 cursor-pointer ${locationTypeColors[destinationLocation.type] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}
              title={`View linked shipment: ${linkedAmazonShipment.shipmentId}`}
            >
              {locationTypeLabels[destinationLocation.type] || destinationLocation.type}
              <LinkIcon />
            </button>
          ) : (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${locationTypeColors[destinationLocation.type] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
              {locationTypeLabels[destinationLocation.type] || destinationLocation.type}
            </span>
          )
        ) : (
          <span className="text-sm text-slate-400">-</span>
        )}
      </td>

      {/* Line Items */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
          <PackageIcon />
          <span>{transfer.lineItems.length} item{transfer.lineItems.length !== 1 ? 's' : ''}</span>
          <span className="text-slate-400 dark:text-slate-500">({totalUnits.toLocaleString()} units)</span>
        </div>
      </td>

      {/* Carrier */}
      <td className="px-4 py-3">
        <span className="text-sm text-slate-700 dark:text-slate-300">
          {transfer.carrier || '-'}
        </span>
      </td>

      {/* Method */}
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${methodColors[transfer.shippingMethod] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
          {methodLabel}
        </span>
      </td>

      {/* Invoice Status */}
      <td className="px-4 py-3">
        {renderInvoiceStatus()}
      </td>

      {/* Depart Date */}
      <td className="px-4 py-3">
        <div className="text-sm">
          <span className={transfer.actualDepartureDate ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}>
            {formatDate(transfer.actualDepartureDate || transfer.scheduledDepartureDate)}
          </span>
          {!transfer.actualDepartureDate && transfer.scheduledDepartureDate && (
            <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">(sched)</span>
          )}
        </div>
      </td>

      {/* Arrive Date */}
      <td className="px-4 py-3">
        <div className="text-sm">
          <span className={transfer.actualArrivalDate ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}>
            {formatDate(transfer.actualArrivalDate || transfer.scheduledArrivalDate)}
          </span>
          {!transfer.actualArrivalDate && transfer.scheduledArrivalDate && (
            <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">(sched)</span>
          )}
        </div>
      </td>

      {/* Cost */}
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {totalCost > 0 ? `$${totalCost.toLocaleString()}` : '-'}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <MoreVerticalIcon />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20">
                <button
                  onClick={() => { onView?.(); setMenuOpen(false) }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  View Details
                </button>
                <button
                  onClick={() => { onEdit?.(); setMenuOpen(false) }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Edit Transfer
                </button>
                {transfer.status === 'draft' && (
                  <button
                    onClick={() => { onUpdateStatus?.('booked'); setMenuOpen(false) }}
                    className="w-full px-4 py-2 text-left text-sm text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Mark as Booked
                  </button>
                )}
                {transfer.status === 'booked' && (
                  <button
                    onClick={() => { onUpdateStatus?.('in-transit'); setMenuOpen(false) }}
                    className="w-full px-4 py-2 text-left text-sm text-amber-600 dark:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Mark In Transit
                  </button>
                )}
                {transfer.status === 'in-transit' && (
                  <button
                    onClick={() => { onUpdateStatus?.('delivered'); setMenuOpen(false) }}
                    className="w-full px-4 py-2 text-left text-sm text-cyan-600 dark:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Mark Delivered
                  </button>
                )}
                {transfer.status === 'delivered' && (
                  <button
                    onClick={() => { onUpdateStatus?.('completed'); setMenuOpen(false) }}
                    className="w-full px-4 py-2 text-left text-sm text-green-600 dark:text-green-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Mark Completed
                  </button>
                )}
                {!hasInvoice && transfer.status !== 'draft' && (
                  <button
                    onClick={() => { onCreateInvoice?.(); setMenuOpen(false) }}
                    className="w-full px-4 py-2 text-left text-sm text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <DocumentPlusIcon />
                    Create Invoice
                  </button>
                )}
                <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
                <button
                  onClick={() => { onDelete?.(); setMenuOpen(false) }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-700"
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

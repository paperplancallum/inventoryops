'use client'

import { ChevronDown, ChevronRight, RefreshCw, ExternalLink, Link2 } from 'lucide-react'
import type { AmazonShipment, AmazonShipmentStatus, AmazonInboundType } from '../types'
import { AmazonShipmentItemsTable } from './AmazonShipmentItemsTable'

interface AmazonShipmentRowProps {
  shipment: AmazonShipment
  isExpanded: boolean
  onToggleExpand: () => void
  onRefresh?: () => void
  onViewDetails?: () => void
  onLinkToTransfer?: () => void
}

const STATUS_STYLES: Record<AmazonShipmentStatus, { bg: string; text: string }> = {
  WORKING: { bg: 'bg-stone-100 dark:bg-stone-700', text: 'text-stone-700 dark:text-stone-300' },
  READY_TO_SHIP: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
  SHIPPED: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  IN_TRANSIT: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  DELIVERED: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400' },
  CHECKED_IN: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400' },
  RECEIVING: { bg: 'bg-lime-100 dark:bg-lime-900/30', text: 'text-lime-700 dark:text-lime-400' },
  CLOSED: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
  CANCELLED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
  DELETED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
  ERROR: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
}

const STATUS_LABELS: Record<AmazonShipmentStatus, string> = {
  WORKING: 'Working',
  READY_TO_SHIP: 'Ready to Ship',
  SHIPPED: 'Shipped',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  CHECKED_IN: 'Checked In',
  RECEIVING: 'Receiving',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
  DELETED: 'Deleted',
  ERROR: 'Error',
}

const SHIPMENT_TYPE_LABELS: Record<string, string> = {
  SP: 'Small Parcel',
  LTL: 'LTL',
  FTL: 'Full Truck',
}

const INBOUND_TYPE_STYLES: Record<AmazonInboundType, { bg: string; text: string }> = {
  FBA: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
  AWD: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' },
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function AmazonShipmentRow({
  shipment,
  isExpanded,
  onToggleExpand,
  onRefresh,
  onViewDetails,
  onLinkToTransfer,
}: AmazonShipmentRowProps) {
  const statusStyle = STATUS_STYLES[shipment.status]

  return (
    <>
      <tr
        className="hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer group"
        onClick={onToggleExpand}
      >
        {/* Expand toggle */}
        <td className="px-4 py-3 w-10">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand()
            }}
            className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-stone-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-stone-500" />
            )}
          </button>
        </td>

        {/* Shipment ID */}
        <td className="px-4 py-3">
          <div className="flex flex-col">
            <span className="font-mono text-sm font-medium text-stone-900 dark:text-stone-100">
              {shipment.shipmentId}
            </span>
            {shipment.linkedTransferId && (
              <span className="text-xs text-lime-600 dark:text-lime-400 flex items-center gap-1 mt-0.5">
                <Link2 className="w-3 h-3" />
                Linked
              </span>
            )}
          </div>
        </td>

        {/* Name */}
        <td className="px-4 py-3 text-sm text-stone-700 dark:text-stone-300 max-w-xs truncate">
          {shipment.shipmentName}
        </td>

        {/* Inbound Type */}
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${INBOUND_TYPE_STYLES[shipment.inboundType]?.bg || ''} ${INBOUND_TYPE_STYLES[shipment.inboundType]?.text || ''}`}
          >
            {shipment.inboundType}
          </span>
        </td>

        {/* Status */}
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
          >
            {STATUS_LABELS[shipment.status]}
          </span>
        </td>

        {/* Destination FC */}
        <td className="px-4 py-3">
          <span className="font-mono text-sm font-medium text-stone-900 dark:text-stone-100">
            {shipment.destinationFcId}
          </span>
        </td>

        {/* Type */}
        <td className="px-4 py-3">
          {shipment.shipmentType && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400">
              {SHIPMENT_TYPE_LABELS[shipment.shipmentType] || shipment.shipmentType}
            </span>
          )}
        </td>

        {/* Units */}
        <td className="px-4 py-3 text-sm text-right tabular-nums text-stone-900 dark:text-stone-100">
          {shipment.totalUnits.toLocaleString()}
        </td>

        {/* Boxes */}
        <td className="px-4 py-3 text-sm text-right tabular-nums text-stone-600 dark:text-stone-400">
          {shipment.boxCount > 0 ? shipment.boxCount : '-'}
        </td>

        {/* Created */}
        <td className="px-4 py-3 text-sm text-stone-600 dark:text-stone-400">
          {formatDate(shipment.createdDate)}
        </td>

        {/* Last Updated */}
        <td className="px-4 py-3 text-sm text-stone-600 dark:text-stone-400">
          {formatDate(shipment.lastUpdatedDate)}
        </td>

        {/* Actions */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onRefresh && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRefresh()
                }}
                className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700"
                title="Refresh from Amazon"
              >
                <RefreshCw className="w-4 h-4 text-stone-500" />
              </button>
            )}
            {onViewDetails && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onViewDetails()
                }}
                className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700"
                title="View in Seller Central"
              >
                <ExternalLink className="w-4 h-4 text-stone-500" />
              </button>
            )}
            {onLinkToTransfer && !shipment.linkedTransferId && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onLinkToTransfer()
                }}
                className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700"
                title="Link to Transfer"
              >
                <Link2 className="w-4 h-4 text-stone-500" />
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded content - items table */}
      {isExpanded && (
        <tr>
          <td colSpan={12} className="p-0">
            <AmazonShipmentItemsTable items={shipment.items} />
          </td>
        </tr>
      )}
    </>
  )
}

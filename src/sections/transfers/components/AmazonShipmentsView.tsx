'use client'

import { useState, useMemo } from 'react'
import { Search, Package, Truck, Building2, Clock } from 'lucide-react'
import type { AmazonShipment, AmazonShipmentStatus } from '../types'
import { AmazonShipmentRow } from './AmazonShipmentRow'

interface AmazonShipmentsViewProps {
  shipments: AmazonShipment[]
  onRefreshShipment?: (shipmentId: string) => void
  onViewShipmentDetails?: (shipmentId: string) => void
  onLinkToTransfer?: (shipmentId: string) => void
}

type StatusFilter = 'all' | 'active' | 'at-amazon' | 'closed'

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'at-amazon', label: 'At Amazon' },
  { id: 'closed', label: 'Closed' },
]

const ACTIVE_STATUSES: AmazonShipmentStatus[] = ['WORKING', 'READY_TO_SHIP', 'SHIPPED', 'IN_TRANSIT']
const AT_AMAZON_STATUSES: AmazonShipmentStatus[] = ['DELIVERED', 'CHECKED_IN', 'RECEIVING']
const CLOSED_STATUSES: AmazonShipmentStatus[] = ['CLOSED', 'CANCELLED', 'DELETED', 'ERROR']

export function AmazonShipmentsView({
  shipments,
  onRefreshShipment,
  onViewShipmentDetails,
  onLinkToTransfer,
}: AmazonShipmentsViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Compute stats
  const stats = useMemo(() => {
    const inTransit = shipments.filter((s) => ACTIVE_STATUSES.includes(s.status)).length
    const atAmazon = shipments.filter((s) => AT_AMAZON_STATUSES.includes(s.status)).length
    const closed = shipments.filter((s) => s.status === 'CLOSED').length
    const pendingUnits = shipments
      .filter((s) => !CLOSED_STATUSES.includes(s.status))
      .reduce((sum, s) => {
        const receivedUnits = s.items.reduce((itemSum, item) => itemSum + item.quantityReceived, 0)
        return sum + (s.totalUnits - receivedUnits)
      }, 0)

    return { total: shipments.length, inTransit, atAmazon, closed, pendingUnits }
  }, [shipments])

  // Filter shipments
  const filteredShipments = useMemo(() => {
    let filtered = shipments

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter((s) => ACTIVE_STATUSES.includes(s.status))
    } else if (statusFilter === 'at-amazon') {
      filtered = filtered.filter((s) => AT_AMAZON_STATUSES.includes(s.status))
    } else if (statusFilter === 'closed') {
      filtered = filtered.filter((s) => CLOSED_STATUSES.includes(s.status))
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          s.shipmentId.toLowerCase().includes(query) ||
          s.shipmentName.toLowerCase().includes(query) ||
          s.destinationFcId.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [shipments, statusFilter, searchQuery])

  const toggleExpand = (shipmentId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(shipmentId)) {
        next.delete(shipmentId)
      } else {
        next.add(shipmentId)
      }
      return next
    })
  }

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-stone-800 rounded-lg p-4 border border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-stone-100 dark:bg-stone-700">
              <Package className="w-5 h-5 text-stone-600 dark:text-stone-400" />
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                Total Shipments
              </p>
              <p className="text-2xl font-bold text-stone-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-800 rounded-lg p-4 border border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                In Transit
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.inTransit}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-800 rounded-lg p-4 border border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
              <Building2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                At Amazon
              </p>
              <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{stats.atAmazon}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-800 rounded-lg p-4 border border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                Units Pending
              </p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {stats.pendingUnits.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by ID, name, or FC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 rounded-lg p-1">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                statusFilter === filter.id
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider w-10">
                  {/* Expand */}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Shipment ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Destination
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Ship Method
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Units
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Boxes
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider w-24">
                  {/* Actions */}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
              {filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-stone-500 dark:text-stone-400">
                    {searchQuery || statusFilter !== 'all'
                      ? 'No shipments match your filters'
                      : 'No Amazon shipments found'}
                  </td>
                </tr>
              ) : (
                filteredShipments.map((shipment) => (
                  <AmazonShipmentRow
                    key={shipment.shipmentId}
                    shipment={shipment}
                    isExpanded={expandedIds.has(shipment.shipmentId)}
                    onToggleExpand={() => toggleExpand(shipment.shipmentId)}
                    onRefresh={onRefreshShipment ? () => onRefreshShipment(shipment.shipmentId) : undefined}
                    onViewDetails={
                      onViewShipmentDetails ? () => onViewShipmentDetails(shipment.shipmentId) : undefined
                    }
                    onLinkToTransfer={
                      onLinkToTransfer ? () => onLinkToTransfer(shipment.shipmentId) : undefined
                    }
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

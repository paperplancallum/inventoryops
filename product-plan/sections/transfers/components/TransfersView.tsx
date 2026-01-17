import { useState } from 'react'
import type { TransfersProps, TransferStatus, TransfersViewTab, AmazonShipment } from '@/../product/sections/transfers/types'
import { TransferTableRow } from './TransferTableRow'
import { TransfersViewTabs } from './TransfersViewTabs'
import { ShippingAgentsView } from './ShippingAgentsView'
import { AmazonShipmentsView } from './AmazonShipmentsView'

// Icons
const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

const SearchIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
)

const MapPinIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

interface ExtendedTransfersProps extends TransfersProps {
  amazonShipments?: AmazonShipment[]
  onRefreshAmazonShipment?: (shipmentId: string) => void
  onViewAmazonShipmentDetails?: (shipmentId: string) => void
  onLinkAmazonToTransfer?: (shipmentId: string) => void
  /** Navigate to Amazon shipments tab and optionally select a shipment */
  onNavigateToAmazonShipment?: (shipmentId: string) => void
}

export function TransfersView({
  transfers,
  locations,
  transferStatuses,
  shippingMethods,
  shippingAgents = [],
  shippingServices = [],
  amazonShipments = [],
  onViewTransfer,
  onEditTransfer,
  onDeleteTransfer,
  onCreateTransfer,
  onUpdateStatus,
  onManageLocations,
  onViewAgent,
  onEditAgent,
  onDeleteAgent,
  onCreateAgent,
  onToggleAgentActive,
  onRefreshAmazonShipment,
  onViewAmazonShipmentDetails,
  onLinkAmazonToTransfer,
  onNavigateToAmazonShipment,
}: ExtendedTransfersProps) {
  const [activeTab, setActiveTab] = useState<TransfersViewTab>('transfers')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TransferStatus | 'all'>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')

  // Filter transfers
  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = searchQuery === '' ||
      transfer.transferNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.sourceLocationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.destinationLocationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.carrier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.lineItems.some(li => li.sku.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter
    const matchesMethod = methodFilter === 'all' || transfer.shippingMethod === methodFilter

    return matchesSearch && matchesStatus && matchesMethod
  })

  // Calculate summary stats
  const totalTransfers = transfers.length
  const inTransitCount = transfers.filter(t => t.status === 'in-transit').length
  const pendingDelivery = transfers.filter(t => t.status === 'delivered').length
  const thisMonthFreight = transfers
    .filter(t => {
      const created = new Date(t.createdAt)
      const now = new Date()
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
    })
    .reduce((sum, t) => sum + t.costs.freight, 0)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                Transfers
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Track shipments between locations
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onManageLocations?.()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-200 dark:border-slate-600"
              >
                <MapPinIcon />
                Locations
              </button>
              <button
                onClick={() => onCreateTransfer?.()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                <PlusIcon />
                New Transfer
              </button>
            </div>
          </div>

          {/* Stats Row - Only show for transfers tab */}
          {activeTab === 'transfers' && (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Transfers</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{totalTransfers}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">In Transit</p>
                <p className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-400">{inTransitCount}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Pending Delivery</p>
                <p className="mt-1 text-2xl font-semibold text-cyan-600 dark:text-cyan-400">{pendingDelivery}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">This Month Freight</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">${thisMonthFreight.toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="mt-6">
            <TransfersViewTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              transfersCount={transfers.length}
              agentsCount={shippingAgents.length}
              amazonShipmentsCount={amazonShipments.length}
            />
          </div>
        </div>

        {/* Toolbar - Only show for transfers tab */}
        {activeTab === 'transfers' && (
        <div className="px-6 pb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search transfers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TransferStatus | 'all')}
              className="appearance-none pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
            >
              <option value="all">All statuses</option>
              {transferStatuses.map(status => (
                <option key={status.id} value={status.id}>{status.label}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <FilterIcon />
            </div>
          </div>

          {/* Method Filter */}
          <div className="relative">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="appearance-none pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
            >
              <option value="all">All methods</option>
              {shippingMethods.map(method => (
                <option key={method.id} value={method.id}>{method.label}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <FilterIcon />
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'transfers' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Transfer #</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Route</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Dest. Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Carrier</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Invoice</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Depart</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Arrive</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Cost</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredTransfers.map(transfer => {
                    // Find destination location to get type
                    const destinationLocation = locations.find(l => l.id === transfer.destinationLocationId)
                    // Find linked Amazon shipment - prefer forward lookup by amazonShipmentId, fallback to reverse lookup
                    let linkedAmazonShipment: AmazonShipment | undefined
                    if (transfer.amazonShipmentId) {
                      // Forward lookup: transfer has amazonShipmentId stored
                      linkedAmazonShipment = amazonShipments.find(s => s.shipmentId === transfer.amazonShipmentId)
                    } else {
                      // Backward compatibility: reverse lookup by linkedTransferId on shipment
                      linkedAmazonShipment = amazonShipments.find(s => s.linkedTransferId === transfer.id)
                    }

                    return (
                      <TransferTableRow
                        key={transfer.id}
                        transfer={transfer}
                        transferStatuses={transferStatuses}
                        shippingMethods={shippingMethods}
                        destinationLocation={destinationLocation}
                        linkedAmazonShipment={linkedAmazonShipment}
                        onView={() => onViewTransfer?.(transfer.id)}
                        onEdit={() => onEditTransfer?.(transfer.id)}
                        onDelete={() => onDeleteTransfer?.(transfer.id)}
                        onUpdateStatus={(newStatus) => onUpdateStatus?.(transfer.id, newStatus)}
                        onNavigateToAmazonShipment={linkedAmazonShipment ? () => {
                          setActiveTab('amazon-shipments')
                          onNavigateToAmazonShipment?.(linkedAmazonShipment.shipmentId)
                        } : undefined}
                      />
                    )
                  })}
                </tbody>
              </table>
            </div>
            {filteredTransfers.length === 0 && (
              <div className="px-4 py-12 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No transfers found matching your criteria
                </p>
              </div>
            )}
            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing {filteredTransfers.length} of {transfers.length} transfers
              </p>
            </div>
          </div>
        )}

        {activeTab === 'shipping-agents' && (
          <ShippingAgentsView
            shippingAgents={shippingAgents}
            shippingServices={shippingServices}
            onViewAgent={onViewAgent}
            onEditAgent={onEditAgent}
            onDeleteAgent={onDeleteAgent}
            onCreateAgent={onCreateAgent}
            onToggleActive={onToggleAgentActive}
          />
        )}

        {activeTab === 'amazon-shipments' && (
          <AmazonShipmentsView
            shipments={amazonShipments}
            onRefreshShipment={onRefreshAmazonShipment}
            onViewShipmentDetails={onViewAmazonShipmentDetails}
            onLinkToTransfer={onLinkAmazonToTransfer}
          />
        )}
      </div>
    </div>
  )
}

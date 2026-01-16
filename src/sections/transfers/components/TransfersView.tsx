'use client'

import { useState } from 'react'
import { Plus, Search, Filter, MapPin, MessageSquare } from 'lucide-react'
import type {
  Transfer,
  TransferStatus,
  TransfersViewTab,
  ShippingAgent,
  ShippingServiceOption,
  ShippingMethodOption,
  TransferStatusOption,
  AmazonShipment,
} from '../types'
import type { Location } from '@/sections/suppliers/types'
import { TransferTableRow, QuoteStatus } from './TransferTableRow'
import { TransfersViewTabs } from './TransfersViewTabs'
import { ShippingAgentsView } from './ShippingAgentsView'
import { AmazonShipmentsView } from './AmazonShipmentsView'
import { TransferLineItemsView } from './TransferLineItemsView'
import type { TransferLineItemFlat, TransferLineItemsSummary } from './TransferLineItemsView'

interface TransfersViewProps {
  transfers: Transfer[]
  locations: Location[]
  transferStatuses: TransferStatusOption[]
  shippingMethods: ShippingMethodOption[]
  shippingAgents?: ShippingAgent[]
  shippingServices?: ShippingServiceOption[]
  amazonShipments?: AmazonShipment[]
  lineItems?: TransferLineItemFlat[]
  lineItemsSummary?: TransferLineItemsSummary
  onViewTransfer?: (id: string) => void
  onEditTransfer?: (id: string) => void
  onDeleteTransfer?: (id: string) => void
  onCreateTransfer?: () => void
  onUpdateStatus?: (id: string, status: TransferStatus) => void
  onManageLocations?: () => void
  onViewAgent?: (id: string) => void
  onEditAgent?: (id: string) => void
  onDeleteAgent?: (id: string) => void
  onCreateAgent?: () => void
  onToggleAgentActive?: (id: string) => void
  onRefreshAmazonShipment?: (shipmentId: string) => void
  onViewAmazonShipmentDetails?: (shipmentId: string) => void
  onLinkAmazonToTransfer?: (shipmentId: string) => void
  onNavigateToAmazonShipment?: (shipmentId: string) => void
  onRequestQuotes?: (transferId: string) => void
}

export function TransfersView({
  transfers,
  locations,
  transferStatuses,
  shippingMethods,
  shippingAgents = [],
  shippingServices = [],
  amazonShipments = [],
  lineItems = [],
  lineItemsSummary,
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
  onRequestQuotes,
}: TransfersViewProps) {
  const [activeTab, setActiveTab] = useState<TransfersViewTab>('transfers')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TransferStatus | 'all'>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<QuoteStatus | 'all'>('all')

  // Helper to determine quote status for a transfer
  const getQuoteStatus = (transfer: Transfer): QuoteStatus => {
    if (transfer.quoteConfirmedAt) return 'confirmed'
    // For now, we return 'no_quotes' as default - in practice this would come from the view/join
    return 'no_quotes'
  }

  // Filter transfers
  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = searchQuery === '' ||
      transfer.transferNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transfer.sourceLocationName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (transfer.destinationLocationName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      transfer.carrier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.lineItems.some(li => li.sku.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter
    const matchesMethod = methodFilter === 'all' || transfer.shippingMethod === methodFilter

    // Quote status filter
    const transferQuoteStatus = getQuoteStatus(transfer)
    const matchesQuoteStatus = quoteStatusFilter === 'all' || transferQuoteStatus === quoteStatusFilter

    return matchesSearch && matchesStatus && matchesMethod && matchesQuoteStatus
  })

  // Calculate summary stats
  const totalTransfers = transfers.length
  const inTransitCount = transfers.filter(t => t.status === 'in-transit').length
  const pendingDelivery = transfers.filter(t => t.status === 'delivered').length
  const needsQuotesCount = transfers.filter(t =>
    !t.quoteConfirmedAt && (t.status === 'draft' || t.status === 'booked')
  ).length
  const thisMonthFreight = transfers
    .filter(t => {
      const created = new Date(t.createdAt)
      const now = new Date()
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
    })
    .reduce((sum, t) => sum + t.costs.freight, 0)

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      {/* Header */}
      <div className="bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-stone-900 dark:text-white">
                Transfers
              </h1>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                Track shipments between locations
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onManageLocations?.()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-stone-700 hover:bg-stone-50 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 text-sm font-medium rounded-lg transition-colors border border-stone-200 dark:border-stone-600"
              >
                <MapPin className="w-4 h-4" />
                Locations
              </button>
              <button
                onClick={() => onCreateTransfer?.()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-lime-600 hover:bg-lime-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Transfer
              </button>
            </div>
          </div>

          {/* Stats Row - Only show for transfers tab */}
          {activeTab === 'transfers' && (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
              <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Total Transfers</p>
                <p className="mt-1 text-2xl font-semibold text-stone-900 dark:text-white">{totalTransfers}</p>
              </div>
              <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">In Transit</p>
                <p className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-400">{inTransitCount}</p>
              </div>
              <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Pending Delivery</p>
                <p className="mt-1 text-2xl font-semibold text-cyan-600 dark:text-cyan-400">{pendingDelivery}</p>
              </div>
              <button
                onClick={() => setQuoteStatusFilter('no_quotes')}
                className={`bg-stone-50 dark:bg-stone-700/50 rounded-lg px-4 py-3 text-left transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 ${
                  quoteStatusFilter === 'no_quotes' ? 'ring-2 ring-red-500' : ''
                }`}
              >
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  Needs Quote
                </p>
                <p className={`mt-1 text-2xl font-semibold ${needsQuotesCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-stone-400'}`}>
                  {needsQuotesCount}
                </p>
              </button>
              <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">This Month Freight</p>
                <p className="mt-1 text-2xl font-semibold text-stone-900 dark:text-white">${thisMonthFreight.toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="mt-6">
            <TransfersViewTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              transfersCount={transfers.length}
              lineItemsCount={lineItems.length}
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
              <Search className="w-4 h-4 text-stone-400" />
            </div>
            <input
              type="text"
              placeholder="Search transfers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TransferStatus | 'all')}
              className="appearance-none pl-3 pr-10 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent cursor-pointer"
            >
              <option value="all">All statuses</option>
              {transferStatuses.map(status => (
                <option key={status.id} value={status.id}>{status.label}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Filter className="w-4 h-4 text-stone-400" />
            </div>
          </div>

          {/* Method Filter */}
          <div className="relative">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="appearance-none pl-3 pr-10 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent cursor-pointer"
            >
              <option value="all">All methods</option>
              {shippingMethods.map(method => (
                <option key={method.id} value={method.id}>{method.label}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Filter className="w-4 h-4 text-stone-400" />
            </div>
          </div>

          {/* Quote Status Filter */}
          <div className="relative">
            <select
              value={quoteStatusFilter}
              onChange={(e) => setQuoteStatusFilter(e.target.value as QuoteStatus | 'all')}
              className="appearance-none pl-3 pr-10 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent cursor-pointer"
            >
              <option value="all">All quote statuses</option>
              <option value="no_quotes">Needs Quote</option>
              <option value="awaiting_quotes">Awaiting Quotes</option>
              <option value="quotes_received">Quotes Received</option>
              <option value="confirmed">Quote Confirmed</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <MessageSquare className="w-4 h-4 text-stone-400" />
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'transfers' && (
          <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-700">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Transfer #</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">From</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">To</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Dest. Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Agent</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Carrier</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Quote</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Depart</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Arrive</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Cost</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-700">
                  {filteredTransfers.map(transfer => {
                    // Find destination location to get type
                    const destinationLocation = locations.find(l => l.id === transfer.destinationLocationId)
                    // Find linked Amazon shipment
                    let linkedAmazonShipment: AmazonShipment | undefined
                    if (transfer.amazonShipmentId) {
                      linkedAmazonShipment = amazonShipments.find(s => s.shipmentId === transfer.amazonShipmentId)
                    }
                    // Find shipping agent
                    const shippingAgent = transfer.shippingAgentId
                      ? shippingAgents.find(a => a.id === transfer.shippingAgentId)
                      : undefined

                    return (
                      <TransferTableRow
                        key={transfer.id}
                        transfer={transfer}
                        transferStatuses={transferStatuses}
                        shippingMethods={shippingMethods}
                        destinationLocation={destinationLocation}
                        linkedAmazonShipment={linkedAmazonShipment}
                        shippingAgent={shippingAgent}
                        quoteStatus={getQuoteStatus(transfer)}
                        onView={() => onViewTransfer?.(transfer.id)}
                        onEdit={() => onEditTransfer?.(transfer.id)}
                        onDelete={() => onDeleteTransfer?.(transfer.id)}
                        onUpdateStatus={(newStatus) => onUpdateStatus?.(transfer.id, newStatus)}
                        onViewAgent={shippingAgent ? () => onViewAgent?.(shippingAgent.id) : undefined}
                        onNavigateToAmazonShipment={linkedAmazonShipment ? () => {
                          setActiveTab('amazon-shipments')
                          onNavigateToAmazonShipment?.(linkedAmazonShipment!.shipmentId)
                        } : undefined}
                        onRequestQuotes={() => onRequestQuotes?.(transfer.id)}
                      />
                    )
                  })}
                </tbody>
              </table>
            </div>
            {filteredTransfers.length === 0 && (
              <div className="px-4 py-12 text-center">
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  No transfers found matching your criteria
                </p>
              </div>
            )}
            <div className="px-4 py-3 border-t border-stone-200 dark:border-stone-700">
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Showing {filteredTransfers.length} of {transfers.length} transfers
              </p>
            </div>
          </div>
        )}

        {activeTab === 'line-items' && lineItemsSummary && (
          <TransferLineItemsView
            lineItems={lineItems}
            summary={lineItemsSummary}
            onViewTransfer={onViewTransfer}
            onViewAgent={onViewAgent}
          />
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

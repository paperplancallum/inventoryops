'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  X,
  Plus,
  Trash2,
  ChevronDown,
  Search,
} from 'lucide-react'
import type {
  Transfer,
  TransferLineItemInput,
  ShippingMethodOption,
  ShippingMethod,
  TransferFormData,
  ShippingAgent,
} from '../types'
import type { Location, LocationType } from '@/sections/suppliers/types'
import { TransferLineItemRow } from './TransferLineItemRow'

// Re-export for backward compatibility
export type { TransferFormData } from '../types'

// Available stock type for selecting items to transfer
export interface AvailableStock {
  id: string
  batchId: string
  sku: string
  productName: string
  locationId: string
  locationName: string
  availableQuantity: number
  allocatedQuantity?: number  // Units allocated to draft transfers
  totalQuantity?: number      // Total units at location (before allocations)
  unitCost: number
}

interface TransferFormProps {
  transfer?: Transfer
  locations: Location[]
  availableStock?: AvailableStock[]
  shippingMethods: ShippingMethodOption[]
  shippingAgents?: ShippingAgent[]
  preSelectedStockIds?: string[]
  initialLineItems?: TransferLineItemInput[]
  initialSourceLocationId?: string
  initialDestinationLocationId?: string
  isOpen?: boolean
  onSubmit?: (data: TransferFormData) => void
  onCancel?: () => void
  onClose?: () => void
}

const locationTypeLabels: Record<LocationType, string> = {
  factory: 'Factory',
  warehouse: 'Warehouse',
  '3pl': '3PL',
  'amazon_fba': 'Amazon FBA',
  'amazon_awd': 'Amazon AWD',
  port: 'Port',
  customs: 'Customs',
}

export function TransferForm({
  transfer,
  locations,
  availableStock = [],
  shippingMethods,
  shippingAgents = [],
  preSelectedStockIds,
  initialLineItems,
  initialSourceLocationId,
  initialDestinationLocationId,
  isOpen = true,
  onSubmit,
  onCancel,
  onClose,
}: TransferFormProps) {
  const isEditing = !!transfer

  // Initialize line items from transfer, initialLineItems prop, or pre-selected stock
  const getInitialLineItems = (): TransferLineItemInput[] => {
    if (transfer?.lineItems) {
      return transfer.lineItems.map(li => ({
        stockId: li.id,
        batchId: li.batchId,
        sku: li.sku,
        productName: li.productName,
        quantity: li.quantity,
        availableQuantity: li.quantity,
        unitCost: li.unitCost,
      }))
    }
    if (initialLineItems && initialLineItems.length > 0) {
      return initialLineItems.map(item => ({
        stockId: item.stockId,
        batchId: item.batchId,
        sku: item.sku,
        productName: item.productName,
        quantity: item.availableQuantity,
        availableQuantity: item.availableQuantity,
        unitCost: item.unitCost,
      }))
    }
    if (preSelectedStockIds && preSelectedStockIds.length > 0) {
      return availableStock
        .filter(s => preSelectedStockIds.includes(s.id))
        .map(s => ({
          stockId: s.id,
          batchId: s.batchId,
          sku: s.sku,
          productName: s.productName,
          quantity: s.availableQuantity,
          availableQuantity: s.availableQuantity,
          unitCost: s.unitCost,
        }))
    }
    return []
  }

  const [lineItems, setLineItems] = useState<TransferLineItemInput[]>(getInitialLineItems)
  const [stockSearchQuery, setStockSearchQuery] = useState('')
  const [showStockSelector, setShowStockSelector] = useState(false)

  // Determine source location from props or transfer
  const getInitialSourceLocation = () => {
    if (transfer?.sourceLocationId) return transfer.sourceLocationId
    if (initialSourceLocationId) return initialSourceLocationId
    if (initialLineItems && initialLineItems.length > 0) {
      const stock = availableStock.find(s => s.id === initialLineItems[0].stockId)
      return stock?.locationId || ''
    }
    if (preSelectedStockIds && preSelectedStockIds.length > 0) {
      const stock = availableStock.find(s => preSelectedStockIds.includes(s.id))
      return stock?.locationId || ''
    }
    return ''
  }

  const [formData, setFormData] = useState<Omit<TransferFormData, 'lineItems'>>({
    sourceLocationId: getInitialSourceLocation(),
    destinationLocationId: transfer?.destinationLocationId || '',
    shippingAgentId: transfer?.shippingAgentId || undefined,
    carrier: transfer?.carrier || '',
    carrierAccountNumber: transfer?.carrierAccountNumber || '',
    shippingMethod: transfer?.shippingMethod || 'ocean-fcl',
    scheduledDepartureDate: transfer?.scheduledDepartureDate || null,
    scheduledArrivalDate: transfer?.scheduledArrivalDate || null,
    incoterms: transfer?.incoterms || '',
    containerNumbers: transfer?.containerNumbers || [],
    costs: transfer?.costs || {
      freight: 0,
      insurance: 0,
      duties: 0,
      taxes: 0,
      handling: 0,
      other: 0,
      currency: 'USD',
    },
    customsInfo: transfer?.customsInfo || {},
    notes: transfer?.notes || '',
  })

  const [trackingNumbers, setTrackingNumbers] = useState<{ carrier: string; number: string }[]>(
    transfer?.trackingNumbers.map(t => ({ carrier: t.carrier, number: t.trackingNumber })) || []
  )

  // Submission state to prevent double-submit
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Amazon Shipment ID state
  const [amazonShipmentId, setAmazonShipmentId] = useState(transfer?.amazonShipmentId || '')

  // Destination type state
  const [destinationType, setDestinationType] = useState<LocationType | ''>(() => {
    if (transfer?.destinationLocationId) {
      const destLoc = locations.find(l => l.id === transfer.destinationLocationId)
      return destLoc?.type || ''
    }
    return ''
  })

  // Update form when availableStock loads (for async data fetching)
  useEffect(() => {
    // Only run if we're not editing and have preSelectedStockIds
    if (!transfer && preSelectedStockIds && preSelectedStockIds.length > 0 && availableStock.length > 0) {
      // Update line items if empty
      if (lineItems.length === 0) {
        const newLineItems = availableStock
          .filter(s => preSelectedStockIds.includes(s.id))
          .map(s => ({
            stockId: s.id,
            batchId: s.batchId,
            sku: s.sku,
            productName: s.productName,
            quantity: s.availableQuantity,
            availableQuantity: s.availableQuantity,
            unitCost: s.unitCost,
          }))
        if (newLineItems.length > 0) {
          setLineItems(newLineItems)
        }
      }
      // Update source location if empty
      if (!formData.sourceLocationId) {
        const stock = availableStock.find(s => preSelectedStockIds.includes(s.id))
        if (stock?.locationId) {
          setFormData(prev => ({ ...prev, sourceLocationId: stock.locationId }))
        }
      }
    }
  }, [availableStock, preSelectedStockIds, transfer, lineItems.length, formData.sourceLocationId])

  // Also handle initialSourceLocationId prop
  useEffect(() => {
    if (!transfer && initialSourceLocationId && !formData.sourceLocationId) {
      setFormData(prev => ({ ...prev, sourceLocationId: initialSourceLocationId }))
    }
  }, [initialSourceLocationId, transfer, formData.sourceLocationId])

  // Also handle initialDestinationLocationId prop
  useEffect(() => {
    if (!transfer && initialDestinationLocationId && !formData.destinationLocationId) {
      setFormData(prev => ({ ...prev, destinationLocationId: initialDestinationLocationId }))
    }
  }, [initialDestinationLocationId, transfer, formData.destinationLocationId])

  // Filter out Amazon locations from source
  const sourceLocations = locations.filter(l => l.isActive && l.type !== 'amazon_fba' && l.type !== 'amazon_awd')

  // Filter destination locations by selected type
  const destinationLocationsByType = useMemo(() => {
    if (!destinationType) return []
    return locations.filter(l =>
      l.isActive &&
      l.id !== formData.sourceLocationId &&
      l.type === destinationType
    )
  }, [locations, formData.sourceLocationId, destinationType])

  // Available destination types (only types that have locations)
  const availableDestinationTypes = useMemo(() => {
    const typesWithLocations = new Set(
      locations
        .filter(l => l.isActive && l.id !== formData.sourceLocationId)
        .map(l => l.type)
    )
    return (Object.keys(locationTypeLabels) as LocationType[]).filter(t => typesWithLocations.has(t))
  }, [locations, formData.sourceLocationId])

  const isAmazonDestination = destinationType === 'amazon_fba' || destinationType === 'amazon_awd'

  // Filter available stock for the selector (only show items with available quantity)
  const filteredAvailableStock = useMemo(() => {
    return availableStock.filter(stock => {
      const hasAvailable = stock.availableQuantity > 0
      const matchesLocation = !formData.sourceLocationId || stock.locationId === formData.sourceLocationId
      const matchesSearch = !stockSearchQuery ||
        stock.sku.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
        stock.productName.toLowerCase().includes(stockSearchQuery.toLowerCase())
      const notAlreadyAdded = !lineItems.some(li => li.stockId === stock.id)
      return hasAvailable && matchesLocation && matchesSearch && notAlreadyAdded
    })
  }, [availableStock, formData.sourceLocationId, stockSearchQuery, lineItems])

  // Early return after all hooks
  if (!isOpen) return null

  // Calculate totals
  const totalUnits = lineItems.reduce((sum, li) => sum + li.quantity, 0)
  const totalValue = lineItems.reduce((sum, li) => sum + (li.quantity * li.unitCost), 0)
  const totalCost =
    formData.costs.freight +
    formData.costs.insurance +
    formData.costs.duties +
    formData.costs.taxes +
    formData.costs.handling +
    formData.costs.other

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return // Prevent double-submit

    setIsSubmitting(true)
    onSubmit?.({
      ...formData,
      amazonShipmentId: isAmazonDestination && amazonShipmentId ? amazonShipmentId : undefined,
      lineItems,
    })
  }

  const addLineItem = (stock: AvailableStock) => {
    if (!formData.sourceLocationId) {
      setFormData(prev => ({ ...prev, sourceLocationId: stock.locationId }))
    }
    setLineItems(prev => [...prev, {
      stockId: stock.id,
      batchId: stock.batchId,
      sku: stock.sku,
      productName: stock.productName,
      quantity: stock.availableQuantity,
      availableQuantity: stock.availableQuantity,
      unitCost: stock.unitCost,
    }])
    setShowStockSelector(false)
    setStockSearchQuery('')
  }

  const removeLineItem = (stockId: string) => {
    setLineItems(prev => prev.filter(li => li.stockId !== stockId))
  }

  const updateLineItemQuantity = (stockId: string, quantity: number) => {
    setLineItems(prev =>
      prev.map(li =>
        li.stockId === stockId
          ? { ...li, quantity: Math.min(Math.max(1, quantity), li.availableQuantity) }
          : li
      )
    )
  }

  const addTrackingNumber = () => {
    setTrackingNumbers(prev => [...prev, { carrier: '', number: '' }])
  }

  const removeTrackingNumber = (index: number) => {
    setTrackingNumbers(prev => prev.filter((_, i) => i !== index))
  }

  const updateTrackingNumber = (index: number, field: 'carrier' | 'number', value: string) => {
    setTrackingNumbers(prev =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    )
  }

  const handleSourceLocationChange = (locationId: string) => {
    if (locationId !== formData.sourceLocationId && lineItems.length > 0) {
      if (confirm('Changing the source location will clear your selected items. Continue?')) {
        setLineItems([])
        setFormData(prev => ({ ...prev, sourceLocationId: locationId }))
      }
    } else {
      setFormData(prev => ({ ...prev, sourceLocationId: locationId }))
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose || onCancel} />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-stone-800 shadow-xl overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 px-6 py-4 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-stone-900 dark:text-white">
                  {isEditing ? 'Edit Transfer' : 'New Transfer'}
                </h2>
                {lineItems.length > 0 && (
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    {totalUnits.toLocaleString()} units • ${totalValue.toLocaleString()} value
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Locations */}
            <section>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-3">Locations</h3>
              <div className="space-y-4">
                {/* Source Location */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Source Location *
                  </label>
                  {(lineItems.length > 0 || (preSelectedStockIds && preSelectedStockIds.length > 0)) && initialSourceLocationId ? (
                    // Show locked location as text when items are pre-selected
                    <div className="w-full px-3 py-2 bg-stone-100 dark:bg-stone-600 border border-stone-200 dark:border-stone-500 rounded-lg text-sm text-stone-700 dark:text-stone-200">
                      {(() => {
                        const loc = sourceLocations.find(l => l.id === formData.sourceLocationId)
                        return loc ? `${loc.name} (${loc.city}, ${loc.country})` : lineItems[0]?.productName ? availableStock.find(s => s.id === lineItems[0]?.stockId)?.locationName || 'Unknown location' : 'Unknown location'
                      })()}
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={formData.sourceLocationId}
                        onChange={(e) => handleSourceLocationChange(e.target.value)}
                        required
                        className="w-full appearance-none px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                      >
                        <option value="">Select source location...</option>
                        {sourceLocations.map(loc => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} ({loc.city}, {loc.country})
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-stone-400" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Destination Type + Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Destination Type *
                    </label>
                    <div className="relative">
                      <select
                        value={destinationType}
                        onChange={(e) => {
                          const newType = e.target.value as LocationType
                          setDestinationType(newType)
                          setFormData(prev => ({ ...prev, destinationLocationId: '' }))
                          if (newType !== 'amazon_fba' && newType !== 'amazon_awd') {
                            setAmazonShipmentId('')
                          }
                        }}
                        required
                        className="w-full appearance-none px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                      >
                        <option value="">Select type...</option>
                        {availableDestinationTypes.map(type => (
                          <option key={type} value={type}>{locationTypeLabels[type]}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-stone-400" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Destination Location *
                    </label>
                    <div className="relative">
                      <select
                        value={formData.destinationLocationId}
                        onChange={(e) => setFormData(prev => ({ ...prev, destinationLocationId: e.target.value }))}
                        required
                        disabled={!destinationType}
                        className="w-full appearance-none px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">{!destinationType ? 'Select type first...' : 'Select location...'}</option>
                        {destinationLocationsByType.map(loc => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} ({loc.city}, {loc.country})
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-stone-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amazon Shipment ID */}
                {isAmazonDestination && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Amazon Shipment ID <span className="text-stone-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={amazonShipmentId}
                      onChange={(e) => setAmazonShipmentId(e.target.value.toUpperCase())}
                      placeholder="e.g., FBA17ABC1234"
                      className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent font-mono"
                    />
                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                      Enter after creating inbound shipment in Seller Central
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Line Items */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-stone-900 dark:text-white">
                  Transfer Items *
                </h3>
                <button
                  type="button"
                  onClick={() => setShowStockSelector(true)}
                  disabled={!formData.sourceLocationId}
                  className="inline-flex items-center gap-1 text-sm text-lime-600 dark:text-lime-400 hover:text-lime-800 dark:hover:text-lime-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Add Stock
                </button>
              </div>

              {lineItems.length === 0 ? (
                <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg p-6 text-center">
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    {!formData.sourceLocationId
                      ? 'Select a source location first'
                      : 'Click "Add Stock" to select items to transfer'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lineItems.map(item => (
                    <TransferLineItemRow
                      key={item.stockId || item.batchId}
                      item={item}
                      onQuantityChange={(qty) => updateLineItemQuantity(item.stockId || item.batchId, qty)}
                      onRemove={() => removeLineItem(item.stockId || item.batchId)}
                    />
                  ))}
                  {/* Summary */}
                  <div className="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-stone-700 mt-3">
                    <span className="text-sm font-medium text-stone-900 dark:text-white">
                      {lineItems.length} item{lineItems.length !== 1 ? 's' : ''}
                    </span>
                    <div className="text-right">
                      <p className="text-sm text-stone-500 dark:text-stone-400">
                        {totalUnits.toLocaleString()} units
                      </p>
                      <p className="text-sm font-semibold text-stone-900 dark:text-white">
                        ${totalValue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Stock Selector Dropdown */}
              {showStockSelector && (
                <div className="mt-2 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg shadow-lg overflow-hidden">
                  <div className="p-3 border-b border-stone-200 dark:border-stone-600">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                        <Search className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={stockSearchQuery}
                        onChange={(e) => setStockSearchQuery(e.target.value)}
                        placeholder="Search available stock..."
                        className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-600 border border-stone-200 dark:border-stone-500 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredAvailableStock.length === 0 ? (
                      <p className="text-sm text-stone-500 dark:text-stone-400 text-center py-4">
                        No available stock found
                      </p>
                    ) : (
                      filteredAvailableStock.map(stock => (
                        <button
                          key={stock.id}
                          type="button"
                          onClick={() => addLineItem(stock)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-600 transition-colors text-left"
                        >
                          <div>
                            <p className="text-sm font-medium text-lime-600 dark:text-lime-400">{stock.sku}</p>
                            <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{stock.productName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-stone-900 dark:text-white">
                              {stock.availableQuantity.toLocaleString()} avail
                            </p>
                            {stock.allocatedQuantity && stock.allocatedQuantity > 0 ? (
                              <p className="text-xs text-amber-600 dark:text-amber-400">
                                {stock.allocatedQuantity.toLocaleString()} in draft transfers
                              </p>
                            ) : (
                              <p className="text-xs text-stone-500 dark:text-stone-400">
                                ${stock.unitCost.toFixed(2)}/unit
                              </p>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-stone-200 dark:border-stone-600">
                    <button
                      type="button"
                      onClick={() => {
                        setShowStockSelector(false)
                        setStockSearchQuery('')
                      }}
                      className="w-full px-3 py-1.5 text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-600 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Shipping Details */}
            <section>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-3">Shipping Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Shipping Agent
                  </label>
                  <div className="relative">
                    <select
                      value={formData.shippingAgentId || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, shippingAgentId: e.target.value || undefined }))}
                      className="w-full appearance-none px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                    >
                      <option value="">No agent selected</option>
                      {shippingAgents.filter(a => a.isActive).map(agent => (
                        <option key={agent.id} value={agent.id}>{agent.name}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown className="w-4 h-4 text-stone-400" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Carrier
                  </label>
                  <input
                    type="text"
                    value={formData.carrier}
                    onChange={(e) => setFormData(prev => ({ ...prev, carrier: e.target.value }))}
                    placeholder="e.g., Maersk, FedEx, UPS"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Shipping Method *
                  </label>
                  <div className="relative">
                    <select
                      value={formData.shippingMethod || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, shippingMethod: e.target.value as ShippingMethod || null }))}
                      required
                      className="w-full appearance-none px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                    >
                      <option value="">Select method...</option>
                      {shippingMethods.map(method => (
                        <option key={method.id} value={method.id}>{method.label}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown className="w-4 h-4 text-stone-400" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Incoterms
                  </label>
                  <div className="relative">
                    <select
                      value={formData.incoterms}
                      onChange={(e) => setFormData(prev => ({ ...prev, incoterms: e.target.value }))}
                      className="w-full appearance-none px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                    >
                      <option value="">Select...</option>
                      <option value="EXW">EXW - Ex Works</option>
                      <option value="FOB">FOB - Free on Board</option>
                      <option value="CIF">CIF - Cost, Insurance & Freight</option>
                      <option value="DDP">DDP - Delivered Duty Paid</option>
                      <option value="DAP">DAP - Delivered at Place</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown className="w-4 h-4 text-stone-400" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Carrier Account #
                  </label>
                  <input
                    type="text"
                    value={formData.carrierAccountNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, carrierAccountNumber: e.target.value }))}
                    placeholder="Optional"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                  />
                </div>
              </div>
            </section>

            {/* Dates */}
            <section>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-3">Scheduled Dates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Departure Date
                  </label>
                  <input
                    type="date"
                    value={formData.scheduledDepartureDate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledDepartureDate: e.target.value || null }))}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Arrival Date
                  </label>
                  <input
                    type="date"
                    value={formData.scheduledArrivalDate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledArrivalDate: e.target.value || null }))}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                  />
                </div>
              </div>
            </section>

            {/* Tracking Numbers */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-stone-900 dark:text-white">Tracking Numbers</h3>
                <button
                  type="button"
                  onClick={addTrackingNumber}
                  className="inline-flex items-center gap-1 text-xs text-lime-600 dark:text-lime-400 hover:text-lime-800 dark:hover:text-lime-300"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              {trackingNumbers.length === 0 ? (
                <p className="text-sm text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-700/50 rounded-lg p-3 text-center">
                  No tracking numbers added yet
                </p>
              ) : (
                <div className="space-y-2">
                  {trackingNumbers.map((tracking, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tracking.carrier}
                        onChange={(e) => updateTrackingNumber(index, 'carrier', e.target.value)}
                        placeholder="Carrier"
                        className="w-32 px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={tracking.number}
                        onChange={(e) => updateTrackingNumber(index, 'number', e.target.value)}
                        placeholder="Tracking number"
                        className="flex-1 px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => removeTrackingNumber(index)}
                        className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Costs */}
            <section>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-3">Costs (USD)</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Freight</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costs.freight || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, costs: { ...prev.costs, freight: parseFloat(e.target.value) || 0 } }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Insurance</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costs.insurance || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, costs: { ...prev.costs, insurance: parseFloat(e.target.value) || 0 } }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Duties</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costs.duties || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, costs: { ...prev.costs, duties: parseFloat(e.target.value) || 0 } }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Taxes</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costs.taxes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, costs: { ...prev.costs, taxes: parseFloat(e.target.value) || 0 } }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Handling</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costs.handling || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, costs: { ...prev.costs, handling: parseFloat(e.target.value) || 0 } }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Other</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costs.other || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, costs: { ...prev.costs, other: parseFloat(e.target.value) || 0 } }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                  />
                </div>
              </div>
              {totalCost > 0 && (
                <p className="mt-2 text-sm font-medium text-stone-900 dark:text-white text-right">
                  Shipping Total: ${totalCost.toLocaleString()}
                </p>
              )}
            </section>

            {/* Customs */}
            <section>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-3">Customs Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    HS Code
                  </label>
                  <input
                    type="text"
                    value={formData.customsInfo.hsCode || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, customsInfo: { ...prev.customsInfo, hsCode: e.target.value } }))}
                    placeholder="e.g., 9617.00.10"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Customs Broker
                  </label>
                  <input
                    type="text"
                    value={formData.customsInfo.broker || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, customsInfo: { ...prev.customsInfo, broker: e.target.value } }))}
                    placeholder="Broker name"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                  />
                </div>
              </div>
            </section>

            {/* Notes */}
            <section>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-3">Notes</h3>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Add any additional notes..."
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent resize-none"
              />
            </section>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-stone-800 border-t border-stone-200 dark:border-stone-700 px-6 py-4">
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.sourceLocationId || !formData.destinationLocationId || lineItems.length === 0}
                className="px-4 py-2 bg-lime-600 hover:bg-lime-700 disabled:bg-stone-300 dark:disabled:bg-stone-600 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : isEditing ? 'Save Changes' : 'Create Transfer'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

import { useState, useMemo, useRef } from 'react'
import type {
  TransferFormProps,
  TransferFormData,
  ShippingMethod,
  AvailableStock,
  TransferLineItemInput,
  InvoiceCostCategory,
  Location,
} from '@/../product/sections/transfers/types'
import type { LocationFormData, LocationType } from '@/../product/sections/locations/types'
import { TransferLineItemRow } from './TransferLineItemRow'
import { LocationForm } from '../../locations/components/LocationForm'
import { SearchableSelect, type SelectOption } from '@/components/ui/searchable-select'

// Invoice input type for form state
interface InvoiceInput {
  id: string
  fileName: string
  fileUrl: string
  amount: number
  currency: string
  allocatedTo: InvoiceCostCategory
  notes: string
}

// Icons
const XIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const PaperClipIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
)

const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const FactoryIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const WarehouseIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
  </svg>
)

const TruckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
)

const AmazonIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595.394-.15.763-.3 1.108-.447.2-.085.397-.134.59-.134.18 0 .338.04.473.117.136.08.197.196.186.35-.01.154-.103.32-.278.496-.174.176-.442.377-.803.603-1.027.646-2.198 1.186-3.516 1.62-1.318.435-2.58.732-3.788.893-.363.048-.615.093-.756.133-.14.04-.21.12-.21.24v.08c.092.255.314.548.665.88.351.333.73.673 1.138 1.02.407.347.683.678.826.993.143.315.066.544-.232.686-.448.215-1.092.322-1.932.322-1.057 0-2.013-.19-2.87-.57-.857-.38-1.538-.888-2.04-1.522-.502-.634-.758-1.324-.768-2.07-.01-.745.237-1.434.74-2.067z" />
    <path d="M13.4 11.466c-.62 0-1.14.096-1.56.29-.422.192-.77.463-1.044.813-.273.35-.474.752-.603 1.205-.13.453-.194.935-.194 1.447 0 .628.09 1.19.272 1.69.18.5.45.923.81 1.27.36.346.8.612 1.32.797.52.185 1.12.277 1.8.277.7 0 1.37-.12 2.01-.357.64-.238 1.19-.573 1.65-1.006.46-.432.82-.94 1.08-1.522.26-.582.39-1.21.39-1.886 0-.767-.14-1.46-.42-2.08-.28-.62-.67-1.15-1.17-1.59-.5-.44-1.08-.78-1.74-1.02-.66-.24-1.37-.36-2.13-.36-.76 0-1.43.11-2.01.33-.58.22-1.07.52-1.47.9-.4.38-.71.82-.93 1.32-.22.5-.33 1.03-.33 1.59 0 .35.05.69.14 1.02.09.33.24.64.44.92.2.28.46.51.77.69.31.18.68.27 1.1.27.32 0 .62-.06.9-.18.28-.12.53-.29.74-.51.21-.22.39-.48.53-.78.14-.3.24-.62.3-.96.02-.14.03-.28.03-.42 0-.28-.04-.54-.11-.78-.07-.24-.18-.45-.32-.63-.14-.18-.31-.32-.51-.42-.2-.1-.42-.15-.66-.15-.2 0-.38.03-.54.1-.16.07-.3.16-.42.28-.12.12-.22.26-.3.42-.08.16-.13.33-.15.51h-.9c.02-.28.08-.55.18-.81.1-.26.24-.49.42-.69.18-.2.4-.36.66-.48.26-.12.55-.18.87-.18.38 0 .72.08 1.02.24.3.16.55.38.75.66.2.28.35.6.45.96.1.36.15.74.15 1.14z" />
  </svg>
)

const ShipIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

// Location type options for the destination type selector
const DESTINATION_TYPE_OPTIONS: SelectOption[] = [
  { value: 'factory', label: 'Factory', icon: <FactoryIcon /> },
  { value: 'warehouse', label: 'Warehouse', icon: <WarehouseIcon /> },
  { value: '3pl', label: '3PL', icon: <TruckIcon /> },
  { value: 'amazon-fba', label: 'Amazon FBA', icon: <AmazonIcon /> },
  { value: 'amazon-awd', label: 'Amazon AWD', icon: <AmazonIcon /> },
  { value: 'port', label: 'Port', icon: <ShipIcon /> },
  { value: 'customs', label: 'Customs', icon: <DocumentIcon /> },
]

export function TransferForm({
  transfer,
  locations,
  availableStock = [],
  shippingMethods,
  preSelectedStockIds,
  initialLineItems,
  initialSourceLocationId,
  isOpen = true,
  onSubmit,
  onCancel,
  onClose,
  locationTypes,
  onLocationCreated,
}: TransferFormProps) {
  // If isOpen is controlled, return null when closed
  if (!isOpen) return null

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
        availableQuantity: li.quantity, // For editing, we use the committed quantity
        unitCost: li.unitCost,
      }))
    }
    // Handle initialLineItems from Inventory page
    if (initialLineItems && initialLineItems.length > 0) {
      return initialLineItems.map(item => ({
        stockId: item.stockId,
        batchId: item.batchId,
        sku: item.sku,
        productName: item.productName,
        quantity: item.availableQuantity, // Default to full available
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
          quantity: s.availableQuantity, // Default to full available
          availableQuantity: s.availableQuantity,
          unitCost: s.unitCost,
        }))
    }
    return []
  }

  const [lineItems, setLineItems] = useState<TransferLineItemInput[]>(getInitialLineItems)
  const [stockSearchQuery, setStockSearchQuery] = useState('')
  const [showStockSelector, setShowStockSelector] = useState(false)

  // Determine source location from initialSourceLocationId, initialLineItems, pre-selected stock, or transfer
  const getInitialSourceLocation = () => {
    if (transfer?.sourceLocationId) return transfer.sourceLocationId
    if (initialSourceLocationId) return initialSourceLocationId
    if (initialLineItems && initialLineItems.length > 0) {
      return initialLineItems[0].sourceLocationId
    }
    if (preSelectedStockIds && preSelectedStockIds.length > 0) {
      const stock = availableStock.find(s => preSelectedStockIds.includes(s.id))
      return stock?.locationId || ''
    }
    return ''
  }

  const [formData, setFormData] = useState<Omit<TransferFormData, 'lineItems' | 'invoices'>>({
    sourceLocationId: getInitialSourceLocation(),
    destinationLocationId: transfer?.destinationLocationId || '',
    carrier: transfer?.carrier || '',
    carrierAccountNumber: transfer?.carrierAccountNumber || '',
    shippingMethod: transfer?.shippingMethod || 'ocean-fcl',
    scheduledDepartureDate: transfer?.scheduledDepartureDate || '',
    scheduledArrivalDate: transfer?.scheduledArrivalDate || '',
    incoterms: transfer?.incoterms || '',
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
    transfer?.trackingNumbers.map(t => ({ carrier: t.carrier, number: t.number })) || []
  )

  // Invoice state
  const [invoices, setInvoices] = useState<InvoiceInput[]>(
    transfer?.invoices?.map(inv => ({
      id: inv.id,
      fileName: inv.fileName,
      fileUrl: inv.fileUrl,
      amount: inv.amount,
      currency: inv.currency,
      allocatedTo: inv.allocatedTo,
      notes: inv.notes || '',
    })) || []
  )
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [newInvoice, setNewInvoice] = useState<Omit<InvoiceInput, 'id'>>({
    fileName: '',
    fileUrl: '',
    amount: 0,
    currency: 'USD',
    allocatedTo: 'freight',
    notes: '',
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // LocationForm state for "Add New Location" feature
  const [showLocationForm, setShowLocationForm] = useState(false)

  // Amazon Shipment ID state (for Amazon FBA/AWD destinations)
  const [amazonShipmentId, setAmazonShipmentId] = useState(transfer?.amazonShipmentId || '')

  // Destination type state for cascading dropdown
  const [destinationType, setDestinationType] = useState<LocationType | ''>(() => {
    // Initialize from existing transfer destination
    if (transfer?.destinationLocationId) {
      const destLoc = locations.find(l => l.id === transfer.destinationLocationId)
      return destLoc?.type || ''
    }
    return ''
  })

  // Filter out Amazon locations from source - we only send TO Amazon, not from
  const sourceLocations = locations.filter(l => l.isActive && l.type !== 'amazon-fba' && l.type !== 'amazon-awd')

  // Convert source locations to SelectOption format
  const sourceLocationOptions: SelectOption[] = useMemo(() => {
    return sourceLocations.map(loc => ({
      value: loc.id,
      label: loc.name,
      description: loc.city ? `${loc.city}, ${loc.country}` : loc.country,
    }))
  }, [sourceLocations])

  // Filter destination locations by selected type
  const destinationLocationsByType = useMemo(() => {
    if (!destinationType) return []
    return locations.filter(l =>
      l.isActive &&
      l.id !== formData.sourceLocationId &&
      l.type === destinationType
    )
  }, [locations, formData.sourceLocationId, destinationType])

  // Convert to SelectOption format
  const destinationLocationOptions: SelectOption[] = useMemo(() => {
    return destinationLocationsByType.map(loc => ({
      value: loc.id,
      label: loc.name,
      description: loc.city ? `${loc.city}, ${loc.country}` : loc.country,
    }))
  }, [destinationLocationsByType])

  // Filter destination types to only show types that have locations
  const availableDestinationTypes = useMemo(() => {
    const typesWithLocations = new Set(
      locations
        .filter(l => l.isActive && l.id !== formData.sourceLocationId)
        .map(l => l.type)
    )
    return DESTINATION_TYPE_OPTIONS.filter(opt => typesWithLocations.has(opt.value as LocationType))
  }, [locations, formData.sourceLocationId])

  // Helper: is destination an Amazon location type?
  const isAmazonDestination = destinationType === 'amazon-fba' || destinationType === 'amazon-awd'

  // Filter available stock by source location and search
  const filteredAvailableStock = useMemo(() => {
    return availableStock.filter(stock => {
      const matchesLocation = !formData.sourceLocationId || stock.locationId === formData.sourceLocationId
      const matchesSearch = !stockSearchQuery ||
        stock.sku.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
        stock.productName.toLowerCase().includes(stockSearchQuery.toLowerCase())
      const notAlreadyAdded = !lineItems.some(li => li.stockId === stock.id)
      return matchesLocation && matchesSearch && notAlreadyAdded
    })
  }, [availableStock, formData.sourceLocationId, stockSearchQuery, lineItems])

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
    onSubmit?.({
      ...formData,
      // Only include amazonShipmentId if destination is Amazon
      amazonShipmentId: isAmazonDestination && amazonShipmentId ? amazonShipmentId : undefined,
      lineItems: lineItems.map(li => ({
        stockId: li.stockId,
        batchId: li.batchId,
        quantity: li.quantity,
      })),
      invoices: invoices.map(inv => ({
        fileName: inv.fileName,
        fileUrl: inv.fileUrl,
        amount: inv.amount,
        currency: inv.currency,
        allocatedTo: inv.allocatedTo,
        notes: inv.notes,
      })),
    })
  }

  const addLineItem = (stock: AvailableStock) => {
    // If no source location set, set it from this stock
    if (!formData.sourceLocationId) {
      setFormData(prev => ({ ...prev, sourceLocationId: stock.locationId }))
    }
    setLineItems(prev => [...prev, {
      stockId: stock.id,
      batchId: stock.batchId,
      sku: stock.sku,
      productName: stock.productName,
      quantity: stock.availableQuantity, // Default to full available
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

  // Invoice handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // In a real app, this would upload to S3/storage and get a URL
      // For now, we'll use a placeholder URL and store the file name
      setNewInvoice(prev => ({
        ...prev,
        fileName: file.name,
        fileUrl: URL.createObjectURL(file), // Temporary local URL for preview
      }))
      setShowInvoiceForm(true)
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const addInvoice = () => {
    if (newInvoice.fileName && newInvoice.amount > 0) {
      setInvoices(prev => [...prev, {
        ...newInvoice,
        id: `inv-${Date.now()}`,
      }])
      setNewInvoice({
        fileName: '',
        fileUrl: '',
        amount: 0,
        currency: 'USD',
        allocatedTo: 'freight',
        notes: '',
      })
      setShowInvoiceForm(false)
    }
  }

  const removeInvoice = (id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id))
  }

  const cancelInvoiceForm = () => {
    setNewInvoice({
      fileName: '',
      fileUrl: '',
      amount: 0,
      currency: 'USD',
      allocatedTo: 'freight',
      notes: '',
    })
    setShowInvoiceForm(false)
  }

  // Handle source location change - clear line items if location changes
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

  // Handle new location creation from nested LocationForm
  const handleLocationFormSubmit = (locationFormData: LocationFormData) => {
    // Create new location with generated ID
    const newLocation: Location = {
      id: `loc-${Date.now()}`,
      ...locationFormData,
      isActive: true,
    }

    // Call parent callback to persist the new location
    onLocationCreated?.(newLocation)

    // Set the destination type to match the new location's type
    setDestinationType(newLocation.type)

    // Auto-select the new location as destination
    setFormData(prev => ({ ...prev, destinationLocationId: newLocation.id }))

    // Close the LocationForm
    setShowLocationForm(false)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose || onCancel} />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-slate-800 shadow-xl overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {isEditing ? 'Edit Transfer' : 'New Transfer'}
                </h2>
                {lineItems.length > 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {totalUnits.toLocaleString()} units &bull; ${totalValue.toLocaleString()} value
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <XIcon />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Locations */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Locations</h3>
              <div className="space-y-4">
                {/* Source Location */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Source Location *
                  </label>
                  <SearchableSelect
                    options={sourceLocationOptions}
                    value={formData.sourceLocationId}
                    onChange={handleSourceLocationChange}
                    placeholder="Search for source location..."
                    searchPlaceholder="Search locations..."
                  />
                </div>

                {/* Destination - Cascading Selection */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Destination Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Destination Type *
                    </label>
                    <SearchableSelect
                      options={availableDestinationTypes}
                      value={destinationType}
                      onChange={(value) => {
                        const newType = value as LocationType
                        setDestinationType(newType)
                        // Clear destination location when type changes
                        setFormData(prev => ({ ...prev, destinationLocationId: '' }))
                        // Clear amazonShipmentId when switching away from Amazon types
                        if (newType !== 'amazon-fba' && newType !== 'amazon-awd') {
                          setAmazonShipmentId('')
                        }
                      }}
                      placeholder="Select type..."
                      searchPlaceholder="Search types..."
                    />
                  </div>

                  {/* Destination Location */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Destination Location *
                    </label>
                    <SearchableSelect
                      options={destinationLocationOptions}
                      value={formData.destinationLocationId}
                      onChange={(value) => setFormData(prev => ({ ...prev, destinationLocationId: value }))}
                      placeholder={!destinationType ? "Select type first..." : "Search locations..."}
                      searchPlaceholder="Search locations..."
                      disabled={!destinationType}
                      onAddNew={locationTypes && locationTypes.length > 0 ? () => setShowLocationForm(true) : undefined}
                      addNewLabel="+ Add New Location"
                    />
                  </div>
                </div>

                {/* Amazon Shipment ID - only show for Amazon destinations */}
                {isAmazonDestination && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Amazon Shipment ID <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={amazonShipmentId}
                      onChange={(e) => setAmazonShipmentId(e.target.value.toUpperCase())}
                      placeholder="e.g., FBA17ABC1234"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Enter after creating inbound shipment in Seller Central
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Line Items */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Transfer Items *
                </h3>
                <button
                  type="button"
                  onClick={() => setShowStockSelector(true)}
                  disabled={!formData.sourceLocationId}
                  className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon />
                  Add Stock
                </button>
              </div>

              {lineItems.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-6 text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {!formData.sourceLocationId
                      ? 'Select a source location first'
                      : 'Click "Add Stock" to select items to transfer'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lineItems.map(item => (
                    <TransferLineItemRow
                      key={item.stockId}
                      item={item}
                      onQuantityChange={(qty) => updateLineItemQuantity(item.stockId, qty)}
                      onRemove={() => removeLineItem(item.stockId)}
                    />
                  ))}
                  {/* Summary */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700 mt-3">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {lineItems.length} item{lineItems.length !== 1 ? 's' : ''}
                    </span>
                    <div className="text-right">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {totalUnits.toLocaleString()} units
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        ${totalValue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Stock Selector Dropdown */}
              {showStockSelector && (
                <div className="mt-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg overflow-hidden">
                  {/* Search */}
                  <div className="p-3 border-b border-slate-200 dark:border-slate-600">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <SearchIcon />
                      </div>
                      <input
                        type="text"
                        value={stockSearchQuery}
                        onChange={(e) => setStockSearchQuery(e.target.value)}
                        placeholder="Search available stock..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        autoFocus
                      />
                    </div>
                  </div>
                  {/* Stock list */}
                  <div className="max-h-48 overflow-y-auto">
                    {filteredAvailableStock.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                        No available stock found
                      </p>
                    ) : (
                      filteredAvailableStock.map(stock => (
                        <button
                          key={stock.id}
                          type="button"
                          onClick={() => addLineItem(stock)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-left"
                        >
                          <div>
                            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{stock.sku}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{stock.productName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {stock.availableQuantity.toLocaleString()} avail
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              ${stock.unitCost.toFixed(2)}/unit
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  {/* Close button */}
                  <div className="p-2 border-t border-slate-200 dark:border-slate-600">
                    <button
                      type="button"
                      onClick={() => {
                        setShowStockSelector(false)
                        setStockSearchQuery('')
                      }}
                      className="w-full px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Carrier & Shipping */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Shipping Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Carrier
                  </label>
                  <input
                    type="text"
                    value={formData.carrier}
                    onChange={(e) => setFormData(prev => ({ ...prev, carrier: e.target.value }))}
                    placeholder="e.g., Maersk, FedEx, UPS"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Shipping Method *
                  </label>
                  <div className="relative">
                    <select
                      value={formData.shippingMethod}
                      onChange={(e) => setFormData(prev => ({ ...prev, shippingMethod: e.target.value as ShippingMethod }))}
                      required
                      className="w-full appearance-none px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {shippingMethods.map(method => (
                        <option key={method.id} value={method.id}>{method.label}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDownIcon />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Incoterms
                  </label>
                  <div className="relative">
                    <select
                      value={formData.incoterms}
                      onChange={(e) => setFormData(prev => ({ ...prev, incoterms: e.target.value }))}
                      className="w-full appearance-none px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select...</option>
                      <option value="EXW">EXW - Ex Works</option>
                      <option value="FOB">FOB - Free on Board</option>
                      <option value="CIF">CIF - Cost, Insurance & Freight</option>
                      <option value="DDP">DDP - Delivered Duty Paid</option>
                      <option value="DAP">DAP - Delivered at Place</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDownIcon />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Carrier Account #
                  </label>
                  <input
                    type="text"
                    value={formData.carrierAccountNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, carrierAccountNumber: e.target.value }))}
                    placeholder="Optional"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </section>

            {/* Dates */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Scheduled Dates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Departure Date
                  </label>
                  <input
                    type="date"
                    value={formData.scheduledDepartureDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledDepartureDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Arrival Date
                  </label>
                  <input
                    type="date"
                    value={formData.scheduledArrivalDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledArrivalDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </section>

            {/* Tracking Numbers */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Tracking Numbers</h3>
                <button
                  type="button"
                  onClick={addTrackingNumber}
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                >
                  <PlusIcon />
                  Add
                </button>
              </div>
              {trackingNumbers.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
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
                        className="w-32 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={tracking.number}
                        onChange={(e) => updateTrackingNumber(index, 'number', e.target.value)}
                        placeholder="Tracking number"
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => removeTrackingNumber(index)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Costs */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Costs (USD)</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Freight</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costs.freight || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, costs: { ...prev.costs, freight: parseFloat(e.target.value) || 0 } }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Insurance</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costs.insurance || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, costs: { ...prev.costs, insurance: parseFloat(e.target.value) || 0 } }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Duties</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costs.duties || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, costs: { ...prev.costs, duties: parseFloat(e.target.value) || 0 } }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Taxes</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costs.taxes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, costs: { ...prev.costs, taxes: parseFloat(e.target.value) || 0 } }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Handling</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costs.handling || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, costs: { ...prev.costs, handling: parseFloat(e.target.value) || 0 } }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Other</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costs.other || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, costs: { ...prev.costs, other: parseFloat(e.target.value) || 0 } }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              {totalCost > 0 && (
                <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white text-right">
                  Shipping Total: ${totalCost.toLocaleString()}
                </p>
              )}
            </section>

            {/* Invoices */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Invoices</h3>
                <label className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 cursor-pointer">
                  <PaperClipIcon />
                  Attach Invoice
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Existing invoices */}
              {invoices.length === 0 && !showInvoiceForm ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                  No invoices attached
                </p>
              ) : (
                <div className="space-y-2">
                  {invoices.map(invoice => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-slate-400">
                          <DocumentIcon />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {invoice.fileName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            ${invoice.amount.toLocaleString()} &rarr; {invoice.allocatedTo.charAt(0).toUpperCase() + invoice.allocatedTo.slice(1)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeInvoice(invoice.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* New invoice form */}
              {showInvoiceForm && (
                <div className="mt-3 p-4 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="text-slate-400">
                      <DocumentIcon />
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {newInvoice.fileName}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Amount *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newInvoice.amount || ''}
                        onChange={(e) => setNewInvoice(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Allocate to *
                      </label>
                      <div className="relative">
                        <select
                          value={newInvoice.allocatedTo}
                          onChange={(e) => setNewInvoice(prev => ({ ...prev, allocatedTo: e.target.value as InvoiceCostCategory }))}
                          className="w-full appearance-none px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="freight">Freight</option>
                          <option value="duties">Duties</option>
                          <option value="insurance">Insurance</option>
                          <option value="handling">Handling</option>
                          <option value="taxes">Taxes</option>
                          <option value="other">Other</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <ChevronDownIcon />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      type="button"
                      onClick={cancelInvoiceForm}
                      className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={addInvoice}
                      disabled={!newInvoice.fileName || newInvoice.amount <= 0}
                      className="px-3 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded transition-colors disabled:cursor-not-allowed"
                    >
                      Add Invoice
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Customs */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Customs Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    HS Code
                  </label>
                  <input
                    type="text"
                    value={formData.customsInfo.hsCode || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, customsInfo: { ...prev.customsInfo, hsCode: e.target.value } }))}
                    placeholder="e.g., 9617.00.10"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Customs Broker
                  </label>
                  <input
                    type="text"
                    value={formData.customsInfo.customsBroker || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, customsInfo: { ...prev.customsInfo, customsBroker: e.target.value } }))}
                    placeholder="Broker name"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </section>

            {/* Notes */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Notes</h3>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Add any additional notes..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </section>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4">
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.sourceLocationId || !formData.destinationLocationId || lineItems.length === 0}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {isEditing ? 'Save Changes' : 'Create Transfer'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Nested LocationForm Modal */}
      {showLocationForm && locationTypes && (
        <div className="fixed inset-0 z-[60]">
          <LocationForm
            locationTypes={locationTypes}
            onSubmit={handleLocationFormSubmit}
            onCancel={() => setShowLocationForm(false)}
          />
        </div>
      )}
    </div>
  )
}

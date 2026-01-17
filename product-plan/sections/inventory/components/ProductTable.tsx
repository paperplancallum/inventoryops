import { useMemo, useState } from 'react'
import type { Stock, ProductStockGroup, StockLocationGroup } from '@/../product/sections/inventory/types'

interface ProductTableProps {
  stocks: Stock[]
  selectedStockIds: string[]
  onSelectStock: (stockId: string) => void
  searchQuery?: string
}

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    className={`w-4 h-4 text-stone-400 transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)

// Stage mapping from location type
type SupplyChainStage = 'production' | 'transit' | 'warehouse' | 'amazon'

const stageFromLocationType = (locationType: string): SupplyChainStage | null => {
  switch (locationType) {
    case 'factory': return 'production'
    case 'in-transit': return 'transit'
    case '3pl': return 'warehouse'
    case 'amazon-fba': return 'amazon'
    default: return null
  }
}

interface StageQuantities {
  production: number
  transit: number
  warehouse: number
  amazon: number
}

const getStageQuantities = (stocks: Stock[]): StageQuantities => {
  const stages: StageQuantities = { production: 0, transit: 0, warehouse: 0, amazon: 0 }
  stocks.forEach((s) => {
    const stage = stageFromLocationType(s.locationType)
    if (stage) {
      stages[stage] += s.totalQuantity
    }
  })
  return stages
}

function groupStockByProduct(stocks: Stock[]): ProductStockGroup[] {
  const productMap = new Map<string, {
    sku: string
    productName: string
    brandId?: string
    brandName?: string
    locationMap: Map<string, {
      locationId: string
      locationName: string
      locationType: string
      stocks: Stock[]
    }>
  }>()

  for (const stock of stocks) {
    if (!productMap.has(stock.sku)) {
      productMap.set(stock.sku, {
        sku: stock.sku,
        productName: stock.productName,
        brandId: stock.brandId,
        brandName: stock.brandName,
        locationMap: new Map(),
      })
    }

    const product = productMap.get(stock.sku)!
    if (!product.locationMap.has(stock.locationId)) {
      product.locationMap.set(stock.locationId, {
        locationId: stock.locationId,
        locationName: stock.locationName,
        locationType: stock.locationType,
        stocks: [],
      })
    }

    product.locationMap.get(stock.locationId)!.stocks.push(stock)
  }

  return Array.from(productMap.values()).map((product) => {
    const locationGroups: StockLocationGroup[] = Array.from(product.locationMap.values()).map((loc) => ({
      locationId: loc.locationId,
      locationName: loc.locationName,
      locationType: loc.locationType,
      totalQuantity: loc.stocks.reduce((sum, s) => sum + s.totalQuantity, 0),
      availableQuantity: loc.stocks.reduce((sum, s) => sum + s.availableQuantity, 0),
      reservedQuantity: loc.stocks.reduce((sum, s) => sum + s.reservedQuantity, 0),
      totalValue: loc.stocks.reduce((sum, s) => sum + s.totalValue, 0),
      stocks: loc.stocks.sort((a, b) => new Date(a.firstReceivedAt).getTime() - new Date(b.firstReceivedAt).getTime()),
    }))

    return {
      sku: product.sku,
      productName: product.productName,
      brandId: product.brandId,
      brandName: product.brandName,
      totalQuantity: locationGroups.reduce((sum, lg) => sum + lg.totalQuantity, 0),
      availableQuantity: locationGroups.reduce((sum, lg) => sum + lg.availableQuantity, 0),
      reservedQuantity: locationGroups.reduce((sum, lg) => sum + lg.reservedQuantity, 0),
      totalValue: locationGroups.reduce((sum, lg) => sum + lg.totalValue, 0),
      locationsCount: locationGroups.length,
      locationGroups: locationGroups.sort((a, b) => a.locationName.localeCompare(b.locationName)),
    }
  }).sort((a, b) => a.sku.localeCompare(b.sku))
}

export function ProductTable({
  stocks,
  selectedStockIds,
  onSelectStock,
  searchQuery = '',
}: ProductTableProps) {
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set())

  const filteredStocks = useMemo(() => {
    if (!searchQuery) return stocks
    const query = searchQuery.toLowerCase()
    return stocks.filter(
      (s) =>
        s.sku.toLowerCase().includes(query) ||
        s.productName.toLowerCase().includes(query) ||
        s.poNumber.toLowerCase().includes(query) ||
        s.supplierName.toLowerCase().includes(query) ||
        s.locationName.toLowerCase().includes(query)
    )
  }, [stocks, searchQuery])

  const productGroups = useMemo(() => groupStockByProduct(filteredStocks), [filteredStocks])

  const toggleProduct = (sku: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev)
      if (next.has(sku)) {
        next.delete(sku)
      } else {
        next.add(sku)
      }
      return next
    })
  }

  const toggleLocation = (sku: string, locationId: string) => {
    const key = `${sku}-${locationId}`
    setExpandedLocations((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  if (productGroups.length === 0) {
    return (
      <div className="text-center py-12 text-stone-500 dark:text-stone-400">
        {searchQuery ? 'No products match your search' : 'No stock data available'}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-stone-100 dark:bg-stone-800 text-left text-xs font-medium uppercase text-stone-500 dark:text-stone-400">
            <th className="py-3 px-4">Product</th>
            <th className="py-3 px-3">Brand</th>
            <th className="py-3 px-3 text-right">Prod</th>
            <th className="py-3 px-3 text-right">Transit</th>
            <th className="py-3 px-3 text-right">WH</th>
            <th className="py-3 px-3 text-right">Amazon</th>
            <th className="py-3 px-3 text-right">Available</th>
            <th className="py-3 px-3 text-right">Reserved</th>
            <th className="py-3 px-3 text-right">Value</th>
            <th className="py-3 px-3 text-right">Loc</th>
          </tr>
        </thead>
        <tbody>
          {productGroups.map((product) => {
            const isProductExpanded = expandedProducts.has(product.sku)

            return (
              <ProductGroupRows
                key={product.sku}
                product={product}
                stocks={filteredStocks}
                isExpanded={isProductExpanded}
                onToggle={() => toggleProduct(product.sku)}
                expandedLocations={expandedLocations}
                onToggleLocation={(locationId) => toggleLocation(product.sku, locationId)}
                selectedStockIds={selectedStockIds}
                onSelectStock={onSelectStock}
              />
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

interface ProductGroupRowsProps {
  product: ProductStockGroup
  stocks: Stock[]
  isExpanded: boolean
  onToggle: () => void
  expandedLocations: Set<string>
  onToggleLocation: (locationId: string) => void
  selectedStockIds: string[]
  onSelectStock: (stockId: string) => void
}

function ProductGroupRows({
  product,
  stocks,
  isExpanded,
  onToggle,
  expandedLocations,
  onToggleLocation,
  selectedStockIds,
  onSelectStock,
}: ProductGroupRowsProps) {
  // Calculate stage quantities for this product
  const productStocks = stocks.filter((s) => s.sku === product.sku)
  const stages = getStageQuantities(productStocks)

  return (
    <>
      {/* Product Row */}
      <tr
        className="border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer"
        onClick={onToggle}
      >
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <ChevronIcon expanded={isExpanded} />
            <div>
              <span className="font-semibold text-lime-600 dark:text-lime-400">{product.sku}</span>
              <span className="ml-2 text-stone-700 dark:text-stone-300">{product.productName}</span>
            </div>
          </div>
        </td>
        <td className="py-3 px-3 text-stone-600 dark:text-stone-400 text-sm">
          {product.brandName || '—'}
        </td>
        <td className="py-3 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
          {stages.production > 0 ? stages.production.toLocaleString() : '—'}
        </td>
        <td className="py-3 px-3 text-right tabular-nums text-blue-600 dark:text-blue-400">
          {stages.transit > 0 ? stages.transit.toLocaleString() : '—'}
        </td>
        <td className="py-3 px-3 text-right tabular-nums text-amber-600 dark:text-amber-400">
          {stages.warehouse > 0 ? stages.warehouse.toLocaleString() : '—'}
        </td>
        <td className="py-3 px-3 text-right tabular-nums text-violet-600 dark:text-violet-400">
          {stages.amazon > 0 ? stages.amazon.toLocaleString() : '—'}
        </td>
        <td className="py-3 px-3 text-right tabular-nums text-stone-700 dark:text-stone-300">
          {product.availableQuantity.toLocaleString()}
        </td>
        <td className="py-3 px-3 text-right tabular-nums text-stone-500 dark:text-stone-400">
          {product.reservedQuantity > 0 ? product.reservedQuantity.toLocaleString() : '—'}
        </td>
        <td className="py-3 px-3 text-right font-medium tabular-nums">
          ${product.totalValue.toLocaleString()}
        </td>
        <td className="py-3 px-3 text-right text-stone-500 dark:text-stone-400">
          {product.locationsCount}
        </td>
      </tr>

      {/* Location Rows (when product expanded) */}
      {isExpanded &&
        product.locationGroups.map((location) => {
          const locationKey = `${product.sku}-${location.locationId}`
          const isLocationExpanded = expandedLocations.has(locationKey)

          return (
            <LocationGroupRows
              key={location.locationId}
              location={location}
              productSku={product.sku}
              isExpanded={isLocationExpanded}
              onToggle={() => onToggleLocation(location.locationId)}
              selectedStockIds={selectedStockIds}
              onSelectStock={onSelectStock}
            />
          )
        })}
    </>
  )
}

interface LocationGroupRowsProps {
  location: StockLocationGroup
  productSku: string
  isExpanded: boolean
  onToggle: () => void
  selectedStockIds: string[]
  onSelectStock: (stockId: string) => void
}

function LocationGroupRows({
  location,
  isExpanded,
  onToggle,
  selectedStockIds,
  onSelectStock,
}: LocationGroupRowsProps) {
  // Determine which stage column should show the quantity
  const stage = stageFromLocationType(location.locationType)

  return (
    <>
      {/* Location Row */}
      <tr
        className="border-b border-stone-100 dark:border-stone-700/50 bg-stone-50 dark:bg-stone-800/50 hover:bg-stone-100 dark:hover:bg-stone-700/50 cursor-pointer"
        onClick={onToggle}
      >
        <td className="py-2 pl-10 pr-4">
          <div className="flex items-center gap-2">
            <ChevronIcon expanded={isExpanded} />
            <span className="font-medium text-stone-700 dark:text-stone-300">{location.locationName}</span>
            <span className="text-xs px-1.5 py-0.5 bg-stone-200 dark:bg-stone-600 rounded text-stone-600 dark:text-stone-400">
              {location.locationType}
            </span>
          </div>
        </td>
        {/* Brand column - empty for location rows */}
        <td className="py-2 px-3"></td>
        {/* Stage columns - show quantity in matching stage, — in others */}
        <td className="py-2 px-3 text-right tabular-nums text-stone-400 dark:text-stone-500">
          {stage === 'production' ? location.totalQuantity.toLocaleString() : '—'}
        </td>
        <td className="py-2 px-3 text-right tabular-nums text-stone-400 dark:text-stone-500">
          {stage === 'transit' ? location.totalQuantity.toLocaleString() : '—'}
        </td>
        <td className="py-2 px-3 text-right tabular-nums text-stone-400 dark:text-stone-500">
          {stage === 'warehouse' ? location.totalQuantity.toLocaleString() : '—'}
        </td>
        <td className="py-2 px-3 text-right tabular-nums text-stone-400 dark:text-stone-500">
          {stage === 'amazon' ? location.totalQuantity.toLocaleString() : '—'}
        </td>
        <td className="py-2 px-3 text-right tabular-nums text-stone-600 dark:text-stone-400">
          {location.availableQuantity.toLocaleString()}
        </td>
        <td className="py-2 px-3 text-right tabular-nums text-stone-500 dark:text-stone-400">
          {location.reservedQuantity > 0 ? location.reservedQuantity.toLocaleString() : '—'}
        </td>
        <td className="py-2 px-3 text-right tabular-nums text-stone-600 dark:text-stone-400">
          ${location.totalValue.toLocaleString()}
        </td>
        <td className="py-2 px-3 text-right text-stone-400 dark:text-stone-500">
          {location.stocks.length} batch{location.stocks.length !== 1 ? 'es' : ''}
        </td>
      </tr>

      {/* Stock Rows (when location expanded) */}
      {isExpanded && (
        <>
          {/* Sub-header for stock rows */}
          <tr className="bg-stone-100/50 dark:bg-stone-700/30 text-xs text-stone-500 dark:text-stone-400">
            <td className="py-1.5 pl-16 pr-4">PO / Supplier</td>
            <td className="py-1.5 px-3"></td>
            <td className="py-1.5 px-3"></td>
            <td className="py-1.5 px-3"></td>
            <td className="py-1.5 px-3"></td>
            <td className="py-1.5 px-3"></td>
            <td className="py-1.5 px-3 text-right">Avail</td>
            <td className="py-1.5 px-3 text-right">Rsvd</td>
            <td className="py-1.5 px-3 text-right">Unit Cost</td>
            <td className="py-1.5 px-3 text-right">Value</td>
          </tr>
          {location.stocks.map((stock) => (
            <StockRowCompact
              key={stock.id}
              stock={stock}
              isSelected={selectedStockIds.includes(stock.id)}
              onSelect={onSelectStock}
            />
          ))}
        </>
      )}
    </>
  )
}

interface StockRowCompactProps {
  stock: Stock
  isSelected: boolean
  onSelect: (stockId: string) => void
}

function StockRowCompact({ stock, isSelected, onSelect }: StockRowCompactProps) {
  const isFullyReserved = stock.availableQuantity === 0

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <tr
      className={`
        border-b border-stone-100 dark:border-stone-700/50 text-sm
        ${isSelected ? 'bg-lime-50 dark:bg-lime-900/20' : 'bg-stone-50/50 dark:bg-stone-800/30'}
        hover:bg-stone-100 dark:hover:bg-stone-700/50
        ${isFullyReserved ? 'text-stone-400 dark:text-stone-500' : ''}
      `}
    >
      <td className="py-2 pl-16 pr-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            disabled={isFullyReserved}
            onChange={() => onSelect(stock.id)}
            className="h-4 w-4 text-lime-600 focus:ring-lime-500 border-stone-300 dark:border-stone-600 rounded disabled:opacity-50"
          />
          <span className="px-2 py-0.5 bg-stone-200 dark:bg-stone-600 rounded text-xs font-medium text-stone-700 dark:text-stone-300">
            {stock.poNumber}
          </span>
          <span className="text-stone-600 dark:text-stone-400 truncate" title={stock.supplierName}>
            {stock.supplierName}
          </span>
        </div>
      </td>
      {/* Empty brand column - brand is shown at product level */}
      <td className="py-2 px-3"></td>
      {/* Empty stage columns - stage is shown at location level */}
      <td className="py-2 px-3"></td>
      <td className="py-2 px-3"></td>
      <td className="py-2 px-3"></td>
      <td className="py-2 px-3"></td>
      <td className="py-2 px-3 text-right tabular-nums">
        <span className={isFullyReserved ? '' : 'text-emerald-600 dark:text-emerald-400'}>
          {stock.availableQuantity.toLocaleString()}
        </span>
      </td>
      <td className="py-2 px-3 text-right tabular-nums">
        {stock.reservedQuantity > 0 && (
          <span className="text-amber-600 dark:text-amber-400">
            {stock.reservedQuantity.toLocaleString()}
          </span>
        )}
      </td>
      <td className="py-2 px-3 text-right tabular-nums text-stone-500 dark:text-stone-400">
        ${stock.unitCost.toFixed(2)}
      </td>
      <td className="py-2 px-3 text-right">
        <span className="font-medium tabular-nums">${stock.totalValue.toLocaleString()}</span>
        <span className="ml-2 text-xs text-stone-400 dark:text-stone-500">{formatDate(stock.firstReceivedAt)}</span>
      </td>
    </tr>
  )
}

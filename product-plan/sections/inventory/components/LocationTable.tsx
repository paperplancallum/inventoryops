import { useMemo, useState } from 'react'
import type { Stock, LocationStockGroup, LocationProductGroup } from '@/../product/sections/inventory/types'

interface LocationTableProps {
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

function groupStockByLocation(stocks: Stock[]): LocationStockGroup[] {
  const locationMap = new Map<string, {
    locationId: string
    locationName: string
    locationType: string
    productMap: Map<string, {
      sku: string
      productName: string
      brandId?: string
      brandName?: string
      stocks: Stock[]
    }>
  }>()

  for (const stock of stocks) {
    if (!locationMap.has(stock.locationId)) {
      locationMap.set(stock.locationId, {
        locationId: stock.locationId,
        locationName: stock.locationName,
        locationType: stock.locationType,
        productMap: new Map(),
      })
    }

    const location = locationMap.get(stock.locationId)!
    if (!location.productMap.has(stock.sku)) {
      location.productMap.set(stock.sku, {
        sku: stock.sku,
        productName: stock.productName,
        brandId: stock.brandId,
        brandName: stock.brandName,
        stocks: [],
      })
    }

    location.productMap.get(stock.sku)!.stocks.push(stock)
  }

  return Array.from(locationMap.values()).map((location) => {
    const productGroups: LocationProductGroup[] = Array.from(location.productMap.values()).map((prod) => ({
      sku: prod.sku,
      productName: prod.productName,
      brandId: prod.brandId,
      brandName: prod.brandName,
      totalQuantity: prod.stocks.reduce((sum, s) => sum + s.totalQuantity, 0),
      availableQuantity: prod.stocks.reduce((sum, s) => sum + s.availableQuantity, 0),
      reservedQuantity: prod.stocks.reduce((sum, s) => sum + s.reservedQuantity, 0),
      totalValue: prod.stocks.reduce((sum, s) => sum + s.totalValue, 0),
      stocks: prod.stocks.sort((a, b) => new Date(a.firstReceivedAt).getTime() - new Date(b.firstReceivedAt).getTime()),
    }))

    return {
      locationId: location.locationId,
      locationName: location.locationName,
      locationType: location.locationType,
      totalQuantity: productGroups.reduce((sum, pg) => sum + pg.totalQuantity, 0),
      availableQuantity: productGroups.reduce((sum, pg) => sum + pg.availableQuantity, 0),
      reservedQuantity: productGroups.reduce((sum, pg) => sum + pg.reservedQuantity, 0),
      totalValue: productGroups.reduce((sum, pg) => sum + pg.totalValue, 0),
      productsCount: productGroups.length,
      productGroups: productGroups.sort((a, b) => a.sku.localeCompare(b.sku)),
    }
  }).sort((a, b) => a.locationName.localeCompare(b.locationName))
}

export function LocationTable({
  stocks,
  selectedStockIds,
  onSelectStock,
  searchQuery = '',
}: LocationTableProps) {
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set())
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())

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

  const locationGroups = useMemo(() => groupStockByLocation(filteredStocks), [filteredStocks])

  const toggleLocation = (locationId: string) => {
    setExpandedLocations((prev) => {
      const next = new Set(prev)
      if (next.has(locationId)) {
        next.delete(locationId)
      } else {
        next.add(locationId)
      }
      return next
    })
  }

  const toggleProduct = (locationId: string, sku: string) => {
    const key = `${locationId}-${sku}`
    setExpandedProducts((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  if (locationGroups.length === 0) {
    return (
      <div className="text-center py-12 text-stone-500 dark:text-stone-400">
        {searchQuery ? 'No locations match your search' : 'No stock data available'}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-stone-100 dark:bg-stone-800 text-left text-xs font-medium uppercase text-stone-500 dark:text-stone-400">
            <th className="py-3 px-4">Location</th>
            <th className="py-3 px-3">Brand</th>
            <th className="py-3 px-3 text-right">Total</th>
            <th className="py-3 px-3 text-right">Available</th>
            <th className="py-3 px-3 text-right">Reserved</th>
            <th className="py-3 px-3 text-right">Value</th>
            <th className="py-3 px-3 text-right">Products</th>
          </tr>
        </thead>
        <tbody>
          {locationGroups.map((location) => {
            const isLocationExpanded = expandedLocations.has(location.locationId)

            return (
              <LocationGroupRows
                key={location.locationId}
                location={location}
                isExpanded={isLocationExpanded}
                onToggle={() => toggleLocation(location.locationId)}
                expandedProducts={expandedProducts}
                onToggleProduct={(sku) => toggleProduct(location.locationId, sku)}
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

interface LocationGroupRowsProps {
  location: LocationStockGroup
  isExpanded: boolean
  onToggle: () => void
  expandedProducts: Set<string>
  onToggleProduct: (sku: string) => void
  selectedStockIds: string[]
  onSelectStock: (stockId: string) => void
}

function LocationGroupRows({
  location,
  isExpanded,
  onToggle,
  expandedProducts,
  onToggleProduct,
  selectedStockIds,
  onSelectStock,
}: LocationGroupRowsProps) {
  return (
    <>
      {/* Location Row */}
      <tr
        className="border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer"
        onClick={onToggle}
      >
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <ChevronIcon expanded={isExpanded} />
            <span className="font-semibold text-stone-800 dark:text-stone-200">{location.locationName}</span>
            <span className="text-xs px-1.5 py-0.5 bg-stone-200 dark:bg-stone-600 rounded text-stone-600 dark:text-stone-400">
              {location.locationType}
            </span>
          </div>
        </td>
        {/* Brand column - empty for location rows */}
        <td className="py-3 px-3 text-stone-400">—</td>
        <td className="py-3 px-3 text-right font-medium tabular-nums">
          {location.totalQuantity.toLocaleString()}
        </td>
        <td className="py-3 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
          {location.availableQuantity.toLocaleString()}
        </td>
        <td className="py-3 px-3 text-right tabular-nums text-amber-600 dark:text-amber-400">
          {location.reservedQuantity > 0 ? location.reservedQuantity.toLocaleString() : '—'}
        </td>
        <td className="py-3 px-3 text-right font-medium tabular-nums">
          ${location.totalValue.toLocaleString()}
        </td>
        <td className="py-3 px-3 text-right text-stone-500 dark:text-stone-400">
          {location.productsCount}
        </td>
      </tr>

      {/* Product Rows (when location expanded) */}
      {isExpanded &&
        location.productGroups.map((product) => {
          const productKey = `${location.locationId}-${product.sku}`
          const isProductExpanded = expandedProducts.has(productKey)

          return (
            <ProductGroupRows
              key={product.sku}
              product={product}
              locationId={location.locationId}
              isExpanded={isProductExpanded}
              onToggle={() => onToggleProduct(product.sku)}
              selectedStockIds={selectedStockIds}
              onSelectStock={onSelectStock}
            />
          )
        })}
    </>
  )
}

interface ProductGroupRowsProps {
  product: LocationProductGroup
  locationId: string
  isExpanded: boolean
  onToggle: () => void
  selectedStockIds: string[]
  onSelectStock: (stockId: string) => void
}

function ProductGroupRows({
  product,
  isExpanded,
  onToggle,
  selectedStockIds,
  onSelectStock,
}: ProductGroupRowsProps) {
  return (
    <>
      {/* Product Row */}
      <tr
        className="border-b border-stone-100 dark:border-stone-700/50 bg-stone-50 dark:bg-stone-800/50 hover:bg-stone-100 dark:hover:bg-stone-700/50 cursor-pointer"
        onClick={onToggle}
      >
        <td className="py-2 pl-10 pr-4">
          <div className="flex items-center gap-2">
            <ChevronIcon expanded={isExpanded} />
            <span className="font-semibold text-lime-600 dark:text-lime-400">{product.sku}</span>
            <span className="text-stone-600 dark:text-stone-400">{product.productName}</span>
          </div>
        </td>
        <td className="py-2 px-3 text-stone-600 dark:text-stone-400 text-sm">
          {product.brandName || '—'}
        </td>
        <td className="py-2 px-3 text-right tabular-nums text-stone-600 dark:text-stone-400">
          {product.totalQuantity.toLocaleString()}
        </td>
        <td className="py-2 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
          {product.availableQuantity.toLocaleString()}
        </td>
        <td className="py-2 px-3 text-right tabular-nums text-amber-600 dark:text-amber-400">
          {product.reservedQuantity > 0 ? product.reservedQuantity.toLocaleString() : '—'}
        </td>
        <td className="py-2 px-3 text-right tabular-nums text-stone-600 dark:text-stone-400">
          ${product.totalValue.toLocaleString()}
        </td>
        <td className="py-2 px-3 text-right text-stone-400 dark:text-stone-500">
          {product.stocks.length} batch{product.stocks.length !== 1 ? 'es' : ''}
        </td>
      </tr>

      {/* Stock Rows (when product expanded) */}
      {isExpanded && (
        <>
          {/* Sub-header for stock rows */}
          <tr className="bg-stone-100/50 dark:bg-stone-700/30 text-xs text-stone-500 dark:text-stone-400">
            <td className="py-1.5 pl-16 pr-4">PO / Supplier</td>
            <td className="py-1.5 px-3"></td>
            <td className="py-1.5 px-3 text-right">Qty</td>
            <td className="py-1.5 px-3 text-right">Avail</td>
            <td className="py-1.5 px-3 text-right">Rsvd</td>
            <td className="py-1.5 px-3 text-right">Unit Cost</td>
            <td className="py-1.5 px-3 text-right">Value</td>
          </tr>
          {product.stocks.map((stock) => (
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
      <td className="py-2 px-3 text-right tabular-nums">
        {stock.totalQuantity.toLocaleString()}
      </td>
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

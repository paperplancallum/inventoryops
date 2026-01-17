import type { Stock } from '@/../product/sections/inventory/types'

interface StockRowProps {
  stock: Stock
  isSelected: boolean
  isDisabled: boolean
  onSelect: (stockId: string) => void
  indent?: number
  showLocation?: boolean
}

export function StockRow({
  stock,
  isSelected,
  isDisabled,
  onSelect,
  indent = 2,
  showLocation = true,
}: StockRowProps) {
  const indentClass = indent === 1 ? 'pl-8' : indent === 2 ? 'pl-16' : 'pl-24'
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
        ${isDisabled ? 'opacity-50' : 'hover:bg-stone-100 dark:hover:bg-stone-700/50'}
        ${isFullyReserved ? 'text-stone-400 dark:text-stone-500' : ''}
      `}
    >
      {/* Checkbox + PO Number */}
      <td className={`py-2 ${indentClass}`}>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            disabled={isDisabled || isFullyReserved}
            onChange={() => onSelect(stock.id)}
            className="h-4 w-4 text-lime-600 focus:ring-lime-500 border-stone-300 dark:border-stone-600 rounded disabled:opacity-50"
          />
          <span className="px-2 py-0.5 bg-stone-200 dark:bg-stone-600 rounded text-xs font-medium text-stone-700 dark:text-stone-300">
            {stock.poNumber}
          </span>
        </div>
      </td>

      {/* Location (optional) */}
      {showLocation && (
        <td className="py-2 px-3">
          <span className="text-stone-600 dark:text-stone-400">{stock.locationName}</span>
        </td>
      )}

      {/* Supplier */}
      <td className="py-2 px-3">
        <span className="text-stone-600 dark:text-stone-400 truncate max-w-32 block" title={stock.supplierName}>
          {stock.supplierName}
        </span>
      </td>

      {/* Total Qty */}
      <td className="py-2 px-3 text-right tabular-nums">
        {stock.totalQuantity.toLocaleString()}
      </td>

      {/* Available */}
      <td className="py-2 px-3 text-right tabular-nums">
        <span className={isFullyReserved ? '' : 'text-emerald-600 dark:text-emerald-400'}>
          {stock.availableQuantity.toLocaleString()}
        </span>
      </td>

      {/* Reserved */}
      <td className="py-2 px-3 text-right tabular-nums">
        {stock.reservedQuantity > 0 && (
          <span className="text-amber-600 dark:text-amber-400">
            {stock.reservedQuantity.toLocaleString()}
          </span>
        )}
      </td>

      {/* Unit Cost */}
      <td className="py-2 px-3 text-right tabular-nums text-stone-500 dark:text-stone-400">
        ${stock.unitCost.toFixed(2)}
      </td>

      {/* Total Value */}
      <td className="py-2 px-3 text-right tabular-nums font-medium">
        ${stock.totalValue.toLocaleString()}
      </td>

      {/* Received Date */}
      <td className="py-2 px-3 text-right text-stone-500 dark:text-stone-400">
        {formatDate(stock.firstReceivedAt)}
      </td>
    </tr>
  )
}

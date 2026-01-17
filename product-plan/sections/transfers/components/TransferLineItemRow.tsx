import type { TransferLineItemInput } from '@/../product/sections/transfers/types'

interface TransferLineItemRowProps {
  item: TransferLineItemInput
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
}

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const MinusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
  </svg>
)

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

export function TransferLineItemRow({
  item,
  onQuantityChange,
  onRemove,
}: TransferLineItemRowProps) {
  const lineValue = item.quantity * item.unitCost
  const isPartial = item.quantity < item.availableQuantity
  const percentUsed = Math.round((item.quantity / item.availableQuantity) * 100)

  const handleDecrease = () => {
    if (item.quantity > 1) {
      onQuantityChange(item.quantity - 1)
    }
  }

  const handleIncrease = () => {
    if (item.quantity < item.availableQuantity) {
      onQuantityChange(item.quantity + 1)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value)) {
      onQuantityChange(Math.min(Math.max(1, value), item.availableQuantity))
    }
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
      {/* Product info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            {item.sku}
          </p>
          {isPartial && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
              Partial ({percentUsed}%)
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate" title={item.productName}>
          {item.productName}
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          {item.availableQuantity.toLocaleString()} available &bull; ${item.unitCost.toFixed(2)}/unit
        </p>
      </div>

      {/* Quantity input */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleDecrease}
          disabled={item.quantity <= 1}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <MinusIcon />
        </button>
        <input
          type="number"
          min={1}
          max={item.availableQuantity}
          value={item.quantity}
          onChange={handleInputChange}
          className="w-20 px-2 py-1.5 text-center text-sm font-medium bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={handleIncrease}
          disabled={item.quantity >= item.availableQuantity}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <PlusIcon />
        </button>
      </div>

      {/* Value */}
      <div className="text-right w-24">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          ${lineValue.toLocaleString()}
        </p>
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
      >
        <TrashIcon />
      </button>
    </div>
  )
}

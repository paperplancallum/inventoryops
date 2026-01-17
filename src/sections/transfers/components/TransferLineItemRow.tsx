'use client'

import { Trash2, Minus, Plus } from 'lucide-react'
import type { TransferLineItemInput } from '../types'

interface TransferLineItemRowProps {
  item: TransferLineItemInput
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
}

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
    <div className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-700/50 rounded-lg border border-stone-200 dark:border-stone-600">
      {/* Product info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-lime-600 dark:text-lime-400">
            {item.sku}
          </p>
          {isPartial && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
              Partial ({percentUsed}%)
            </span>
          )}
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 truncate" title={item.productName}>
          {item.productName}
        </p>
        <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
          {item.availableQuantity.toLocaleString()} available &bull; ${item.unitCost.toFixed(2)}/unit
        </p>
      </div>

      {/* Quantity input */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleDecrease}
          disabled={item.quantity <= 1}
          className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="number"
          min={1}
          max={item.availableQuantity}
          value={item.quantity}
          onChange={handleInputChange}
          className="w-20 px-2 py-1.5 text-center text-sm font-medium bg-white dark:bg-stone-600 border border-stone-200 dark:border-stone-500 rounded text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={handleIncrease}
          disabled={item.quantity >= item.availableQuantity}
          className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Value */}
      <div className="text-right w-24">
        <p className="text-sm font-semibold text-stone-900 dark:text-white">
          ${lineValue.toLocaleString()}
        </p>
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="p-1.5 text-stone-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

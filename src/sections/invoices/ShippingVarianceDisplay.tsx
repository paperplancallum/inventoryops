'use client'

import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useState } from 'react'

interface LineItemComparison {
  description: string
  quotedAmount: number | null
  actualAmount: number | null
}

interface ShippingVarianceDisplayProps {
  quotedAmount: number | null
  actualAmount: number | null
  currency?: string
  variant?: 'compact' | 'standard' | 'expanded'
  showLabels?: boolean
  showPercentage?: boolean
  lineItemComparison?: LineItemComparison[]
  className?: string
}

export function ShippingVarianceDisplay({
  quotedAmount,
  actualAmount,
  currency = 'USD',
  variant = 'standard',
  showLabels = true,
  showPercentage = true,
  lineItemComparison,
  className = '',
}: ShippingVarianceDisplayProps) {
  const [showLineItems, setShowLineItems] = useState(false)

  // Calculate variance
  const quoted = quotedAmount ?? 0
  const actual = actualAmount ?? 0
  const varianceAmount = actual - quoted
  const variancePercent = quoted > 0 ? (varianceAmount / quoted) * 100 : 0
  const roundedPercent = Math.round(variancePercent * 100) / 100

  // Determine status
  const isOver = varianceAmount > 0
  const isUnder = varianceAmount < 0
  const isEqual = varianceAmount === 0

  // Format currency
  const formatAmount = (amount: number | null) => {
    if (amount === null) return '-'
    return `${currency} ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  // Get status colors
  const getStatusColor = () => {
    if (isEqual) return {
      bg: 'bg-stone-100 dark:bg-stone-700',
      text: 'text-stone-700 dark:text-stone-300',
      icon: 'text-stone-500 dark:text-stone-400',
    }
    if (isOver) return {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-300',
      icon: 'text-red-600 dark:text-red-400',
    }
    return {
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-700 dark:text-green-300',
      icon: 'text-green-600 dark:text-green-400',
    }
  }

  const colors = getStatusColor()

  // Get icon
  const StatusIcon = isEqual ? Minus : isOver ? TrendingUp : TrendingDown

  // Compact variant - just the badge
  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text} ${className}`}>
        <StatusIcon className={`w-3 h-3 ${colors.icon}`} />
        {isOver ? '+' : ''}{formatAmount(varianceAmount)}
        {showPercentage && (
          <span>({isOver ? '+' : ''}{roundedPercent}%)</span>
        )}
      </div>
    )
  }

  // Standard variant - inline with labels
  if (variant === 'standard') {
    return (
      <div className={`flex flex-wrap items-center gap-3 text-sm ${className}`}>
        {showLabels && quotedAmount !== null && (
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 dark:text-stone-400">Quoted:</span>
            <span className="font-medium text-stone-900 dark:text-white">
              {formatAmount(quotedAmount)}
            </span>
          </div>
        )}
        {showLabels && actualAmount !== null && (
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 dark:text-stone-400">Actual:</span>
            <span className="font-medium text-stone-900 dark:text-white">
              {formatAmount(actualAmount)}
            </span>
          </div>
        )}
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded ${colors.bg}`}>
          <StatusIcon className={`w-4 h-4 ${colors.icon}`} />
          <span className={`font-medium ${colors.text}`}>
            {isOver ? '+' : ''}{formatAmount(varianceAmount)}
          </span>
          {showPercentage && (
            <span className={colors.text}>
              ({isOver ? '+' : ''}{roundedPercent}%)
            </span>
          )}
        </div>
      </div>
    )
  }

  // Expanded variant - full card with optional line items
  return (
    <div className={`p-4 ${colors.bg} rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-5 h-5 ${colors.icon}`} />
          <span className={`text-sm font-medium uppercase tracking-wide ${colors.text}`}>
            {isEqual ? 'On Budget' : isOver ? 'Over Budget' : 'Under Budget'}
          </span>
        </div>
        <span className={`text-xl font-bold ${colors.text}`}>
          {isOver ? '+' : ''}{formatAmount(varianceAmount)}
          {showPercentage && (
            <span className="text-sm ml-1">
              ({isOver ? '+' : ''}{roundedPercent}%)
            </span>
          )}
        </span>
      </div>

      {/* Amount comparison */}
      <div className="grid grid-cols-2 gap-4 py-3 border-t border-stone-200 dark:border-stone-600">
        <div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">Quoted Amount</p>
          <p className="text-lg font-semibold text-stone-900 dark:text-white">
            {formatAmount(quotedAmount)}
          </p>
        </div>
        <div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">Actual Amount</p>
          <p className="text-lg font-semibold text-stone-900 dark:text-white">
            {formatAmount(actualAmount)}
          </p>
        </div>
      </div>

      {/* Line item comparison */}
      {lineItemComparison && lineItemComparison.length > 0 && (
        <div className="pt-3 border-t border-stone-200 dark:border-stone-600">
          <button
            onClick={() => setShowLineItems(!showLineItems)}
            className="flex items-center gap-1 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
          >
            {showLineItems ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Hide line item breakdown
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Show line item breakdown ({lineItemComparison.length} items)
              </>
            )}
          </button>

          {showLineItems && (
            <div className="mt-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-stone-500 dark:text-stone-400 uppercase">
                    <th className="text-left py-1">Item</th>
                    <th className="text-right py-1">Quoted</th>
                    <th className="text-right py-1">Actual</th>
                    <th className="text-right py-1">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-600">
                  {lineItemComparison.map((item, index) => {
                    const itemQuoted = item.quotedAmount ?? 0
                    const itemActual = item.actualAmount ?? 0
                    const itemVariance = itemActual - itemQuoted
                    const itemIsOver = itemVariance > 0

                    return (
                      <tr key={index}>
                        <td className="py-2 text-stone-900 dark:text-white">
                          {item.description}
                        </td>
                        <td className="py-2 text-right text-stone-600 dark:text-stone-400">
                          {item.quotedAmount !== null ? formatAmount(item.quotedAmount) : '-'}
                        </td>
                        <td className="py-2 text-right text-stone-600 dark:text-stone-400">
                          {item.actualAmount !== null ? formatAmount(item.actualAmount) : '-'}
                        </td>
                        <td className={`py-2 text-right font-medium ${
                          itemVariance === 0
                            ? 'text-stone-500 dark:text-stone-400'
                            : itemIsOver
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {item.quotedAmount !== null && item.actualAmount !== null
                            ? `${itemIsOver ? '+' : ''}${formatAmount(itemVariance)}`
                            : '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

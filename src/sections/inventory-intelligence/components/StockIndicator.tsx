'use client'

interface StockIndicatorProps {
  current: number
  threshold: number
  max?: number
  showLabel?: boolean
}

export function StockIndicator({ current, threshold, max, showLabel = true }: StockIndicatorProps) {
  const maxValue = max || Math.max(current, threshold * 2)
  const percentage = Math.min((current / maxValue) * 100, 100)
  const thresholdPercentage = Math.min((threshold / maxValue) * 100, 100)

  // Determine color based on stock level
  const getBarColor = () => {
    if (current < threshold * 0.5) return 'bg-red-500'
    if (current < threshold) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
          <span>{current.toLocaleString()} units</span>
          <span>Threshold: {threshold.toLocaleString()}</span>
        </div>
      )}
      <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        {/* Current stock bar */}
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all ${getBarColor()}`}
          style={{ width: `${percentage}%` }}
        />
        {/* Threshold marker */}
        <div
          className="absolute inset-y-0 w-0.5 bg-slate-900 dark:bg-slate-300"
          style={{ left: `${thresholdPercentage}%` }}
        />
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { MoreHorizontal, Eye, Pencil, Trash2, GitBranch, ChevronRight, Check, MapPin } from 'lucide-react'
import type { Batch } from '../types'

interface BatchCardProps {
  batch: Batch
  locationName?: string
  allocatedQuantity?: number
  isDragging?: boolean
  isSelected?: boolean
  isSelectable?: boolean
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onSplit?: (id: string) => void
  onToggleSelect?: (id: string) => void
}

export function BatchCard({
  batch,
  locationName,
  allocatedQuantity,
  isDragging = false,
  isSelected = false,
  isSelectable = false,
  onView,
  onEdit,
  onDelete,
  onSplit,
  onToggleSelect,
}: BatchCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const formatDate = (dateString: string) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const isOverdue = () => {
    if (!batch.expectedArrival) return false
    return new Date(batch.expectedArrival) < new Date() && batch.stage !== 'amazon'
  }

  return (
    <div
      className={`
        bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700
        shadow-sm hover:shadow-md transition-shadow cursor-grab relative
        ${isDragging ? 'shadow-lg ring-2 ring-lime-500' : ''}
        ${isSelected ? 'ring-2 ring-lime-500 border-lime-500' : ''}
      `}
      onClick={() => onView?.(batch.id)}
    >
      {/* Selection Checkbox */}
      {isSelectable && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleSelect?.(batch.id)
          }}
          className={`
            absolute top-2 left-2 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
            ${isSelected
              ? 'bg-lime-500 border-lime-500 text-white'
              : 'bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-500 hover:border-lime-500'
            }
          `}
        >
          {isSelected && <Check className="w-3 h-3" />}
        </button>
      )}

      {/* Header */}
      <div className={`px-3 py-2 border-b border-stone-100 dark:border-stone-700 ${isSelectable ? 'pl-9' : ''}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-stone-900 dark:text-white bg-stone-100 dark:bg-stone-700 px-1.5 py-0.5 rounded">
                {batch.batchNumber}
              </span>
              <span className="text-xs text-stone-400 dark:text-stone-500">
                {batch.poNumber}
              </span>
              {batch.shipmentId && (
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  #{batch.shipmentId.slice(-6)}
                </span>
              )}
            </div>
            <h4 className="mt-1 text-sm font-medium text-stone-900 dark:text-white truncate">
              {batch.productName}
            </h4>
            <p className="text-xs text-lime-600 dark:text-lime-400 font-mono">
              {batch.sku}
            </p>
          </div>

          {/* Action Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(false)
                  }}
                />
                <div className="absolute top-full right-0 mt-1 z-20 w-36 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg py-1">
                  {onView && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onView(batch.id)
                        setShowMenu(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(batch.id)
                        setShowMenu(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                  {onSplit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSplit(batch.id)
                        setShowMenu(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700"
                    >
                      <GitBranch className="w-4 h-4" />
                      Split Batch
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(batch.id)
                        setShowMenu(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 py-2">
        <div className="flex items-center justify-between">
          <div>
            {/* Show available quantity (total minus draft allocations) as main number */}
            {(() => {
              const available = batch.quantity - (allocatedQuantity || 0)
              const hasDraft = allocatedQuantity && allocatedQuantity > 0
              return (
                <>
                  <p className={`text-lg font-semibold tabular-nums ${
                    available <= 0
                      ? 'text-stone-400 dark:text-stone-500'
                      : 'text-stone-900 dark:text-white'
                  }`}>
                    {available.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {hasDraft ? 'available' : 'units'}
                    </p>
                    {hasDraft && (
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        ({allocatedQuantity.toLocaleString()} in draft)
                      </span>
                    )}
                  </div>
                </>
              )
            })()}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-stone-700 dark:text-stone-300 tabular-nums">
              ${batch.totalCost.toLocaleString()}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              @ ${batch.unitCost.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-stone-100 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 rounded-b-lg">
        <div className="flex items-center justify-between text-xs">
          <span className="text-stone-500 dark:text-stone-400 truncate max-w-[60%]">
            {batch.supplierName}
          </span>
          <span className={`font-medium ${isOverdue() ? 'text-red-600 dark:text-red-400' : 'text-stone-600 dark:text-stone-400'}`}>
            {isOverdue() ? 'Overdue • ' : ''}{formatDate(batch.expectedArrival)}
          </span>
        </div>
        {/* Location indicator */}
        {locationName && (
          <div className="mt-1.5 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{locationName}</span>
          </div>
        )}
      </div>

      {/* Stage History Indicator */}
      {batch.stageHistory.length > 0 && (
        <div className="px-3 pb-2 flex items-center gap-1">
          {batch.stageHistory.slice(-3).map((entry, idx) => (
            <div
              key={idx}
              className="flex items-center text-[10px] text-stone-400 dark:text-stone-500"
            >
              <span className="capitalize">{entry.stage}</span>
              {idx < Math.min(batch.stageHistory.length - 1, 2) && (
                <ChevronRight className="w-3 h-3 mx-0.5" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

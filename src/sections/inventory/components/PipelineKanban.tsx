'use client'

import { useMemo, useState } from 'react'
import { Layers, LayoutGrid } from 'lucide-react'
import type { Batch, BatchStage, PipelineStage } from '../types'
import type { AvailableStock } from '@/sections/transfers/types'
import { BatchCard } from './BatchCard'

interface POGroup {
  poNumber: string
  batches: Batch[]
  totalUnits: number
  allocatedUnits: number
  totalValue: number
}

const STAGES: PipelineStage[] = [
  { id: 'ordered', label: 'Ordered', order: 0 },
  { id: 'factory', label: 'At Factory', order: 1 },
  { id: 'inspected', label: 'Inspected', order: 2 },
  { id: 'ready_to_ship', label: 'Ready to Ship', order: 3 },
  { id: 'in-transit', label: 'In Transit', order: 4 },
  { id: 'warehouse', label: 'Warehouse', order: 5 },
  { id: 'amazon', label: 'Amazon FBA', order: 6 },
]

const stageColors: Record<BatchStage, { bg: string; border: string; header: string }> = {
  ordered: { bg: 'bg-stone-50', border: 'border-stone-200', header: 'bg-stone-100' },
  factory: { bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-blue-100' },
  inspected: { bg: 'bg-cyan-50', border: 'border-cyan-200', header: 'bg-cyan-100' },
  'ready_to_ship': { bg: 'bg-teal-50', border: 'border-teal-200', header: 'bg-teal-100' },
  'in-transit': { bg: 'bg-amber-50', border: 'border-amber-200', header: 'bg-amber-100' },
  warehouse: { bg: 'bg-emerald-50', border: 'border-emerald-200', header: 'bg-emerald-100' },
  amazon: { bg: 'bg-violet-50', border: 'border-violet-200', header: 'bg-violet-100' },
}

interface PipelineKanbanProps {
  batches: Batch[]
  availableStock?: AvailableStock[]
  selectedBatchIds?: Set<string>
  isSelectionMode?: boolean
  onViewBatch?: (id: string) => void
  onEditBatch?: (id: string) => void
  onDeleteBatch?: (id: string) => void
  onSplitBatch?: (id: string) => void
  onToggleSelect?: (id: string) => void
}

export function PipelineKanban({
  batches,
  availableStock = [],
  selectedBatchIds = new Set(),
  isSelectionMode = false,
  onViewBatch,
  onEditBatch,
  onDeleteBatch,
  onSplitBatch,
  onToggleSelect,
}: PipelineKanbanProps) {
  const [groupByPO, setGroupByPO] = useState(false)

  // Build a map of batch ID to location name(s) from available stock
  const batchLocationMap = useMemo(() => {
    const map = new Map<string, string>()
    availableStock.forEach(stock => {
      const existing = map.get(stock.batchId)
      if (!existing) {
        map.set(stock.batchId, stock.locationName)
      } else if (!existing.includes(stock.locationName)) {
        // Multiple locations - show first one with indicator
        map.set(stock.batchId, `${existing.split(' +')[0]} + more`)
      }
    })
    return map
  }, [availableStock])

  // Build a map of batch ID to total allocated quantity from available stock
  const batchAllocationMap = useMemo(() => {
    const map = new Map<string, number>()
    availableStock.forEach(stock => {
      if (stock.allocatedQuantity && stock.allocatedQuantity > 0) {
        const existing = map.get(stock.batchId) || 0
        map.set(stock.batchId, existing + stock.allocatedQuantity)
      }
    })
    return map
  }, [availableStock])

  // Group batches by stage
  const batchesByStage = useMemo(() => {
    const grouped: Record<BatchStage, Batch[]> = {
      ordered: [],
      factory: [],
      inspected: [],
      'ready_to_ship': [],
      'in-transit': [],
      warehouse: [],
      amazon: [],
    }

    batches.forEach((batch) => {
      grouped[batch.stage].push(batch)
    })

    // Sort each stage by expected arrival (earliest first for FIFO)
    Object.keys(grouped).forEach((stage) => {
      grouped[stage as BatchStage].sort(
        (a, b) => new Date(a.expectedArrival).getTime() - new Date(b.expectedArrival).getTime()
      )
    })

    return grouped
  }, [batches])

  // Group batches by PO within each stage
  const batchesByStageGroupedByPO = useMemo(() => {
    const result: Record<BatchStage, POGroup[]> = {
      ordered: [],
      factory: [],
      inspected: [],
      'ready_to_ship': [],
      'in-transit': [],
      warehouse: [],
      amazon: [],
    }

    Object.entries(batchesByStage).forEach(([stage, stageBatches]) => {
      const poMap = new Map<string, Batch[]>()

      stageBatches.forEach((batch) => {
        const existing = poMap.get(batch.poNumber) || []
        existing.push(batch)
        poMap.set(batch.poNumber, existing)
      })

      const groups: POGroup[] = Array.from(poMap.entries()).map(([poNumber, batchList]) => {
        const totalUnits = batchList.reduce((sum, b) => sum + b.quantity, 0)
        const allocatedUnits = batchList.reduce((sum, b) => sum + (batchAllocationMap.get(b.id) || 0), 0)
        return {
          poNumber,
          batches: batchList,
          totalUnits,
          allocatedUnits,
          totalValue: batchList.reduce((sum, b) => sum + b.totalCost, 0),
        }
      })

      // Sort groups by earliest expected arrival in group
      groups.sort((a, b) => {
        const aEarliest = Math.min(...a.batches.map(b => new Date(b.expectedArrival).getTime()))
        const bEarliest = Math.min(...b.batches.map(b => new Date(b.expectedArrival).getTime()))
        return aEarliest - bEarliest
      })

      result[stage as BatchStage] = groups
    })

    return result
  }, [batchesByStage, batchAllocationMap])

  // Calculate totals per stage (showing available units = total - allocated)
  const stageTotals = useMemo(() => {
    const totals: Record<BatchStage, { count: number; units: number; allocated: number; value: number }> = {
      ordered: { count: 0, units: 0, allocated: 0, value: 0 },
      factory: { count: 0, units: 0, allocated: 0, value: 0 },
      inspected: { count: 0, units: 0, allocated: 0, value: 0 },
      'ready_to_ship': { count: 0, units: 0, allocated: 0, value: 0 },
      'in-transit': { count: 0, units: 0, allocated: 0, value: 0 },
      warehouse: { count: 0, units: 0, allocated: 0, value: 0 },
      amazon: { count: 0, units: 0, allocated: 0, value: 0 },
    }

    batches.forEach((batch) => {
      const allocated = batchAllocationMap.get(batch.id) || 0
      totals[batch.stage].count++
      totals[batch.stage].units += batch.quantity
      totals[batch.stage].allocated += allocated
      totals[batch.stage].value += batch.totalCost
    })

    return totals
  }, [batches, batchAllocationMap])

  // Helper to render batches (used in both grouped and ungrouped modes)
  const renderBatches = (stageBatches: Batch[]) => {
    return stageBatches.map((batch) => (
      <div key={batch.id} className="mb-2">
        <BatchCard
          batch={batch}
          locationName={batchLocationMap.get(batch.id)}
          allocatedQuantity={batchAllocationMap.get(batch.id)}
          isDragging={false}
          isSelected={selectedBatchIds.has(batch.id)}
          isSelectable={isSelectionMode}
          onView={onViewBatch}
          onEdit={onEditBatch}
          onDelete={onDeleteBatch}
          onSplit={onSplitBatch}
          onToggleSelect={onToggleSelect}
        />
      </div>
    ))
  }

  // Render grouped content (batches grouped by PO)
  const renderGroupedContent = (stageId: BatchStage) => {
    const groups = batchesByStageGroupedByPO[stageId]

    if (groups.length === 0) {
      return (
        <div className="flex items-center justify-center h-24 text-sm text-stone-400 dark:text-stone-500">
          No batches
        </div>
      )
    }

    return groups.map((group) => (
      <div
        key={`po-group:${group.poNumber}`}
        className="mb-3 rounded-lg border bg-white/50 dark:bg-stone-700/30 overflow-hidden border-stone-300 dark:border-stone-600"
      >
        {/* PO Group Header */}
        <div className="px-3 py-2 border-b border-stone-200 dark:border-stone-600 bg-stone-100 dark:bg-stone-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              {group.poNumber}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {group.batches.length} batch{group.batches.length !== 1 ? 'es' : ''}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
            <span>
              {(group.totalUnits - group.allocatedUnits).toLocaleString()} {group.allocatedUnits > 0 ? 'available' : 'units'}
              {group.allocatedUnits > 0 && (
                <span className="ml-1 text-amber-600 dark:text-amber-400">
                  ({group.allocatedUnits.toLocaleString()} draft)
                </span>
              )}
            </span>
            <span>·</span>
            <span>${group.totalValue.toLocaleString()}</span>
          </div>
        </div>
        {/* Batches in group */}
        <div className="p-2">
          {group.batches.map((batch) => (
            <div key={batch.id} className="mb-2">
              <BatchCard
                batch={batch}
                locationName={batchLocationMap.get(batch.id)}
                allocatedQuantity={batchAllocationMap.get(batch.id)}
                isDragging={false}
                isSelected={selectedBatchIds.has(batch.id)}
                isSelectable={isSelectionMode}
                onView={onViewBatch}
                onEdit={onEditBatch}
                onDelete={onDeleteBatch}
                onSplit={onSplitBatch}
                onToggleSelect={onToggleSelect}
              />
            </div>
          ))}
        </div>
      </div>
    ))
  }

  // Render ungrouped content (individual batch cards)
  const renderUngroupedContent = (stageBatches: Batch[]) => {
    if (stageBatches.length === 0) {
      return (
        <div className="flex items-center justify-center h-24 text-sm text-stone-400 dark:text-stone-500">
          No batches
        </div>
      )
    }
    return renderBatches(stageBatches)
  }

  return (
    <div>
      {/* Toggle Button */}
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-700 rounded-lg">
          <button
            onClick={() => setGroupByPO(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              !groupByPO
                ? 'bg-white dark:bg-stone-600 text-stone-900 dark:text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
            title="Individual batches"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Batches</span>
          </button>
          <button
            onClick={() => setGroupByPO(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              groupByPO
                ? 'bg-white dark:bg-stone-600 text-stone-900 dark:text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
            title="Group by Purchase Order"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">By PO</span>
          </button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px]">
        {STAGES.map((stage) => {
          const colors = stageColors[stage.id]
          const total = stageTotals[stage.id]
          const stageBatches = batchesByStage[stage.id]

          return (
            <div
              key={stage.id}
              className={`flex-shrink-0 w-72 rounded-lg border ${colors.border} ${colors.bg} dark:bg-stone-800 dark:border-stone-700`}
            >
              {/* Stage Header */}
              <div className={`px-4 py-3 ${colors.header} dark:bg-stone-700 rounded-t-lg border-b ${colors.border} dark:border-stone-600`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-stone-900 dark:text-white">
                    {stage.label}
                  </h3>
                  <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium bg-white dark:bg-stone-600 text-stone-700 dark:text-stone-200 rounded-full shadow-sm">
                    {total.count}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
                  <span>
                    {(total.units - total.allocated).toLocaleString()} {total.allocated > 0 ? 'available' : 'units'}
                    {total.allocated > 0 && (
                      <span className="ml-1 text-amber-600 dark:text-amber-400">
                        ({total.allocated.toLocaleString()} draft)
                      </span>
                    )}
                  </span>
                  <span>${total.value.toLocaleString()}</span>
                </div>
              </div>

              {/* Batch Cards */}
              <div className="p-2 min-h-[400px]">
                {groupByPO
                  ? renderGroupedContent(stage.id)
                  : renderUngroupedContent(stageBatches)
                }
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

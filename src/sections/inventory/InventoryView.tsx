'use client'

import { useState } from 'react'
import { Plus, Search, Filter, LayoutGrid, Table as TableIcon } from 'lucide-react'
import type { InventoryProps, Batch, BatchStage } from './types'
import { BatchCard } from './BatchCard'
import { PipelineColumn } from './PipelineColumn'
import { BatchTableRow } from './BatchTableRow'

type ViewMode = 'pipeline' | 'table'

export function InventoryView({
  batches,
  pipelineStages,
  amazonReconciliation,
  onViewBatch,
  onEditBatch,
  onDeleteBatch,
  onCreateBatch,
  onMoveBatch,
}: InventoryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('pipeline')
  const [searchQuery, setSearchQuery] = useState('')
  const [stageFilter, setStageFilter] = useState<BatchStage | 'all'>('all')

  // Filter batches based on search and stage filter
  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      searchQuery === '' ||
      batch.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.batchNumber.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStage = stageFilter === 'all' || batch.stage === stageFilter

    return matchesSearch && matchesStage
  })

  // Group batches by stage for pipeline view
  const batchesByStage = pipelineStages.reduce(
    (acc, stage) => {
      acc[stage.id] = filteredBatches.filter((b) => b.stage === stage.id)
      return acc
    },
    {} as Record<BatchStage, Batch[]>
  )

  // Calculate summary stats
  const totalBatches = batches.length
  const totalUnits = batches.reduce((sum, b) => sum + b.quantity, 0)
  const totalValue = batches.reduce((sum, b) => sum + b.totalCost, 0)
  const inTransitCount = batches.filter((b) => b.stage === 'in-transit').length

  // Get reconciliation status for a batch
  const getReconciliation = (batchId: string) =>
    amazonReconciliation.find((r) => r.batchId === batchId)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                Inventory
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Track batches through pipeline stages
              </p>
            </div>
            <button
              onClick={() => onCreateBatch?.()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Batch
            </button>
          </div>

          {/* Stats Row */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Total Batches
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                {totalBatches}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Total Units
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                {totalUnits.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Total Value
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                ${totalValue.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                In Transit
              </p>
              <p className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-400">
                {inTransitCount}
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 pb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search batches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Stage Filter */}
            <div className="relative">
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value as BatchStage | 'all')}
                className="appearance-none pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
              >
                <option value="all">All stages</option>
                {pipelineStages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Filter className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <button
              onClick={() => setViewMode('pipeline')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'pipeline'
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Pipeline</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {viewMode === 'pipeline' ? (
          /* Pipeline / Kanban View */
          <div className="flex gap-4 overflow-x-auto pb-4">
            {pipelineStages.map((stage) => (
              <PipelineColumn
                key={stage.id}
                stage={stage}
                batches={batchesByStage[stage.id] || []}
                onViewBatch={onViewBatch}
                onMoveBatch={onMoveBatch}
                getReconciliation={getReconciliation}
                allStages={pipelineStages}
              />
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Stage
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Supplier
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      PO
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      ETA
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Cost
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredBatches.map((batch) => (
                    <BatchTableRow
                      key={batch.id}
                      batch={batch}
                      stages={pipelineStages}
                      reconciliation={getReconciliation(batch.id)}
                      onView={() => onViewBatch?.(batch.id)}
                      onEdit={() => onEditBatch?.(batch.id)}
                      onDelete={() => onDeleteBatch?.(batch.id)}
                      onMoveBatch={(newStage) => onMoveBatch?.(batch.id, newStage)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            {filteredBatches.length === 0 && (
              <div className="px-4 py-12 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No batches found matching your criteria
                </p>
              </div>
            )}
            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-indigo-600 dark:text-indigo-400">
                Showing {filteredBatches.length} of {batches.length} batches
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import type { Batch, BatchStage, PipelineStage, AmazonReconciliation } from './types'
import { BatchCard } from './BatchCard'

interface PipelineColumnProps {
  stage: PipelineStage
  batches: Batch[]
  allStages: PipelineStage[]
  onViewBatch?: (id: string) => void
  onMoveBatch?: (batchId: string, newStage: BatchStage) => void
  getReconciliation: (batchId: string) => AmazonReconciliation | undefined
}

const stageStyles: Record<BatchStage, { headerBg: string; headerText: string; accent: string }> = {
  ordered: {
    headerBg: 'bg-slate-100 dark:bg-slate-700',
    headerText: 'text-slate-700 dark:text-slate-200',
    accent: 'bg-slate-400',
  },
  factory: {
    headerBg: 'bg-blue-50 dark:bg-blue-900/20',
    headerText: 'text-blue-700 dark:text-blue-300',
    accent: 'bg-blue-500',
  },
  inspected: {
    headerBg: 'bg-purple-50 dark:bg-purple-900/20',
    headerText: 'text-purple-700 dark:text-purple-300',
    accent: 'bg-purple-500',
  },
  ready_to_ship: {
    headerBg: 'bg-teal-50 dark:bg-teal-900/20',
    headerText: 'text-teal-700 dark:text-teal-300',
    accent: 'bg-teal-500',
  },
  'in-transit': {
    headerBg: 'bg-amber-50 dark:bg-amber-900/20',
    headerText: 'text-amber-700 dark:text-amber-300',
    accent: 'bg-amber-500',
  },
  warehouse: {
    headerBg: 'bg-cyan-50 dark:bg-cyan-900/20',
    headerText: 'text-cyan-700 dark:text-cyan-300',
    accent: 'bg-cyan-500',
  },
  amazon: {
    headerBg: 'bg-green-50 dark:bg-green-900/20',
    headerText: 'text-green-700 dark:text-green-300',
    accent: 'bg-green-500',
  },
}

export function PipelineColumn({
  stage,
  batches,
  allStages,
  onViewBatch,
  onMoveBatch,
  getReconciliation,
}: PipelineColumnProps) {
  const styles = stageStyles[stage.id]
  const totalUnits = batches.reduce((sum, b) => sum + b.quantity, 0)
  const totalValue = batches.reduce((sum, b) => sum + b.totalCost, 0)

  return (
    <div className="flex-shrink-0 w-72">
      {/* Column Header */}
      <div className={`${styles.headerBg} rounded-t-xl px-4 py-3`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${styles.accent}`} />
            <h3 className={`font-semibold ${styles.headerText}`}>{stage.label}</h3>
          </div>
          <span
            className={`
            px-2 py-0.5 rounded-full text-xs font-medium
            bg-white/60 dark:bg-slate-800/60 ${styles.headerText}
          `}
          >
            {batches.length}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span>{totalUnits.toLocaleString()} units</span>
          <span>${totalValue.toLocaleString()}</span>
        </div>
      </div>

      {/* Column Body */}
      <div className="bg-slate-100/50 dark:bg-slate-800/30 rounded-b-xl p-3 min-h-[400px] space-y-3">
        {batches.length === 0 ? (
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
            <p className="text-sm text-slate-400 dark:text-slate-500">No batches</p>
          </div>
        ) : (
          batches.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              reconciliation={getReconciliation(batch.id)}
              onView={() => onViewBatch?.(batch.id)}
              onMoveBatch={(newStage) => onMoveBatch?.(batch.id, newStage)}
              allStages={allStages}
            />
          ))
        )}
      </div>
    </div>
  )
}

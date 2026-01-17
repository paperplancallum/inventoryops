'use client'

import { useState } from 'react'
import {
  ArrowLeft,
  Factory,
  Package,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  DollarSign,
  Plus,
  AlertTriangle,
} from 'lucide-react'
import type { WorkOrder, WorkOrderStatus, WorkOrderCostType } from '@/lib/supabase/hooks/useWorkOrders'

interface WorkOrderDetailProps {
  workOrder: WorkOrder
  onBack: () => void
  onStatusChange: (status: WorkOrderStatus, note?: string) => Promise<void>
  onStart: () => Promise<void>
  onComplete: (actualOutput: number, scrap: number) => Promise<void>
  onCancel: (reason?: string) => Promise<void>
  onAddCost: (
    costType: WorkOrderCostType,
    description: string,
    amount: number,
    isPerUnit: boolean,
    perUnitRate?: number,
    quantity?: number
  ) => Promise<void>
}

const statusConfig: Record<WorkOrderStatus, { label: string; bg: string; text: string; icon: typeof Clock }> = {
  draft: { label: 'Draft', bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-300', icon: Clock },
  planned: { label: 'Planned', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', icon: Clock },
  in_progress: { label: 'In Progress', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', icon: PlayCircle },
  completed: { label: 'Completed', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', icon: CheckCircle },
  cancelled: { label: 'Cancelled', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', icon: XCircle },
}

const costTypeLabels: Record<WorkOrderCostType, string> = {
  kitting_per_unit: 'Kitting (Per Unit)',
  kitting_flat: 'Kitting (Flat)',
  assembly_per_unit: 'Assembly (Per Unit)',
  assembly_flat: 'Assembly (Flat)',
  packaging: 'Packaging',
  labor: 'Labor',
  other: 'Other',
}

export function WorkOrderDetail({
  workOrder,
  onBack,
  onStatusChange,
  onStart,
  onComplete,
  onCancel,
  onAddCost,
}: WorkOrderDetailProps) {
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showAddCostModal, setShowAddCostModal] = useState(false)

  const [actualOutput, setActualOutput] = useState(workOrder.plannedOutputQuantity)
  const [scrapQty, setScrapQty] = useState(0)
  const [cancelReason, setCancelReason] = useState('')
  const [newCostType, setNewCostType] = useState<WorkOrderCostType>('kitting_flat')
  const [newCostDescription, setNewCostDescription] = useState('')
  const [newCostAmount, setNewCostAmount] = useState(0)
  const [newCostIsPerUnit, setNewCostIsPerUnit] = useState(false)
  const [newCostRate, setNewCostRate] = useState(0)
  const [newCostQty, setNewCostQty] = useState(workOrder.plannedOutputQuantity)
  const [processing, setProcessing] = useState(false)

  const status = statusConfig[workOrder.status]
  const StatusIcon = status.icon

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const handleStart = async () => {
    setProcessing(true)
    try {
      await onStart()
    } finally {
      setProcessing(false)
    }
  }

  const handleComplete = async () => {
    setProcessing(true)
    try {
      await onComplete(actualOutput, scrapQty)
      setShowCompleteModal(false)
    } finally {
      setProcessing(false)
    }
  }

  const handleCancel = async () => {
    setProcessing(true)
    try {
      await onCancel(cancelReason || undefined)
      setShowCancelModal(false)
    } finally {
      setProcessing(false)
    }
  }

  const handleAddCost = async () => {
    setProcessing(true)
    try {
      const amount = newCostIsPerUnit ? newCostRate * newCostQty : newCostAmount
      await onAddCost(
        newCostType,
        newCostDescription,
        amount,
        newCostIsPerUnit,
        newCostIsPerUnit ? newCostRate : undefined,
        newCostIsPerUnit ? newCostQty : undefined
      )
      setShowAddCostModal(false)
      setNewCostDescription('')
      setNewCostAmount(0)
      setNewCostRate(0)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-300 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                {workOrder.workOrderNumber}
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {status.label}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {workOrder.finishedProductName} ({workOrder.bomName})
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {workOrder.status === 'draft' && (
              <>
                <button
                  onClick={() => onStatusChange('planned')}
                  className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                >
                  Mark Planned
                </button>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
            {workOrder.status === 'planned' && (
              <>
                <button
                  onClick={handleStart}
                  disabled={processing}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {processing ? 'Starting...' : 'Start Work Order'}
                </button>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
            {workOrder.status === 'in_progress' && (
              <button
                onClick={() => setShowCompleteModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
              >
                Complete Work Order
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="col-span-2 space-y-6">
            {/* Overview */}
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-4">
                Overview
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Assembly Location</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-900 dark:text-white">
                      {workOrder.assemblyLocationName}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Planned Output</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {workOrder.plannedOutputQuantity} units
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Actual Output</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {workOrder.actualOutputQuantity ?? '—'}
                    {workOrder.scrapQuantity > 0 && (
                      <span className="text-amber-600 dark:text-amber-400 ml-2">
                        ({workOrder.scrapQuantity} scrap)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Scheduled Start</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {formatDate(workOrder.scheduledStartDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Scheduled End</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {formatDate(workOrder.scheduledEndDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Actual Start</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {formatDate(workOrder.actualStartDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Actual End</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {formatDate(workOrder.actualEndDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Components */}
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-4">
                Components ({workOrder.components.length})
              </h3>
              {workOrder.components.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No components allocated yet
                </p>
              ) : (
                <div className="space-y-2">
                  {workOrder.components.map((comp, idx) => (
                    <div
                      key={comp.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 flex items-center justify-center text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white text-sm">
                            Batch #{comp.componentBatchId.slice(0, 8)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Allocated: {comp.quantityAllocated} | Consumed: {comp.quantityConsumed ?? '—'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                          {formatCurrency(comp.totalCost)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          @ {formatCurrency(comp.unitCost)}/unit
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            {workOrder.notes && (
              <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                  Notes
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {workOrder.notes}
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Costs & Timeline */}
          <div className="space-y-6">
            {/* Costs */}
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Costs
                </h3>
                {(workOrder.status === 'in_progress' || workOrder.status === 'planned') && (
                  <button
                    onClick={() => setShowAddCostModal(true)}
                    className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Cost
                  </button>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Component Costs</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {formatCurrency(workOrder.totalComponentCost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Assembly Costs</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {formatCurrency(workOrder.totalAssemblyCost)}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-600">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Total</span>
                  <span className="font-semibold text-lg text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(workOrder.totalComponentCost + workOrder.totalAssemblyCost)}
                  </span>
                </div>
                {workOrder.actualOutputQuantity && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-slate-500 dark:text-slate-400">Cost per unit</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {formatCurrency((workOrder.totalComponentCost + workOrder.totalAssemblyCost) / workOrder.actualOutputQuantity)}
                    </span>
                  </div>
                )}
              </div>

              {/* Cost Details */}
              {workOrder.costs.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                    Assembly Cost Breakdown
                  </p>
                  <div className="space-y-1">
                    {workOrder.costs.map(cost => (
                      <div key={cost.id} className="flex justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400">
                          {cost.description}
                        </span>
                        <span className="text-slate-900 dark:text-white">
                          {formatCurrency(cost.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Status History */}
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-4">
                Status History
              </h3>
              <div className="space-y-3">
                {workOrder.statusHistory.map((entry, idx) => {
                  const entryStatus = statusConfig[entry.status]
                  const EntryIcon = entryStatus.icon
                  return (
                    <div key={entry.id} className="flex gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${entryStatus.bg}`}>
                        <EntryIcon className={`w-3.5 h-3.5 ${entryStatus.text}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {entryStatus.label}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(entry.createdAt)}
                        </p>
                        {entry.note && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            {entry.note}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCompleteModal(false)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Complete Work Order
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Actual Output Quantity
                </label>
                <input
                  type="number"
                  value={actualOutput}
                  onChange={(e) => setActualOutput(parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Scrap Quantity
                </label>
                <input
                  type="number"
                  value={scrapQty}
                  onChange={(e) => setScrapQty(parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                disabled={processing || actualOutput <= 0}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50"
              >
                {processing ? 'Completing...' : 'Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCancelModal(false)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Cancel Work Order
            </h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Reason (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Keep Open
              </button>
              <button
                onClick={handleCancel}
                disabled={processing}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
              >
                {processing ? 'Cancelling...' : 'Cancel Work Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Cost Modal */}
      {showAddCostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddCostModal(false)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Add Cost
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Cost Type
                </label>
                <select
                  value={newCostType}
                  onChange={(e) => setNewCostType(e.target.value as WorkOrderCostType)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                >
                  {Object.entries(costTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newCostDescription}
                  onChange={(e) => setNewCostDescription(e.target.value)}
                  placeholder="e.g., Kitting fee from supplier"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="perUnit"
                  checked={newCostIsPerUnit}
                  onChange={(e) => setNewCostIsPerUnit(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="perUnit" className="text-sm text-slate-700 dark:text-slate-300">
                  Per-unit cost
                </label>
              </div>
              {newCostIsPerUnit ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Rate per unit
                    </label>
                    <input
                      type="number"
                      value={newCostRate}
                      onChange={(e) => setNewCostRate(parseFloat(e.target.value) || 0)}
                      min={0}
                      step={0.01}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={newCostQty}
                      onChange={(e) => setNewCostQty(parseInt(e.target.value) || 0)}
                      min={1}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={newCostAmount}
                    onChange={(e) => setNewCostAmount(parseFloat(e.target.value) || 0)}
                    min={0}
                    step={0.01}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                  />
                </div>
              )}
              {newCostIsPerUnit && (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Total: {formatCurrency(newCostRate * newCostQty)}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddCostModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCost}
                disabled={processing || !newCostDescription}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
              >
                {processing ? 'Adding...' : 'Add Cost'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

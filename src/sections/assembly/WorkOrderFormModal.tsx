'use client'

import { useState, useEffect } from 'react'
import { X, Factory, Calendar, Package, MapPin } from 'lucide-react'
import type { WorkOrder, WorkOrderFormData } from '@/lib/supabase/hooks/useWorkOrders'
import type { BOM } from '@/lib/supabase/hooks/useBOMs'

interface Location {
  id: string
  name: string
  type: string
}

interface WorkOrderFormModalProps {
  workOrder?: WorkOrder
  boms: BOM[]
  locations: Location[]
  onSubmit: (data: WorkOrderFormData) => Promise<void>
  onCancel: () => void
}

export function WorkOrderFormModal({
  workOrder,
  boms,
  locations,
  onSubmit,
  onCancel,
}: WorkOrderFormModalProps) {
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [bomId, setBomId] = useState(workOrder?.bomId || '')
  const [assemblyLocationId, setAssemblyLocationId] = useState(workOrder?.assemblyLocationId || '')
  const [plannedOutputQuantity, setPlannedOutputQuantity] = useState(workOrder?.plannedOutputQuantity || 1)
  const [scheduledStartDate, setScheduledStartDate] = useState(workOrder?.scheduledStartDate || '')
  const [scheduledEndDate, setScheduledEndDate] = useState(workOrder?.scheduledEndDate || '')
  const [notes, setNotes] = useState(workOrder?.notes || '')

  const selectedBom = boms.find(b => b.id === bomId)

  // Calculate estimated cost based on BOM
  const estimatedCost = selectedBom
    ? selectedBom.estimatedUnitCost * plannedOutputQuantity
    : 0

  // Required components for display
  const requiredComponents = selectedBom?.lineItems.map(item => ({
    name: item.componentName,
    sku: item.componentSku,
    required: Math.ceil(item.quantityRequired * plannedOutputQuantity / selectedBom.outputQuantity),
    unitCost: item.componentUnitCost,
  })) || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!bomId) {
      alert('Please select a BOM')
      return
    }

    if (!assemblyLocationId) {
      alert('Please select an assembly location')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        bomId,
        assemblyLocationId,
        plannedOutputQuantity,
        scheduledStartDate: scheduledStartDate || undefined,
        scheduledEndDate: scheduledEndDate || undefined,
        notes: notes || undefined,
        components: [], // Components allocated separately
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      {/* Modal */}
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white dark:bg-slate-800 shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Factory className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {workOrder ? 'Edit Work Order' : 'New Work Order'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Create an assembly job to produce finished goods
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* BOM Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Bill of Materials *
              </label>
              <select
                value={bomId}
                onChange={(e) => setBomId(e.target.value)}
                disabled={!!workOrder}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                required
              >
                <option value="">Select a BOM...</option>
                {boms.map(bom => (
                  <option key={bom.id} value={bom.id}>
                    {bom.finishedProductSku} - {bom.finishedProductName} ({bom.name})
                  </option>
                ))}
              </select>
              {boms.length === 0 && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  No active BOMs found. Create a BOM first.
                </p>
              )}
            </div>

            {/* Assembly Location */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Assembly Location *
              </label>
              <select
                value={assemblyLocationId}
                onChange={(e) => setAssemblyLocationId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select a location...</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Output Quantity */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Planned Output Quantity *
              </label>
              <input
                type="number"
                value={plannedOutputQuantity}
                onChange={(e) => setPlannedOutputQuantity(parseInt(e.target.value) || 1)}
                min={1}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              {selectedBom && selectedBom.outputQuantity > 1 && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  BOM produces {selectedBom.outputQuantity} units per batch
                </p>
              )}
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Scheduled Start
                </label>
                <input
                  type="date"
                  value={scheduledStartDate}
                  onChange={(e) => setScheduledStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Scheduled End
                </label>
                <input
                  type="date"
                  value={scheduledEndDate}
                  onChange={(e) => setScheduledEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Optional work order notes..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Required Components Preview */}
            {selectedBom && requiredComponents.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Required Components
                </h4>
                <div className="space-y-2">
                  {requiredComponents.map((comp, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-slate-900 dark:text-white">{comp.name}</span>
                        <span className="text-slate-500 dark:text-slate-400 ml-2">
                          ({comp.sku})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-slate-900 dark:text-white">
                          {comp.required}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 ml-1">units</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Estimated total cost
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(estimatedCost)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !bomId || !assemblyLocationId}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : workOrder ? 'Update Work Order' : 'Create Work Order'}
          </button>
        </div>
      </div>
    </div>
  )
}

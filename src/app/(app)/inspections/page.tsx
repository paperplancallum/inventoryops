'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useInspections } from '@/lib/supabase/hooks/useInspections'
import { useInspectionAgents } from '@/lib/supabase/hooks/useInspectionAgents'
import { usePurchaseOrders } from '@/lib/supabase/hooks'
import {
  InspectionsView,
  InspectionAgentForm,
} from '@/sections/inspections'
import {
  INSPECTION_STATUS_OPTIONS,
  type InspectionAgentFormData,
} from '@/sections/inspections/types'

// Simple modal wrapper component
function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

// PO type for the form
interface POOption {
  id: string
  poNumber: string
  supplierName: string
  status: string
  total: number
  lineItemCount: number
  expectedDate: string
}

// Available PO type for adding to inspection
interface AvailablePO {
  id: string
  poNumber: string
  supplierName: string
  lineItemCount: number
  expectedDate: string
}

// Helper to calculate days difference
function getDaysDifference(date1: string, date2: string): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = d2.getTime() - d1.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Edit inspection form
function EditInspectionForm({
  inspection,
  agents,
  currentPOs,
  availablePOs,
  loadingPOs,
  onSubmit,
  onAddPOs,
  onRemovePO,
  onCancel,
}: {
  inspection: { id: string; inspectionNumber: string; scheduledDate: string; agentId: string | null; notes: string; supplierName: string | null }
  agents: { id: string; name: string }[]
  currentPOs: { id: string; poNumber: string }[]
  availablePOs: AvailablePO[]
  loadingPOs: boolean
  onSubmit: (data: { scheduledDate?: string; agentId?: string | null; notes?: string }) => Promise<void>
  onAddPOs: (poIds: string[], newScheduledDate?: string) => Promise<void>
  onRemovePO: (poId: string) => Promise<void>
  onCancel: () => void
}) {
  const [scheduledDate, setScheduledDate] = useState(inspection.scheduledDate)
  const [agentId, setAgentId] = useState<string | null>(inspection.agentId)
  const [notes, setNotes] = useState(inspection.notes || '')
  const [submitting, setSubmitting] = useState(false)
  const [selectedPOsToAdd, setSelectedPOsToAdd] = useState<string[]>([])
  const [addingPOs, setAddingPOs] = useState(false)
  const [showDateWarning, setShowDateWarning] = useState(false)
  const [removingPOId, setRemovingPOId] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

  const handleRemovePO = async (poId: string) => {
    // If this is the last PO, show warning
    if (currentPOs.length === 1) {
      alert('Cannot remove the last purchase order from an inspection')
      return
    }

    // Show confirmation if not already confirmed
    if (confirmRemove !== poId) {
      setConfirmRemove(poId)
      return
    }

    setRemovingPOId(poId)
    await onRemovePO(poId)
    setRemovingPOId(null)
    setConfirmRemove(null)
  }

  // Calculate if selected POs would push back the inspection date
  const selectedPODetails = availablePOs.filter(po => selectedPOsToAdd.includes(po.id))
  const latestExpectedDate = selectedPODetails.reduce((latest, po) => {
    if (!po.expectedDate) return latest
    if (!latest) return po.expectedDate
    return new Date(po.expectedDate) > new Date(latest) ? po.expectedDate : latest
  }, '' as string)

  const delayDays = latestExpectedDate && scheduledDate
    ? getDaysDifference(scheduledDate, latestExpectedDate)
    : 0

  const hasSignificantDelay = delayDays > 7 // More than 7 days difference

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await onSubmit({
      scheduledDate,
      agentId,
      notes,
    })
    setSubmitting(false)
  }

  const handleAddPOs = async () => {
    if (selectedPOsToAdd.length === 0) return

    // If there's a significant delay, show warning first
    if (hasSignificantDelay && !showDateWarning) {
      setShowDateWarning(true)
      return
    }

    setAddingPOs(true)
    // If there's a significant delay and user confirmed, pass the new scheduled date
    if (hasSignificantDelay && latestExpectedDate) {
      await onAddPOs(selectedPOsToAdd, latestExpectedDate)
      // Update local form state to reflect new scheduled date
      setScheduledDate(latestExpectedDate)
    } else {
      await onAddPOs(selectedPOsToAdd)
    }
    setSelectedPOsToAdd([])
    setShowDateWarning(false)
    setAddingPOs(false)
  }

  const togglePOSelection = (poId: string) => {
    setSelectedPOsToAdd(prev =>
      prev.includes(poId) ? prev.filter(id => id !== poId) : [...prev, poId]
    )
    setShowDateWarning(false) // Reset warning when selection changes
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 mb-4">
        <p className="text-sm font-medium text-slate-900 dark:text-white">
          {inspection.inspectionNumber}
        </p>
        {inspection.supplierName && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Supplier: {inspection.supplierName}
          </p>
        )}
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Scheduled: {new Date(scheduledDate).toLocaleDateString()}
        </p>
      </div>

      {/* Current POs */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Current Purchase Orders ({currentPOs.length})
        </label>
        <div className="space-y-1">
          {currentPOs.map(po => (
            <div
              key={po.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                confirmRemove === po.id
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  : 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800'
              }`}
            >
              <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="flex-1 text-sm text-indigo-700 dark:text-indigo-300">{po.poNumber}</span>
              {confirmRemove === po.id ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-red-600 dark:text-red-400 mr-1">Remove?</span>
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    title="Cancel"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemovePO(po.id)}
                    disabled={removingPOId === po.id}
                    className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50"
                    title="Confirm remove"
                  >
                    {removingPOId === po.id ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </div>
              ) : currentPOs.length > 1 ? (
                <button
                  type="button"
                  onClick={() => handleRemovePO(po.id)}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                  title="Remove from inspection"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Add More POs */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Add More Purchase Orders
        </label>
        {loadingPOs ? (
          <p className="text-sm text-slate-500">Loading available POs...</p>
        ) : availablePOs.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">
            No additional POs available from this supplier
          </p>
        ) : (
          <>
            <div className="max-h-40 overflow-y-auto border border-slate-300 dark:border-slate-600 rounded-lg">
              {availablePOs.map(po => {
                const poDelayDays = po.expectedDate && scheduledDate
                  ? getDaysDifference(scheduledDate, po.expectedDate)
                  : 0
                const wouldDelay = poDelayDays > 7

                return (
                  <label
                    key={po.id}
                    className={`flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-0 ${
                      wouldDelay && selectedPOsToAdd.includes(po.id) ? 'bg-amber-50 dark:bg-amber-900/10' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPOsToAdd.includes(po.id)}
                      onChange={() => togglePOSelection(po.id)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {po.poNumber}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {po.lineItemCount} line items
                        {po.expectedDate && (
                          <span className={wouldDelay ? ' text-amber-600 dark:text-amber-400 font-medium' : ''}>
                            {' '}• Expected: {new Date(po.expectedDate).toLocaleDateString()}
                            {wouldDelay && ` (+${poDelayDays} days)`}
                          </span>
                        )}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>

            {/* Date delay warning */}
            {showDateWarning && hasSignificantDelay && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      This will delay the inspection by {delayDays} days
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      The selected PO(s) won&apos;t be ready until {new Date(latestExpectedDate).toLocaleDateString()}.
                      This could delay delivery of the other PO(s) in this inspection.
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 font-medium">
                      Consider scheduling a separate inspection instead.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => setShowDateWarning(false)}
                        className="px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddPOs}
                        disabled={addingPOs}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded disabled:opacity-50"
                      >
                        {addingPOs ? 'Adding...' : 'Add Anyway'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedPOsToAdd.length > 0 && !showDateWarning && (
              <button
                type="button"
                onClick={handleAddPOs}
                disabled={addingPOs}
                className={`mt-2 w-full px-3 py-2 text-sm font-medium rounded-lg disabled:opacity-50 ${
                  hasSignificantDelay
                    ? 'text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                    : 'text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                }`}
              >
                {addingPOs ? 'Adding...' : `Add ${selectedPOsToAdd.length} PO${selectedPOsToAdd.length > 1 ? 's' : ''}${hasSignificantDelay ? ' (may delay inspection)' : ''}`}
              </button>
            )}
          </>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Scheduled Date
        </label>
        <input
          type="date"
          value={scheduledDate}
          onChange={e => setScheduledDate(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Inspection Agent
        </label>
        <select
          value={agentId || ''}
          onChange={e => setAgentId(e.target.value || null)}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Unassigned</option>
          {agents.map(agent => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Notes for the inspection..."
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

// Schedule inspection form (enhanced with PO selection and batch scheduling)
function ScheduleInspectionForm({
  agents,
  purchaseOrders,
  preselectedPOIds,
  onSubmitBatch,
  onCancel,
  onComplete,
}: {
  agents: { id: string; name: string }[]
  purchaseOrders: POOption[]
  preselectedPOIds?: string[]
  onSubmitBatch: (poIds: string[], agentId: string | null, scheduledDate: string, notes?: string) => Promise<number>
  onCancel: () => void
  onComplete: () => void
}) {
  const [selectedPOIds, setSelectedPOIds] = useState<string[]>(preselectedPOIds || [])
  const [agentId, setAgentId] = useState<string | null>(null)
  const [scheduledDate, setScheduledDate] = useState('')
  const [notes, setNotes] = useState('')
  const [dateWarning, setDateWarning] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Filter out POs that already have inspections (status check can be enhanced later)
  const availablePOs = purchaseOrders.filter(po =>
    !['cancelled'].includes(po.status) &&
    (preselectedPOIds?.includes(po.id) || !preselectedPOIds?.length)
  )

  const selectedPODetails = purchaseOrders.filter(po => selectedPOIds.includes(po.id))

  // Calculate minimum date (latest expected date from selected POs)
  const minScheduledDate = selectedPODetails.length > 0
    ? selectedPODetails.reduce((latest, po) => {
        const poDate = new Date(po.expectedDate)
        return poDate > latest ? poDate : latest
      }, new Date(selectedPODetails[0].expectedDate))
    : null

  const minDateString = minScheduledDate?.toISOString().split('T')[0] || ''

  // Pre-fill scheduled date when POs are selected
  useEffect(() => {
    if (minDateString && !scheduledDate) {
      setScheduledDate(minDateString)
    }
  }, [minDateString, scheduledDate])

  // Update scheduled date when selection changes (if current date is before new min)
  useEffect(() => {
    if (minDateString && scheduledDate && scheduledDate < minDateString) {
      setScheduledDate(minDateString)
      setDateWarning(null)
    }
  }, [minDateString, scheduledDate])

  const togglePOSelection = (poId: string) => {
    setSelectedPOIds(prev =>
      prev.includes(poId)
        ? prev.filter(id => id !== poId)
        : [...prev, poId]
    )
    setDateWarning(null)
  }

  const handleDateChange = (newDate: string) => {
    if (minDateString && newDate < minDateString) {
      // Find the PO with the latest expected date
      const latestPO = selectedPODetails.reduce((latest, po) =>
        new Date(po.expectedDate) > new Date(latest.expectedDate) ? po : latest
      , selectedPODetails[0])

      setDateWarning(
        `Inspection cannot be scheduled before the expected production completion date. ` +
        `${latestPO.poNumber} is expected to complete on ${new Date(latestPO.expectedDate).toLocaleDateString()}.`
      )
      // Don't update the date - keep the valid one
      return
    }
    setDateWarning(null)
    setScheduledDate(newDate)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedPOIds.length === 0 || !scheduledDate) return

    setSubmitting(true)
    setSubmitError(null)

    // Use batch scheduling - groups POs by supplier + location automatically
    const inspectionCount = await onSubmitBatch(
      selectedPOIds,
      agentId,
      scheduledDate,
      notes || undefined
    )

    setSubmitting(false)

    if (inspectionCount === 0) {
      setSubmitError('Failed to schedule inspections. Please try again.')
    } else {
      onComplete()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Selected POs Summary */}
      {selectedPODetails.length > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200 mb-2">
            Selected Purchase Orders ({selectedPODetails.length})
          </p>
          <div className="space-y-2">
            {selectedPODetails.map(po => (
              <div key={po.id} className="flex items-center justify-between text-sm">
                <span className="text-indigo-700 dark:text-indigo-300">{po.poNumber} - {po.supplierName}</span>
                <button
                  type="button"
                  onClick={() => togglePOSelection(po.id)}
                  className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PO Selection */}
      {!preselectedPOIds?.length && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Select Purchase Orders <span className="text-red-500">*</span>
          </label>
          <div className="max-h-48 overflow-y-auto border border-slate-300 dark:border-slate-600 rounded-lg">
            {availablePOs.length === 0 ? (
              <p className="p-3 text-sm text-slate-500">No purchase orders available</p>
            ) : (
              availablePOs.map(po => (
                <label
                  key={po.id}
                  className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedPOIds.includes(po.id)}
                    onChange={() => togglePOSelection(po.id)}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {po.poNumber}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {po.supplierName} • {po.lineItemCount} items • ${po.total.toLocaleString()}
                    </p>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Inspection Agent
        </label>
        <select
          value={agentId || ''}
          onChange={e => setAgentId(e.target.value || null)}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Unassigned</option>
          {agents.map(agent => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Scheduled Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={scheduledDate}
          onChange={e => handleDateChange(e.target.value)}
          min={minDateString || new Date().toISOString().split('T')[0]}
          className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
            dateWarning ? 'border-amber-400 dark:border-amber-500' : 'border-slate-300 dark:border-slate-600'
          }`}
          required
        />
        {minDateString && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Earliest date: {new Date(minDateString).toLocaleDateString()} (latest PO completion)
          </p>
        )}
        {dateWarning && (
          <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {dateWarning}
            </p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Optional notes for the inspection..."
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Error Message */}
      {submitError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{submitError}</p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={selectedPOIds.length === 0 || !scheduledDate || submitting}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Scheduling...
            </span>
          ) : (
            `Schedule Inspection${selectedPOIds.length > 1 ? `s (${selectedPOIds.length})` : ''}`
          )}
        </button>
      </div>
    </form>
  )
}

export default function InspectionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Hooks
  const {
    inspections,
    summary,
    loading: inspectionsLoading,
    error: inspectionsError,
    scheduleInspectionBatch,
    updateStatus,
    updateInspection,
    getAvailablePOsForInspection,
    addPurchaseOrdersToInspection,
    removePurchaseOrderFromInspection,
    markResult,
    sendToAgent,
    markPaid,
    createReworkRequest,
    completeRework,
    scheduleReinspection,
    deleteInspection,
    sendMessage,
  } = useInspections()

  const {
    agents,
    activeAgents,
    loading: agentsLoading,
    error: agentsError,
    createAgent,
    updateAgent,
    toggleAgentStatus,
    deleteAgent,
  } = useInspectionAgents()

  const {
    purchaseOrders,
    loading: posLoading,
  } = usePurchaseOrders()

  // Modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showAgentModal, setShowAgentModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null)
  const [editingInspectionId, setEditingInspectionId] = useState<string | null>(null)
  const [preselectedPOIds, setPreselectedPOIds] = useState<string[]>([])
  const [availablePOsForEdit, setAvailablePOsForEdit] = useState<AvailablePO[]>([])
  const [loadingAvailablePOs, setLoadingAvailablePOs] = useState(false)

  // Handle URL params and sessionStorage on mount
  useEffect(() => {
    const action = searchParams.get('action')
    const viewId = searchParams.get('view')

    if (action === 'create') {
      // Check for preselected POs from sessionStorage
      const storedPOIds = sessionStorage.getItem('preselectedPOIds')
      if (storedPOIds) {
        try {
          const poIds = JSON.parse(storedPOIds)
          if (Array.isArray(poIds) && poIds.length > 0) {
            setPreselectedPOIds(poIds)
          }
        } catch (e) {
          console.error('Failed to parse preselected PO IDs:', e)
        }
        sessionStorage.removeItem('preselectedPOIds')
      }
      setShowScheduleModal(true)
      // Clear the URL param
      router.replace('/inspections')
    }

    if (viewId) {
      // Could open a detail modal for the inspection - for now just clear the param
      router.replace('/inspections')
    }
  }, [searchParams, router])

  // Convert POs to form options
  const poOptions: POOption[] = purchaseOrders.map(po => ({
    id: po.id,
    poNumber: po.poNumber,
    supplierName: po.supplierName,
    status: po.status,
    total: po.total,
    lineItemCount: po.lineItems.length,
    expectedDate: po.expectedDate,
  }))

  // Get agent being edited
  const editingAgent = editingAgentId ? agents.find(a => a.id === editingAgentId) : undefined

  // Handlers
  const handleScheduleInspectionBatch = useCallback(
    async (poIds: string[], agentId: string | null, scheduledDate: string, notes?: string): Promise<number> => {
      const results = await scheduleInspectionBatch(poIds, agentId, scheduledDate, notes)
      return results.length
    },
    [scheduleInspectionBatch]
  )

  const handleScheduleComplete = useCallback(() => {
    setShowScheduleModal(false)
    setPreselectedPOIds([])
  }, [])

  const handleSendToAgent = useCallback(async (id: string) => {
    await sendToAgent(id)
  }, [sendToAgent])

  const handleMarkPaid = useCallback(async (id: string) => {
    await markPaid(id)
  }, [markPaid])

  const handleMarkResult = useCallback(async (id: string, result: 'pass' | 'fail') => {
    await markResult(id, result)
  }, [markResult])

  const handleStartInspection = useCallback(async (id: string) => {
    await updateStatus(id, 'in-progress')
  }, [updateStatus])

  const handleCreateRework = useCallback(async (id: string) => {
    // For now, create with default instructions - could show a modal later
    await createReworkRequest(id, 'Please address the defects found during inspection.')
  }, [createReworkRequest])

  const handleCompleteRework = useCallback(async (id: string) => {
    await completeRework(id)
  }, [completeRework])

  const handleScheduleReinspection = useCallback(async (id: string) => {
    // Get the original inspection to determine scheduled date
    const inspection = inspections.find(i => i.id === id)
    if (inspection) {
      // Schedule re-inspection 7 days from now
      const newDate = new Date()
      newDate.setDate(newDate.getDate() + 7)
      await scheduleReinspection(id, newDate.toISOString().split('T')[0], inspection.agentId)
    }
  }, [inspections, scheduleReinspection])

  const handleViewPurchaseOrder = useCallback((poId: string) => {
    router.push(`/purchase-orders?id=${poId}`)
  }, [router])

  const handleDeleteInspection = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this inspection?')) {
      await deleteInspection(id)
    }
  }, [deleteInspection])

  const handleSendMessage = useCallback(async (inspectionId: string, content: string) => {
    await sendMessage(inspectionId, content, 'outbound')
  }, [sendMessage])

  const handleAddNote = useCallback(async (inspectionId: string, content: string) => {
    await sendMessage(inspectionId, content, 'note')
  }, [sendMessage])

  const handleEditInspection = useCallback(async (id: string) => {
    setEditingInspectionId(id)
    setShowEditModal(true)
    setLoadingAvailablePOs(true)
    const available = await getAvailablePOsForInspection(id)
    setAvailablePOsForEdit(available)
    setLoadingAvailablePOs(false)
  }, [getAvailablePOsForInspection])

  const handleAddPOsToInspection = useCallback(
    async (poIds: string[], newScheduledDate?: string) => {
      if (!editingInspectionId) return
      const success = await addPurchaseOrdersToInspection(editingInspectionId, poIds)
      if (success) {
        // If a new scheduled date was provided (due to delay), update the inspection
        if (newScheduledDate) {
          await updateInspection(editingInspectionId, { scheduledDate: newScheduledDate })
        }
        // Refresh available POs list
        const available = await getAvailablePOsForInspection(editingInspectionId)
        setAvailablePOsForEdit(available)
      }
    },
    [editingInspectionId, addPurchaseOrdersToInspection, getAvailablePOsForInspection, updateInspection]
  )

  const handleRemovePOFromInspection = useCallback(
    async (poId: string) => {
      if (!editingInspectionId) return
      const success = await removePurchaseOrderFromInspection(editingInspectionId, poId)
      if (success) {
        // Refresh available POs list (the removed PO is now available again)
        const available = await getAvailablePOsForInspection(editingInspectionId)
        setAvailablePOsForEdit(available)
      }
    },
    [editingInspectionId, removePurchaseOrderFromInspection, getAvailablePOsForInspection]
  )

  const handleUpdateInspection = useCallback(
    async (data: { scheduledDate?: string; agentId?: string | null; notes?: string }) => {
      if (!editingInspectionId) return
      const success = await updateInspection(editingInspectionId, data)
      if (success) {
        setShowEditModal(false)
        setEditingInspectionId(null)
      }
    },
    [editingInspectionId, updateInspection]
  )

  // Agent handlers
  const handleAddAgent = useCallback(() => {
    setEditingAgentId(null)
    setShowAgentModal(true)
  }, [])

  const handleEditAgent = useCallback((id: string) => {
    setEditingAgentId(id)
    setShowAgentModal(true)
  }, [])

  const handleDeleteAgent = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this agent?')) {
      await deleteAgent(id)
    }
  }, [deleteAgent])

  const handleToggleAgentStatus = useCallback(async (id: string) => {
    await toggleAgentStatus(id)
  }, [toggleAgentStatus])

  const handleAgentFormSubmit = useCallback(async (data: InspectionAgentFormData) => {
    if (editingAgentId) {
      await updateAgent(editingAgentId, data)
    } else {
      await createAgent(data)
    }
    setShowAgentModal(false)
    setEditingAgentId(null)
  }, [editingAgentId, createAgent, updateAgent])

  const handleAgentFormCancel = useCallback(() => {
    setShowAgentModal(false)
    setEditingAgentId(null)
  }, [])

  // Loading state
  if (inspectionsLoading || agentsLoading || posLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-slate-500">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Loading inspections...</span>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (inspectionsError || agentsError) {
    const error = inspectionsError || agentsError
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-medium text-red-800 dark:text-red-200">Error loading inspections</h3>
              <p className="text-sm text-red-600 dark:text-red-300">{error?.message}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <InspectionsView
        inspections={inspections}
        agents={agents}
        statusOptions={INSPECTION_STATUS_OPTIONS}
        summary={summary}
        onScheduleInspection={() => setShowScheduleModal(true)}
        onEditInspection={handleEditInspection}
        onSendToAgent={handleSendToAgent}
        onMarkPaid={handleMarkPaid}
        onMarkResult={handleMarkResult}
        onStartInspection={handleStartInspection}
        onCreateRework={handleCreateRework}
        onCompleteRework={handleCompleteRework}
        onScheduleReinspection={handleScheduleReinspection}
        onViewPurchaseOrder={handleViewPurchaseOrder}
        onDeleteInspection={handleDeleteInspection}
        onSendMessage={handleSendMessage}
        onAddNote={handleAddNote}
        onAddAgent={handleAddAgent}
        onEditAgent={handleEditAgent}
        onDeleteAgent={handleDeleteAgent}
        onToggleAgentStatus={handleToggleAgentStatus}
      />

      {/* Schedule Inspection Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false)
          setPreselectedPOIds([])
        }}
        title="Schedule Inspection"
      >
        <ScheduleInspectionForm
          agents={activeAgents}
          purchaseOrders={poOptions}
          preselectedPOIds={preselectedPOIds.length > 0 ? preselectedPOIds : undefined}
          onSubmitBatch={handleScheduleInspectionBatch}
          onCancel={() => {
            setShowScheduleModal(false)
            setPreselectedPOIds([])
          }}
          onComplete={handleScheduleComplete}
        />
      </Modal>

      {/* Agent Form Modal */}
      <Modal
        isOpen={showAgentModal}
        onClose={handleAgentFormCancel}
        title={editingAgent ? 'Edit Agent' : 'Add Agent'}
      >
        <InspectionAgentForm
          agent={editingAgent}
          isOpen={true}
          onSubmit={handleAgentFormSubmit}
          onCancel={handleAgentFormCancel}
        />
      </Modal>

      {/* Edit Inspection Modal */}
      {editingInspectionId && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingInspectionId(null)
            setAvailablePOsForEdit([])
          }}
          title="Edit Inspection"
        >
          {(() => {
            const inspection = inspections.find(i => i.id === editingInspectionId)
            if (!inspection) return null

            // Build current POs list from both legacy and junction table approaches
            const currentPOs: { id: string; poNumber: string }[] = []
            if (inspection.purchaseOrders && inspection.purchaseOrders.length > 0) {
              for (const po of inspection.purchaseOrders) {
                currentPOs.push({ id: po.id, poNumber: po.poNumber })
              }
            } else if (inspection.purchaseOrderId && inspection.purchaseOrderNumber) {
              currentPOs.push({ id: inspection.purchaseOrderId, poNumber: inspection.purchaseOrderNumber })
            }

            return (
              <EditInspectionForm
                inspection={{
                  id: inspection.id,
                  inspectionNumber: inspection.inspectionNumber || '',
                  scheduledDate: inspection.scheduledDate,
                  agentId: inspection.agentId,
                  notes: inspection.notes,
                  supplierName: inspection.supplierName || inspection.purchaseOrders?.[0]?.supplierName || null,
                }}
                agents={activeAgents}
                currentPOs={currentPOs}
                availablePOs={availablePOsForEdit}
                loadingPOs={loadingAvailablePOs}
                onSubmit={handleUpdateInspection}
                onAddPOs={handleAddPOsToInspection}
                onRemovePO={handleRemovePOFromInspection}
                onCancel={() => {
                  setShowEditModal(false)
                  setEditingInspectionId(null)
                  setAvailablePOsForEdit([])
                }}
              />
            )
          })()}
        </Modal>
      )}
    </>
  )
}

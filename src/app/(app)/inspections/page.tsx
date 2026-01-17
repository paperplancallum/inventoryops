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
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null)
  const [preselectedPOIds, setPreselectedPOIds] = useState<string[]>([])

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
    </>
  )
}

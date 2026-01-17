'use client'

import { useState } from 'react'
import type { InspectionsProps, InspectionStatus, Inspection } from '@/sections/inspections/types'
import { InspectionTableRow } from './InspectionTableRow'
import { AgentsTable } from './AgentsTable'
import { InspectionDetailPanel } from './InspectionDetailPanel'

type Tab = 'inspections' | 'agents'

// Icons
const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

const SearchIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

const ClipboardCheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
)

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ExclamationIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const ListIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
)

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

export function InspectionsView({
  inspections,
  agents,
  statusOptions,
  summary,
  onViewInspection: _onViewInspection,
  onEditInspection,
  onDeleteInspection,
  onScheduleInspection,
  onSendToAgent,
  onMarkPaid,
  onMarkResult,
  onStartInspection,
  onCreateRework,
  onCompleteRework,
  onScheduleReinspection,
  onViewPurchaseOrder,
  onGenerateReport,
  onAddAgent,
  onEditAgent,
  onDeleteAgent,
  onToggleAgentStatus,
  onSendMessage,
  onAddNote,
}: InspectionsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('inspections')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<InspectionStatus | 'all'>('all')
  const [sortField, setSortField] = useState<'scheduledDate' | 'defectRate'>('scheduledDate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null)

  // Track expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRowExpanded = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Filter inspections
  const filteredInspections = inspections.filter(insp => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = searchQuery === '' ||
      insp.inspectionNumber?.toLowerCase().includes(searchLower) ||
      (insp.purchaseOrderNumber || '').toLowerCase().includes(searchLower) ||
      (insp.supplierName || '').toLowerCase().includes(searchLower) ||
      insp.purchaseOrders?.some(po =>
        po.poNumber.toLowerCase().includes(searchLower) ||
        po.supplierName.toLowerCase().includes(searchLower)
      ) ||
      insp.lineItems.some(li =>
        li.productName.toLowerCase().includes(searchLower) ||
        li.productSku.toLowerCase().includes(searchLower)
      )

    const matchesStatus = statusFilter === 'all' || insp.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Sort inspections
  const sortedInspections = [...filteredInspections].sort((a, b) => {
    let comparison = 0
    if (sortField === 'scheduledDate') {
      comparison = new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    } else if (sortField === 'defectRate') {
      comparison = a.overallDefectRate - b.overallDefectRate
    }
    return sortDirection === 'desc' ? -comparison : comparison
  })

  const handleSort = (field: 'scheduledDate' | 'defectRate') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Calculate pending actions count
  const pendingActionsCount = summary.pendingConfirmation + summary.reportSubmitted

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                Inspections
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Pre-shipment quality control for purchase orders
              </p>
            </div>
            <button
              onClick={() => onScheduleInspection?.()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <PlusIcon />
              Schedule Inspection
            </button>
          </div>

          {/* Summary Cards */}
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-200 dark:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-300">
                  <ClipboardCheckIcon />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total</p>
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {summary.total}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${pendingActionsCount > 0 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' : 'bg-slate-200 dark:bg-slate-600 text-slate-500'}`}>
                  <ClockIcon />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Pending Actions</p>
              </div>
              <p className={`mt-2 text-2xl font-semibold ${pendingActionsCount > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-900 dark:text-white'}`}>
                {pendingActionsCount}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <CheckCircleIcon />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Passed</p>
              </div>
              <p className="mt-2 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                {summary.passed}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${summary.pendingRework > 0 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-slate-200 dark:bg-slate-600 text-slate-500'}`}>
                  <ExclamationIcon />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Pending Rework</p>
              </div>
              <p className={`mt-2 text-2xl font-semibold ${summary.pendingRework > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                {summary.pendingRework}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <ClipboardCheckIcon />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Avg Defect Rate</p>
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {summary.avgDefectRate.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-1 border-b border-slate-200 dark:border-slate-700 -mx-6 px-6">
            <button
              onClick={() => setActiveTab('inspections')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'inspections'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <ListIcon />
              Inspections
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'agents'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <UsersIcon />
              Agents
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                {agents.filter(a => a.isActive).length}
              </span>
            </button>
          </div>
        </div>

        {/* Filters - only show for inspections tab */}
        {activeTab === 'inspections' && (
        <div className="px-6 pb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search by PO, supplier, or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InspectionStatus | 'all')}
              className="appearance-none pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
            >
              <option value="all">All statuses</option>
              {statusOptions.map(status => (
                <option key={status.id} value={status.id}>{status.label}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <FilterIcon />
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'agents' ? (
          <AgentsTable
            agents={agents}
            onAddAgent={onAddAgent}
            onEditAgent={onEditAgent}
            onDeleteAgent={onDeleteAgent}
            onToggleAgentStatus={onToggleAgentStatus}
          />
        ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="w-8 px-2 py-3">
                    {/* Expand button column */}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Inspection #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    PO(s)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Supplier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Line Items
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    <button
                      onClick={() => handleSort('scheduledDate')}
                      className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      Date
                      {sortField === 'scheduledDate' && (
                        <span className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                          <ChevronDownIcon />
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Agent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    <button
                      onClick={() => handleSort('defectRate')}
                      className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      Defect Rate
                      {sortField === 'defectRate' && (
                        <span className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                          <ChevronDownIcon />
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Result
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Invoice
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {sortedInspections.map(insp => (
                  <InspectionTableRow
                    key={insp.id}
                    inspection={insp}
                    statusOptions={statusOptions}
                    isExpanded={expandedRows.has(insp.id)}
                    onToggleExpand={() => toggleRowExpanded(insp.id)}
                    onView={() => setSelectedInspection(insp)}
                    onEdit={() => onEditInspection?.(insp.id)}
                    onDelete={() => onDeleteInspection?.(insp.id)}
                    onSendToAgent={() => onSendToAgent?.(insp.id)}
                    onMarkPaid={() => onMarkPaid?.(insp.id)}
                    onMarkResult={(result) => onMarkResult?.(insp.id, result)}
                    onStart={() => onStartInspection?.(insp.id)}
                    onCreateRework={() => onCreateRework?.(insp.id)}
                    onScheduleReinspection={() => onScheduleReinspection?.(insp.id)}
                    onGenerateReport={() => onGenerateReport?.(insp.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {sortedInspections.length === 0 && (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No inspections found matching your criteria
              </p>
            </div>
          )}
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing {sortedInspections.length} of {inspections.length} inspections
            </p>
          </div>
        </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedInspection && (
        <InspectionDetailPanel
          inspection={selectedInspection}
          isOpen={!!selectedInspection}
          onClose={() => setSelectedInspection(null)}
          onEdit={() => {
            onEditInspection?.(selectedInspection.id)
            setSelectedInspection(null)
          }}
          onSendMessage={onSendMessage}
          onAddNote={onAddNote}
          onViewPurchaseOrder={onViewPurchaseOrder}
          onSendToAgent={() => {
            onSendToAgent?.(selectedInspection.id)
          }}
          onMarkPaid={() => {
            onMarkPaid?.(selectedInspection.id)
          }}
          onMarkResult={(result) => {
            onMarkResult?.(selectedInspection.id, result)
          }}
          onCreateRework={() => {
            onCreateRework?.(selectedInspection.id)
          }}
          onCompleteRework={() => {
            onCompleteRework?.(selectedInspection.id)
          }}
          onScheduleReinspection={() => {
            onScheduleReinspection?.(selectedInspection.id)
          }}
        />
      )}
    </div>
  )
}

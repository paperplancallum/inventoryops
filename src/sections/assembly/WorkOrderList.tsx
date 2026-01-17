'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, RefreshCw, Factory, Eye, Edit, Clock, CheckCircle, XCircle, PlayCircle } from 'lucide-react'
import type { WorkOrder, WorkOrderStatus } from '@/lib/supabase/hooks/useWorkOrders'

interface WorkOrderListProps {
  workOrders: WorkOrder[]
  loading?: boolean
  onCreateWorkOrder?: () => void
  onEditWorkOrder?: (id: string) => void
  onViewWorkOrder?: (id: string) => void
  onRefresh?: () => void
}

const statusConfig: Record<WorkOrderStatus, { label: string; bg: string; text: string; icon: typeof Clock }> = {
  draft: { label: 'Draft', bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-300', icon: Clock },
  planned: { label: 'Planned', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', icon: Clock },
  in_progress: { label: 'In Progress', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', icon: PlayCircle },
  completed: { label: 'Completed', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', icon: CheckCircle },
  cancelled: { label: 'Cancelled', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', icon: XCircle },
}

export function WorkOrderList({
  workOrders,
  loading = false,
  onCreateWorkOrder,
  onEditWorkOrder,
  onViewWorkOrder,
  onRefresh,
}: WorkOrderListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'all'>('all')

  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter(wo => {
      // Status filter
      if (statusFilter !== 'all' && wo.status !== statusFilter) return false

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          wo.workOrderNumber.toLowerCase().includes(q) ||
          wo.bomName.toLowerCase().includes(q) ||
          wo.finishedProductName.toLowerCase().includes(q) ||
          wo.assemblyLocationName.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [workOrders, statusFilter, searchQuery])

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

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
              Work Orders
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage assembly and kitting jobs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onCreateWorkOrder}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Work Order
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by WO#, product, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as WorkOrderStatus | 'all')}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading && workOrders.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : filteredWorkOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Factory className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
              {searchQuery || statusFilter !== 'all' ? 'No work orders found' : 'No work orders yet'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {searchQuery || statusFilter !== 'all' ? 'Try different filters' : 'Create your first work order to start assembly'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <button
                onClick={onCreateWorkOrder}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Work Order
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Work Order #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Location
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Qty
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Schedule
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Est. Cost
                </th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredWorkOrders.map(wo => {
                const status = statusConfig[wo.status]
                const StatusIcon = status.icon
                return (
                  <tr
                    key={wo.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900 dark:text-white">
                        {wo.workOrderNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                          {wo.finishedProductName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {wo.bomName}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {wo.assemblyLocationName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                          {wo.actualOutputQuantity ?? wo.plannedOutputQuantity}
                        </p>
                        {wo.scrapQuantity > 0 && (
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            -{wo.scrapQuantity} scrap
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        {wo.status === 'completed' ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            Completed {formatDate(wo.actualEndDate)}
                          </span>
                        ) : wo.actualStartDate ? (
                          <span className="text-amber-600 dark:text-amber-400">
                            Started {formatDate(wo.actualStartDate)}
                          </span>
                        ) : wo.scheduledStartDate ? (
                          <span className="text-slate-600 dark:text-slate-400">
                            Scheduled {formatDate(wo.scheduledStartDate)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(wo.totalComponentCost + wo.totalAssemblyCost)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onViewWorkOrder?.(wo.id)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {wo.status === 'draft' && (
                          <button
                            onClick={() => onEditWorkOrder?.(wo.id)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

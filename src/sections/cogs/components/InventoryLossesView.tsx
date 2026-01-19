'use client'

import { useState, useMemo } from 'react'
import { RefreshCw, Plus, Search, MoreVertical, Package, AlertTriangle, DollarSign, Filter } from 'lucide-react'
import type { InventoryLoss, InventoryLossSummary, InventoryLossType, ReimbursementStatus, InventoryLossFormData } from '@/lib/supabase/hooks'
import { InventoryLossForm } from './InventoryLossForm'
import { ReimbursementModal } from './ReimbursementModal'

const LOSS_TYPE_LABELS: Record<InventoryLossType, string> = {
  damaged_inbound: 'Damaged (Inbound)',
  damaged_warehouse: 'Damaged (Warehouse)',
  damaged_customer: 'Damaged (Customer)',
  lost_inbound: 'Lost (Inbound)',
  lost_warehouse: 'Lost (Warehouse)',
  disposed: 'Disposed',
  expired: 'Expired',
  recalled: 'Recalled',
  write_off: 'Write-off',
}

const LOSS_TYPE_COLORS: Record<InventoryLossType, string> = {
  damaged_inbound: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  damaged_warehouse: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  damaged_customer: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
  lost_inbound: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  lost_warehouse: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  disposed: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  expired: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  recalled: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
  write_off: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
}

const REIMBURSEMENT_STATUS_COLORS: Record<ReimbursementStatus, string> = {
  none: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
  partial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  complete: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  denied: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
}

interface InventoryLossesViewProps {
  losses: InventoryLoss[]
  summary: InventoryLossSummary | null
  pendingReimbursements: InventoryLoss[]
  isLoading: boolean
  error: string | null
  onCreateLoss: (data: InventoryLossFormData) => Promise<InventoryLoss | null>
  onUpdateLoss: (id: string, data: Partial<InventoryLossFormData>) => Promise<InventoryLoss | null>
  onDeleteLoss: (id: string) => Promise<boolean>
  onRecordReimbursement: (id: string, data: { amount: number; date: string; reference?: string }) => Promise<InventoryLoss | null>
  onRefresh: () => void
}

export function InventoryLossesView({
  losses,
  summary,
  pendingReimbursements,
  isLoading,
  error,
  onCreateLoss,
  onUpdateLoss,
  onDeleteLoss,
  onRecordReimbursement,
  onRefresh,
}: InventoryLossesViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<InventoryLossType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<ReimbursementStatus | 'all'>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingLoss, setEditingLoss] = useState<InventoryLoss | null>(null)
  const [reimbursementLoss, setReimbursementLoss] = useState<InventoryLoss | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const filteredLosses = useMemo(() => {
    let result = [...losses]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(l =>
        l.sellerSku.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q) ||
        l.amazonCaseId?.toLowerCase().includes(q)
      )
    }

    if (typeFilter !== 'all') {
      result = result.filter(l => l.lossType === typeFilter)
    }

    if (statusFilter !== 'all') {
      result = result.filter(l => l.reimbursementStatus === statusFilter)
    }

    return result
  }, [losses, searchQuery, typeFilter, statusFilter])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const handleCreate = async (data: InventoryLossFormData) => {
    const result = await onCreateLoss(data)
    if (result) {
      setIsFormOpen(false)
    }
  }

  const handleUpdate = async (data: InventoryLossFormData) => {
    if (!editingLoss) return
    const result = await onUpdateLoss(editingLoss.id, data)
    if (result) {
      setEditingLoss(null)
    }
  }

  const handleDelete = async (id: string) => {
    const result = await onDeleteLoss(id)
    if (result) {
      setDeleteConfirmId(null)
    }
  }

  const handleReimbursement = async (data: { amount: number; date: string; reference?: string }) => {
    if (!reimbursementLoss) return
    const result = await onRecordReimbursement(reimbursementLoss.id, data)
    if (result) {
      setReimbursementLoss(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                Inventory Losses
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Track damaged, lost, and disposed inventory
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsFormOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Record Loss
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          {summary && (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Losses</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{summary.totalLosses}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Units Lost</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{summary.totalUnits}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Cost</p>
                <p className="mt-1 text-2xl font-semibold text-red-600 dark:text-red-400">{formatCurrency(summary.totalCost)}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Reimbursed</p>
                <p className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">{formatCurrency(summary.totalReimbursed)}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Net Loss</p>
                <p className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(summary.totalNetLoss)}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Pending</p>
                <p className="mt-1 text-2xl font-semibold text-yellow-600 dark:text-yellow-400">{summary.pendingReimbursements}</p>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="px-6 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search by SKU, description, or case ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <select
              aria-label="Filter by type"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as InventoryLossType | 'all')}
              className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All types</option>
              {Object.entries(LOSS_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <select
              aria-label="Filter by reimbursement status"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as ReimbursementStatus | 'all')}
              className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All statuses</option>
              <option value="none">No reimbursement</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="complete">Complete</option>
              <option value="denied">Denied</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {filteredLosses.length > 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Type</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Cost</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Reimbursement</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Net Loss</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredLosses.map(loss => (
                    <tr key={loss.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                        {formatDate(loss.lossDate)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {loss.sellerSku}
                        </div>
                        {loss.description && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                            {loss.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${LOSS_TYPE_COLORS[loss.lossType]}`}>
                          {LOSS_TYPE_LABELS[loss.lossType]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-900 dark:text-white">
                        {loss.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600 dark:text-red-400 font-medium">
                        {formatCurrency(loss.totalCost)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${REIMBURSEMENT_STATUS_COLORS[loss.reimbursementStatus]}`}>
                            {loss.reimbursementStatus === 'none' ? 'None' : loss.reimbursementStatus.charAt(0).toUpperCase() + loss.reimbursementStatus.slice(1)}
                          </span>
                          {loss.reimbursementAmount > 0 && (
                            <span className="text-xs text-green-600 dark:text-green-400">
                              {formatCurrency(loss.reimbursementAmount)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-amber-600 dark:text-amber-400 font-medium">
                        {formatCurrency(loss.netLoss)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setMenuOpenId(menuOpenId === loss.id ? null : loss.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {menuOpenId === loss.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20">
                                <button
                                  onClick={() => {
                                    setEditingLoss(loss)
                                    setMenuOpenId(null)
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                  Edit
                                </button>
                                {loss.reimbursementStatus !== 'complete' && (
                                  <button
                                    onClick={() => {
                                      setReimbursementLoss(loss)
                                      setMenuOpenId(null)
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                                  >
                                    Record Reimbursement
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setDeleteConfirmId(loss.id)
                                    setMenuOpenId(null)
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing {filteredLosses.length} of {losses.length} losses
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="w-12 h-12 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'No losses match your filters'
                : 'No inventory losses recorded'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Record damaged, lost, or disposed inventory'}
            </p>
            {!searchQuery && typeFilter === 'all' && statusFilter === 'all' && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Record Loss
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(isFormOpen || editingLoss) && (
        <InventoryLossForm
          loss={editingLoss}
          onSubmit={editingLoss ? handleUpdate : handleCreate}
          onCancel={() => {
            setIsFormOpen(false)
            setEditingLoss(null)
          }}
        />
      )}

      {/* Reimbursement Modal */}
      {reimbursementLoss && (
        <ReimbursementModal
          loss={reimbursementLoss}
          onSubmit={handleReimbursement}
          onCancel={() => setReimbursementLoss(null)}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Delete Inventory Loss
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Are you sure you want to delete this loss record? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

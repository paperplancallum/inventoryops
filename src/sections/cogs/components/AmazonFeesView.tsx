'use client'

import { useState, useMemo } from 'react'
import { RefreshCw, Plus, Search, MoreVertical, DollarSign, Upload, Filter } from 'lucide-react'
import type { AmazonFee, AmazonFeeSummary, AmazonFeeType, FeeAttributionLevel, AmazonFeeFormData } from '@/lib/supabase/hooks'
import { AmazonFeeForm } from './AmazonFeeForm'
import { AmazonFeesImportModal } from './AmazonFeesImportModal'

const FEE_TYPE_LABELS: Record<AmazonFeeType, string> = {
  fba_fulfillment: 'FBA Fulfillment',
  fba_storage_monthly: 'FBA Storage (Monthly)',
  fba_storage_long_term: 'FBA Storage (Long-term)',
  fba_removal: 'FBA Removal',
  fba_disposal: 'FBA Disposal',
  fba_prep: 'FBA Prep',
  fba_labeling: 'FBA Labeling',
  inbound_placement: 'Inbound Placement',
  inbound_defect: 'Inbound Defect',
  inbound_transportation: 'Inbound Transportation',
  awd_storage: 'AWD Storage',
  awd_processing: 'AWD Processing',
  awd_transportation: 'AWD Transportation',
  referral_fee: 'Referral Fee',
  sponsored_products: 'Sponsored Products',
  sponsored_brands: 'Sponsored Brands',
  sponsored_display: 'Sponsored Display',
  reimbursement: 'Reimbursement',
  refund_admin: 'Refund Admin',
  other: 'Other',
}

const FEE_TYPE_COLORS: Record<string, string> = {
  fba: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  inbound: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  awd: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  referral: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
  sponsored: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
  reimbursement: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  other: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
}

function getFeeTypeColor(type: AmazonFeeType): string {
  if (type.startsWith('fba_')) return FEE_TYPE_COLORS.fba
  if (type.startsWith('inbound_')) return FEE_TYPE_COLORS.inbound
  if (type.startsWith('awd_')) return FEE_TYPE_COLORS.awd
  if (type === 'referral_fee') return FEE_TYPE_COLORS.referral
  if (type.startsWith('sponsored_')) return FEE_TYPE_COLORS.sponsored
  if (type === 'reimbursement') return FEE_TYPE_COLORS.reimbursement
  return FEE_TYPE_COLORS.other
}

const ATTRIBUTION_LEVEL_LABELS: Record<FeeAttributionLevel, string> = {
  order_item: 'Order Item',
  shipment: 'Shipment',
  product: 'Product',
  account: 'Account',
}

interface AmazonFeesViewProps {
  fees: AmazonFee[]
  summary: AmazonFeeSummary | null
  feesByType: Record<AmazonFeeType, AmazonFee[]>
  feesByMonth: Record<string, AmazonFee[]>
  isLoading: boolean
  error: string | null
  onCreateFee: (data: AmazonFeeFormData) => Promise<AmazonFee | null>
  onCreateFeesBatch?: (data: AmazonFeeFormData[]) => Promise<AmazonFee[]>
  onUpdateFee: (id: string, data: Partial<AmazonFeeFormData>) => Promise<AmazonFee | null>
  onDeleteFee: (id: string) => Promise<boolean>
  onRefresh: () => void
}

export function AmazonFeesView({
  fees,
  summary,
  feesByType,
  feesByMonth,
  isLoading,
  error,
  onCreateFee,
  onCreateFeesBatch,
  onUpdateFee,
  onDeleteFee,
  onRefresh,
}: AmazonFeesViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<AmazonFeeType | 'all'>('all')
  const [levelFilter, setLevelFilter] = useState<FeeAttributionLevel | 'all'>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [editingFee, setEditingFee] = useState<AmazonFee | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const filteredFees = useMemo(() => {
    let result = [...fees]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(f =>
        f.description?.toLowerCase().includes(q) ||
        f.sourceReference?.toLowerCase().includes(q) ||
        f.feeType.toLowerCase().includes(q)
      )
    }

    if (typeFilter !== 'all') {
      result = result.filter(f => f.feeType === typeFilter)
    }

    if (levelFilter !== 'all') {
      result = result.filter(f => f.attributionLevel === levelFilter)
    }

    return result
  }, [fees, searchQuery, typeFilter, levelFilter])

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount))
    return amount < 0 ? `-${formatted}` : formatted
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const handleCreate = async (data: AmazonFeeFormData) => {
    const result = await onCreateFee(data)
    if (result) {
      setIsFormOpen(false)
    }
  }

  const handleUpdate = async (data: AmazonFeeFormData) => {
    if (!editingFee) return
    const result = await onUpdateFee(editingFee.id, data)
    if (result) {
      setEditingFee(null)
    }
  }

  const handleDelete = async (id: string) => {
    const result = await onDeleteFee(id)
    if (result) {
      setDeleteConfirmId(null)
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
                Amazon Fees
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Track FBA, inbound, AWD, and other Amazon fees
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
              {onCreateFeesBatch && (
                <button
                  onClick={() => setIsImportOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-200 dark:border-slate-600"
                >
                  <Upload className="w-4 h-4" />
                  Import CSV
                </button>
              )}
              <button
                onClick={() => setIsFormOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Fee
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          {summary && (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Fees</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{summary.feeCount}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Net Amount</p>
                <p className={`mt-1 text-2xl font-semibold ${summary.totalFees >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {formatCurrency(summary.totalFees)}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Charges</p>
                <p className="mt-1 text-2xl font-semibold text-red-600 dark:text-red-400">{formatCurrency(summary.totalCharges)}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Reimbursements</p>
                <p className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">{formatCurrency(summary.totalReimbursements)}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">In COGS</p>
                <p className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(summary.cogsAmount)}</p>
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
                placeholder="Search fees..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <select
              aria-label="Filter by type"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as AmazonFeeType | 'all')}
              className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All types</option>
              {Object.entries(FEE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <select
              aria-label="Filter by attribution level"
              value={levelFilter}
              onChange={e => setLevelFilter(e.target.value as FeeAttributionLevel | 'all')}
              className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All levels</option>
              {Object.entries(ATTRIBUTION_LEVEL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
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
        {filteredFees.length > 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Level</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Amount</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">COGS</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredFees.map(fee => (
                    <tr key={fee.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                        {formatDate(fee.feeDate)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFeeTypeColor(fee.feeType)}`}>
                          {FEE_TYPE_LABELS[fee.feeType]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-900 dark:text-white truncate max-w-[200px]">
                          {fee.description || '-'}
                        </div>
                        {fee.sourceReference && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Ref: {fee.sourceReference}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {ATTRIBUTION_LEVEL_LABELS[fee.attributionLevel]}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-sm text-right font-medium ${fee.amount >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {formatCurrency(fee.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          fee.includeInCogs
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                        }`}>
                          {fee.includeInCogs ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setMenuOpenId(menuOpenId === fee.id ? null : fee.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {menuOpenId === fee.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                              <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20">
                                <button
                                  onClick={() => {
                                    setEditingFee(fee)
                                    setMenuOpenId(null)
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteConfirmId(fee.id)
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
                Showing {filteredFees.length} of {fees.length} fees
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <div className="flex justify-center mb-4">
              <DollarSign className="w-12 h-12 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {searchQuery || typeFilter !== 'all' || levelFilter !== 'all'
                ? 'No fees match your filters'
                : 'No Amazon fees recorded'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {searchQuery || typeFilter !== 'all' || levelFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add Amazon fees manually or import from reports'}
            </p>
            {!searchQuery && typeFilter === 'all' && levelFilter === 'all' && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Fee
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(isFormOpen || editingFee) && (
        <AmazonFeeForm
          fee={editingFee}
          onSubmit={editingFee ? handleUpdate : handleCreate}
          onCancel={() => {
            setIsFormOpen(false)
            setEditingFee(null)
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Delete Amazon Fee
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Are you sure you want to delete this fee? This action cannot be undone.
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

      {/* Import Modal */}
      {isImportOpen && onCreateFeesBatch && (
        <AmazonFeesImportModal
          onImport={async (fees) => {
            const result = await onCreateFeesBatch(fees)
            if (result.length > 0) {
              onRefresh()
            }
            return result
          }}
          onCancel={() => setIsImportOpen(false)}
        />
      )}
    </div>
  )
}

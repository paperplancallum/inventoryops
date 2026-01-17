'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, RefreshCw, Layers, Package, ChevronDown, ChevronRight, Edit, Archive, DollarSign } from 'lucide-react'
import type { BOM } from '@/lib/supabase/hooks/useBOMs'

interface BOMListProps {
  boms: BOM[]
  loading?: boolean
  onCreateBOM?: () => void
  onEditBOM?: (id: string) => void
  onArchiveBOM?: (id: string) => void
  onRefresh?: () => void
}

export function BOMList({
  boms,
  loading = false,
  onCreateBOM,
  onEditBOM,
  onArchiveBOM,
  onRefresh,
}: BOMListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedBomId, setExpandedBomId] = useState<string | null>(null)

  const filteredBoms = useMemo(() => {
    if (!searchQuery.trim()) return boms
    const q = searchQuery.toLowerCase()
    return boms.filter(bom =>
      bom.name.toLowerCase().includes(q) ||
      bom.finishedProductName.toLowerCase().includes(q) ||
      bom.finishedProductSku.toLowerCase().includes(q)
    )
  }, [boms, searchQuery])

  const toggleExpand = (id: string) => {
    setExpandedBomId(prev => prev === id ? null : id)
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
              Bill of Materials
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage product assembly structures
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
              onClick={onCreateBOM}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              New BOM
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, product, or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {loading && boms.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : filteredBoms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Layers className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
              {searchQuery ? 'No BOMs found' : 'No BOMs yet'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {searchQuery ? 'Try a different search term' : 'Create your first Bill of Materials to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={onCreateBOM}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create BOM
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBoms.map(bom => (
              <div
                key={bom.id}
                className="bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden"
              >
                {/* BOM Header */}
                <div className="p-4 flex items-center gap-4">
                  <button
                    onClick={() => toggleExpand(bom.id)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {expandedBomId === bom.id ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-white">
                          {bom.name}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {bom.finishedProductSku} - {bom.finishedProductName}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-slate-500 dark:text-slate-400">Components</p>
                      <p className="font-medium text-slate-900 dark:text-white">{bom.componentCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500 dark:text-slate-400">Output Qty</p>
                      <p className="font-medium text-slate-900 dark:text-white">{bom.outputQuantity}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500 dark:text-slate-400">Est. Cost</p>
                      <p className="font-medium text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(bom.estimatedUnitCost)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500 dark:text-slate-400">Version</p>
                      <p className="font-medium text-slate-900 dark:text-white">{bom.version}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditBOM?.(bom.id)}
                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onArchiveBOM?.(bom.id)}
                      className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                      title="Archive"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Components */}
                {expandedBomId === bom.id && bom.lineItems.length > 0 && (
                  <div className="border-t border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-4">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Components
                    </h4>
                    <div className="space-y-2">
                      {bom.lineItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg"
                        >
                          <span className="w-6 h-6 flex items-center justify-center text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-600 rounded">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 dark:text-white text-sm">
                              {item.componentName}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              SKU: {item.componentSku}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-slate-900 dark:text-white text-sm">
                              {item.quantityRequired} {item.uom}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              @ {formatCurrency(item.componentUnitCost)}
                            </p>
                          </div>
                          <div className="w-24 text-right">
                            <p className="font-medium text-emerald-600 dark:text-emerald-400 text-sm">
                              {formatCurrency(item.quantityRequired * item.componentUnitCost)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Cost Summary */}
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">
                          Total component cost (for {bom.outputQuantity} units)
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(bom.lineItems.reduce((sum, i) => sum + (i.quantityRequired * i.componentUnitCost), 0))}
                        </span>
                      </div>
                      {bom.expectedScrapPercent > 0 && (
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-slate-500 dark:text-slate-400">
                            Expected scrap
                          </span>
                          <span className="text-amber-600 dark:text-amber-400">
                            {bom.expectedScrapPercent}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

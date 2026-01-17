'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Search } from 'lucide-react'
import type { SafetyStockViewProps, ThresholdType } from '@/../product/sections/inventory-intelligence/types'

export function SafetyStockView({
  rules,
  products: _products,
  locations: _locations,
  thresholdTypes,
  onUpdate,
  onCreate,
  onDelete,
}: SafetyStockViewProps) {
  // Suppress unused variable warnings - these are passed for consistency but denormalized data is used
  void _products
  void _locations
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<number>(0)

  const filteredRules = rules.filter((r) => {
    const query = searchQuery.toLowerCase()
    return (
      r.sku.toLowerCase().includes(query) ||
      r.productName.toLowerCase().includes(query) ||
      r.locationName.toLowerCase().includes(query)
    )
  })

  const handleStartEdit = (id: string, currentValue: number) => {
    setEditingId(id)
    setEditValue(currentValue)
  }

  const handleSaveEdit = (id: string) => {
    onUpdate?.(id, { thresholdValue: editValue })
    setEditingId(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
  }

  const getThresholdLabel = (type: ThresholdType) => {
    return thresholdTypes.find((t) => t.id === type)?.label || type
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-medium text-slate-900 dark:text-white">Safety Stock Rules</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Minimum inventory thresholds that trigger replenishment suggestions
          </p>
        </div>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          Add Rule
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by SKU, product, or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
      </div>

      {/* Rules Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-700 dark:bg-slate-800">
        {filteredRules.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500 dark:text-slate-400">
              {rules.length === 0
                ? 'No safety stock rules configured yet.'
                : 'No rules match your search.'}
            </p>
            {rules.length === 0 && (
              <button
                onClick={onCreate}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                <Plus className="h-4 w-4" />
                Add Your First Rule
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Threshold Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Value
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Seasonal
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                          {rule.productName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {rule.sku}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      {rule.locationName}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      {getThresholdLabel(rule.thresholdType)}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === rule.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                            className="w-20 rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(rule.id)
                              if (e.key === 'Escape') handleCancelEdit()
                            }}
                          />
                          <button
                            onClick={() => handleSaveEdit(rule.id)}
                            className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(rule.id, rule.thresholdValue)}
                          className="text-sm font-medium text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
                        >
                          {rule.thresholdValue.toLocaleString()}
                          {rule.thresholdType === 'units' ? ' units' : ' days'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {rule.seasonalMultipliers.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {rule.seasonalMultipliers.map((sm) => (
                            <span
                              key={sm.month}
                              className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                            >
                              M{sm.month}: {sm.multiplier}x
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          rule.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                        }`}
                      >
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleStartEdit(rule.id, rule.thresholdValue)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete?.(rule.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

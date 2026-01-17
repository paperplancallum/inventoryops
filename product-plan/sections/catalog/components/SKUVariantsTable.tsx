import { Star, Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import type { ProductSKU, SKUCondition } from '@/../product/sections/catalog/types'

interface SKUVariantsTableProps {
  skus: ProductSKU[]
  onEditSKU?: (skuId: string) => void
  onDeleteSKU?: (skuId: string) => void
  onSetDefault?: (skuId: string) => void
}

const conditionStyles: Record<SKUCondition, { bg: string; text: string; label: string }> = {
  new: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    label: 'New',
  },
  refurbished: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    label: 'Refurbished',
  },
  'used-like-new': {
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    text: 'text-cyan-700 dark:text-cyan-400',
    label: 'Used - Like New',
  },
  'used-very-good': {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    label: 'Used - Very Good',
  },
  'used-good': {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
    label: 'Used - Good',
  },
  'used-acceptable': {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    label: 'Used - Acceptable',
  },
}

export function SKUVariantsTable({
  skus,
  onEditSKU,
  onDeleteSKU,
  onSetDefault,
}: SKUVariantsTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  if (!skus || skus.length === 0) {
    return (
      <div className="text-center py-6 text-slate-500 dark:text-slate-400">
        <p className="text-sm">No SKU variants defined</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-600">
            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              SKU
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Condition
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              ASIN
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              FNSKU
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Stock
            </th>
            <th className="px-3 py-2 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
          {skus.map((sku) => {
            const style = conditionStyles[sku.condition]

            return (
              <tr
                key={sku.id}
                className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                  sku.isDefault ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                }`}
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-900 dark:text-slate-100">
                      {sku.sku}
                    </span>
                    {sku.isDefault && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 rounded">
                        <Star className="w-3 h-3 fill-current" />
                        Default
                      </span>
                    )}
                  </div>
                  {sku.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs truncate">
                      {sku.notes}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${style.bg} ${style.text}`}
                  >
                    {style.label}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-400">
                  {sku.asin}
                </td>
                <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-400">
                  {sku.fnsku || <span className="text-slate-400 dark:text-slate-500">—</span>}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  <span
                    className={`font-medium ${
                      sku.stockLevel === 0
                        ? 'text-red-600 dark:text-red-400'
                        : sku.stockLevel < 100
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {sku.stockLevel.toLocaleString()}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === sku.id ? null : sku.id)}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {openMenuId === sku.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 z-20 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1">
                          {onEditSKU && (
                            <button
                              onClick={() => {
                                onEditSKU(sku.id)
                                setOpenMenuId(null)
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                              <Pencil className="w-4 h-4" />
                              Edit
                            </button>
                          )}
                          {onSetDefault && !sku.isDefault && (
                            <button
                              onClick={() => {
                                onSetDefault(sku.id)
                                setOpenMenuId(null)
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                              <Star className="w-4 h-4" />
                              Set as Default
                            </button>
                          )}
                          {onDeleteSKU && !sku.isDefault && (
                            <>
                              <div className="my-1 border-t border-slate-200 dark:border-slate-700" />
                              <button
                                onClick={() => {
                                  onDeleteSKU(sku.id)
                                  setOpenMenuId(null)
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

'use client'

import { AlertCircle } from 'lucide-react'
import type { AmazonShipmentItem } from '../types'

interface AmazonShipmentItemsTableProps {
  items: AmazonShipmentItem[]
}

export function AmazonShipmentItemsTable({ items }: AmazonShipmentItemsTableProps) {
  return (
    <div className="bg-stone-50 dark:bg-stone-800/50 border-t border-stone-200 dark:border-stone-700">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-stone-200 dark:border-stone-700">
            <th className="px-4 py-2 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              SKU
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              FNSKU
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Product
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Shipped
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Received
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
          {items.map((item) => {
            const hasDiscrepancy = item.quantityReceived > 0 && item.quantityReceived !== item.quantityShipped
            const discrepancy = item.quantityReceived - item.quantityShipped

            return (
              <tr
                key={item.sellerSku}
                className="hover:bg-stone-100 dark:hover:bg-stone-700/50"
              >
                <td className="px-4 py-2 text-sm font-mono text-stone-900 dark:text-stone-100">
                  {item.sellerSku}
                </td>
                <td className="px-4 py-2 text-sm font-mono text-stone-600 dark:text-stone-400">
                  {item.fnSku}
                </td>
                <td className="px-4 py-2 text-sm text-stone-700 dark:text-stone-300 max-w-xs truncate">
                  {item.productName}
                </td>
                <td className="px-4 py-2 text-sm text-right tabular-nums text-stone-900 dark:text-stone-100">
                  {item.quantityShipped.toLocaleString()}
                </td>
                <td className="px-4 py-2 text-sm text-right tabular-nums">
                  <span
                    className={
                      hasDiscrepancy
                        ? discrepancy < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-amber-600 dark:text-amber-400'
                        : 'text-stone-900 dark:text-stone-100'
                    }
                  >
                    {item.quantityReceived.toLocaleString()}
                    {hasDiscrepancy && (
                      <span className="ml-1 inline-flex items-center">
                        <AlertCircle className="w-3 h-3" />
                        <span className="ml-0.5 text-xs">
                          ({discrepancy > 0 ? '+' : ''}{discrepancy})
                        </span>
                      </span>
                    )}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

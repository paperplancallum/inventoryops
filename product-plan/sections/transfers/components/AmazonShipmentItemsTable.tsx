import { AlertCircle } from 'lucide-react'
import type { AmazonShipmentItem } from '../../../../product/sections/transfers/types'

interface AmazonShipmentItemsTableProps {
  items: AmazonShipmentItem[]
}

export function AmazonShipmentItemsTable({ items }: AmazonShipmentItemsTableProps) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              SKU
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              FNSKU
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Product
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Shipped
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Received
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {items.map((item) => {
            const hasDiscrepancy = item.quantityReceived > 0 && item.quantityReceived !== item.quantityShipped
            const discrepancy = item.quantityReceived - item.quantityShipped

            return (
              <tr
                key={item.sellerSku}
                className="hover:bg-slate-100 dark:hover:bg-slate-700/50"
              >
                <td className="px-4 py-2 text-sm font-mono text-slate-900 dark:text-slate-100">
                  {item.sellerSku}
                </td>
                <td className="px-4 py-2 text-sm font-mono text-slate-600 dark:text-slate-400">
                  {item.fnSku}
                </td>
                <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 max-w-xs truncate">
                  {item.productName}
                </td>
                <td className="px-4 py-2 text-sm text-right tabular-nums text-slate-900 dark:text-slate-100">
                  {item.quantityShipped.toLocaleString()}
                </td>
                <td className="px-4 py-2 text-sm text-right tabular-nums">
                  <span
                    className={
                      hasDiscrepancy
                        ? discrepancy < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-900 dark:text-slate-100'
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

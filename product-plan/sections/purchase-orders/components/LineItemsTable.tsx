import type { POLineItemFlat, POStatusOption } from '@/../product/sections/purchase-orders/types'

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

const ExternalLinkIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
)

function getStatusBadgeStyles(status: string): string {
  switch (status) {
    case 'draft':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
    case 'sent':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'confirmed':
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
    case 'partially-received':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'received':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'cancelled':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface LineItemsTableProps {
  lineItems: POLineItemFlat[]
  poStatuses: POStatusOption[]
  sortField: 'sku' | 'quantity' | 'unitCost' | 'subtotal' | 'expectedDate'
  sortDirection: 'asc' | 'desc'
  onSort: (field: 'sku' | 'quantity' | 'unitCost' | 'subtotal' | 'expectedDate') => void
  onViewPO?: (poId: string) => void
}

export function LineItemsTable({
  lineItems,
  poStatuses,
  sortField,
  sortDirection,
  onSort,
  onViewPO,
}: LineItemsTableProps) {
  const getStatusLabel = (status: string) => {
    const statusOption = poStatuses.find((s) => s.id === status)
    return statusOption?.label || status
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                <button
                  onClick={() => onSort('sku')}
                  className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  SKU
                  {sortField === 'sku' && (
                    <span className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                      <ChevronDownIcon />
                    </span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Product
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                <button
                  onClick={() => onSort('quantity')}
                  className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Qty
                  {sortField === 'quantity' && (
                    <span className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                      <ChevronDownIcon />
                    </span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                <button
                  onClick={() => onSort('unitCost')}
                  className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Unit Cost
                  {sortField === 'unitCost' && (
                    <span className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                      <ChevronDownIcon />
                    </span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                <button
                  onClick={() => onSort('subtotal')}
                  className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Subtotal
                  {sortField === 'subtotal' && (
                    <span className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                      <ChevronDownIcon />
                    </span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                PO #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Supplier
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                <button
                  onClick={() => onSort('expectedDate')}
                  className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Expected
                  {sortField === 'expectedDate' && (
                    <span className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                      <ChevronDownIcon />
                    </span>
                  )}
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {lineItems.map((item) => (
              <tr
                key={item.lineItemId}
                className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <span className="font-mono text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    {item.sku}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-sm text-slate-900 dark:text-white truncate block max-w-[200px]"
                    title={item.productName}
                  >
                    {item.productName}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm text-slate-900 dark:text-white">
                    {formatNumber(item.quantity)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {formatCurrency(item.unitCost)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {formatCurrency(item.subtotal)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onViewPO?.(item.poId)}
                    className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {item.poNumber}
                    <ExternalLinkIcon />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {item.supplierName}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadgeStyles(
                      item.status
                    )}`}
                  >
                    {getStatusLabel(item.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {formatDate(item.expectedDate)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {lineItems.length === 0 && (
        <div className="px-4 py-12 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No line items found matching your criteria
          </p>
        </div>
      )}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Showing {lineItems.length} line items
        </p>
      </div>
    </div>
  )
}

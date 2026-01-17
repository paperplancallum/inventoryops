import * as Popover from '@radix-ui/react-popover'
import {
  Factory,
  Truck,
  Warehouse,
  Package,
  ArrowRight,
  X,
  FileText,
} from 'lucide-react'
import type { StockBreakdown } from '@/../product/sections/catalog/types'

interface StockBreakdownPopoverProps {
  stockLevel: number
  stockBreakdown?: StockBreakdown
  isLowStock?: boolean
}

interface StockSectionProps {
  icon: React.ReactNode
  title: string
  total: number
  iconColor: string
  children: React.ReactNode
}

function StockSection({ icon, title, total, iconColor, children }: StockSectionProps) {
  return (
    <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={iconColor}>{icon}</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </span>
        </div>
        <span className="font-mono text-sm font-medium text-slate-900 dark:text-white">
          {total.toLocaleString()}
        </span>
      </div>
      <div className="space-y-1 text-sm">{children}</div>
    </div>
  )
}

function EmptyState() {
  return <p className="text-slate-400 dark:text-slate-500 text-xs italic">No stock</p>
}

export function StockBreakdownPopover({
  stockLevel,
  stockBreakdown,
  isLowStock,
}: StockBreakdownPopoverProps) {
  const stockColorClass =
    stockLevel === 0
      ? 'text-red-600 dark:text-red-400'
      : isLowStock
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-slate-900 dark:text-white'

  // If no breakdown data, just show the number without popover
  if (!stockBreakdown) {
    return (
      <span className={`font-mono text-sm ${stockColorClass}`}>
        {stockLevel.toLocaleString()}
      </span>
    )
  }

  const { inProduction, inTransfer, warehouseStock, amazonStock } = stockBreakdown
  const amazonTotal = amazonStock.fbaTotal + amazonStock.awdTotal

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className={`font-mono text-sm cursor-pointer hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 rounded px-1 -mx-1 ${stockColorClass}`}
        >
          {stockLevel.toLocaleString()}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="w-[320px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 animate-in fade-in-0 zoom-in-95"
          sideOffset={5}
          align="end"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-t-xl">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Stock Breakdown
            </span>
            <span className={`font-mono text-lg font-bold ${stockColorClass}`}>
              {stockLevel.toLocaleString()}
            </span>
          </div>

          {/* In Production Section */}
          <StockSection
            icon={<Factory className="w-4 h-4" />}
            title="In Production"
            total={inProduction.total}
            iconColor="text-amber-500 dark:text-amber-400"
          >
            {inProduction.factoryStock.length === 0 && inProduction.pendingPOs.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                {inProduction.factoryStock.map((loc) => (
                  <div
                    key={loc.locationId}
                    className="flex items-center justify-between py-1"
                  >
                    <span
                      className="text-slate-600 dark:text-slate-300 text-xs truncate max-w-[200px]"
                      title={loc.locationName}
                    >
                      {loc.locationName}
                    </span>
                    <span className="font-mono text-xs text-slate-700 dark:text-slate-200">
                      {loc.quantity.toLocaleString()}
                    </span>
                  </div>
                ))}
                {inProduction.pendingPOs.map((po) => (
                  <div
                    key={po.poNumber}
                    className="flex items-center justify-between py-1"
                  >
                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 text-xs">
                      <FileText className="w-3 h-3 text-slate-400" />
                      <span className="font-mono">{po.poNumber}</span>
                      <span className="text-slate-400">
                        (ETA: {new Date(po.expectedDate).toLocaleDateString()})
                      </span>
                    </div>
                    <span className="font-mono text-xs text-slate-700 dark:text-slate-200">
                      {po.quantity.toLocaleString()}
                    </span>
                  </div>
                ))}
              </>
            )}
          </StockSection>

          {/* In Transfer Section */}
          <StockSection
            icon={<Truck className="w-4 h-4" />}
            title="In Transfer"
            total={inTransfer.total}
            iconColor="text-blue-500 dark:text-blue-400"
          >
            {inTransfer.transfers.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="max-h-[120px] overflow-y-auto">
                {inTransfer.transfers.map((transfer) => (
                  <div
                    key={transfer.transferId}
                    className="flex items-center justify-between py-1"
                  >
                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 text-xs min-w-0 flex-1">
                      <span
                        className="truncate max-w-[90px]"
                        title={transfer.sourceLocationName}
                      >
                        {transfer.sourceLocationName}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                      <span
                        className="truncate max-w-[90px]"
                        title={transfer.destinationLocationName}
                      >
                        {transfer.destinationLocationName}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-slate-700 dark:text-slate-200 ml-2 shrink-0">
                      {transfer.quantity.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </StockSection>

          {/* Warehouse Section */}
          <StockSection
            icon={<Warehouse className="w-4 h-4" />}
            title="Warehouse"
            total={warehouseStock.total}
            iconColor="text-slate-500 dark:text-slate-400"
          >
            {warehouseStock.locations.length === 0 ? (
              <EmptyState />
            ) : (
              warehouseStock.locations.map((loc) => (
                <div
                  key={loc.locationId}
                  className="flex items-center justify-between py-1"
                >
                  <span
                    className="text-slate-600 dark:text-slate-300 text-xs truncate max-w-[200px]"
                    title={loc.locationName}
                  >
                    {loc.locationName}
                  </span>
                  <span className="font-mono text-xs text-slate-700 dark:text-slate-200">
                    {loc.quantity.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </StockSection>

          {/* Amazon Section */}
          <StockSection
            icon={<Package className="w-4 h-4" />}
            title="Amazon"
            total={amazonTotal}
            iconColor="text-orange-500 dark:text-orange-400"
          >
            {amazonStock.fbaLocations.length === 0 &&
            amazonStock.awdLocations.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                {amazonStock.fbaLocations.length > 0 && (
                  <div className="mb-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      FBA
                    </span>
                    {amazonStock.fbaLocations.map((loc) => (
                      <div
                        key={loc.locationId}
                        className="flex items-center justify-between py-0.5 pl-2"
                      >
                        <span
                          className="text-slate-600 dark:text-slate-300 text-xs truncate max-w-[180px]"
                          title={loc.locationName}
                        >
                          {loc.locationName}
                        </span>
                        <span className="font-mono text-xs text-slate-700 dark:text-slate-200">
                          {loc.quantity.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {amazonStock.awdLocations.length > 0 && (
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      AWD
                    </span>
                    {amazonStock.awdLocations.map((loc) => (
                      <div
                        key={loc.locationId}
                        className="flex items-center justify-between py-0.5 pl-2"
                      >
                        <span
                          className="text-slate-600 dark:text-slate-300 text-xs truncate max-w-[180px]"
                          title={loc.locationName}
                        >
                          {loc.locationName}
                        </span>
                        <span className="font-mono text-xs text-slate-700 dark:text-slate-200">
                          {loc.quantity.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </StockSection>

          {/* Close button for mobile */}
          <Popover.Close className="absolute top-2 right-2 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 sm:hidden">
            <X className="w-4 h-4" />
          </Popover.Close>
          <Popover.Arrow className="fill-white dark:fill-slate-800" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

'use client'

import { Plus, Pencil, Archive, Package, Tag, Store } from 'lucide-react'
import type { BrandsViewProps, Brand, AmazonConnection } from '@/../product/sections/settings/types'

function BrandCard({
  brand,
  amazonConnections = [],
  onEdit,
  onArchive,
}: {
  brand: Brand
  amazonConnections?: AmazonConnection[]
  onEdit?: (id: string) => void
  onArchive?: (id: string) => void
}) {
  // Get the connected Amazon accounts for this brand
  const linkedConnections = amazonConnections.filter(
    (conn) => brand.amazonConnectionIds?.includes(conn.id)
  )
  const isInactive = brand.status === 'inactive'

  return (
    <div
      className={`rounded-xl border p-5 transition-colors ${
        isInactive
          ? 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/30 opacity-60'
          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/50'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Logo placeholder */}
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
            {brand.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Tag className="h-6 w-6 text-slate-400 dark:text-slate-500" />
            )}
          </div>

          {/* Brand info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                {brand.name}
              </h3>
              {isInactive && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                  Archived
                </span>
              )}
            </div>

            {brand.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                {brand.description}
              </p>
            )}

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
              {/* Product count */}
              <div className="flex items-center gap-1.5">
                <Package className="h-4 w-4" />
                <span>
                  {brand.productCount ?? 0} product{brand.productCount !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Amazon connections */}
              {linkedConnections.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Store className="h-4 w-4" />
                  <span>
                    {linkedConnections.map((conn) => conn.connectionName).join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* Marketplace badges */}
            {linkedConnections.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {linkedConnections.map((conn) =>
                  conn.enabledMarketplaces.map((marketplace) => (
                    <span
                      key={`${conn.id}-${marketplace}`}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    >
                      {marketplace}
                    </span>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit?.(brand.id)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition-colors"
            title="Edit brand"
          >
            <Pencil className="h-4 w-4" />
          </button>
          {brand.status === 'active' ? (
            <button
              onClick={() => onArchive?.(brand.id)}
              className="p-2 rounded-lg text-slate-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/20 dark:hover:text-amber-400 transition-colors"
              title="Archive brand"
            >
              <Archive className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => onArchive?.(brand.id)}
              className="p-2 rounded-lg text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400 transition-colors"
              title="Restore brand"
            >
              <Archive className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function BrandsView({
  brands,
  amazonConnections = [],
  onCreateBrand,
  onEditBrand,
  onArchiveBrand,
}: BrandsViewProps) {
  const activeBrands = brands.filter((b) => b.status === 'active')
  const archivedBrands = brands.filter((b) => b.status === 'inactive')

  return (
    <div className="space-y-6">
      {/* Header with action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Brands
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Organize your products into brands or product lines
          </p>
        </div>
        <button
          onClick={onCreateBrand}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-500 text-white font-medium text-sm hover:bg-lime-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Brand
        </button>
      </div>

      {/* Brands list */}
      {brands.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 p-12 text-center dark:border-slate-700">
          <div className="mx-auto w-12 h-12 rounded-full bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center mb-4">
            <Tag className="h-6 w-6 text-lime-600 dark:text-lime-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            No brands yet
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Create a brand to start organizing your products
          </p>
          <button
            onClick={onCreateBrand}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-500 text-white font-medium text-sm hover:bg-lime-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Your First Brand
          </button>
        </div>
      ) : (
        <>
          {/* Active brands */}
          <div className="space-y-4">
            {activeBrands.map((brand) => (
              <BrandCard
                key={brand.id}
                brand={brand}
                amazonConnections={amazonConnections}
                onEdit={onEditBrand}
                onArchive={onArchiveBrand}
              />
            ))}
          </div>

          {/* Archived brands */}
          {archivedBrands.length > 0 && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">
                Archived Brands ({archivedBrands.length})
              </h3>
              <div className="space-y-4">
                {archivedBrands.map((brand) => (
                  <BrandCard
                    key={brand.id}
                    brand={brand}
                    amazonConnections={amazonConnections}
                    onEdit={onEditBrand}
                    onArchive={onArchiveBrand}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Info box */}
      <div className="rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-1">
          About Brands & Amazon Accounts
        </h4>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Brands are organizational groupings for your products. Each product belongs to one brand, and each brand
          can be linked to one or more Amazon Seller Central accounts. This allows you to sell the same brand
          across multiple regions (NA, EU, etc.) or maintain separate accounts for different business needs.
          The marketplace badges show which Amazon marketplaces each brand is currently selling on.
        </p>
      </div>
    </div>
  )
}

'use client'

import { Plus, Edit2, Archive, Package } from 'lucide-react'
import type { BrandsTabProps, Brand } from './types'

export function BrandsTab({
  brands,
  amazonConnections,
  loading,
  onCreateBrand,
  onEditBrand,
  onArchiveBrand,
}: BrandsTabProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800/50 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Brands
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Organize your products by brand
          </p>
        </div>
        <button
          onClick={onCreateBrand}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Brand
        </button>
      </div>

      {/* Brands list */}
      {brands.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 p-12 text-center dark:border-slate-700">
          <div className="mx-auto w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
            <Package className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            No brands created yet
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Create brands to organize your products
          </p>
          <button
            onClick={onCreateBrand}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Your First Brand
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {brands.map((brand) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              amazonConnections={amazonConnections}
              onEdit={onEditBrand}
              onArchive={onArchiveBrand}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function BrandCard({
  brand,
  amazonConnections,
  onEdit,
  onArchive,
}: {
  brand: Brand
  amazonConnections: { id: string; sellerName: string | null }[]
  onEdit: (id: string) => void
  onArchive: (id: string) => void
}) {
  const linkedAccounts = amazonConnections.filter(c => brand.amazonConnectionIds.includes(c.id))

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Logo placeholder */}
          <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl font-semibold text-slate-400">
                {brand.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {brand.name}
            </h3>
            {brand.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {brand.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{brand.productCount} product{brand.productCount !== 1 ? 's' : ''}</span>
              {linkedAccounts.length > 0 && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <span>
                    Sold via {linkedAccounts.map(a => a.sellerName || 'Amazon').join(', ')}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(brand.id)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition-colors"
            title="Edit brand"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onArchive(brand.id)}
            className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
            title="Archive brand"
            disabled={brand.productCount > 0}
          >
            <Archive className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

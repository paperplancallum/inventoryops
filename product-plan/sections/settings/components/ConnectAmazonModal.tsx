'use client'

import { useState } from 'react'
import { X, Globe, Tag, Check } from 'lucide-react'
import type { Brand, AmazonConnection, AmazonRegion } from '@/../product/sections/settings/types'

const regionOptions: { id: AmazonRegion; label: string; description: string }[] = [
  { id: 'NA', label: 'North America', description: 'US, Canada, Mexico, Brazil' },
  { id: 'EU', label: 'Europe', description: 'UK, Germany, France, Italy, Spain, etc.' },
  { id: 'FE', label: 'Far East', description: 'Japan, Australia, Singapore, India, etc.' },
]

export interface ConnectAmazonFormData {
  brandIds: string[]
  connectionName: string
  region: AmazonRegion
}

interface ConnectAmazonModalProps {
  brands: Brand[]
  existingConnections: AmazonConnection[]
  onSubmit: (data: ConnectAmazonFormData) => void
  onCancel: () => void
}

export function ConnectAmazonModal({
  brands,
  existingConnections: _existingConnections,
  onSubmit,
  onCancel,
}: ConnectAmazonModalProps) {
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([])
  const [connectionName, setConnectionName] = useState('')
  const [region, setRegion] = useState<AmazonRegion | null>(null)
  const [errors, setErrors] = useState<{
    brands?: string
    connectionName?: string
    region?: string
  }>({})

  // Only show active brands
  const activeBrands = brands.filter((b) => b.status === 'active')

  const toggleBrand = (brandId: string) => {
    setSelectedBrandIds((prev) =>
      prev.includes(brandId)
        ? prev.filter((id) => id !== brandId)
        : [...prev, brandId]
    )
    if (errors.brands) {
      setErrors((prev) => ({ ...prev, brands: undefined }))
    }
  }

  const validate = (): boolean => {
    const newErrors: typeof errors = {}

    if (selectedBrandIds.length === 0) {
      newErrors.brands = 'Select at least one brand'
    }

    if (!connectionName.trim()) {
      newErrors.connectionName = 'Connection name is required'
    }

    if (!region) {
      newErrors.region = 'Select a region'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate() && region) {
      onSubmit({
        brandIds: selectedBrandIds,
        connectionName: connectionName.trim(),
        region,
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onCancel}
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-slate-800 shadow-2xl overflow-hidden flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Connect Amazon Account
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Link your Seller Central account to one or more brands
                </p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Step 1: Brand Selection */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                  1
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Select Brand(s)
                </h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                Which brand(s) will sell through this Amazon account?
              </p>

              {activeBrands.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-4 text-center">
                  <Tag className="h-6 w-6 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No brands available. Create a brand first.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeBrands.map((brand) => {
                    const isSelected = selectedBrandIds.includes(brand.id)
                    return (
                      <button
                        key={brand.id}
                        type="button"
                        onClick={() => toggleBrand(brand.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div
                          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-amber-500 border-amber-500'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {brand.name}
                          </p>
                          {brand.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {brand.description}
                            </p>
                          )}
                        </div>
                        {brand.productCount !== undefined && brand.productCount > 0 && (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {brand.productCount} products
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {errors.brands && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {errors.brands}
                </p>
              )}
            </section>

            {/* Step 2: Account Details */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                  2
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Account Details
                </h3>
              </div>

              <div className="space-y-4">
                {/* Connection Name */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Connection Name
                    </label>
                    {selectedBrandIds.length > 0 && region && (
                      <button
                        type="button"
                        onClick={() => {
                          const brandNames = selectedBrandIds
                            .map((id) => activeBrands.find((b) => b.id === id)?.name)
                            .filter(Boolean)
                          const regionLabel = regionOptions.find((r) => r.id === region)?.label || region
                          const suggestedName =
                            brandNames.length === 1
                              ? `${brandNames[0]} - ${regionLabel}`
                              : `${brandNames[0]} + ${brandNames.length - 1} more - ${regionLabel}`
                          setConnectionName(suggestedName)
                          if (errors.connectionName) {
                            setErrors((prev) => ({ ...prev, connectionName: undefined }))
                          }
                        }}
                        className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                      >
                        Auto-fill name
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={connectionName}
                    onChange={(e) => {
                      setConnectionName(e.target.value)
                      if (errors.connectionName) {
                        setErrors((prev) => ({ ...prev, connectionName: undefined }))
                      }
                    }}
                    placeholder="e.g., Main NA Account"
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                      errors.connectionName
                        ? 'border-red-500'
                        : 'border-slate-200 dark:border-slate-600'
                    }`}
                  />
                  {errors.connectionName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.connectionName}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    A friendly name to identify this account
                  </p>
                </div>

                {/* Region Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Amazon Region
                  </label>
                  <div className="space-y-2">
                    {regionOptions.map((opt) => {
                      const isSelected = region === opt.id
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setRegion(opt.id)
                            if (errors.region) {
                              setErrors((prev) => ({ ...prev, region: undefined }))
                            }
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div
                            className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'border-amber-500'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-amber-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {opt.label}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {opt.description}
                            </p>
                          </div>
                          <Globe className="w-4 h-4 text-slate-400" />
                        </button>
                      )
                    })}
                  </div>
                  {errors.region && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {errors.region}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Info */}
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                After clicking "Connect", you'll be redirected to Amazon Seller Central
                to authorize access. Once connected, you can select which marketplaces
                to sync.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={activeBrands.length === 0}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                Connect to Amazon
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

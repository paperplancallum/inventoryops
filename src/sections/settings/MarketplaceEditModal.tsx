'use client'

import { useState, useEffect } from 'react'
import { X, Check, Globe } from 'lucide-react'
import type { AmazonConnection, AmazonMarketplace } from './types'
import { NA_MARKETPLACES } from '@/lib/supabase/hooks/useAmazonConnections'

interface MarketplaceEditModalProps {
  connection: AmazonConnection
  isOpen: boolean
  onClose: () => void
  onSave: (id: string, marketplaces: AmazonMarketplace[]) => Promise<void>
}

export function MarketplaceEditModal({
  connection,
  isOpen,
  onClose,
  onSave,
}: MarketplaceEditModalProps) {
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<AmazonMarketplace[]>([])
  const [saving, setSaving] = useState(false)

  // Reset selection when connection changes
  useEffect(() => {
    if (connection) {
      setSelectedMarketplaces([...connection.marketplaces])
    }
  }, [connection])

  if (!isOpen) return null

  const toggleMarketplace = (mp: AmazonMarketplace) => {
    setSelectedMarketplaces((prev) =>
      prev.includes(mp) ? prev.filter((m) => m !== mp) : [...prev, mp]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(connection.id, selectedMarketplaces)
      onClose()
    } catch {
      // Error handled by parent
    } finally {
      setSaving(false)
    }
  }

  const hasChanges =
    selectedMarketplaces.length !== connection.marketplaces.length ||
    selectedMarketplaces.some((mp) => !connection.marketplaces.includes(mp))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Edit Marketplaces
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {connection.sellerName || 'Amazon Account'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Select the marketplaces you want to sync with this account.
          </p>

          <div className="space-y-2">
            {NA_MARKETPLACES.map((marketplace) => {
              const isSelected = selectedMarketplaces.includes(marketplace.id)
              return (
                <button
                  key={marketplace.id}
                  onClick={() => toggleMarketplace(marketplace.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Globe className={`h-5 w-5 ${isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                    <div className="text-left">
                      <span className={`text-sm font-medium ${isSelected ? 'text-amber-900 dark:text-amber-100' : 'text-slate-700 dark:text-slate-300'}`}>
                        {marketplace.name}
                      </span>
                      <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                        {marketplace.id}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-amber-500 text-white'
                        : 'border-2 border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

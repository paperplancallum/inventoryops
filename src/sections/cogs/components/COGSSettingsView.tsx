'use client'

import { useState } from 'react'
import { Settings, Plus, Star, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import type { COGSSettings, COGSSettingsFormData } from '@/lib/supabase/hooks'
import { COGSSettingsForm } from './COGSSettingsForm'

interface COGSSettingsViewProps {
  settings: COGSSettings[]
  defaultSettings: COGSSettings | null
  isLoading: boolean
  error: string | null
  onCreateSettings: (data: COGSSettingsFormData) => Promise<COGSSettings | null>
  onUpdateSettings: (id: string, data: Partial<COGSSettingsFormData>) => Promise<COGSSettings | null>
  onDeleteSettings: (id: string) => Promise<boolean>
  onSetAsDefault: (id: string) => Promise<boolean>
}

export function COGSSettingsView({
  settings,
  defaultSettings,
  isLoading,
  error,
  onCreateSettings,
  onUpdateSettings,
  onDeleteSettings,
  onSetAsDefault,
}: COGSSettingsViewProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSettings, setEditingSettings] = useState<COGSSettings | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const handleCreate = async (data: COGSSettingsFormData) => {
    const result = await onCreateSettings(data)
    if (result) {
      setIsFormOpen(false)
    }
  }

  const handleUpdate = async (data: COGSSettingsFormData) => {
    if (!editingSettings) return
    const result = await onUpdateSettings(editingSettings.id, data)
    if (result) {
      setEditingSettings(null)
    }
  }

  const handleDelete = async (id: string) => {
    const result = await onDeleteSettings(id)
    if (result) {
      setDeleteConfirmId(null)
    }
  }

  const costCategories = [
    { key: 'includeProductCost', label: 'Product Cost', group: 'Base Costs' },
    { key: 'includeShippingToAmazon', label: 'Shipping to Amazon', group: 'Base Costs' },
    { key: 'includeDutiesTaxes', label: 'Duties & Taxes', group: 'Base Costs' },
    { key: 'includeFbaFulfillment', label: 'FBA Fulfillment', group: 'FBA Fees' },
    { key: 'includeFbaStorage', label: 'FBA Storage', group: 'FBA Fees' },
    { key: 'includeFbaPrep', label: 'FBA Prep', group: 'FBA Fees' },
    { key: 'includeFbaLabeling', label: 'FBA Labeling', group: 'FBA Fees' },
    { key: 'includeInboundPlacement', label: 'Inbound Placement', group: 'Inbound Fees' },
    { key: 'includeInboundTransportation', label: 'Inbound Transportation', group: 'Inbound Fees' },
    { key: 'includeAwdStorage', label: 'AWD Storage', group: 'AWD Fees' },
    { key: 'includeAwdProcessing', label: 'AWD Processing', group: 'AWD Fees' },
    { key: 'includeAwdTransportation', label: 'AWD Transportation', group: 'AWD Fees' },
    { key: 'includeReferralFees', label: 'Referral Fees', group: 'Other' },
    { key: 'includeAdvertising', label: 'Advertising', group: 'Other' },
    { key: 'includeDamagedLost', label: 'Damaged/Lost', group: 'Adjustments' },
    { key: 'includeDisposed', label: 'Disposed', group: 'Adjustments' },
    { key: 'includeAssemblyCosts', label: 'Assembly Costs', group: 'Base Costs' },
  ]

  const groupedCategories = costCategories.reduce((acc, cat) => {
    if (!acc[cat.group]) acc[cat.group] = []
    acc[cat.group].push(cat)
    return acc
  }, {} as Record<string, typeof costCategories>)

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                COGS Settings
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Configure which costs to include in COGS calculations
              </p>
            </div>
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Profile
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Settings List */}
      <div className="p-6">
        {settings.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {settings.map(profile => (
              <div
                key={profile.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                {/* Profile Header */}
                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                      <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {profile.name}
                        </h3>
                        {profile.isDefault && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                            <Star className="w-3 h-3" />
                            Default
                          </span>
                        )}
                      </div>
                      {profile.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {profile.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === profile.id ? null : profile.id)}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {menuOpenId === profile.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                        <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20">
                          <button
                            onClick={() => {
                              setEditingSettings(profile)
                              setMenuOpenId(null)
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit
                          </button>
                          {!profile.isDefault && (
                            <button
                              onClick={() => {
                                onSetAsDefault(profile.id)
                                setMenuOpenId(null)
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                            >
                              <Star className="w-4 h-4" />
                              Set as Default
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setDeleteConfirmId(profile.id)
                              setMenuOpenId(null)
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Cost Categories */}
                <div className="p-5 space-y-4">
                  {Object.entries(groupedCategories).map(([group, categories]) => (
                    <div key={group}>
                      <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                        {group}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {categories.map(cat => {
                          const isIncluded = profile[cat.key as keyof COGSSettings] as boolean
                          return (
                            <span
                              key={cat.key}
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                isIncluded
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                                  : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                              }`}
                            >
                              {cat.label}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <div className="flex justify-center mb-4">
              <Settings className="w-12 h-12 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No settings profiles
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Create a COGS settings profile to configure cost calculations
            </p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Profile
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(isFormOpen || editingSettings) && (
        <COGSSettingsForm
          settings={editingSettings}
          onSubmit={editingSettings ? handleUpdate : handleCreate}
          onCancel={() => {
            setIsFormOpen(false)
            setEditingSettings(null)
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Delete Settings Profile
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Are you sure you want to delete this settings profile? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

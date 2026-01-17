'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Archive, ArchiveRestore, X } from 'lucide-react'
import type { ArchiveConfirmationDialogProps } from './types'

export function ArchiveConfirmationDialog({
  isOpen,
  locationName,
  onConfirm,
  onCancel,
  isArchiving = true,
}: ArchiveConfirmationDialogProps) {
  const [inputValue, setInputValue] = useState('')

  // Reset input when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setInputValue('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const isNameMatch = inputValue === locationName
  const action = isArchiving ? 'Archive' : 'Unarchive'
  const actionLower = action.toLowerCase()

  const handleConfirm = () => {
    if (isNameMatch) {
      onConfirm(inputValue)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onCancel} />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  isArchiving
                    ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'
                    : 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
                }`}
              >
                {isArchiving ? (
                  <Archive className="w-5 h-5" />
                ) : (
                  <ArchiveRestore className="w-5 h-5" />
                )}
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {action} Location
              </h2>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Warning */}
            <div
              className={`flex gap-3 p-4 rounded-lg ${
                isArchiving
                  ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
                  : 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
              }`}
            >
              <AlertTriangle
                className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  isArchiving
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-green-600 dark:text-green-400'
                }`}
              />
              <div className="text-sm">
                {isArchiving ? (
                  <>
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      This location will be archived
                    </p>
                    <p className="mt-1 text-amber-700 dark:text-amber-300">
                      Archived locations are hidden from active views but can be restored later.
                      Any existing stock or transaction history will be preserved.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      This location will be restored
                    </p>
                    <p className="mt-1 text-green-700 dark:text-green-300">
                      The location will become active again and visible in all views.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Location Name Display */}
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                You are about to {actionLower}:
              </p>
              <div className="px-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <p className="font-medium text-slate-900 dark:text-white">{locationName}</p>
              </div>
            </div>

            {/* Confirmation Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                To confirm, type the location name below:
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Type location name to confirm"
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                autoFocus
              />
              {inputValue && !isNameMatch && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  Name does not match
                </p>
              )}
              {isNameMatch && (
                <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                  Name matches
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isNameMatch}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isArchiving
                  ? 'bg-amber-600 hover:bg-amber-700 disabled:bg-amber-600'
                  : 'bg-green-600 hover:bg-green-700 disabled:bg-green-600'
              }`}
            >
              {action}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

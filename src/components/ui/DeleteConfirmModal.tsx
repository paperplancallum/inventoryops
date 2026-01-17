'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  itemName?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Text that user must type to confirm deletion (e.g., "DELETE" or the item name) */
  requireConfirmText?: string
  /** Label shown above the confirmation input */
  confirmTextLabel?: string
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Delete',
  message = 'Are you sure you want to delete this item?',
  itemName,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  requireConfirmText,
  confirmTextLabel,
}: DeleteConfirmModalProps) {
  const [confirmInput, setConfirmInput] = useState('')

  // Reset input when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmInput('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const isConfirmDisabled = requireConfirmText
    ? confirmInput !== requireConfirmText
    : false

  const handleConfirm = () => {
    if (!isConfirmDisabled) {
      onConfirm()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white dark:bg-slate-800 shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {message}
            </p>
            {itemName && (
              <p className="mt-2 font-medium text-slate-900 dark:text-white">
                {itemName}
              </p>
            )}
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              This action cannot be undone.
            </p>

            {/* Confirmation text input */}
            {requireConfirmText && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {confirmTextLabel || (
                    <>
                      Type <span className="font-mono font-semibold text-red-600 dark:text-red-400">{requireConfirmText}</span> to confirm
                    </>
                  )}
                </label>
                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder={requireConfirmText}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isConfirmDisabled}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

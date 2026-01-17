'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Plus, Trash2, AlertCircle, GripVertical } from 'lucide-react'
import type {
  Invoice,
  EditableScheduleItem,
  MilestoneTriggerOption,
  PaymentMilestoneTrigger,
} from './types'
import { MILESTONE_TRIGGERS } from './types'

interface EditMilestonesModalProps {
  isOpen: boolean
  invoice: Invoice
  onClose: () => void
  onSave: (items: EditableScheduleItem[]) => Promise<boolean>
}

export function EditMilestonesModal({
  isOpen,
  invoice,
  onClose,
  onSave,
}: EditMilestonesModalProps) {
  const [items, setItems] = useState<EditableScheduleItem[]>([])
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState<'percentage' | 'amount'>('percentage')

  // Initialize items from invoice
  useEffect(() => {
    if (isOpen) {
      const existingItems: EditableScheduleItem[] = invoice.paymentSchedule.map(item => ({
        id: item.id,
        milestoneName: item.milestoneName,
        percentage: item.percentage,
        amount: item.amount,
        trigger: item.trigger,
        offsetDays: item.offsetDays,
        isNew: false,
        isDeleted: false,
      }))

      // If no items, create a default 100% item
      if (existingItems.length === 0) {
        existingItems.push({
          id: `new-${Date.now()}`,
          milestoneName: 'Full Payment',
          percentage: 100,
          amount: invoice.amount,
          trigger: 'manual',
          offsetDays: 0,
          isNew: true,
          isDeleted: false,
        })
      }

      setItems(existingItems)
    }
  }, [isOpen, invoice])

  if (!isOpen) return null

  const activeItems = items.filter(item => !item.isDeleted)
  const totalPercentage = activeItems.reduce((sum, item) => sum + item.percentage, 0)
  const totalAmount = activeItems.reduce((sum, item) => sum + item.amount, 0)
  const isValid = Math.abs(totalPercentage - 100) < 0.01

  const handlePercentageChange = (id: string, newPercentage: number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const percentage = Math.max(0, Math.min(100, newPercentage))
      return {
        ...item,
        percentage,
        amount: Math.round(invoice.amount * percentage) / 100,
      }
    }))
  }

  const handleAmountChange = (id: string, newAmount: number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const amount = Math.max(0, Math.min(invoice.amount, newAmount))
      return {
        ...item,
        amount,
        percentage: Math.round((amount / invoice.amount) * 10000) / 100,
      }
    }))
  }

  const handleNameChange = (id: string, name: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, milestoneName: name } : item
    ))
  }

  const handleTriggerChange = (id: string, trigger: PaymentMilestoneTrigger) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, trigger } : item
    ))
  }

  const handleOffsetDaysChange = (id: string, offsetDays: number) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, offsetDays: Math.max(0, offsetDays) } : item
    ))
  }

  const handleAddMilestone = () => {
    const remainingPercentage = Math.max(0, 100 - totalPercentage)
    setItems(prev => [...prev, {
      id: `new-${Date.now()}`,
      milestoneName: '',
      percentage: remainingPercentage,
      amount: Math.round(invoice.amount * remainingPercentage) / 100,
      trigger: 'manual',
      offsetDays: 0,
      isNew: true,
      isDeleted: false,
    }])
  }

  const handleRemoveMilestone = (id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, isDeleted: true } : item
    ))
  }

  const handleDistributeEvenly = () => {
    const count = activeItems.length
    if (count === 0) return

    const evenPercentage = Math.round(10000 / count) / 100
    const evenAmount = Math.round(invoice.amount / count * 100) / 100

    setItems(prev => {
      let runningTotal = 0
      return prev.map((item, idx) => {
        if (item.isDeleted) return item

        // Last item gets the remainder to ensure 100%
        const isLastActive = prev.filter(i => !i.isDeleted).indexOf(item) === count - 1
        const percentage = isLastActive ? Math.round((100 - runningTotal) * 100) / 100 : evenPercentage
        runningTotal += percentage

        return {
          ...item,
          percentage,
          amount: Math.round(invoice.amount * percentage) / 100,
        }
      })
    })
  }

  const handleSave = async () => {
    if (!isValid) return

    setSaving(true)
    const success = await onSave(items)
    setSaving(false)

    if (success) {
      onClose()
    }
  }

  const handleClose = () => {
    if (saving) return
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl transform rounded-xl bg-white dark:bg-slate-800 shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Edit Payment Milestones
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {invoice.invoiceNumber} — Total: ${invoice.amount.toLocaleString()}
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={saving}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-500 dark:hover:text-slate-300 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Edit Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Edit by:</span>
                <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setEditMode('percentage')}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      editMode === 'percentage'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                    }`}
                  >
                    Percentage
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMode('amount')}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      editMode === 'amount'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                    }`}
                  >
                    Amount
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDistributeEvenly}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                Distribute Evenly
              </button>
            </div>

            {/* Milestones List */}
            <div className="space-y-3">
              {items.filter(item => !item.isDeleted).map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                >
                  {/* Drag Handle (visual only for now) */}
                  <div className="pt-2 text-slate-400 cursor-grab">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Main Fields */}
                  <div className="flex-1 grid grid-cols-12 gap-3">
                    {/* Milestone Name */}
                    <div className="col-span-4">
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={item.milestoneName}
                        onChange={(e) => handleNameChange(item.id, e.target.value)}
                        placeholder="e.g., Deposit"
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Percentage / Amount */}
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        {editMode === 'percentage' ? 'Percentage' : 'Amount'}
                      </label>
                      {editMode === 'percentage' ? (
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={item.percentage}
                            onChange={(e) => handlePercentageChange(item.id, parseFloat(e.target.value) || 0)}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-2 pr-7 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 text-sm">%</span>
                        </div>
                      ) : (
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={invoice.amount}
                            value={item.amount}
                            onChange={(e) => handleAmountChange(item.id, parseFloat(e.target.value) || 0)}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 pl-7 pr-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      )}
                    </div>

                    {/* Display calculated value */}
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        {editMode === 'percentage' ? 'Amount' : 'Percentage'}
                      </label>
                      <div className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-600/50 rounded-lg">
                        {editMode === 'percentage'
                          ? `$${item.amount.toLocaleString()}`
                          : `${item.percentage}%`
                        }
                      </div>
                    </div>

                    {/* Trigger */}
                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Trigger
                      </label>
                      <select
                        value={item.trigger}
                        onChange={(e) => handleTriggerChange(item.id, e.target.value as PaymentMilestoneTrigger)}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {MILESTONE_TRIGGERS.map(trigger => (
                          <option key={trigger.id} value={trigger.id}>
                            {trigger.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Offset Days */}
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        +Days
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={item.offsetDays}
                        onChange={(e) => handleOffsetDaysChange(item.id, parseInt(e.target.value) || 0)}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-600 px-2 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveMilestone(item.id)}
                    disabled={activeItems.length <= 1}
                    className="pt-6 text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                    title={activeItems.length <= 1 ? 'Must have at least one milestone' : 'Remove milestone'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Milestone Button */}
            <button
              type="button"
              onClick={handleAddMilestone}
              className="flex items-center gap-2 w-full justify-center py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Milestone
            </button>

            {/* Totals */}
            <div className={`flex items-center justify-between p-3 rounded-lg ${
              isValid
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {!isValid && <AlertCircle className="w-4 h-4 text-red-500" />}
                <span className={`text-sm font-medium ${isValid ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                  Total: {totalPercentage.toFixed(2)}% = ${totalAmount.toLocaleString()}
                </span>
              </div>
              {!isValid && (
                <span className="text-sm text-red-600 dark:text-red-400">
                  Must equal 100% (${invoice.amount.toLocaleString()})
                </span>
              )}
              {isValid && (
                <span className="text-sm text-emerald-600 dark:text-emerald-400">
                  ✓ Valid
                </span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-700 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !isValid}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

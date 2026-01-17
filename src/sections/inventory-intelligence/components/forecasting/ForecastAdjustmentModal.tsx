'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import type { AdjustmentEffect, AccountForecastAdjustment, ProductForecastAdjustment } from '../../types'

export interface ForecastAdjustment {
  name: string
  startDate: string
  endDate: string
  effect: AdjustmentEffect
  multiplier?: number
  isRecurring: boolean
  notes?: string
}

export interface ForecastAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (adjustment: Omit<ForecastAdjustment, 'id' | 'createdAt'>) => void
  existingAdjustment?: ForecastAdjustment | AccountForecastAdjustment | ProductForecastAdjustment
  mode: 'account' | 'product'
  productId?: string
}

export function ForecastAdjustmentModal({
  isOpen,
  onClose,
  onSave,
  existingAdjustment,
  mode,
}: ForecastAdjustmentModalProps) {
  const [name, setName] = React.useState('')
  const [startDate, setStartDate] = React.useState('')
  const [endDate, setEndDate] = React.useState('')
  const [effect, setEffect] = React.useState<AdjustmentEffect>('exclude')
  const [multiplier, setMultiplier] = React.useState(1.5)
  const [isRecurring, setIsRecurring] = React.useState(false)
  const [notes, setNotes] = React.useState('')

  // Initialize form with existing adjustment data
  React.useEffect(() => {
    if (existingAdjustment) {
      setName(existingAdjustment.name)
      setStartDate(existingAdjustment.startDate)
      setEndDate(existingAdjustment.endDate)
      setEffect(existingAdjustment.effect)
      setMultiplier(existingAdjustment.multiplier ?? 1.5)
      setIsRecurring(existingAdjustment.isRecurring)
      setNotes(existingAdjustment.notes ?? '')
    } else {
      // Reset form for new adjustment
      setName('')
      setStartDate('')
      setEndDate('')
      setEffect('exclude')
      setMultiplier(1.5)
      setIsRecurring(false)
      setNotes('')
    }
  }, [existingAdjustment, isOpen])

  const handleSave = () => {
    if (!name || !startDate || !endDate) return

    const adjustment: Omit<ForecastAdjustment, 'id' | 'createdAt'> = {
      name,
      startDate,
      endDate,
      effect,
      multiplier: effect === 'multiply' ? multiplier : undefined,
      isRecurring,
      notes: notes || undefined
    }

    onSave(adjustment)
    onClose()
  }

  const formatMultiplierLabel = (value: number) => {
    const percent = Math.round((value - 1) * 100)
    if (percent > 0) return `+${percent}%`
    if (percent < 0) return `${percent}%`
    return '0%'
  }

  if (!isOpen) return null

  const isEditing = !!existingAdjustment
  const title = isEditing
    ? 'Edit Forecast Adjustment'
    : mode === 'account'
      ? 'Add Account Adjustment'
      : 'Add Product Adjustment'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Black Friday Sale"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Recurring */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="recurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="recurring" className="text-sm text-slate-700 dark:text-slate-300">
              Recurring yearly
            </label>
          </div>

          {/* Effect Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Effect
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 dark:has-[:checked]:bg-indigo-900/20">
                <input
                  type="radio"
                  name="effect"
                  value="exclude"
                  checked={effect === 'exclude'}
                  onChange={() => setEffect('exclude')}
                  className="mt-0.5 h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    Exclude from history
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Ignore this period&apos;s data when calculating forecasts (e.g., stockouts, data issues)
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 dark:has-[:checked]:bg-indigo-900/20">
                <input
                  type="radio"
                  name="effect"
                  value="multiply"
                  checked={effect === 'multiply'}
                  onChange={() => setEffect('multiply')}
                  className="mt-0.5 h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    Multiply forecast
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Adjust the forecast for this period by a percentage (e.g., promotions, holidays)
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Multiplier Slider (only shown when multiply is selected) */}
          {effect === 'multiply' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Multiplier
                </label>
                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  {multiplier.toFixed(2)}x ({formatMultiplierLabel(multiplier)})
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.05"
                value={multiplier}
                onChange={(e) => setMultiplier(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>0x</span>
                <span>1x</span>
                <span>2x</span>
                <span>3x</span>
                <span>5x</span>
              </div>

              {/* Units Preview */}
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Example:</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">100 units</span>
                  <span className="text-slate-400">→</span>
                  <span className={`font-semibold ${
                    multiplier > 1
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : multiplier < 1
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {Math.round(100 * multiplier)} units
                  </span>
                  {multiplier !== 1 && (
                    <span className={`text-xs ${
                      multiplier > 1
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      ({multiplier > 1 ? '+' : ''}{Math.round((multiplier - 1) * 100)}%)
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Notes <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this adjustment..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name || !startDate || !endDate}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEditing ? 'Save Changes' : 'Add Adjustment'}
          </button>
        </div>
      </div>
    </div>
  )
}

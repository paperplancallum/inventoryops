'use client'

import { Check } from 'lucide-react'
import type { AmazonReceiving as AmazonReceivingType, AmazonReceivingStatus } from '../types'

interface AmazonReceivingProps {
  receiving: AmazonReceivingType
  onUpdate?: (update: Partial<AmazonReceivingType>) => void
}

const stages: { id: AmazonReceivingStatus; label: string }[] = [
  { id: 'checked-in', label: 'Checked In' },
  { id: 'receiving', label: 'Receiving' },
  { id: 'received', label: 'Received' },
  { id: 'closed', label: 'Closed' },
]

const stageOrder: Record<AmazonReceivingStatus, number> = {
  'checked-in': 0,
  receiving: 1,
  received: 2,
  closed: 3,
}

export function AmazonReceiving({ receiving }: AmazonReceivingProps) {
  const currentStageIndex = stageOrder[receiving.status]

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  const getDateForStage = (stageId: AmazonReceivingStatus): string | null => {
    switch (stageId) {
      case 'checked-in': return receiving.checkedInDate
      case 'receiving': return receiving.receivingStartedDate
      case 'received': return receiving.receivedDate
      case 'closed': return receiving.closedDate
      default: return null
    }
  }

  return (
    <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg p-4">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-4">
        {stages.map((stage, index) => {
          const isCompleted = index < currentStageIndex
          const isCurrent = index === currentStageIndex
          const stageDate = getDateForStage(stage.id)

          return (
            <div key={stage.id} className="flex-1 flex flex-col items-center">
              {/* Connector line */}
              {index > 0 && (
                <div className="absolute w-full h-0.5 -translate-y-1/2 top-1/2 left-0">
                  <div className={`h-full ${isCompleted || isCurrent ? 'bg-lime-500' : 'bg-stone-300 dark:bg-stone-600'}`} />
                </div>
              )}

              {/* Circle */}
              <div className="relative">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    isCompleted
                      ? 'bg-lime-500 text-white'
                      : isCurrent
                      ? 'bg-amber-500 text-white ring-4 ring-amber-100 dark:ring-amber-900/50'
                      : 'bg-stone-200 dark:bg-stone-600 text-stone-500 dark:text-stone-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" strokeWidth={3} />
                  ) : (
                    index + 1
                  )}
                </div>
              </div>

              {/* Label */}
              <div className="mt-2 text-center">
                <p className={`text-xs font-medium ${isCurrent ? 'text-amber-600 dark:text-amber-400' : 'text-stone-600 dark:text-stone-400'}`}>
                  {stage.label}
                </p>
                {stageDate && (
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                    {formatDate(stageDate)}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Discrepancy */}
      {receiving.status === 'closed' && receiving.discrepancy !== 0 && (
        <div className={`mt-4 p-3 rounded-lg ${receiving.discrepancy < 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-lime-50 dark:bg-lime-900/20'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${receiving.discrepancy < 0 ? 'text-red-700 dark:text-red-300' : 'text-lime-700 dark:text-lime-300'}`}>
              Quantity Discrepancy
            </span>
            <span className={`text-sm font-semibold ${receiving.discrepancy < 0 ? 'text-red-700 dark:text-red-300' : 'text-lime-700 dark:text-lime-300'}`}>
              {receiving.discrepancy > 0 ? '+' : ''}{receiving.discrepancy} units
            </span>
          </div>
        </div>
      )}

      {/* Notes */}
      {receiving.notes && (
        <div className="mt-4">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase mb-1">Receiving Notes</p>
          <p className="text-sm text-stone-600 dark:text-stone-400">{receiving.notes}</p>
        </div>
      )}
    </div>
  )
}

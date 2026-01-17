import { Truck, Search, Package } from 'lucide-react'
import type { WeekTimelineProps, TimelineEvent } from '../../../../product/sections/dashboard/types'

function getEventIcon(type: TimelineEvent['type']) {
  switch (type) {
    case 'arrival':
      return <Truck className="h-4 w-4" />
    case 'inspection':
      return <Search className="h-4 w-4" />
    case 'completion':
      return <Package className="h-4 w-4" />
  }
}

function getEventColor(type: TimelineEvent['type']) {
  switch (type) {
    case 'arrival':
      return 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50'
    case 'inspection':
      return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50'
    case 'completion':
      return 'text-lime-600 dark:text-lime-400 bg-lime-50 dark:bg-lime-950/50'
  }
}

export function WeekTimeline({ days }: WeekTimelineProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">This Week</h3>
      <div className="grid grid-cols-5 gap-2">
        {days.map((day, index) => (
          <div key={day.date} className="text-center">
            {/* Day header */}
            <div className={`mb-2 ${index === 0 ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
              <p className="text-xs">{day.dayLabel}</p>
              <p className="text-lg">{day.dateLabel}</p>
            </div>

            {/* Events */}
            <div className="min-h-[60px] space-y-1">
              {day.events.length === 0 ? (
                <p className="text-sm text-slate-300 dark:text-slate-600">--</p>
              ) : (
                day.events.map((event) => (
                  <div
                    key={event.id}
                    className={`rounded-md p-1.5 ${getEventColor(event.type)}`}
                    title={`${event.title}${event.subtitle ? ` - ${event.subtitle}` : ''}`}
                  >
                    <div className="flex justify-center mb-0.5">
                      {getEventIcon(event.type)}
                    </div>
                    <p className="text-xs font-medium truncate">{event.title}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

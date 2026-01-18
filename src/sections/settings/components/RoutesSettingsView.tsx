'use client'

import { MapPin, Route, Truck, Ship, Plane } from 'lucide-react'

export function RoutesSettingsView() {
  return (
    <div className="space-y-8">
      {/* Shipping Legs Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-medium text-slate-900 dark:text-white">
              Shipping Legs
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Define individual point-to-point shipping segments
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <MapPin className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-base font-medium text-slate-900 dark:text-white mb-2">
            Shipping Legs Coming Soon
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Define individual shipping segments like &quot;Factory to Port&quot; or &quot;Port to Amazon FBA&quot;
            with transit times and costs.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Ship className="w-4 h-4" />
              Sea
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Plane className="w-4 h-4" />
              Air
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Truck className="w-4 h-4" />
              Ground
            </div>
          </div>
        </div>
      </section>

      {/* Shipping Routes Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-medium text-slate-900 dark:text-white">
              Shipping Routes
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Combine legs into complete shipping routes
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <Route className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-base font-medium text-slate-900 dark:text-white mb-2">
            Shipping Routes Coming Soon
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Compose complete shipping routes by combining multiple legs.
            Set default routes for origin-destination pairs.
          </p>
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg max-w-sm mx-auto">
            <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span className="px-2 py-1 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                Factory
              </span>
              <span className="text-slate-400">→</span>
              <span className="px-2 py-1 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                Port
              </span>
              <span className="text-slate-400">→</span>
              <span className="px-2 py-1 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                Amazon FBA
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

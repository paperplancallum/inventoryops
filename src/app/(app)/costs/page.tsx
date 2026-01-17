import { DollarSign, Plus } from 'lucide-react'

export default function CostsPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Costs & Payments
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track expenses and landed costs
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" />
          Add Cost
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            Costs & Payments Section
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            This section will be implemented in Milestone 5. It will include cost recording, payment tracking, and landed cost calculation.
          </p>
        </div>
      </div>
    </div>
  )
}

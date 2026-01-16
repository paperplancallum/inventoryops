import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Submit Quote | InventoryOps',
  description: 'Submit your shipping quote',
}

export default function QuotesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Minimal header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IO</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">
              InventoryOps
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 mt-auto">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Need help? Contact us at support@inventoryops.com
          </p>
        </div>
      </footer>
    </div>
  )
}

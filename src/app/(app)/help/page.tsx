import { HelpCircle, Book, MessageCircle, Mail } from 'lucide-react'

export default function HelpPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Help & Support
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Get help with InventoryOps
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <HelpCard
          title="Documentation"
          description="Browse guides and tutorials for using InventoryOps"
          icon={<Book className="w-6 h-6" />}
        />
        <HelpCard
          title="FAQs"
          description="Find answers to commonly asked questions"
          icon={<HelpCircle className="w-6 h-6" />}
        />
        <HelpCard
          title="Contact Support"
          description="Get in touch with our support team"
          icon={<Mail className="w-6 h-6" />}
        />
      </div>

      <div className="mt-8 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
            <MessageCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              Need help getting started?
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              InventoryOps helps Amazon FBA businesses track inventory from purchase order through to Amazon. Start by adding your products and suppliers in the Catalog section.
            </p>
            <a
              href="/catalog"
              className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              Go to Catalog
              <span className="ml-1">&rarr;</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

interface HelpCardProps {
  title: string
  description: string
  icon: React.ReactNode
}

function HelpCard({ title, description, icon }: HelpCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors cursor-pointer">
      <div className="w-12 h-12 mb-4 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  )
}

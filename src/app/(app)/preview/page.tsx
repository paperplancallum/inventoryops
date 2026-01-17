'use client'

import {
  Package,
  FileText,
  Boxes,
  DollarSign,
  ClipboardCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

const quickStats = [
  { label: 'Active SKUs', value: '24', icon: Package, color: 'text-indigo-600' },
  { label: 'Open POs', value: '7', icon: FileText, color: 'text-emerald-600' },
  { label: 'In Transit', value: '3', icon: Boxes, color: 'text-amber-600' },
  { label: 'Pending Inspections', value: '2', icon: ClipboardCheck, color: 'text-rose-600' },
]

const recentActivity = [
  { type: 'success', message: 'PO-2024-0042 shipped from Shenzhen', time: '2 hours ago' },
  { type: 'warning', message: 'Low stock alert: SKU-1234 (Widget Pro)', time: '4 hours ago' },
  { type: 'info', message: 'Invoice #INV-0089 payment received', time: '6 hours ago' },
  { type: 'success', message: 'Inspection passed for PO-2024-0039', time: '1 day ago' },
]

const quickLinks = [
  { label: 'Product Catalog', href: '/catalog', icon: Package, description: 'Manage products and suppliers' },
  { label: 'Purchase Orders', href: '/purchase-orders', icon: FileText, description: 'Track orders through production' },
  { label: 'Inventory', href: '/inventory', icon: Boxes, description: 'Monitor stock across locations' },
  { label: 'Costs & Payments', href: '/costs', icon: DollarSign, description: 'Invoices and payment tracking' },
]

export default function PreviewPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome to InventoryOps</h1>
        <p className="text-indigo-100 mb-4">
          This is an interactive demo. Explore the full platform - click around, view data, and see how InventoryOps can transform your Amazon FBA operations.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-700 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
          >
            <Package className="w-4 h-4" />
            Browse Catalog
          </Link>
          <Link
            href="/purchase-orders"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-400 transition-colors"
          >
            <FileText className="w-4 h-4" />
            View Purchase Orders
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stat.value}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Activity
            </h2>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {recentActivity.map((activity, i) => (
              <div key={i} className="p-4 flex items-start gap-3">
                {activity.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />}
                {activity.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />}
                {activity.type === 'info' && <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5" />}
                <div>
                  <p className="text-sm text-zinc-900 dark:text-zinc-100">{activity.message}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Explore the Platform</h2>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="p-4 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  <link.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{link.label}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{link.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Note */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Demo Mode:</strong> This is a fully interactive prototype with sample data. All features are functional - create purchase orders, manage products, track shipments, and more. Changes are stored in your browser session.
        </p>
      </div>
    </div>
  )
}

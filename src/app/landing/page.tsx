'use client';

import Image from 'next/image';
import {
  Package,
  TrendingUp,
  ClipboardCheck,
  Truck,
  DollarSign,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Boxes,
  FileText,
  ShieldCheck,
  MessageSquare,
  Inbox,
  Brain,
  History,
  Ship,
  MapPin,
  FolderOpen,
  Users,
  CreditCard,
  Play
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Boxes className="w-8 h-8 text-indigo-600" />
              <span className="text-xl font-bold text-slate-900">InventoryOps</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-600 hover:text-slate-900 transition">Features</a>
              <a href="#screenshots" className="text-slate-600 hover:text-slate-900 transition">Screenshots</a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-900 transition">Pricing</a>
            </div>
            <div className="flex items-center gap-4">
              <a href="/preview" className="px-4 py-2 text-indigo-600 font-medium hover:text-indigo-700 transition flex items-center gap-2">
                <Play className="w-4 h-4" /> Try Demo
              </a>
              <a href="/preview" className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition">
                Start Free Trial
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
              </span>
              Built for Amazon FBA Sellers
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 leading-tight mb-6">
              Track Every Unit from{' '}
              <span className="text-indigo-600">Factory to Amazon</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              The complete operations platform for FBA sellers. Manage purchase orders, track inventory through your supply chain, and never lose visibility of your products again.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/preview" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                <Play className="w-5 h-5" /> Try Interactive Demo
              </a>
              <a href="#screenshots" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 hover:border-slate-300 transition flex items-center justify-center gap-2">
                See Screenshots <ChevronRight className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Hero Image */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
              <Image
                src="/screenshots/live-dashboard.png"
                alt="InventoryOps Dashboard"
                width={1400}
                height={900}
                className="w-full"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Sound Familiar?</h2>
            <p className="text-slate-400 text-lg">These problems cost FBA sellers thousands every month</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { problem: "Lost track of a shipment and missed a restock deadline", cost: "Stockout = lost sales" },
              { problem: "Amazon received fewer units than you sent", cost: "Discrepancies = lost inventory" },
              { problem: "Spreadsheets everywhere with no single source of truth", cost: "Chaos = costly mistakes" },
            ].map((item, i) => (
              <div key={i} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <p className="text-white text-lg mb-3">&ldquo;{item.problem}&rdquo;</p>
                <p className="text-red-400 font-medium">{item.cost}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Everything You Need to Run Your FBA Business</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              One platform to manage your entire supply chain from order to Amazon fulfillment
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Package,
                title: "Product Catalog",
                description: "Manage SKUs with ASIN/FNSKU tracking, supplier links, and stock levels. Import/export via CSV.",
                color: "indigo"
              },
              {
                icon: FileText,
                title: "Purchase Orders",
                description: "Create POs, track status from draft to received. Built-in supplier messaging.",
                color: "blue"
              },
              {
                icon: Ship,
                title: "Transfer Tracking",
                description: "Track shipments between factories, 3PLs, and Amazon FBA/AWD with carrier and cost details.",
                color: "cyan"
              },
              {
                icon: ClipboardCheck,
                title: "Quality Inspections",
                description: "Schedule inspections, record defects by type/severity, track rework requests with suppliers.",
                color: "purple"
              },
              {
                icon: Brain,
                title: "Inventory Intelligence",
                description: "AI-powered transfer and PO suggestions based on forecasts and safety stock levels.",
                color: "orange"
              },
              {
                icon: MessageSquare,
                title: "Supplier Messaging",
                description: "Message suppliers directly from POs with full thread history and unread notifications.",
                color: "emerald"
              },
              {
                icon: Inbox,
                title: "Unified Inbox",
                description: "All supplier and shipping agent messages in one place across all POs and transfers.",
                color: "violet"
              },
              {
                icon: History,
                title: "Activity Log",
                description: "Complete audit trail of every change with user attribution and timestamps.",
                color: "slate"
              },
              {
                icon: BarChart3,
                title: "Amazon Reconciliation",
                description: "Compare expected vs received quantities. Automatically flag discrepancies for claims.",
                color: "amber"
              },
              {
                icon: CreditCard,
                title: "Invoices & Payments",
                description: "Track product costs, shipping, duties, and inspection fees. Know your true landed cost.",
                color: "green"
              },
              {
                icon: MapPin,
                title: "Location Management",
                description: "Define your supply chain nodes - factories, 3PLs, ports, customs, and Amazon warehouses.",
                color: "rose"
              },
              {
                icon: FolderOpen,
                title: "Document Management",
                description: "Generate PO PDFs, inspection briefs, manifests, and packing lists. All in one place.",
                color: "amber"
              },
            ].map((feature, i) => (
              <div key={i} className="group p-6 bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-lg transition-all">
                <div className={`w-12 h-12 rounded-xl bg-${feature.color}-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 text-${feature.color}-600`} />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section id="screenshots" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">See InventoryOps in Action</h2>
            <p className="text-xl text-slate-600">Intuitive interface designed for efficiency</p>
          </div>

          <div className="space-y-20">
            {/* Inventory Screenshot */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm font-medium mb-4">
                  Multi-Location Inventory
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4">Track Stock Across Every Location</h3>
                <p className="text-lg text-slate-600 mb-6">
                  See your complete inventory picture - from production to transit to warehouse to Amazon. Know exactly what&apos;s available, reserved, and in-transit at a glance.
                </p>
                <ul className="space-y-3">
                  {["Production, Transit, Warehouse, Amazon views", "Available vs Reserved quantities", "Real-time stock valuations", "Multi-brand filtering"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                <Image
                  src="/screenshots/live-inventory.png"
                  alt="Inventory Overview"
                  width={1400}
                  height={900}
                  className="w-full"
                />
              </div>
            </div>

            {/* Catalog Screenshot */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                <Image
                  src="/screenshots/live-catalog.png"
                  alt="Product Catalog"
                  width={1400}
                  height={900}
                  className="w-full"
                />
              </div>
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">
                  Product Catalog
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4">All Your Products in One Place</h3>
                <p className="text-lg text-slate-600 mb-6">
                  Manage your entire product line with Amazon-specific fields like ASIN and FNSKU. Organize by brand and link products to suppliers.
                </p>
                <ul className="space-y-3">
                  {["SKU, ASIN, FNSKU tracking", "Multi-brand organization", "Stock level monitoring with alerts", "Bulk CSV import/export"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Purchase Orders Screenshot */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
                  Purchase Orders
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4">Streamlined Supplier Ordering</h3>
                <p className="text-lg text-slate-600 mb-6">
                  Create and track purchase orders with built-in inspection scheduling and invoice tracking. Full visibility from order to delivery.
                </p>
                <ul className="space-y-3">
                  {["Multi-status workflow tracking", "Integrated inspection scheduling", "Invoice & payment tracking", "Supplier messaging with notifications"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                <Image
                  src="/screenshots/live-purchase-orders.png"
                  alt="Purchase Orders"
                  width={1400}
                  height={900}
                  className="w-full"
                />
              </div>
            </div>

            {/* Inspections Screenshot */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                <Image
                  src="/screenshots/live-inspections.png"
                  alt="Quality Inspections"
                  width={1400}
                  height={900}
                  className="w-full"
                />
              </div>
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
                  Quality Inspections
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4">Pre-Shipment Quality Control</h3>
                <p className="text-lg text-slate-600 mb-6">
                  Schedule inspections, assign agents, track defect rates, and manage rework requests. Catch quality issues before they reach Amazon.
                </p>
                <ul className="space-y-3">
                  {["Assign inspection agents per PO", "Track defect rates by supplier", "Pass/fail workflows with re-inspection", "Full inspection history & invoicing"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Supplier Messaging Screenshot */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
                  Supplier Communication
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4">Message Suppliers Directly from POs</h3>
                <p className="text-lg text-slate-600 mb-6">
                  No more switching between email and your system. Message suppliers directly from purchase orders, with full thread history and notification badges.
                </p>
                <ul className="space-y-3">
                  {["In-app messaging per purchase order", "Full conversation history", "Unread message indicators", "Internal notes for team collaboration"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                <Image
                  src="/screenshots/live-supplier-messaging.png"
                  alt="Supplier Messaging"
                  width={1400}
                  height={900}
                  className="w-full"
                />
              </div>
            </div>

            {/* Unified Inbox Screenshot */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                <Image
                  src="/screenshots/live-inbox.png"
                  alt="Unified Inbox"
                  width={1400}
                  height={900}
                  className="w-full"
                />
              </div>
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm font-medium mb-4">
                  Unified Inbox
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4">All Messages in One Place</h3>
                <p className="text-lg text-slate-600 mb-6">
                  View all supplier and shipping agent messages across all purchase orders and transfers. Never miss an important update.
                </p>
                <ul className="space-y-3">
                  {["Combined view across all POs & transfers", "Filter by source, supplier, or status", "Unread and awaiting reply indicators", "Quick jump to related PO or transfer"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Inventory Intelligence Screenshot */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mb-4">
                  Inventory Intelligence
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4">Smart Restock Suggestions</h3>
                <p className="text-lg text-slate-600 mb-6">
                  AI-powered suggestions for transfers and purchase orders based on forecasts and safety stock levels. Stay ahead of stockouts.
                </p>
                <ul className="space-y-3">
                  {["Critical/Warning/Planned urgency levels", "Transfer and PO suggestions", "Location health monitoring", "Forecast-based recommendations"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                <Image
                  src="/screenshots/live-inventory-intelligence.png"
                  alt="Inventory Intelligence"
                  width={1400}
                  height={900}
                  className="w-full"
                />
              </div>
            </div>

            {/* Transfers Screenshot */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                <Image
                  src="/screenshots/live-transfers.png"
                  alt="Transfer Tracking"
                  width={1400}
                  height={900}
                  className="w-full"
                />
              </div>
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm font-medium mb-4">
                  Transfer Tracking
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4">Track Every Shipment</h3>
                <p className="text-lg text-slate-600 mb-6">
                  Full visibility of shipments between factories, 3PLs, and Amazon. Track by carrier, method, and cost.
                </p>
                <ul className="space-y-3">
                  {["Route tracking from origin to destination", "Multiple shipping methods supported", "Carrier and cost tracking", "Amazon FBA/AWD shipment management"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Activity Log Screenshot */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-200 text-slate-700 rounded-full text-sm font-medium mb-4">
                  Activity Log
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4">Complete Audit Trail</h3>
                <p className="text-lg text-slate-600 mb-6">
                  Track every change across your entire system. Know who did what and when - perfect for teams and compliance.
                </p>
                <ul className="space-y-3">
                  {["User attribution on every change", "Filter by entity, action, or user", "Timestamp and description for context", "Exportable activity reports"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                <Image
                  src="/screenshots/live-activity-log.png"
                  alt="Activity Log"
                  width={1400}
                  height={900}
                  className="w-full"
                />
              </div>
            </div>

            {/* Invoices Screenshot */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                <Image
                  src="/screenshots/live-invoices.png"
                  alt="Invoices & Payments"
                  width={1400}
                  height={900}
                  className="w-full"
                />
              </div>
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
                  Invoices & Payments
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4">Track Every Dollar</h3>
                <p className="text-lg text-slate-600 mb-6">
                  Manage all costs in one place - product costs, shipping, duties, inspections, and storage. Know your true landed cost.
                </p>
                <ul className="space-y-3">
                  {["Product, shipping, customs, inspection costs", "Payment status tracking (Paid/Partial/Overdue)", "Link invoices to POs and batches", "Multi-brand cost filtering"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Locations Screenshot */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-medium mb-4">
                  Location Management
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4">Map Your Supply Chain</h3>
                <p className="text-lg text-slate-600 mb-6">
                  Define all nodes in your supply chain - factories, 3PLs, ports, customs, and Amazon warehouses. Know where your inventory lives.
                </p>
                <ul className="space-y-3">
                  {["Factory, 3PL, Port, Customs, Amazon FBA/AWD types", "Contact information per location", "Country and city tracking", "Active/inactive status management"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                <Image
                  src="/screenshots/live-locations.png"
                  alt="Locations"
                  width={1400}
                  height={900}
                  className="w-full"
                />
              </div>
            </div>

            {/* Documents Screenshot */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                <Image
                  src="/screenshots/live-documents.png"
                  alt="Document Management"
                  width={1400}
                  height={900}
                  className="w-full"
                />
              </div>
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium mb-4">
                  Document Management
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4">All Documents in One Place</h3>
                <p className="text-lg text-slate-600 mb-6">
                  Generate and store PO PDFs, inspection briefs, shipping manifests, and packing lists. Download or preview anytime.
                </p>
                <ul className="space-y-3">
                  {["Purchase Order PDFs", "Inspection brief reports", "Shipping manifests & packing lists", "Download, preview, and link to source"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Suppliers Screenshot */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium mb-4">
                  Supplier Management
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4">Manage Your Vendor Network</h3>
                <p className="text-lg text-slate-600 mb-6">
                  Track all your suppliers with contact info, lead times, payment terms, and linked products. Build stronger supplier relationships.
                </p>
                <ul className="space-y-3">
                  {["Contact details and email", "Lead time tracking by supplier", "Payment terms configuration", "Product count per supplier"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                <Image
                  src="/screenshots/live-suppliers.png"
                  alt="Supplier Management"
                  width={1400}
                  height={900}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Try Demo CTA */}
          <div className="mt-20 text-center">
            <a href="/preview" className="inline-flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white font-semibold rounded-2xl hover:bg-indigo-700 transition text-lg shadow-lg hover:shadow-xl">
              <Play className="w-6 h-6" /> Try the Interactive Demo
            </a>
            <p className="mt-4 text-slate-500">No sign up required - explore all features instantly</p>
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Why InventoryOps?</h2>
            <p className="text-xl text-slate-600">Purpose-built for Amazon FBA operations</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Amazon-Native", desc: "ASIN/FNSKU fields and reconciliation built-in" },
              { title: "Visual Pipeline", desc: "Kanban board, not just spreadsheet tables" },
              { title: "Full Audit Trail", desc: "Stage history on every batch and PO" },
              { title: "Integrated QC", desc: "Inspections tied directly to batches" },
            ].map((item, i) => (
              <div key={i} className="text-center p-6">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-slate-600">Start free, scale as you grow</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Tier */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Free</h3>
              <p className="text-slate-600 mb-6">Try it out</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">$0</span>
                <span className="text-slate-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {["Up to 2 SKUs", "All features included", "Full pipeline tracking", "Email support"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
              <a href="/preview" className="block w-full py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition text-center">
                Try Demo
              </a>
            </div>

            {/* Pro Tier */}
            <div className="bg-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-4 right-4 px-3 py-1 bg-indigo-500 rounded-full text-sm font-medium">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-indigo-200 mb-6">For growing sellers</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$99</span>
                <span className="text-indigo-200">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {["Up to 100 SKUs", "All features included", "Full inspection system", "Cost & payment tracking", "Amazon reconciliation", "Priority support"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <a href="/preview" className="block w-full py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition text-center">
                Start Free Trial
              </a>
            </div>

            {/* Enterprise Tier */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Enterprise</h3>
              <p className="text-slate-600 mb-6">For large catalogs</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">Custom</span>
              </div>
              <ul className="space-y-3 mb-8">
                {["100+ SKUs", "All Pro features", "Custom integrations", "Dedicated support", "SLA guarantees", "Team training"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
              <a href="mailto:hello@inventoryops.com" className="block w-full py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition text-center">
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Take Control of Your FBA Operations?
          </h2>
          <p className="text-xl text-indigo-200 mb-8">
            Join sellers who&apos;ve eliminated spreadsheet chaos and gained full visibility into their supply chain.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/preview" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition">
              <Play className="w-5 h-5" /> Try Interactive Demo
            </a>
            <a href="mailto:hello@inventoryops.com" className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-indigo-500 transition">
              Contact Us <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Boxes className="w-6 h-6 text-indigo-400" />
              <span className="text-lg font-semibold text-white">InventoryOps</span>
            </div>
            <p className="text-slate-400 text-sm">
              &copy; {new Date().getFullYear()} InventoryOps. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

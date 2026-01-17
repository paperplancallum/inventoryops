import { useState, useEffect } from 'react'
import type { ShippingAgentFormProps, ShippingAgentFormData, ShippingService } from '@/../product/sections/transfers/types'
import type { PaymentTermsTemplate } from '@/../product/sections/invoices-and-payments/types'

// Icons
const XIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

const serviceIcons: Record<ShippingService, string> = {
  ocean: '🚢',
  air: '✈️',
  trucking: '🚚',
  rail: '🚂',
  courier: '📦',
}

// Milestone Preview Component
function MilestonePreview({ template }: { template: PaymentTermsTemplate }) {
  const triggerLabels: Record<string, string> = {
    'po-confirmed': 'PO Confirmed',
    'inspection-passed': 'Inspection Passed',
    'customs-cleared': 'Customs Cleared',
    'shipment-departed': 'Shipment Departed',
    'goods-received': 'Goods Received',
    'manual': 'Manual',
    'upfront': 'Upfront',
  }

  return (
    <div className="mt-2 bg-slate-100 dark:bg-slate-600 rounded-lg p-3">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{template.description}</p>
      <div className="space-y-1.5">
        {template.milestones.map((milestone) => (
          <div key={milestone.id} className="flex items-center justify-between text-xs">
            <span className="text-slate-700 dark:text-slate-300">{milestone.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">{milestone.percentage}%</span>
              <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-500 rounded text-slate-600 dark:text-slate-200">
                {triggerLabels[milestone.trigger] || milestone.trigger}
                {milestone.offsetDays > 0 && ` +${milestone.offsetDays}d`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ShippingAgentForm({
  agent,
  shippingServices,
  paymentTermsTemplates = [],
  isOpen = true,
  onSubmit,
  onCancel,
}: ShippingAgentFormProps) {
  const [formData, setFormData] = useState<ShippingAgentFormData>({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    services: [],
    address: undefined,
    accountNumber: '',
    website: '',
    notes: '',
    paymentTerms: '',
    paymentTermsTemplateId: '',
  })

  // Get the selected template for preview
  const selectedTemplate = paymentTermsTemplates.find(t => t.id === formData.paymentTermsTemplateId)

  // Reset form when agent changes
  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name,
        contactName: agent.contactName,
        email: agent.email,
        phone: agent.phone,
        services: agent.services,
        address: agent.address,
        accountNumber: agent.accountNumber || '',
        website: agent.website || '',
        notes: agent.notes || '',
        paymentTerms: agent.paymentTerms || '',
        paymentTermsTemplateId: agent.paymentTermsTemplateId || '',
      })
    } else {
      setFormData({
        name: '',
        contactName: '',
        email: '',
        phone: '',
        services: [],
        address: undefined,
        accountNumber: '',
        website: '',
        notes: '',
        paymentTerms: '',
        paymentTermsTemplateId: '',
      })
    }
  }, [agent])

  const toggleService = (serviceId: ShippingService) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...prev.services, serviceId]
    }))
  }

  const updateAddress = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        city: prev.address?.city || '',
        country: prev.address?.country || '',
        [field]: value,
      }
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.(formData)
  }

  if (!isOpen) return null

  const isEditing = !!agent

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {isEditing ? 'Edit Shipping Agent' : 'New Shipping Agent'}
          </h2>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <XIcon />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Basic Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="e.g., FlexPort"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Contact Name *
                </label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                  required
                  placeholder="e.g., David Chen"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  placeholder="e.g., david@flexport.com"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                  placeholder="e.g., +1-415-555-0123"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="e.g., https://flexport.com"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Services */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Services Offered *</h3>
            <div className="flex flex-wrap gap-2">
              {shippingServices.map(service => {
                const isSelected = formData.services.includes(service.id)
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleService(service.id)}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-colors ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{serviceIcons[service.id]}</span>
                    <span className="text-sm font-medium">{service.label}</span>
                    {isSelected && (
                      <span className="text-indigo-500 dark:text-indigo-400">
                        <CheckIcon />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            {formData.services.length === 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select at least one service
              </p>
            )}
          </section>

          {/* Address */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Address (Optional)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.address?.street || ''}
                  onChange={(e) => updateAddress('street', e.target.value)}
                  placeholder="e.g., 760 Market St, Floor 9"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.address?.city || ''}
                  onChange={(e) => updateAddress('city', e.target.value)}
                  placeholder="e.g., San Francisco"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  State/Province
                </label>
                <input
                  type="text"
                  value={formData.address?.state || ''}
                  onChange={(e) => updateAddress('state', e.target.value)}
                  placeholder="e.g., CA"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.address?.country || ''}
                  onChange={(e) => updateAddress('country', e.target.value)}
                  placeholder="e.g., US"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.address?.postalCode || ''}
                  onChange={(e) => updateAddress('postalCode', e.target.value)}
                  placeholder="e.g., 94102"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Account & Notes */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Additional Information</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.accountNumber || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                  placeholder="e.g., FP-2024-001"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Payment Terms */}
              {paymentTermsTemplates.length > 0 ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Payment Terms
                  </label>
                  <div className="relative">
                    <select
                      value={formData.paymentTermsTemplateId || ''}
                      onChange={(e) => {
                        const templateId = e.target.value
                        const template = paymentTermsTemplates.find(t => t.id === templateId)
                        setFormData(prev => ({
                          ...prev,
                          paymentTermsTemplateId: templateId,
                          paymentTerms: template?.name || '',
                        }))
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none pr-10"
                    >
                      <option value="">Select payment terms...</option>
                      {paymentTermsTemplates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                      <ChevronDownIcon />
                    </div>
                  </div>
                  {selectedTemplate && <MilestonePreview template={selectedTemplate} />}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={formData.paymentTerms || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                    placeholder="e.g., Net 30 after departure"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="e.g., Primary freight forwarder for China imports. Excellent visibility and tracking."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.name || !formData.contactName || !formData.email || !formData.phone || formData.services.length === 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {isEditing ? 'Save Changes' : 'Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

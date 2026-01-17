import { useState } from 'react'
import type { SupplierFormProps, SupplierFormData } from '@/../product/sections/suppliers/types'
import type { PaymentTermsTemplate } from '@/../product/sections/invoices-and-payments/types'

// Icons
const XIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

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
    <div className="mt-2 bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{template.description}</p>
      <div className="space-y-1.5">
        {template.milestones.map((milestone) => (
          <div key={milestone.id} className="flex items-center justify-between text-xs">
            <span className="text-slate-700 dark:text-slate-300">{milestone.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">{milestone.percentage}%</span>
              <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-600 rounded text-slate-600 dark:text-slate-300">
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

export function SupplierForm({
  supplier,
  paymentTermsTemplates = [],
  factoryLocations = [],
  onSubmit,
  onCancel,
}: SupplierFormProps) {
  const isEditing = !!supplier

  const [formData, setFormData] = useState<SupplierFormData>({
    name: supplier?.name || '',
    contactName: supplier?.contactName || '',
    contactEmail: supplier?.contactEmail || '',
    contactPhone: supplier?.contactPhone || '',
    country: supplier?.country || '',
    leadTimeDays: supplier?.leadTimeDays || 30,
    paymentTerms: supplier?.paymentTerms || '',
    paymentTermsTemplateId: supplier?.paymentTermsTemplateId || '',
    factoryLocationId: supplier?.factoryLocationId || '',
    createFactoryLocation: !supplier, // Auto-create for new suppliers
    notes: supplier?.notes || '',
  })

  // Get the linked factory location for display
  const linkedFactory = factoryLocations.find(f => f.id === formData.factoryLocationId)

  // Get the selected template for preview
  const selectedTemplate = paymentTermsTemplates.find(t => t.id === formData.paymentTermsTemplateId)

  const [errors, setErrors] = useState<Partial<Record<keyof SupplierFormData, string>>>({})

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof SupplierFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required'
    }
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required'
    }
    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Invalid email format'
    }
    if (formData.leadTimeDays < 0) {
      newErrors.leadTimeDays = 'Lead time must be positive'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit?.(formData)
    }
  }

  const handleChange = (field: keyof SupplierFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-slate-800 shadow-xl overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {isEditing ? 'Edit Supplier' : 'Add Supplier'}
              </h2>
              <button
                type="button"
                onClick={onCancel}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <XIcon />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Company Info */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Company Info</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g., Shenzhen Drinkware Co."
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    placeholder="e.g., China"
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.country ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                    }`}
                  />
                  {errors.country && <p className="mt-1 text-xs text-red-500">{errors.country}</p>}
                </div>
              </div>
            </section>

            {/* Factory Location */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Factory Location</h3>
              {isEditing ? (
                // Existing supplier: show linked factory or dropdown
                <div>
                  {linkedFactory ? (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{linkedFactory.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{linkedFactory.city}, {linkedFactory.country}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleChange('factoryLocationId', '')}
                        className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                      >
                        Change
                      </button>
                    </div>
                  ) : factoryLocations.length > 0 ? (
                    <div className="relative">
                      <select
                        value={formData.factoryLocationId || ''}
                        onChange={(e) => handleChange('factoryLocationId', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none pr-10"
                      >
                        <option value="">Select factory location...</option>
                        {factoryLocations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name} ({location.city}, {location.country})
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                        <ChevronDownIcon />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No factory locations available</p>
                  )}
                </div>
              ) : (
                // New supplier: show auto-create info
                <div className="p-3 bg-lime-50 dark:bg-lime-950/30 rounded-lg border border-lime-200 dark:border-lime-800">
                  <p className="text-sm text-lime-800 dark:text-lime-200">
                    A factory location will be automatically created for this supplier based on the company name and country.
                  </p>
                </div>
              )}
            </section>

            {/* Contact */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Contact</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => handleChange('contactName', e.target.value)}
                    placeholder="e.g., Li Wei"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleChange('contactEmail', e.target.value)}
                    placeholder="e.g., contact@supplier.com"
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.contactEmail ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                    }`}
                  />
                  {errors.contactEmail && <p className="mt-1 text-xs text-red-500">{errors.contactEmail}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleChange('contactPhone', e.target.value)}
                    placeholder="e.g., +86 755 8888 1234"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </section>

            {/* Terms */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Terms</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Lead Time (days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.leadTimeDays}
                    onChange={(e) => handleChange('leadTimeDays', parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.leadTimeDays ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                    }`}
                  />
                  {errors.leadTimeDays && <p className="mt-1 text-xs text-red-500">{errors.leadTimeDays}</p>}
                </div>
                {paymentTermsTemplates.length > 0 ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Payment Terms Template
                    </label>
                    <div className="relative">
                      <select
                        value={formData.paymentTermsTemplateId || ''}
                        onChange={(e) => {
                          const templateId = e.target.value
                          const template = paymentTermsTemplates.find(t => t.id === templateId)
                          handleChange('paymentTermsTemplateId', templateId)
                          // Auto-fill the display string
                          if (template) {
                            handleChange('paymentTerms', template.name)
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none pr-10"
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
                      value={formData.paymentTerms}
                      onChange={(e) => handleChange('paymentTerms', e.target.value)}
                      placeholder="e.g., 30% deposit, 70% before shipping"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Notes */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Notes</h3>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                placeholder="Add any additional notes about this supplier..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </section>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4">
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {isEditing ? 'Save Changes' : 'Add Supplier'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

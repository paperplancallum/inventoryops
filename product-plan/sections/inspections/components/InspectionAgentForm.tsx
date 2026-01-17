import { useState, useEffect } from 'react'
import type { InspectionAgentFormProps, InspectionAgentFormData } from '@/../product/sections/inspections/types'
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

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
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

// Common specialties for inspection agents
const COMMON_SPECIALTIES = [
  'Electronics',
  'Textiles',
  'Packaging',
  'Food & Beverage',
  'Toys',
  'Furniture',
  'Machinery',
  'Automotive Parts',
  'Consumer Goods',
  'Pharmaceuticals',
]

export function InspectionAgentForm({
  agent,
  paymentTermsTemplates = [],
  isOpen = true,
  onSubmit,
  onCancel,
}: InspectionAgentFormProps) {
  const isEditing = !!agent

  const [formData, setFormData] = useState<InspectionAgentFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    location: '',
    hourlyRate: 0,
    specialties: [],
    notes: '',
    paymentTerms: '',
    paymentTermsTemplateId: '',
  })

  // Get the selected template for preview
  const selectedTemplate = paymentTermsTemplates.find(t => t.id === formData.paymentTermsTemplateId)

  const [errors, setErrors] = useState<Partial<Record<keyof InspectionAgentFormData, string>>>({})
  const [newSpecialty, setNewSpecialty] = useState('')

  // Update form data when agent changes (for edit mode)
  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name || '',
        email: agent.email || '',
        phone: agent.phone || '',
        company: agent.company || '',
        location: agent.location || '',
        hourlyRate: agent.hourlyRate || 0,
        specialties: agent.specialties || [],
        notes: agent.notes || '',
        paymentTerms: agent.paymentTerms || '',
        paymentTermsTemplateId: agent.paymentTermsTemplateId || '',
      })
    }
  }, [agent])

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof InspectionAgentFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Agent name is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    if (!formData.company.trim()) {
      newErrors.company = 'Company is required'
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required'
    }
    if (formData.hourlyRate < 0) {
      newErrors.hourlyRate = 'Hourly rate must be positive'
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

  const handleChange = (field: keyof InspectionAgentFormData, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const addSpecialty = (specialty: string) => {
    const trimmed = specialty.trim()
    if (trimmed && !formData.specialties.includes(trimmed)) {
      handleChange('specialties', [...formData.specialties, trimmed])
    }
    setNewSpecialty('')
  }

  const removeSpecialty = (specialty: string) => {
    handleChange('specialties', formData.specialties.filter(s => s !== specialty))
  }

  if (!isOpen) return null

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
                {isEditing ? 'Edit Inspection Agent' : 'Add Inspection Agent'}
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
            {/* Basic Info */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Agent Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g., John Smith"
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Company *
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    placeholder="e.g., Asia Quality Inspections"
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.company ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                    }`}
                  />
                  {errors.company && <p className="mt-1 text-xs text-red-500">{errors.company}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="e.g., Shenzhen, China"
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.location ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                    }`}
                  />
                  {errors.location && <p className="mt-1 text-xs text-red-500">{errors.location}</p>}
                </div>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Contact</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="e.g., john@aqinspections.com"
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                    }`}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="e.g., +86 755 8888 1234"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </section>

            {/* Rate & Specialties */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Rate & Expertise</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Hourly Rate (USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={(e) => handleChange('hourlyRate', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.hourlyRate ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                    }`}
                  />
                  {errors.hourlyRate && <p className="mt-1 text-xs text-red-500">{errors.hourlyRate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Specialties
                  </label>
                  {/* Selected specialties */}
                  {formData.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-full"
                        >
                          {specialty}
                          <button
                            type="button"
                            onClick={() => removeSpecialty(specialty)}
                            className="hover:text-indigo-900 dark:hover:text-indigo-100"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Common specialties to add */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {COMMON_SPECIALTIES.filter(s => !formData.specialties.includes(s)).slice(0, 5).map((specialty) => (
                      <button
                        key={specialty}
                        type="button"
                        onClick={() => addSpecialty(specialty)}
                        className="px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        + {specialty}
                      </button>
                    ))}
                  </div>
                  {/* Custom specialty input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addSpecialty(newSpecialty)
                        }
                      }}
                      placeholder="Add custom specialty..."
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => addSpecialty(newSpecialty)}
                      disabled={!newSpecialty.trim()}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PlusIcon />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Payment Terms */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Payment Terms</h3>
              <div className="space-y-4">
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
                      value={formData.paymentTerms || ''}
                      onChange={(e) => handleChange('paymentTerms', e.target.value)}
                      placeholder="e.g., Payment required before inspection"
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
                placeholder="Add any additional notes about this agent..."
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
                {isEditing ? 'Save Changes' : 'Add Agent'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { X, MapPin } from 'lucide-react'
import { SearchableSelect, type SelectOption } from '@/components/ui/SearchableSelect'
import type { LocationFormProps, LocationFormData, LocationType } from './types'
import { LOCATION_TYPES, TYPE_COLORS } from './types'

// Countries list with Vietnam, China, and United States at the top
const COUNTRY_OPTIONS: SelectOption[] = [
  // Priority countries
  { value: 'Vietnam', label: 'Vietnam' },
  { value: 'China', label: 'China' },
  { value: 'United States', label: 'United States' },
  // Divider represented by disabled option
  { value: '---', label: '───────────────' },
  // Rest of countries alphabetically
  { value: 'Afghanistan', label: 'Afghanistan' },
  { value: 'Albania', label: 'Albania' },
  { value: 'Algeria', label: 'Algeria' },
  { value: 'Argentina', label: 'Argentina' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Austria', label: 'Austria' },
  { value: 'Bangladesh', label: 'Bangladesh' },
  { value: 'Belgium', label: 'Belgium' },
  { value: 'Brazil', label: 'Brazil' },
  { value: 'Cambodia', label: 'Cambodia' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Chile', label: 'Chile' },
  { value: 'Colombia', label: 'Colombia' },
  { value: 'Czech Republic', label: 'Czech Republic' },
  { value: 'Denmark', label: 'Denmark' },
  { value: 'Egypt', label: 'Egypt' },
  { value: 'Finland', label: 'Finland' },
  { value: 'France', label: 'France' },
  { value: 'Germany', label: 'Germany' },
  { value: 'Greece', label: 'Greece' },
  { value: 'Hong Kong', label: 'Hong Kong' },
  { value: 'Hungary', label: 'Hungary' },
  { value: 'India', label: 'India' },
  { value: 'Indonesia', label: 'Indonesia' },
  { value: 'Ireland', label: 'Ireland' },
  { value: 'Israel', label: 'Israel' },
  { value: 'Italy', label: 'Italy' },
  { value: 'Japan', label: 'Japan' },
  { value: 'Malaysia', label: 'Malaysia' },
  { value: 'Mexico', label: 'Mexico' },
  { value: 'Netherlands', label: 'Netherlands' },
  { value: 'New Zealand', label: 'New Zealand' },
  { value: 'Nigeria', label: 'Nigeria' },
  { value: 'Norway', label: 'Norway' },
  { value: 'Pakistan', label: 'Pakistan' },
  { value: 'Peru', label: 'Peru' },
  { value: 'Philippines', label: 'Philippines' },
  { value: 'Poland', label: 'Poland' },
  { value: 'Portugal', label: 'Portugal' },
  { value: 'Romania', label: 'Romania' },
  { value: 'Russia', label: 'Russia' },
  { value: 'Saudi Arabia', label: 'Saudi Arabia' },
  { value: 'Singapore', label: 'Singapore' },
  { value: 'South Africa', label: 'South Africa' },
  { value: 'South Korea', label: 'South Korea' },
  { value: 'Spain', label: 'Spain' },
  { value: 'Sweden', label: 'Sweden' },
  { value: 'Switzerland', label: 'Switzerland' },
  { value: 'Taiwan', label: 'Taiwan' },
  { value: 'Thailand', label: 'Thailand' },
  { value: 'Turkey', label: 'Turkey' },
  { value: 'Ukraine', label: 'Ukraine' },
  { value: 'United Arab Emirates', label: 'United Arab Emirates' },
  { value: 'United Kingdom', label: 'United Kingdom' },
]

const defaultFormData: LocationFormData = {
  name: '',
  type: 'warehouse',
  addressLine1: '',
  addressLine2: '',
  city: '',
  stateProvince: '',
  country: '',
  countryCode: '',
  postalCode: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  notes: '',
}

interface FormErrors {
  name?: string
  city?: string
  country?: string
  contactEmail?: string
}

export function LocationForm({
  location,
  locationTypes = LOCATION_TYPES,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: LocationFormProps) {
  const isEditing = !!location
  const [formData, setFormData] = useState<LocationFormData>(defaultFormData)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        type: location.type,
        addressLine1: location.addressLine1 || '',
        addressLine2: location.addressLine2 || '',
        city: location.city || '',
        stateProvince: location.stateProvince || '',
        country: location.country,
        countryCode: location.countryCode || '',
        postalCode: location.postalCode || '',
        contactName: location.contactName || '',
        contactEmail: location.contactEmail || '',
        contactPhone: location.contactPhone || '',
        notes: location.notes || '',
      })
    } else {
      setFormData(defaultFormData)
    }
    setErrors({})
    setTouched({})
  }, [location])

  const validateField = (field: keyof FormErrors, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Location name is required'
        break
      case 'contactEmail':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Invalid email format'
        }
        break
    }
    return undefined
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    const nameError = validateField('name', formData.name)
    if (nameError) newErrors.name = nameError

    const emailError = validateField('contactEmail', formData.contactEmail)
    if (emailError) newErrors.contactEmail = emailError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all fields as touched
    setTouched({
      name: true,
      city: true,
      country: true,
      contactEmail: true,
    })

    if (validate()) {
      onSubmit?.(formData)
    }
  }

  const updateField = <K extends keyof LocationFormData>(field: K, value: LocationFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear error when field is updated
    if (field in errors) {
      const newError = validateField(field as keyof FormErrors, value as string)
      setErrors(prev => ({
        ...prev,
        [field]: newError,
      }))
    }
  }

  const handleBlur = (field: keyof FormErrors) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const error = validateField(field, formData[field] as string)
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white dark:bg-slate-800 shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-lg font-semibold text-slate-900 dark:text-white">
                {isEditing ? 'Edit Location' : 'Add Location'}
              </span>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {/* Basic Info */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Basic Information</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Location Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => updateField('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                placeholder="Location name"
                className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  touched.name && errors.name
                    ? 'border-red-500 dark:border-red-400'
                    : 'border-slate-200 dark:border-slate-600'
                }`}
              />
              {touched.name && errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Location Type *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {locationTypes.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => updateField('type', type.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                      formData.type === type.id
                        ? `${TYPE_COLORS[type.id]} border-current`
                        : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-transparent hover:border-slate-300 dark:hover:border-slate-500'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Address */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Address</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Street Address
              </label>
              <input
                type="text"
                value={formData.addressLine1}
                onChange={e => updateField('addressLine1', e.target.value)}
                placeholder="123 Warehouse Way"
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                value={formData.addressLine2}
                onChange={e => updateField('addressLine2', e.target.value)}
                placeholder="Suite 100"
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => updateField('city', e.target.value)}
                  placeholder="City"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  State / Province
                </label>
                <input
                  type="text"
                  value={formData.stateProvince}
                  onChange={e => updateField('stateProvince', e.target.value)}
                  placeholder="CA"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Country
                </label>
                <SearchableSelect
                  options={COUNTRY_OPTIONS.filter(o => o.value !== '---')}
                  value={formData.country}
                  onChange={value => updateField('country', value)}
                  placeholder="Select country"
                  searchPlaceholder="Search countries..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={e => updateField('postalCode', e.target.value)}
                  placeholder="90001"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Contact Info */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Contact Information</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Contact Name
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={e => updateField('contactName', e.target.value)}
                placeholder="John Smith"
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={e => updateField('contactEmail', e.target.value)}
                  onBlur={() => handleBlur('contactEmail')}
                  placeholder="Email"
                  className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    touched.contactEmail && errors.contactEmail
                      ? 'border-red-500 dark:border-red-400'
                      : 'border-slate-200 dark:border-slate-600'
                  }`}
                />
                {touched.contactEmail && errors.contactEmail && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contactEmail}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={e => updateField('contactPhone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Notes */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notes</h3>
            <textarea
              value={formData.notes}
              onChange={e => updateField('notes', e.target.value)}
              placeholder="Add any notes about this location..."
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </section>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isSubmitting
                ? 'Saving...'
                : isEditing
                ? 'Save Changes'
                : 'Add Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

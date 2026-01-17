'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import type { PurchaseOrder, LineItem, Supplier, PaymentTermsOption } from './types'

interface Product {
  id: string
  sku: string
  name: string
  unitCost: number
}

interface PaymentTermsSelectOption extends PaymentTermsOption {
  // Extends the base type if needed
}

const DEFAULT_LEAD_TIME_DAYS = 30

// Calculate expected date based on order date and lead time
function calculateExpectedDate(orderDate: string, leadTimeDays: number): string {
  const date = new Date(orderDate)
  date.setDate(date.getDate() + leadTimeDays)
  return date.toISOString().split('T')[0]
}

interface InitialLineItem {
  productId: string
  sku: string
  productName: string
  quantity: number
  unitCost: number
}

interface POFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (po: Omit<PurchaseOrder, 'id' | 'statusHistory'> & { id?: string }) => void
  purchaseOrder?: PurchaseOrder | null
  suppliers: Supplier[]
  products: Product[]
  paymentTermsOptions?: PaymentTermsSelectOption[]
  initialSupplierId?: string
  initialLineItems?: InitialLineItem[]
}

type Step = 'supplier' | 'items' | 'details'

export function POFormModal({
  isOpen,
  onClose,
  onSubmit,
  purchaseOrder,
  suppliers,
  products,
  paymentTermsOptions = [],
  initialSupplierId,
  initialLineItems,
}: POFormModalProps) {
  const [step, setStep] = useState<Step>('supplier')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form state
  const [supplierId, setSupplierId] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [orderDate, setOrderDate] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [paymentTermsTemplateId, setPaymentTermsTemplateId] = useState('')
  const [notes, setNotes] = useState('')
  const [usingDefaultLeadTime, setUsingDefaultLeadTime] = useState(false)

  // Reset form when modal opens/closes or when editing
  useEffect(() => {
    if (isOpen) {
      if (purchaseOrder) {
        setSupplierId(purchaseOrder.supplierId)
        setLineItems([...purchaseOrder.lineItems])
        setOrderDate(purchaseOrder.orderDate)
        setExpectedDate(purchaseOrder.expectedDate)
        setPaymentTermsTemplateId(purchaseOrder.paymentTermsTemplateId || '')
        setNotes(purchaseOrder.notes)
        setStep('supplier')
      } else {
        // Check for prefill data from Inventory Intelligence
        const prefillSupplier = initialSupplierId ? suppliers.find(s => s.id === initialSupplierId) : null
        const firstSupplier = prefillSupplier || suppliers[0]
        setSupplierId(firstSupplier?.id || '')

        // Use initial line items if provided (from Inventory Intelligence)
        if (initialLineItems && initialLineItems.length > 0) {
          setLineItems(initialLineItems.map((item, index) => ({
            id: `prefill-${index}`,
            productId: item.productId,
            sku: item.sku,
            productName: item.productName,
            quantity: item.quantity,
            unitCost: item.unitCost,
            subtotal: item.quantity * item.unitCost,
          })))
          // Skip to items step if we have prefilled data
          setStep('items')
        } else {
          setLineItems([])
          setStep('supplier')
        }

        setOrderDate(new Date().toISOString().split('T')[0])
        setExpectedDate('')
        // Pre-select payment terms based on supplier
        setPaymentTermsTemplateId(firstSupplier?.paymentTermsTemplateId || '')
        setNotes('')
        setUsingDefaultLeadTime(false)
      }
      setErrors({})
    }
  }, [isOpen, purchaseOrder, suppliers, initialSupplierId, initialLineItems])

  const selectedSupplier = suppliers.find((s) => s.id === supplierId)

  // Auto-select payment terms when supplier changes (only for new POs)
  useEffect(() => {
    if (!isOpen || purchaseOrder) return // Don't auto-select when editing
    if (!supplierId) return

    const supplier = suppliers.find((s) => s.id === supplierId)
    if (supplier?.paymentTermsTemplateId) {
      setPaymentTermsTemplateId(supplier.paymentTermsTemplateId)
    }
  }, [isOpen, purchaseOrder, supplierId, suppliers])

  // Auto-calculate expected date when supplier or order date changes (only for new POs)
  useEffect(() => {
    if (!isOpen || purchaseOrder) return // Don't auto-calculate when editing
    if (!orderDate || !supplierId) return

    const supplier = suppliers.find((s) => s.id === supplierId)
    const leadTime = supplier?.leadTimeDays || DEFAULT_LEAD_TIME_DAYS
    const calculatedDate = calculateExpectedDate(orderDate, leadTime)

    setExpectedDate(calculatedDate)
    setUsingDefaultLeadTime(!supplier?.leadTimeDays)
  }, [isOpen, purchaseOrder, supplierId, orderDate, suppliers])

  // Add line item
  const handleAddLineItem = () => {
    const newItem: LineItem = {
      id: `li-new-${Date.now()}`,
      sku: '',
      productName: '',
      quantity: 1,
      unitCost: 0,
      subtotal: 0,
    }
    setLineItems([...lineItems, newItem])
  }

  // Update line item
  const handleUpdateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems]
    const item = { ...updated[index] }

    if (field === 'sku') {
      const product = products.find((p) => p.sku === value)
      if (product) {
        item.sku = product.sku
        item.productName = product.name
        item.unitCost = product.unitCost
        item.subtotal = item.quantity * product.unitCost
      } else {
        item.sku = value as string
      }
    } else if (field === 'quantity') {
      item.quantity = Number(value) || 0
      item.subtotal = item.quantity * item.unitCost
    } else if (field === 'unitCost') {
      item.unitCost = Number(value) || 0
      item.subtotal = item.quantity * item.unitCost
    } else {
      ;(item as Record<string, unknown>)[field] = value
    }

    updated[index] = item
    setLineItems(updated)
  }

  // Remove line item
  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0)
  const total = subtotal

  // Validation
  const validateStep = (currentStep: Step): boolean => {
    const newErrors: Record<string, string> = {}

    if (currentStep === 'supplier') {
      if (!supplierId) {
        newErrors.supplier = 'Please select a supplier'
      }
    }

    if (currentStep === 'items') {
      if (lineItems.length === 0) {
        newErrors.items = 'Add at least one line item'
      } else {
        lineItems.forEach((item, index) => {
          if (!item.sku) {
            newErrors[`item-${index}-sku`] = 'SKU is required'
          }
          if (item.quantity <= 0) {
            newErrors[`item-${index}-quantity`] = 'Quantity must be greater than 0'
          }
        })
      }
    }

    if (currentStep === 'details') {
      if (!orderDate) {
        newErrors.orderDate = 'Order date is required'
      }
      if (!expectedDate) {
        newErrors.expectedDate = 'Expected date is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (!validateStep(step)) return

    if (step === 'supplier') setStep('items')
    else if (step === 'items') setStep('details')
  }

  const handleBack = () => {
    if (step === 'items') setStep('supplier')
    else if (step === 'details') setStep('items')
  }

  const handleSubmit = () => {
    if (!validateStep('details')) return

    // Get the payment terms name from the selected template
    const selectedTemplate = paymentTermsOptions.find(t => t.id === paymentTermsTemplateId)
    const paymentTermsDisplay = selectedTemplate?.name || ''

    const poData = {
      ...(purchaseOrder ? { id: purchaseOrder.id } : {}),
      poNumber: purchaseOrder?.poNumber || `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      supplierId,
      supplierName: selectedSupplier?.name || '',
      status: purchaseOrder?.status || ('draft' as const),
      orderDate,
      expectedDate,
      receivedDate: purchaseOrder?.receivedDate || null,
      paymentTerms: paymentTermsDisplay,
      paymentTermsTemplateId: paymentTermsTemplateId || undefined,
      notes,
      subtotal,
      total,
      lineItems,
    }

    onSubmit(poData)
    onClose()
  }

  const steps: { key: Step; label: string }[] = [
    { key: 'supplier', label: 'Supplier' },
    { key: 'items', label: 'Line Items' },
    { key: 'details', label: 'Details' },
  ]

  const currentStepIndex = steps.findIndex((s) => s.key === step)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={purchaseOrder ? 'Edit Purchase Order' : 'New Purchase Order'}
      size="xl"
    >
      {/* Step Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => (
            <div key={s.key} className="flex items-center flex-1">
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStepIndex
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    index <= currentStepIndex
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    index < currentStepIndex
                      ? 'bg-indigo-600'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {/* Step 1: Supplier Selection */}
        {step === 'supplier' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Select Supplier <span className="text-red-500">*</span>
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.supplier
                    ? 'border-red-500'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <option value="">Choose a supplier...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.supplier && (
                <p className="mt-1 text-xs text-red-500">{errors.supplier}</p>
              )}
            </div>

            {selectedSupplier && (
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Selected Supplier
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {selectedSupplier.name}
                </p>
                {selectedSupplier.leadTimeDays ? (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Lead time: {selectedSupplier.leadTimeDays} days
                  </p>
                ) : (
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                          Missing lead time
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                          This supplier doesn&apos;t have a lead time configured. A default of {DEFAULT_LEAD_TIME_DAYS} days will be used. Consider updating the supplier to set an accurate lead time.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Line Items */}
        {step === 'items' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Line Items
              </h3>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {errors.items && (
              <p className="text-xs text-red-500">{errors.items}</p>
            )}

            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div
                  key={item.id}
                  className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Item {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(index)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Product/SKU
                      </label>
                      <select
                        value={item.sku}
                        onChange={(e) => handleUpdateLineItem(index, 'sku', e.target.value)}
                        className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          errors[`item-${index}-sku`]
                            ? 'border-red-500'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <option value="">Select product...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.sku}>
                            {p.sku} - {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateLineItem(index, 'quantity', e.target.value)
                        }
                        className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          errors[`item-${index}-quantity`]
                            ? 'border-red-500'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Unit Cost
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          $
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitCost}
                          onChange={(e) =>
                            handleUpdateLineItem(index, 'unitCost', e.target.value)
                          }
                          className="w-full pl-7 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Subtotal
                      </label>
                      <div className="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-600 rounded-lg text-slate-900 dark:text-white font-medium">
                        ${item.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {lineItems.length === 0 && (
                <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                  No line items added. Click &quot;Add Item&quot; to add products.
                </div>
              )}
            </div>

            {lineItems.length > 0 && (
              <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="text-right">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total</p>
                  <p className="text-xl font-semibold text-slate-900 dark:text-white">
                    ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Details */}
        {step === 'details' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Order Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.orderDate
                      ? 'border-red-500'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {errors.orderDate && (
                  <p className="mt-1 text-xs text-red-500">{errors.orderDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Expected Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => {
                    setExpectedDate(e.target.value)
                    setUsingDefaultLeadTime(false) // User manually changed it
                  }}
                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.expectedDate
                      ? 'border-red-500'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {errors.expectedDate ? (
                  <p className="mt-1 text-xs text-red-500">{errors.expectedDate}</p>
                ) : selectedSupplier && !purchaseOrder && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {usingDefaultLeadTime ? (
                      <span className="text-amber-600 dark:text-amber-400">
                        Based on default {DEFAULT_LEAD_TIME_DAYS}-day lead time
                      </span>
                    ) : selectedSupplier.leadTimeDays ? (
                      <span>
                        Based on {selectedSupplier.leadTimeDays}-day supplier lead time
                      </span>
                    ) : null}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Payment Terms
              </label>
              <select
                value={paymentTermsTemplateId}
                onChange={(e) => setPaymentTermsTemplateId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select payment terms...</option>
                {paymentTermsOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
              {paymentTermsTemplateId && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {paymentTermsOptions.find(t => t.id === paymentTermsTemplateId)?.description}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any additional notes for this order..."
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Summary */}
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                Order Summary
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Supplier</span>
                  <span className="text-slate-900 dark:text-white font-medium">
                    {selectedSupplier?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Items</span>
                  <span className="text-slate-900 dark:text-white font-medium">
                    {lineItems.length}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-600">
                  <span className="text-slate-600 dark:text-slate-400">Total</span>
                  <span className="text-slate-900 dark:text-white font-semibold">
                    ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-slate-200 dark:border-slate-700 mt-6">
        <div>
          {step !== 'supplier' && (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          {step === 'details' ? (
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {purchaseOrder ? 'Save Changes' : 'Create PO'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}

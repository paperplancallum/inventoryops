'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import type { Batch, BatchStage, PipelineStage } from './types'

interface Supplier {
  id: string
  name: string
}

interface Product {
  id: string
  sku: string
  name: string
  unitCost: number
}

interface BatchFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (batch: Omit<Batch, 'id' | 'batchNumber' | 'stageHistory' | 'attachments'> & { id?: string }) => void
  batch?: Batch | null
  pipelineStages: PipelineStage[]
  suppliers: Supplier[]
  products: Product[]
}

type Step = 'product' | 'details' | 'logistics'

export function BatchFormModal({
  isOpen,
  onClose,
  onSubmit,
  batch,
  pipelineStages,
  suppliers,
  products,
}: BatchFormModalProps) {
  const [step, setStep] = useState<Step>('product')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form state
  const [sku, setSku] = useState('')
  const [productName, setProductName] = useState('')
  const [quantity, setQuantity] = useState(0)
  const [unitCost, setUnitCost] = useState(0)
  const [supplierId, setSupplierId] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [poNumber, setPoNumber] = useState('')
  const [shipmentId, setShipmentId] = useState('')
  const [stage, setStage] = useState<BatchStage>('ordered')
  const [orderedDate, setOrderedDate] = useState('')
  const [expectedArrival, setExpectedArrival] = useState('')
  const [actualArrival, setActualArrival] = useState('')
  const [notes, setNotes] = useState('')

  // Reset form when modal opens/closes or when editing
  useEffect(() => {
    if (isOpen) {
      if (batch) {
        setSku(batch.sku)
        setProductName(batch.productName)
        setQuantity(batch.quantity)
        setUnitCost(batch.unitCost)
        setSupplierName(batch.supplierName)
        setSupplierId(suppliers.find(s => s.name === batch.supplierName)?.id || '')
        setPoNumber(batch.poNumber)
        setShipmentId(batch.shipmentId || '')
        setStage(batch.stage)
        setOrderedDate(batch.orderedDate)
        setExpectedArrival(batch.expectedArrival)
        setActualArrival(batch.actualArrival || '')
        setNotes(batch.notes)
        setStep('product')
      } else {
        setSku('')
        setProductName('')
        setQuantity(0)
        setUnitCost(0)
        setSupplierId(suppliers[0]?.id || '')
        setSupplierName(suppliers[0]?.name || '')
        setPoNumber('')
        setShipmentId('')
        setStage('ordered')
        setOrderedDate(new Date().toISOString().split('T')[0])
        setExpectedArrival('')
        setActualArrival('')
        setNotes('')
        setStep('product')
      }
      setErrors({})
    }
  }, [isOpen, batch, suppliers])

  // Handle product selection
  const handleProductChange = (selectedSku: string) => {
    const product = products.find(p => p.sku === selectedSku)
    if (product) {
      setSku(product.sku)
      setProductName(product.name)
      setUnitCost(product.unitCost)
    } else {
      setSku(selectedSku)
    }
  }

  // Handle supplier selection
  const handleSupplierChange = (selectedId: string) => {
    const supplier = suppliers.find(s => s.id === selectedId)
    if (supplier) {
      setSupplierId(supplier.id)
      setSupplierName(supplier.name)
    }
  }

  const totalCost = quantity * unitCost

  // Validation
  const validateStep = (currentStep: Step): boolean => {
    const newErrors: Record<string, string> = {}

    if (currentStep === 'product') {
      if (!sku) newErrors.sku = 'SKU is required'
      if (!productName) newErrors.productName = 'Product name is required'
      if (quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0'
      if (unitCost <= 0) newErrors.unitCost = 'Unit cost must be greater than 0'
    }

    if (currentStep === 'details') {
      if (!supplierName) newErrors.supplier = 'Supplier is required'
      if (!poNumber) newErrors.poNumber = 'PO number is required'
    }

    if (currentStep === 'logistics') {
      if (!orderedDate) newErrors.orderedDate = 'Order date is required'
      if (!expectedArrival) newErrors.expectedArrival = 'Expected arrival is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (!validateStep(step)) return

    if (step === 'product') setStep('details')
    else if (step === 'details') setStep('logistics')
  }

  const handleBack = () => {
    if (step === 'details') setStep('product')
    else if (step === 'logistics') setStep('details')
  }

  const handleSubmit = () => {
    if (!validateStep('logistics')) return

    const batchData = {
      ...(batch ? { id: batch.id } : {}),
      sku,
      productName,
      quantity,
      unitCost,
      totalCost,
      supplierName,
      poNumber,
      shipmentId: shipmentId || null,
      stage,
      orderedDate,
      expectedArrival,
      actualArrival: actualArrival || null,
      notes,
    }

    onSubmit(batchData)
    onClose()
  }

  const steps: { key: Step; label: string }[] = [
    { key: 'product', label: 'Product' },
    { key: 'details', label: 'Details' },
    { key: 'logistics', label: 'Logistics' },
  ]

  const currentStepIndex = steps.findIndex(s => s.key === step)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={batch ? 'Edit Batch' : 'New Batch'}
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
        {/* Step 1: Product */}
        {step === 'product' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Product/SKU <span className="text-red-500">*</span>
              </label>
              <select
                value={sku}
                onChange={(e) => handleProductChange(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.sku ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <option value="">Select product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.sku}>
                    {p.sku} - {p.name}
                  </option>
                ))}
              </select>
              {errors.sku && <p className="mt-1 text-xs text-red-500">{errors.sku}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.productName ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.productName && <p className="mt-1 text-xs text-red-500">{errors.productName}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.quantity ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {errors.quantity && <p className="mt-1 text-xs text-red-500">{errors.quantity}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Unit Cost <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitCost}
                    onChange={(e) => setUnitCost(Number(e.target.value))}
                    className={`w-full pl-7 pr-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.unitCost ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                </div>
                {errors.unitCost && <p className="mt-1 text-xs text-red-500">{errors.unitCost}</p>}
              </div>
            </div>

            {/* Total Cost Display */}
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Total Cost</span>
                <span className="text-lg font-semibold text-slate-900 dark:text-white">
                  ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 'details' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Supplier <span className="text-red-500">*</span>
              </label>
              <select
                value={supplierId}
                onChange={(e) => handleSupplierChange(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.supplier ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <option value="">Select supplier...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.supplier && <p className="mt-1 text-xs text-red-500">{errors.supplier}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                PO Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="e.g., PO-2024-001"
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.poNumber ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.poNumber && <p className="mt-1 text-xs text-red-500">{errors.poNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Shipment ID
              </label>
              <input
                type="text"
                value={shipmentId}
                onChange={(e) => setShipmentId(e.target.value)}
                placeholder="e.g., SHIP-2024-001 (optional)"
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Initial Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as BatchStage)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {pipelineStages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 3: Logistics */}
        {step === 'logistics' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Order Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={orderedDate}
                  onChange={(e) => setOrderedDate(e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.orderedDate ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {errors.orderedDate && <p className="mt-1 text-xs text-red-500">{errors.orderedDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Expected Arrival <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={expectedArrival}
                  onChange={(e) => setExpectedArrival(e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.expectedArrival ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {errors.expectedArrival && <p className="mt-1 text-xs text-red-500">{errors.expectedArrival}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Actual Arrival
              </label>
              <input
                type="date"
                value={actualArrival}
                onChange={(e) => setActualArrival(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any additional notes for this batch..."
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Summary */}
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                Batch Summary
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Product</span>
                  <span className="text-slate-900 dark:text-white font-medium font-mono">{sku}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Quantity</span>
                  <span className="text-slate-900 dark:text-white font-medium">{quantity.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Supplier</span>
                  <span className="text-slate-900 dark:text-white font-medium">{supplierName}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-600">
                  <span className="text-slate-600 dark:text-slate-400">Total Cost</span>
                  <span className="text-slate-900 dark:text-white font-semibold">
                    ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
          {step !== 'product' && (
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
          {step === 'logistics' ? (
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {batch ? 'Save Changes' : 'Create Batch'}
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

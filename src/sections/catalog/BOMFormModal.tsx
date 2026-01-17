'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Plus, Trash2, GripVertical, Search, Package, Layers, Receipt } from 'lucide-react'
import type { BOM, BOMFormData, BOMExpenseItem } from '@/lib/supabase/hooks/useBOMs'

interface ProductOption {
  id: string
  sku: string
  name: string
  unit_cost: number
}

interface BOMFormModalProps {
  bom?: BOM
  onSubmit: (data: BOMFormData) => Promise<void>
  onCancel: () => void
  fetchFinishedGoods: () => Promise<ProductOption[]>
  fetchComponents: () => Promise<ProductOption[]>
}

interface LineItemInput {
  id: string // Temp ID for UI
  componentProductId: string
  componentSku: string
  componentName: string
  quantityRequired: number
  uom: string
  positionNotes: string
  unitCost: number
}

interface ExpenseItemInput {
  id: string // Temp ID for UI
  name: string
  description: string
  amount: number
  isPerUnit: boolean
}

export function BOMFormModal({
  bom,
  onSubmit,
  onCancel,
  fetchFinishedGoods,
  fetchComponents,
}: BOMFormModalProps) {
  const [finishedGoods, setFinishedGoods] = useState<ProductOption[]>([])
  const [components, setComponents] = useState<ProductOption[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [finishedProductId, setFinishedProductId] = useState(bom?.finishedProductId || '')
  const [name, setName] = useState(bom?.name || '')
  const [version, setVersion] = useState(bom?.version || 'v1.0')
  const [outputQuantity, setOutputQuantity] = useState(bom?.outputQuantity || 1)
  const [expectedScrapPercent, setExpectedScrapPercent] = useState(bom?.expectedScrapPercent || 0)
  const [notes, setNotes] = useState(bom?.notes || '')
  const [lineItems, setLineItems] = useState<LineItemInput[]>([])

  // Expense items state
  const [expenseItems, setExpenseItems] = useState<ExpenseItemInput[]>([])
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [newExpenseName, setNewExpenseName] = useState('')
  const [newExpenseAmount, setNewExpenseAmount] = useState(0)

  // Component search
  const [componentSearch, setComponentSearch] = useState('')
  const [showComponentSearch, setShowComponentSearch] = useState(false)

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true)
      try {
        const [fgList, compList] = await Promise.all([
          fetchFinishedGoods(),
          fetchComponents(),
        ])
        setFinishedGoods(fgList)
        setComponents(compList)

        // Initialize line items from existing BOM
        if (bom?.lineItems) {
          setLineItems(bom.lineItems.map(item => ({
            id: item.id,
            componentProductId: item.componentProductId,
            componentSku: item.componentSku,
            componentName: item.componentName,
            quantityRequired: item.quantityRequired,
            uom: item.uom,
            positionNotes: item.positionNotes || '',
            unitCost: item.componentUnitCost,
          })))
        }

        // Initialize expense items from existing BOM
        if (bom?.expenseItems) {
          setExpenseItems(bom.expenseItems.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description || '',
            amount: item.amount,
            isPerUnit: item.isPerUnit,
          })))
        }
      } finally {
        setLoadingProducts(false)
      }
    }
    loadProducts()
  }, [bom, fetchFinishedGoods, fetchComponents])

  // Auto-generate name from product
  useEffect(() => {
    if (!name && finishedProductId) {
      const product = finishedGoods.find(p => p.id === finishedProductId)
      if (product) {
        setName(`${product.name} Assembly`)
      }
    }
  }, [finishedProductId, finishedGoods, name])

  const addComponent = useCallback((component: ProductOption) => {
    // Check if already added
    if (lineItems.some(li => li.componentProductId === component.id)) {
      return
    }

    setLineItems(prev => [...prev, {
      id: `temp-${Date.now()}`,
      componentProductId: component.id,
      componentSku: component.sku,
      componentName: component.name,
      quantityRequired: 1,
      uom: 'each',
      positionNotes: '',
      unitCost: component.unit_cost,
    }])
    setComponentSearch('')
    setShowComponentSearch(false)
  }, [lineItems])

  const removeComponent = useCallback((id: string) => {
    setLineItems(prev => prev.filter(li => li.id !== id))
  }, [])

  const updateComponentQuantity = useCallback((id: string, quantity: number) => {
    setLineItems(prev => prev.map(li =>
      li.id === id ? { ...li, quantityRequired: Math.max(1, Math.round(quantity)) } : li
    ))
  }, [])

  const updateComponentUom = useCallback((id: string, uom: string) => {
    setLineItems(prev => prev.map(li =>
      li.id === id ? { ...li, uom } : li
    ))
  }, [])

  // Expense item handlers
  const addExpenseItem = useCallback(() => {
    if (!newExpenseName.trim() || newExpenseAmount <= 0) return

    setExpenseItems(prev => [...prev, {
      id: `temp-exp-${Date.now()}`,
      name: newExpenseName.trim(),
      description: '',
      amount: newExpenseAmount,
      isPerUnit: true, // Always per-unit
    }])

    setNewExpenseName('')
    setNewExpenseAmount(0)
    setShowAddExpense(false)
  }, [newExpenseName, newExpenseAmount])

  const removeExpenseItem = useCallback((id: string) => {
    setExpenseItems(prev => prev.filter(ei => ei.id !== id))
  }, [])

  const updateExpenseAmount = useCallback((id: string, amount: number) => {
    setExpenseItems(prev => prev.map(ei =>
      ei.id === id ? { ...ei, amount: Math.max(0, amount) } : ei
    ))
  }, [])

  const filteredComponents = components.filter(c => {
    if (!componentSearch.trim()) return true
    const q = componentSearch.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.sku.toLowerCase().includes(q)
  })

  const totalComponentCost = lineItems.reduce((sum, item) => sum + (item.quantityRequired * item.unitCost), 0)
  // All expenses are per-unit
  const totalExpenseCost = expenseItems.reduce((sum, exp) => sum + exp.amount, 0)
  const estimatedUnitCost = outputQuantity > 0 ? (totalComponentCost / outputQuantity) + totalExpenseCost : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!finishedProductId) {
      alert('Please select a finished product')
      return
    }

    if (lineItems.length === 0) {
      alert('Please add at least one component')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        finishedProductId,
        name,
        version,
        outputQuantity,
        expectedScrapPercent,
        notes,
        lineItems: lineItems.map(li => ({
          componentProductId: li.componentProductId,
          quantityRequired: li.quantityRequired,
          uom: li.uom,
          positionNotes: li.positionNotes || undefined,
        })),
        expenseItems: expenseItems.map(ei => ({
          name: ei.name,
          description: ei.description || undefined,
          amount: ei.amount,
          isPerUnit: ei.isPerUnit,
        })),
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      {/* Modal */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-slate-800 shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {bom ? 'Edit BOM' : 'New Bill of Materials'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Define the components needed to assemble a finished product
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Basic Information
              </h3>

              {/* Finished Product */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Finished Product *
                </label>
                <select
                  value={finishedProductId}
                  onChange={(e) => setFinishedProductId(e.target.value)}
                  disabled={loadingProducts || !!bom}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  required
                >
                  <option value="">Select a finished product...</option>
                  {finishedGoods.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.sku} - {product.name}
                    </option>
                  ))}
                </select>
                {finishedGoods.length === 0 && !loadingProducts && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    No finished goods found. Create a product with type "Finished Good" first.
                  </p>
                )}
              </div>

              {/* BOM Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  BOM Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Widget Assembly"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Version */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Version
                  </label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="v1.0"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Output Quantity */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Output Qty
                  </label>
                  <input
                    type="number"
                    value={outputQuantity}
                    onChange={(e) => setOutputQuantity(parseInt(e.target.value) || 1)}
                    min={1}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Expected Scrap */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Scrap %
                  </label>
                  <input
                    type="number"
                    value={expectedScrapPercent}
                    onChange={(e) => setExpectedScrapPercent(parseFloat(e.target.value) || 0)}
                    min={0}
                    max={100}
                    step={0.5}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Optional assembly notes..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            {/* Components */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Components ({lineItems.length})
                </h3>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowComponentSearch(!showComponentSearch)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Component
                  </button>

                  {/* Component Search Dropdown */}
                  {showComponentSearch && (
                    <div className="absolute right-0 top-full mt-1 w-80 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-10">
                      <div className="p-2 border-b border-slate-200 dark:border-slate-600">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search components..."
                            value={componentSearch}
                            onChange={(e) => setComponentSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-sm rounded border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {loadingProducts ? (
                          <div className="p-4 text-center text-sm text-slate-500">Loading...</div>
                        ) : filteredComponents.length === 0 ? (
                          <div className="p-4 text-center text-sm text-slate-500">
                            No components found
                          </div>
                        ) : (
                          filteredComponents.map(comp => (
                            <button
                              key={comp.id}
                              type="button"
                              onClick={() => addComponent(comp)}
                              disabled={lineItems.some(li => li.componentProductId === comp.id)}
                              className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              <Package className="w-4 h-4 text-slate-400" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                  {comp.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {comp.sku} - {formatCurrency(comp.unit_cost)}
                                </p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Component List */}
              {lineItems.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-lg p-8 text-center">
                  <Package className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No components added yet
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Click "Add Component" to add parts to this BOM
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lineItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg"
                    >
                      <span className="w-6 h-6 flex items-center justify-center text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-600 rounded">
                        {index + 1}
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white text-sm truncate">
                          {item.componentName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {item.componentSku} @ {formatCurrency(item.unitCost)}
                        </p>
                      </div>

                      <input
                        type="number"
                        value={item.quantityRequired}
                        onChange={(e) => updateComponentQuantity(item.id, parseInt(e.target.value) || 1)}
                        min={1}
                        step={1}
                        className="w-20 px-2 py-1 text-sm text-right rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />

                      <select
                        value={item.uom}
                        onChange={(e) => updateComponentUom(item.id, e.target.value)}
                        className="w-20 px-2 py-1 text-sm rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="each">each</option>
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="lb">lb</option>
                        <option value="oz">oz</option>
                        <option value="m">m</option>
                        <option value="cm">cm</option>
                        <option value="ft">ft</option>
                        <option value="in">in</option>
                        <option value="L">L</option>
                        <option value="mL">mL</option>
                      </select>

                      <span className="w-20 text-right text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(item.quantityRequired * item.unitCost)}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeComponent(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Cost Summary */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-600">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">
                        Total component cost
                      </span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {formatCurrency(totalComponentCost)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Expense Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Expenses ({expenseItems.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddExpense(!showAddExpense)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Expense
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Add non-component costs like processing fees, kitting fees, or labor costs.
              </p>

              {/* Add Expense Form */}
              {showAddExpense && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Expense Name *
                      </label>
                      <input
                        type="text"
                        value={newExpenseName}
                        onChange={(e) => setNewExpenseName(e.target.value)}
                        placeholder="e.g., Kitting Fee, Processing Fee"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Amount per Unit ($) *
                      </label>
                      <input
                        type="number"
                        value={newExpenseAmount}
                        onChange={(e) => setNewExpenseAmount(parseFloat(e.target.value) || 0)}
                        min={0}
                        step={0.01}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddExpense(false)
                          setNewExpenseName('')
                          setNewExpenseAmount(0)
                        }}
                        className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={addExpenseItem}
                        disabled={!newExpenseName.trim() || newExpenseAmount <= 0}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Expense Items List */}
              {expenseItems.length > 0 && (
                <div className="space-y-2">
                  {expenseItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/30"
                    >
                      <Receipt className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />

                      <p className="flex-1 min-w-0 font-medium text-slate-900 dark:text-white text-sm truncate">
                        {item.name}
                      </p>

                      <div className="flex items-center gap-1">
                        <span className="text-sm text-slate-500">$</span>
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) => updateExpenseAmount(item.id, parseFloat(e.target.value) || 0)}
                          min={0}
                          step={0.01}
                          className="w-20 px-2 py-1 text-sm text-right rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-slate-500">/ unit</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeExpenseItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total Cost Summary */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-600 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  Component cost (÷ {outputQuantity} units)
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formatCurrency(totalComponentCost / (outputQuantity || 1))} / unit
                </span>
              </div>
              {expenseItems.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">
                    Expense cost
                  </span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {formatCurrency(totalExpenseCost)} / unit
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-base pt-2 border-t border-slate-100 dark:border-slate-700">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Estimated unit cost
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(estimatedUnitCost)} / unit
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !finishedProductId || lineItems.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : bom ? 'Update BOM' : 'Create BOM'}
          </button>
        </div>
      </div>
    </div>
  )
}

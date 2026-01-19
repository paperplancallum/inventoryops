'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Package, LayoutGrid, List, Plus, RefreshCw, Link2, ShoppingCart, CheckSquare } from 'lucide-react'
import { useBatches } from '@/lib/supabase/hooks/useBatches'
import { useStockLedger } from '@/lib/supabase/hooks/useStockLedger'
import { useAmazonConnection } from '@/lib/supabase/hooks/useAmazonConnection'
import { useAmazonInventory } from '@/lib/supabase/hooks/useAmazonInventory'
import { useProducts } from '@/lib/supabase/hooks/useProducts'
import { useTransfers } from '@/lib/supabase/hooks/useTransfers'
import { useLocations } from '@/lib/supabase/hooks/useLocations'
import { useShippingAgents } from '@/lib/supabase/hooks/useShippingAgents'
import {
  PipelineKanban,
  BatchDetailPanel,
  BatchSelectionBar,
  SplitBatchModal,
  MergeBatchModal,
  AmazonConnectCard,
  AmazonInventoryTable,
  AmazonSkuMappingModal,
} from '@/sections/inventory/components'
import { TransferForm } from '@/sections/transfers/components'
import { SHIPPING_METHOD_OPTIONS } from '@/sections/transfers/types'
import type { Batch } from '@/sections/inventory/types'
import type { AmazonInventoryItem } from '@/lib/supabase/hooks/useAmazonInventory'
import type { TransferFormData } from '@/sections/transfers/components/TransferForm'

type ViewMode = 'kanban' | 'table'
type TabType = 'pipeline' | 'amazon-connect' | 'amazon'

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<TabType>('pipeline')
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [splitBatch, setSplitBatch] = useState<Batch | null>(null)
  const [mergeBatch, setMergeBatch] = useState<Batch | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [mappingItem, setMappingItem] = useState<AmazonInventoryItem | null>(null)
  const [transferBatch, setTransferBatch] = useState<Batch | null>(null)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set())

  // Pipeline hooks
  const {
    batches,
    batchesByStage,
    summary,
    loading,
    error,
    refetch,
    splitBatch: doSplitBatch,
    mergeBatches: doMergeBatches,
    addAttachment,
    removeAttachment,
  } = useBatches()

  const {
    ledgerEntries,
    fetchEntriesForBatch,
  } = useStockLedger()

  // Products for SKU mapping
  const { products } = useProducts()

  // Amazon hooks
  const {
    connection,
    isConnected,
    needsReauth,
    loading: connectionLoading,
    isConnecting,
    getAuthUrl,
    exchangeCode,
    disconnect,
  } = useAmazonConnection()

  const {
    inventory: amazonInventory,
    summary: amazonSummary,
    loading: amazonLoading,
    syncing,
    lastSyncAt,
    syncFromAmazon,
    mapSku,
    unmapSku,
  } = useAmazonInventory()

  // Transfers hooks
  const {
    availableStock,
    createTransfer,
    fetchAvailableStock,
  } = useTransfers()

  const { locations } = useLocations()
  const { shippingAgents } = useShippingAgents()

  // Fetch available stock on mount to show draft allocations
  useEffect(() => {
    fetchAvailableStock()
  }, [fetchAvailableStock])

  // Pipeline handlers
  const handleViewBatch = useCallback((id: string) => {
    const batch = batches.find(b => b.id === id)
    if (batch) {
      setSelectedBatch(batch)
      setIsDetailOpen(true)
      fetchEntriesForBatch(id)
    }
  }, [batches, fetchEntriesForBatch])

  const handleEditBatch = useCallback((id: string) => {
    console.log('Edit batch:', id)
  }, [])

  const handleDeleteBatch = useCallback((id: string) => {
    console.log('Delete batch:', id)
  }, [])

  const handleSplitBatch = useCallback((id: string) => {
    const batch = batches.find(b => b.id === id)
    if (batch) {
      setSplitBatch(batch)
      setIsDetailOpen(false)
    }
  }, [batches])

  const handleMergeBatch = useCallback((id: string) => {
    const batch = batches.find(b => b.id === id)
    if (batch) {
      setMergeBatch(batch)
      setIsDetailOpen(false)
    }
  }, [batches])

  const handleAddAttachment = useCallback(async (batchId: string, file: File) => {
    await addAttachment(batchId, file)
    if (selectedBatch?.id === batchId) {
      const updated = batches.find(b => b.id === batchId)
      if (updated) setSelectedBatch(updated)
    }
  }, [addAttachment, selectedBatch, batches])

  const handleRemoveAttachment = useCallback(async (batchId: string, attachmentId: string) => {
    await removeAttachment(batchId, attachmentId)
    if (selectedBatch?.id === batchId) {
      const updated = batches.find(b => b.id === batchId)
      if (updated) setSelectedBatch(updated)
    }
  }, [removeAttachment, selectedBatch, batches])

  const handleSplit = useCallback(async (batchId: string, splitQuantity: number, note?: string) => {
    const result = await doSplitBatch(batchId, splitQuantity, note)
    if (result) {
      setSplitBatch(null)
    }
    return result
  }, [doSplitBatch])

  const handleMerge = useCallback(async (batchIds: string[], note?: string) => {
    const result = await doMergeBatches(batchIds, note)
    if (result) {
      setMergeBatch(null)
    }
    return result
  }, [doMergeBatches])

  const handleCreateTransfer = useCallback(async (batchId: string) => {
    const batch = batches.find(b => b.id === batchId)
    if (batch) {
      // Fetch available stock
      await fetchAvailableStock()
      // Set this batch as selected so the transfer form can find matching stock
      setSelectedBatchIds(new Set([batchId]))
      setTransferBatch(batch)
    }
  }, [batches, fetchAvailableStock])

  const handleSubmitTransfer = useCallback(async (data: TransferFormData) => {
    const transfer = await createTransfer(data)
    setTransferBatch(null)
    // Clear selection if any
    setSelectedBatchIds(new Set())
    // Refresh batches to reflect any changes
    refetch()
    // Refresh available stock
    fetchAvailableStock()

    // Show success toast with link to transfer
    if (transfer) {
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-medium">Transfer {transfer.transferNumber} created</span>
          <a
            href={`/transfers?id=${transfer.id}`}
            className="text-sm text-lime-600 hover:text-lime-700 underline"
          >
            View transfer →
          </a>
        </div>,
        { duration: 6000 }
      )
    }
  }, [createTransfer, refetch, fetchAvailableStock])

  const handleCloseTransferForm = useCallback(() => {
    setTransferBatch(null)
  }, [])

  // Selection handlers
  const handleToggleSelect = useCallback((batchId: string) => {
    setSelectedBatchIds(prev => {
      const next = new Set(prev)
      if (next.has(batchId)) {
        next.delete(batchId)
      } else {
        next.add(batchId)
      }
      return next
    })
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedBatchIds(new Set())
    setIsSelectionMode(false)
  }, [])

  const handleToggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => !prev)
    if (isSelectionMode) {
      // Clear selection when exiting selection mode
      setSelectedBatchIds(new Set())
    }
  }, [isSelectionMode])

  // Get selected batches for the selection bar
  const selectedBatches = useMemo(() => {
    return batches.filter(b => selectedBatchIds.has(b.id))
  }, [batches, selectedBatchIds])

  // Build allocation map for batch quantities in draft transfers
  const batchAllocationMap = useMemo(() => {
    const map = new Map<string, number>()
    availableStock.forEach(stock => {
      if (stock.allocatedQuantity && stock.allocatedQuantity > 0) {
        const existing = map.get(stock.batchId) || 0
        map.set(stock.batchId, existing + stock.allocatedQuantity)
      }
    })
    return map
  }, [availableStock])

  // Handle initiating transfer for selected batches
  const handleInitiateMultiTransfer = useCallback(async () => {
    if (selectedBatches.length === 0) return

    // Fetch available stock
    await fetchAvailableStock()

    // Set the first batch as the "transfer batch" to open the form
    // The form will be pre-populated with all selected batches' stock
    setTransferBatch(selectedBatches[0])

    // Exit selection mode
    setIsSelectionMode(false)
  }, [selectedBatches, fetchAvailableStock])

  // Amazon handlers
  const handleConnect = useCallback(async () => {
    const authUrl = await getAuthUrl()
    if (authUrl) {
      window.location.href = authUrl
    }
  }, [getAuthUrl])

  const handleMapSku = useCallback((item: AmazonInventoryItem) => {
    setMappingItem(item)
  }, [])

  const handleUnmapSku = useCallback(async (sellerSku: string) => {
    await unmapSku(sellerSku)
  }, [unmapSku])

  const handleConfirmMapping = useCallback(async (
    amazonSku: string,
    internalSkuId: string,
    internalProductId: string
  ): Promise<boolean> => {
    const success = await mapSku(amazonSku, internalSkuId, internalProductId)
    if (success) {
      setMappingItem(null)
    }
    return success
  }, [mapSku])

  // Transform products to the format expected by the mapping modal
  const productsForMapping = useMemo(() => {
    return products.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      skus: (p.skus || []).map(s => ({
        id: s.id,
        sku: s.sku,
      })),
    }))
  }, [products])

  // Get ledger entries for selected batch
  const selectedBatchLedgerEntries = selectedBatch
    ? ledgerEntries.filter(e => e.batchId === selectedBatch.id)
    : []

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      {/* Header */}
      <div className="bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-stone-900 dark:text-white">
                Inventory
              </h1>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                Track batches through production to Amazon FBA
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Refresh */}
              <button
                onClick={() => {
                  if (activeTab === 'pipeline') refetch()
                  else syncFromAmazon()
                }}
                disabled={loading || syncing}
                className="p-2 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors disabled:opacity-50"
                title={activeTab === 'pipeline' ? 'Refresh' : 'Sync from Amazon'}
              >
                <RefreshCw className={`w-5 h-5 ${(loading || syncing) ? 'animate-spin' : ''}`} />
              </button>

              {activeTab === 'pipeline' && (
                <>
                  {/* Selection Mode Toggle */}
                  <button
                    onClick={handleToggleSelectionMode}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isSelectionMode
                        ? 'bg-lime-100 dark:bg-lime-900/50 text-lime-700 dark:text-lime-400 border border-lime-300 dark:border-lime-700'
                        : 'bg-white dark:bg-stone-700 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-600'
                    }`}
                    title={isSelectionMode ? 'Exit selection mode' : 'Select batches for transfer'}
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span className="hidden sm:inline">{isSelectionMode ? 'Cancel' : 'Select'}</span>
                  </button>

                  {/* View Toggle */}
                  <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-700 rounded-lg">
                    <button
                      onClick={() => setViewMode('kanban')}
                      className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        viewMode === 'kanban'
                          ? 'bg-white dark:bg-stone-600 text-stone-900 dark:text-white shadow-sm'
                          : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                      <span className="hidden sm:inline">Kanban</span>
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        viewMode === 'table'
                          ? 'bg-white dark:bg-stone-600 text-stone-900 dark:text-white shadow-sm'
                          : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      <List className="w-4 h-4" />
                      <span className="hidden sm:inline">Table</span>
                    </button>
                  </div>

                  {/* Add Batch Button */}
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-lime-600 hover:bg-lime-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Batch</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex items-center gap-1 border-b border-stone-200 dark:border-stone-700 -mb-px">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'pipeline'
                  ? 'border-lime-600 text-lime-600 dark:text-lime-400'
                  : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
              }`}
            >
              <Package className="w-4 h-4" />
              Pipeline
            </button>
            <button
              onClick={() => setActiveTab('amazon-connect')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'amazon-connect'
                  ? 'border-lime-600 text-lime-600 dark:text-lime-400'
                  : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
              }`}
            >
              <Link2 className="w-4 h-4" />
              Amazon Connect
              {!isConnected && (
                <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded">
                  Not Connected
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('amazon')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'amazon'
                  ? 'border-lime-600 text-lime-600 dark:text-lime-400'
                  : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              Amazon FBA
            </button>
          </div>

          {/* Stats Row - Pipeline */}
          {activeTab === 'pipeline' && (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
              <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Total Batches</p>
                <p className="mt-1 text-2xl font-semibold text-stone-900 dark:text-white">{summary.totalBatches}</p>
              </div>
              <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Total Units</p>
                <p className="mt-1 text-2xl font-semibold text-stone-900 dark:text-white">{summary.totalUnits.toLocaleString()}</p>
              </div>
              <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Total Value</p>
                <p className="mt-1 text-2xl font-semibold text-stone-900 dark:text-white">${summary.totalValue.toLocaleString()}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">Factory</p>
                <p className="mt-1 text-2xl font-semibold text-blue-700 dark:text-blue-300">{batchesByStage.factory.length}</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">In Transit</p>
                <p className="mt-1 text-2xl font-semibold text-amber-700 dark:text-amber-300">{batchesByStage['in-transit'].length}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Warehouse</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-700 dark:text-emerald-300">{batchesByStage.warehouse.length}</p>
              </div>
              <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wide">Amazon</p>
                <p className="mt-1 text-2xl font-semibold text-violet-700 dark:text-violet-300">{batchesByStage.amazon.length}</p>
              </div>
            </div>
          )}

          {/* Stats Row - Amazon */}
          {activeTab === 'amazon' && isConnected && (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Total SKUs</p>
                <p className="mt-1 text-2xl font-semibold text-stone-900 dark:text-white">{amazonSummary.totalItems}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">FBA Fulfillable</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-700 dark:text-emerald-300">{amazonSummary.totalFbaFulfillable.toLocaleString()}</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">FBA Reserved</p>
                <p className="mt-1 text-2xl font-semibold text-amber-700 dark:text-amber-300">{amazonSummary.totalFbaReserved.toLocaleString()}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">FBA Inbound</p>
                <p className="mt-1 text-2xl font-semibold text-blue-700 dark:text-blue-300">{amazonSummary.totalFbaInbound.toLocaleString()}</p>
              </div>
              <div className="bg-lime-50 dark:bg-lime-900/20 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-lime-600 dark:text-lime-400 uppercase tracking-wide">Mapped</p>
                <p className="mt-1 text-2xl font-semibold text-lime-700 dark:text-lime-300">{amazonSummary.mappedCount}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">Unmapped</p>
                <p className="mt-1 text-2xl font-semibold text-red-700 dark:text-red-300">{amazonSummary.unmappedCount}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Pipeline Tab */}
        {activeTab === 'pipeline' && (
          <>
            {loading && batches.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 mx-auto text-stone-400 animate-spin" />
                  <p className="mt-4 text-stone-500 dark:text-stone-400">Loading batches...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <p className="text-red-600 dark:text-red-400">{error.message}</p>
                  <button
                    onClick={() => refetch()}
                    className="mt-4 px-4 py-2 bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg text-sm hover:bg-stone-200 dark:hover:bg-stone-600"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : batches.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Package className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600" />
                  <h3 className="mt-4 text-lg font-medium text-stone-900 dark:text-white">
                    No batches yet
                  </h3>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    Batches are automatically created when you receive purchase orders.
                  </p>
                </div>
              </div>
            ) : viewMode === 'kanban' ? (
              <PipelineKanban
                batches={batches}
                availableStock={availableStock}
                selectedBatchIds={selectedBatchIds}
                isSelectionMode={isSelectionMode}
                onViewBatch={handleViewBatch}
                onEditBatch={handleEditBatch}
                onDeleteBatch={handleDeleteBatch}
                onSplitBatch={handleSplitBatch}
                onToggleSelect={handleToggleSelect}
              />
            ) : (
              <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-stone-100 dark:bg-stone-700 text-left text-xs font-medium uppercase text-stone-500 dark:text-stone-400">
                      {isSelectionMode && (
                        <th className="py-3 px-4 w-12">
                          <button
                            onClick={() => {
                              if (selectedBatchIds.size === batches.length) {
                                setSelectedBatchIds(new Set())
                              } else {
                                setSelectedBatchIds(new Set(batches.map(b => b.id)))
                              }
                            }}
                            className={`
                              w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                              ${selectedBatchIds.size === batches.length
                                ? 'bg-lime-500 border-lime-500 text-white'
                                : 'bg-white dark:bg-stone-600 border-stone-300 dark:border-stone-500 hover:border-lime-500'
                              }
                            `}
                            title={selectedBatchIds.size === batches.length ? 'Deselect all' : 'Select all'}
                          >
                            {selectedBatchIds.size === batches.length && (
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        </th>
                      )}
                      <th className="py-3 px-4">Batch</th>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Stage</th>
                      <th className="py-3 px-4 text-right">Qty</th>
                      <th className="py-3 px-4 text-right">Value</th>
                      <th className="py-3 px-4">Supplier</th>
                      <th className="py-3 px-4">Expected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
                    {batches.map((batch) => (
                      <tr
                        key={batch.id}
                        onClick={() => {
                          if (isSelectionMode) {
                            handleToggleSelect(batch.id)
                          } else {
                            handleViewBatch(batch.id)
                          }
                        }}
                        className={`
                          hover:bg-stone-50 dark:hover:bg-stone-700/50 cursor-pointer transition-colors
                          ${selectedBatchIds.has(batch.id) ? 'bg-lime-50 dark:bg-lime-900/20' : ''}
                        `}
                      >
                        {isSelectionMode && (
                          <td className="py-3 px-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleSelect(batch.id)
                              }}
                              className={`
                                w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                                ${selectedBatchIds.has(batch.id)
                                  ? 'bg-lime-500 border-lime-500 text-white'
                                  : 'bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-500 hover:border-lime-500'
                                }
                              `}
                            >
                              {selectedBatchIds.has(batch.id) && (
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                          </td>
                        )}
                        <td className="py-3 px-4">
                          <div>
                            <span className="text-sm font-medium text-stone-900 dark:text-white">
                              {batch.batchNumber}
                            </span>
                            <span className="text-xs text-stone-500 dark:text-stone-400 block">
                              {batch.poNumber}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm text-stone-900 dark:text-white">{batch.productName}</p>
                            <p className="text-xs text-lime-600 dark:text-lime-400 font-mono">{batch.sku}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-stone-600 dark:text-stone-400 capitalize">
                            {batch.stage}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {(() => {
                            const allocated = batchAllocationMap.get(batch.id) || 0
                            const available = batch.quantity - allocated
                            const hasDraft = allocated > 0
                            return (
                              <>
                                <span className={`tabular-nums text-sm ${
                                  available <= 0
                                    ? 'text-stone-400 dark:text-stone-500'
                                    : 'text-stone-900 dark:text-white'
                                }`}>
                                  {available.toLocaleString()}
                                </span>
                                {hasDraft && (
                                  <span className="block text-xs text-amber-600 dark:text-amber-400">
                                    {allocated.toLocaleString()} in draft
                                  </span>
                                )}
                              </>
                            )
                          })()}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-sm font-medium text-stone-900 dark:text-white">
                          ${batch.totalCost.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-stone-600 dark:text-stone-400">
                          {batch.supplierName}
                        </td>
                        <td className="py-3 px-4 text-sm text-stone-600 dark:text-stone-400">
                          {new Date(batch.expectedArrival).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Amazon Connect Tab */}
        {activeTab === 'amazon-connect' && (
          <AmazonConnectCard
            connection={connection}
            isConnected={isConnected}
            needsReauth={needsReauth}
            loading={connectionLoading}
            isConnecting={isConnecting}
            lastSyncAt={lastSyncAt}
            onConnect={handleConnect}
            onDisconnect={disconnect}
            onSync={syncFromAmazon}
            syncing={syncing}
          />
        )}

        {/* Amazon FBA Tab */}
        {activeTab === 'amazon' && (
          <AmazonInventoryTable
            inventory={amazonInventory}
            summary={amazonSummary}
            loading={amazonLoading}
            syncing={syncing}
            lastSyncAt={lastSyncAt}
            onSync={syncFromAmazon}
            onMapSku={handleMapSku}
            onUnmapSku={handleUnmapSku}
          />
        )}
      </div>

      {/* Batch Detail Panel */}
      {selectedBatch && (
        <BatchDetailPanel
          batch={selectedBatch}
          ledgerEntries={selectedBatchLedgerEntries}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false)
            setSelectedBatch(null)
          }}
          onEdit={handleEditBatch}
          onSplit={handleSplitBatch}
          onMerge={handleMergeBatch}
          onCreateTransfer={handleCreateTransfer}
          onAddAttachment={handleAddAttachment}
          onRemoveAttachment={handleRemoveAttachment}
        />
      )}

      {/* Split Batch Modal */}
      {splitBatch && (
        <SplitBatchModal
          batch={splitBatch}
          isOpen={true}
          onClose={() => setSplitBatch(null)}
          onSplit={handleSplit}
        />
      )}

      {/* Merge Batch Modal */}
      {mergeBatch && (
        <MergeBatchModal
          currentBatch={mergeBatch}
          availableBatches={batches}
          isOpen={true}
          onClose={() => setMergeBatch(null)}
          onMerge={handleMerge}
        />
      )}

      {/* SKU Mapping Modal */}
      {mappingItem && (
        <AmazonSkuMappingModal
          amazonItem={mappingItem}
          products={productsForMapping}
          isOpen={true}
          onClose={() => setMappingItem(null)}
          onMap={handleConfirmMapping}
        />
      )}

      {/* Transfer Form Sidebar */}
      {transferBatch && (() => {
        // Get the pre-selected stock items
        const preSelectedStock = availableStock.filter(s => {
          if (selectedBatchIds.size > 0) {
            return selectedBatchIds.has(s.batchId)
          }
          return s.batchId === transferBatch.id
        })
        // Get source location from first selected stock item (all should be same location)
        const sourceLocationId = preSelectedStock[0]?.locationId || ''

        return (
          <TransferForm
            locations={locations}
            availableStock={availableStock}
            shippingMethods={SHIPPING_METHOD_OPTIONS}
            shippingAgents={shippingAgents}
            preSelectedStockIds={preSelectedStock.map(s => s.id)}
            initialSourceLocationId={sourceLocationId}
            isOpen={true}
            onSubmit={handleSubmitTransfer}
            onCancel={() => {
              handleCloseTransferForm()
              // Clear selection when closing after multi-select
              if (selectedBatchIds.size > 0) {
                setSelectedBatchIds(new Set())
              }
            }}
            onClose={() => {
              handleCloseTransferForm()
              // Clear selection when closing after multi-select
              if (selectedBatchIds.size > 0) {
                setSelectedBatchIds(new Set())
              }
            }}
          />
        )
      })()}

      {/* Batch Selection Bar */}
      {isSelectionMode && selectedBatches.length > 0 && (
        <BatchSelectionBar
          selectedBatches={selectedBatches}
          availableStock={availableStock}
          onInitiateTransfer={handleInitiateMultiTransfer}
          onClearSelection={handleClearSelection}
        />
      )}
    </div>
  )
}

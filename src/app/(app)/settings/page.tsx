'use client'

import { useState, useCallback } from 'react'
import { SettingsView, AmazonAccountsTab, BrandsTab, LegsTab, RoutesTab, MarketplaceEditModal, BrandFormModal, LegFormModal, RouteComposerModal } from '@/sections/settings'
import type { SettingsTab, Brand, AmazonMarketplace, LegFormData, RouteFormData } from '@/sections/settings'
import { useAmazonConnections } from '@/lib/supabase/hooks/useAmazonConnections'
import { useShippingLegs } from '@/lib/supabase/hooks/useShippingLegs'
import { useShippingRoutes } from '@/lib/supabase/hooks/useShippingRoutes'
import { useBrands, type BrandFormData } from '@/lib/supabase/hooks/useBrands'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('amazon-accounts')
  const [editingMarketplacesId, setEditingMarketplacesId] = useState<string | null>(null)
  const [brandModalOpen, setBrandModalOpen] = useState(false)
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null)
  const [legModalOpen, setLegModalOpen] = useState(false)
  const [editingLegId, setEditingLegId] = useState<string | null>(null)
  const [routeModalOpen, setRouteModalOpen] = useState(false)
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null)

  // Hooks
  const amazonConnections = useAmazonConnections()
  const shippingLegs = useShippingLegs()
  const shippingRoutes = useShippingRoutes(shippingLegs.legs)
  const brandsHook = useBrands()

  // Convert brands to settings format
  const brands: Brand[] = brandsHook.brands.map(b => ({
    id: b.id,
    name: b.name,
    description: b.description,
    logoUrl: b.logoUrl,
    status: b.status,
    amazonConnectionIds: b.amazonConnectionIds,
    productCount: 0, // TODO: Add product count query
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  }))

  // Amazon Accounts handlers
  const handleConnectAmazon = useCallback(async () => {
    const authUrl = await amazonConnections.initiateOAuth()
    if (authUrl) {
      window.location.href = authUrl
    }
  }, [amazonConnections])

  const handleRefreshConnection = useCallback(async (id: string) => {
    await amazonConnections.refreshToken(id)
  }, [amazonConnections])

  const handleEditMarketplaces = useCallback((id: string) => {
    setEditingMarketplacesId(id)
  }, [])

  const handleSaveMarketplaces = useCallback(async (id: string, marketplaces: AmazonMarketplace[]) => {
    await amazonConnections.updateMarketplaces(id, marketplaces)
  }, [amazonConnections])

  const handleDisconnectAmazon = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to disconnect this Amazon account?')) {
      await amazonConnections.disconnect(id)
    }
  }, [amazonConnections])

  // Brands handlers
  const handleCreateBrand = useCallback(() => {
    setEditingBrandId(null)
    setBrandModalOpen(true)
  }, [])

  const handleEditBrand = useCallback((id: string) => {
    setEditingBrandId(id)
    setBrandModalOpen(true)
  }, [])

  const handleSaveBrand = useCallback(async (data: BrandFormData & { removeLogo?: boolean }) => {
    if (editingBrandId) {
      await brandsHook.updateBrand(editingBrandId, data)
    } else {
      await brandsHook.createBrand(data)
    }
  }, [brandsHook, editingBrandId])

  const handleCloseBrandModal = useCallback(() => {
    setBrandModalOpen(false)
    setEditingBrandId(null)
  }, [])

  const handleArchiveBrand = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to archive this brand?')) {
      await brandsHook.deleteBrand(id)
    }
  }, [brandsHook])

  // Legs handlers
  const handleCreateLeg = useCallback(() => {
    setEditingLegId(null)
    setLegModalOpen(true)
  }, [])

  const handleEditLeg = useCallback((id: string) => {
    setEditingLegId(id)
    setLegModalOpen(true)
  }, [])

  const handleSaveLeg = useCallback(async (data: LegFormData) => {
    if (editingLegId) {
      await shippingLegs.updateLeg(editingLegId, data)
    } else {
      await shippingLegs.createLeg(data)
    }
  }, [shippingLegs, editingLegId])

  const handleCloseLegModal = useCallback(() => {
    setLegModalOpen(false)
    setEditingLegId(null)
  }, [])

  const handleDeleteLeg = useCallback(async (id: string) => {
    const result = await shippingLegs.deleteLeg(id)
    if (!result.success) {
      alert(result.error || 'Failed to delete leg')
      if (result.affectedRoutes && result.affectedRoutes.length > 0) {
        alert(`This leg is used in the following routes: ${result.affectedRoutes.map(r => r.name).join(', ')}`)
      }
    }
  }, [shippingLegs])

  const handleToggleLegActive = useCallback(async (id: string) => {
    await shippingLegs.toggleActive(id)
  }, [shippingLegs])

  // Routes handlers
  const handleCreateRoute = useCallback(() => {
    setEditingRouteId(null)
    setRouteModalOpen(true)
  }, [])

  const handleEditRoute = useCallback((id: string) => {
    setEditingRouteId(id)
    setRouteModalOpen(true)
  }, [])

  const handleSaveRoute = useCallback(async (data: RouteFormData) => {
    if (editingRouteId) {
      await shippingRoutes.updateRoute(editingRouteId, data)
    } else {
      await shippingRoutes.createRoute(data)
    }
  }, [shippingRoutes, editingRouteId])

  const handleCloseRouteModal = useCallback(() => {
    setRouteModalOpen(false)
    setEditingRouteId(null)
  }, [])

  const handleDeleteRoute = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this route?')) {
      await shippingRoutes.deleteRoute(id)
    }
  }, [shippingRoutes])

  const handleSetRouteDefault = useCallback(async (id: string) => {
    await shippingRoutes.setDefault(id)
  }, [shippingRoutes])

  const handleToggleRouteActive = useCallback(async (id: string) => {
    await shippingRoutes.toggleActive(id)
  }, [shippingRoutes])

  // Get connection being edited for marketplace modal
  const editingConnection = editingMarketplacesId
    ? amazonConnections.connections.find(c => c.id === editingMarketplacesId)
    : null

  // Get brand being edited
  const editingBrand = editingBrandId
    ? brands.find(b => b.id === editingBrandId)
    : null

  // Get leg being edited
  const editingLeg = editingLegId
    ? shippingLegs.legs.find(l => l.id === editingLegId)
    : null

  // Get route being edited
  const editingRoute = editingRouteId
    ? shippingRoutes.routes.find(r => r.id === editingRouteId)
    : null

  return (
    <>
      <SettingsView activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'amazon-accounts' && (
          <AmazonAccountsTab
            connections={amazonConnections.connections}
            loading={amazonConnections.loading}
            onConnect={handleConnectAmazon}
            onRefresh={handleRefreshConnection}
            onEditMarketplaces={handleEditMarketplaces}
            onDisconnect={handleDisconnectAmazon}
          />
        )}

        {activeTab === 'brands' && (
          <BrandsTab
            brands={brands}
            amazonConnections={amazonConnections.connections}
            loading={brandsHook.loading}
            onCreateBrand={handleCreateBrand}
            onEditBrand={handleEditBrand}
            onArchiveBrand={handleArchiveBrand}
          />
        )}

        {activeTab === 'routes' && (
          <div className="space-y-8">
            <LegsTab
              legs={shippingLegs.legs}
              loading={shippingLegs.loading}
              onCreateLeg={handleCreateLeg}
              onEditLeg={handleEditLeg}
              onDeleteLeg={handleDeleteLeg}
              onToggleActive={handleToggleLegActive}
            />
            <RoutesTab
              routes={shippingRoutes.expandedRoutes}
              legs={shippingLegs.legs}
              loading={shippingRoutes.loading}
              onCreateRoute={handleCreateRoute}
              onEditRoute={handleEditRoute}
              onDeleteRoute={handleDeleteRoute}
              onSetDefault={handleSetRouteDefault}
              onToggleActive={handleToggleRouteActive}
            />
          </div>
        )}
      </SettingsView>

      {/* Marketplace Edit Modal */}
      {editingConnection && (
        <MarketplaceEditModal
          connection={editingConnection}
          isOpen={!!editingMarketplacesId}
          onClose={() => setEditingMarketplacesId(null)}
          onSave={handleSaveMarketplaces}
        />
      )}

      {/* Brand Form Modal */}
      <BrandFormModal
        brand={editingBrand}
        amazonConnections={amazonConnections.connections}
        isOpen={brandModalOpen}
        uploading={brandsHook.uploadingLogo}
        onClose={handleCloseBrandModal}
        onSave={handleSaveBrand}
      />

      {/* Leg Form Modal */}
      <LegFormModal
        leg={editingLeg}
        isOpen={legModalOpen}
        onClose={handleCloseLegModal}
        onSave={handleSaveLeg}
      />

      {/* Route Composer Modal */}
      <RouteComposerModal
        route={editingRoute}
        legs={shippingLegs.legs}
        allLegs={shippingLegs.legs}
        isOpen={routeModalOpen}
        onClose={handleCloseRouteModal}
        onSave={handleSaveRoute}
      />
    </>
  )
}

'use client'

import { useState, useMemo } from 'react'
import { Search, Plus, MoreHorizontal, Pencil, Trash2, RefreshCw, Tag } from 'lucide-react'
import type { Brand } from '@/lib/supabase/hooks/useBrands'

type SortKey = 'name' | 'createdAt' | 'updatedAt'
type SortDir = 'asc' | 'desc'

interface BrandsViewProps {
  brands: Brand[]
  onEditBrand: (id: string) => void
  onDeleteBrand: (id: string) => void
  onCreateBrand: () => void
  onRefresh: () => void
  loading?: boolean
}

export function BrandsView({
  brands,
  onEditBrand,
  onDeleteBrand,
  onCreateBrand,
  onRefresh,
  loading = false,
}: BrandsViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const filteredBrands = useMemo(() => {
    let result = [...brands]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        brand =>
          brand.name.toLowerCase().includes(query) ||
          brand.description?.toLowerCase().includes(query)
      )
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0
      switch (sortKey) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
      }
      return sortDir === 'asc' ? comparison : -comparison
    })

    return result
  }, [brands, searchQuery, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return null
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      {/* Header */}
      <div className="border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">Brands</h1>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                Manage your product brands
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onRefresh}
                disabled={loading}
                className="p-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onCreateBrand}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Brand
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-stone-600 dark:text-stone-400">
              Total: <span className="font-medium text-stone-900 dark:text-stone-100">{brands.length}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-3 border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="px-6 py-4">
        {loading && brands.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-stone-400 animate-spin mx-auto mb-4" />
            <p className="text-stone-500 dark:text-stone-400">Loading brands...</p>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-1">
              {searchQuery ? 'No brands found' : 'No brands yet'}
            </h3>
            <p className="text-stone-500 dark:text-stone-400 mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Create your first brand to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={onCreateBrand}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Brand
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
                  <th
                    className="text-left px-4 py-3 text-sm font-medium text-stone-600 dark:text-stone-400 cursor-pointer hover:text-stone-900 dark:hover:text-stone-200"
                    onClick={() => handleSort('name')}
                  >
                    Name <SortIcon columnKey="name" />
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-600 dark:text-stone-400">
                    Description
                  </th>
                  <th
                    className="text-left px-4 py-3 text-sm font-medium text-stone-600 dark:text-stone-400 cursor-pointer hover:text-stone-900 dark:hover:text-stone-200"
                    onClick={() => handleSort('createdAt')}
                  >
                    Created <SortIcon columnKey="createdAt" />
                  </th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filteredBrands.map((brand) => (
                  <tr
                    key={brand.id}
                    className="border-b border-stone-100 dark:border-stone-700/50 last:border-0 hover:bg-stone-50 dark:hover:bg-stone-700/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {brand.logoUrl ? (
                          <img
                            src={brand.logoUrl}
                            alt={brand.name}
                            className="w-8 h-8 rounded object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Tag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                        )}
                        <span className="font-medium text-stone-900 dark:text-stone-100">
                          {brand.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-600 dark:text-stone-400 max-w-md truncate">
                      {brand.description || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-500 dark:text-stone-400">
                      {new Date(brand.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpenId(menuOpenId === brand.id ? null : brand.id)}
                          className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                        {menuOpenId === brand.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setMenuOpenId(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-stone-800 rounded-lg shadow-lg border border-stone-200 dark:border-stone-700 py-1 z-20">
                              <button
                                onClick={() => {
                                  onEditBrand(brand.id)
                                  setMenuOpenId(null)
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2"
                              >
                                <Pencil className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  onDeleteBrand(brand.id)
                                  setMenuOpenId(null)
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

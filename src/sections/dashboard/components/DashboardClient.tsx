'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'
import { DashboardView } from './DashboardView'
import type { DashboardData } from '../types'

interface DashboardClientProps {
  initialData: DashboardData
  refreshAction: () => Promise<DashboardData>
}

export function DashboardClient({ initialData, refreshAction }: DashboardClientProps) {
  const router = useRouter()
  const [data, setData] = useState(initialData)
  const [isPending, startTransition] = useTransition()

  const handleNavigate = useCallback((section: string, entityId?: string) => {
    let url = `/${section}`

    // Add query params for create actions or entity navigation
    if (entityId === 'create') {
      url += '?create=true'
    } else if (entityId === 'payment') {
      url += '?payment=true'
    } else if (entityId) {
      url += `?id=${entityId}`
    }

    router.push(url)
  }, [router])

  const handleRefresh = useCallback(() => {
    startTransition(async () => {
      try {
        const newData = await refreshAction()
        setData(newData)
      } catch (error) {
        console.error('Failed to refresh dashboard:', error)
      }
    })
  }, [refreshAction])

  return (
    <DashboardView
      data={data}
      onNavigate={handleNavigate}
      onRefresh={handleRefresh}
      isRefreshing={isPending}
    />
  )
}

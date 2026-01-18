import { fetchDashboardData } from '@/lib/supabase/dashboard'
import { DashboardClient } from '@/sections/dashboard/components/DashboardClient'

export const dynamic = 'force-dynamic'

async function refreshDashboard() {
  'use server'
  return fetchDashboardData()
}

export default async function DashboardPage() {
  const data = await fetchDashboardData()

  return <DashboardClient initialData={data} refreshAction={refreshDashboard} />
}

'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  Boxes,
  Receipt,
  ClipboardCheck,
  Truck,
  MapPin,
  Activity,
  Link,
  Brain,
  Files,
  Inbox,
  Settings,
  FileSpreadsheet,
  Factory,
  Tag,
} from 'lucide-react'
import { AppShell } from './AppShell'
import { useTheme } from '@/providers/ThemeProvider'
import { useAuth } from '@/providers/AuthProvider'
import type { NavigationItem } from './MainNav'

const navigationItems: NavigationItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Catalog', href: '/catalog', icon: <Package className="w-5 h-5" /> },
  { label: 'Brands', href: '/brands', icon: <Tag className="w-5 h-5" /> },
  { label: 'Suppliers', href: '/suppliers', icon: <Users className="w-5 h-5" /> },
  { label: 'Purchase Orders', href: '/purchase-orders', icon: <FileText className="w-5 h-5" /> },
  { label: 'Inventory', href: '/inventory', icon: <Boxes className="w-5 h-5" /> },
  { label: 'Assembly', href: '/assembly', icon: <Factory className="w-5 h-5" /> },
  { label: 'Invoices & Payments', href: '/invoices-and-payments', icon: <Receipt className="w-5 h-5" /> },
  { label: 'Inspections', href: '/inspections', icon: <ClipboardCheck className="w-5 h-5" /> },
  { label: 'Transfers', href: '/transfers', icon: <Truck className="w-5 h-5" /> },
  { label: 'Locations', href: '/locations', icon: <MapPin className="w-5 h-5" /> },
  { label: 'Activity Log', href: '/activity-log', icon: <Activity className="w-5 h-5" /> },
  { label: 'Magic Links', href: '/magic-links', icon: <Link className="w-5 h-5" /> },
  { label: 'Intelligence', href: '/inventory-intelligence', icon: <Brain className="w-5 h-5" /> },
  { label: 'Documents', href: '/documents', icon: <Files className="w-5 h-5" /> },
  { label: 'Inbox', href: '/inbox', icon: <Inbox className="w-5 h-5" /> },
  { label: 'Supplier Invoices', href: '/supplier-invoices', icon: <FileSpreadsheet className="w-5 h-5" /> },
]

const utilityItems: NavigationItem[] = [
  { label: 'Settings', href: '/settings', icon: <Settings className="w-5 h-5" /> },
]

interface ShellWrapperProps {
  children: ReactNode
}

export function ShellWrapper({ children }: ShellWrapperProps) {
  const { isDark, toggleTheme } = useTheme()
  const { user, signOut, loading } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  // Get user display info
  const userInfo = user
    ? {
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
      }
    : {
        name: 'Guest',
        email: '',
      }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <AppShell
      navigationItems={navigationItems}
      utilityItems={utilityItems}
      user={userInfo}
      isDark={isDark}
      onToggleTheme={toggleTheme}
      onLogout={handleLogout}
    >
      {children}
    </AppShell>
  )
}

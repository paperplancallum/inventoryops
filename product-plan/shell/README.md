# Application Shell

The application shell provides the persistent navigation and layout that wraps all sections.

## Components

### AppShell
Main layout wrapper with sidebar navigation and mobile responsiveness.

**Props:**
- `children` — Page content to render
- `navigationItems` — Array of nav items with label, href, icon, isActive
- `utilityItems` — Secondary nav items (settings, etc.)
- `user` — Current user info (name, email, avatarUrl)
- `onNavigate` — Callback when nav item is clicked
- `onLogout` — Callback when logout is clicked

### MainNav
Vertical navigation component used in the sidebar.

**Props:**
- `items` — Navigation items array
- `onNavigate` — Click handler

### UserMenu
User profile dropdown at bottom of sidebar.

**Props:**
- `user` — User object with name, email, avatarUrl
- `onLogout` — Logout callback

## Usage Example

```tsx
import { AppShell } from './components'
import {
  LayoutDashboard, Package, Users, FileText,
  Boxes, Receipt, ClipboardCheck, Truck,
  MapPin, Activity, Link, Brain, Files,
  Inbox, Settings, FileSpreadsheet
} from 'lucide-react'

const navigationItems = [
  { label: 'Dashboard', href: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Catalog', href: '/catalog', icon: <Package className="w-5 h-5" /> },
  { label: 'Suppliers', href: '/suppliers', icon: <Users className="w-5 h-5" /> },
  { label: 'Purchase Orders', href: '/purchase-orders', icon: <FileText className="w-5 h-5" /> },
  { label: 'Inventory', href: '/inventory', icon: <Boxes className="w-5 h-5" /> },
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

const utilityItems = [
  { label: 'Settings', href: '/settings', icon: <Settings className="w-5 h-5" /> },
]

function App() {
  const currentPath = window.location.pathname

  return (
    <AppShell
      navigationItems={navigationItems.map(item => ({
        ...item,
        isActive: item.href === currentPath
      }))}
      utilityItems={utilityItems}
      user={{ name: 'John Doe', email: 'john@example.com' }}
      onNavigate={(href) => { /* router.push(href) */ }}
      onLogout={() => { /* handle logout */ }}
    >
      {/* Page content */}
    </AppShell>
  )
}
```

## Dependencies

- `lucide-react` — Icon library
- React 18+
- Tailwind CSS v4

## Features

- Responsive sidebar (collapsible on mobile)
- Dark mode support
- User menu with avatar
- Active state highlighting
- Utility section separator

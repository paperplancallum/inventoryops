'use client'

import { Inbox } from 'lucide-react'
import { PlaceholderPage } from '@/components/ui/PlaceholderPage'

export default function InboxPage() {
  return (
    <PlaceholderPage
      title="Inbox"
      description="Aggregated messages across Purchase Orders and Shipping Agents in one unified view."
      icon={Inbox}
    />
  )
}

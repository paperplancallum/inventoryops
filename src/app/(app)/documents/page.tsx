'use client'

import { Files } from 'lucide-react'
import { PlaceholderPage } from '@/components/ui/PlaceholderPage'

export default function DocumentsPage() {
  return (
    <PlaceholderPage
      title="Documents"
      description="Centralized document management for browsing, searching, and downloading all generated PDFs."
      icon={Files}
    />
  )
}

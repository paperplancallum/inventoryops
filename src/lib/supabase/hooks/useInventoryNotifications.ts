'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type NotificationType =
  | 'critical_stock'
  | 'warning_stock'
  | 'suggestion_accepted'
  | 'suggestion_expired'
  | 'forecast_updated'

export type NotificationStatus = 'unread' | 'read' | 'dismissed'

export interface InventoryNotification {
  id: string
  type: NotificationType
  status: NotificationStatus
  title: string
  message: string
  entityType: string | null
  entityId: string | null
  data: Record<string, unknown>
  createdAt: string
  readAt: string | null
  dismissedAt: string | null
}

export interface NotificationInsert {
  type: NotificationType
  title: string
  message: string
  entityType?: string | null
  entityId?: string | null
  data?: Record<string, unknown>
}

export function useInventoryNotifications() {
  const [notifications, setNotifications] = useState<InventoryNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('inventory_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (fetchError) throw fetchError

      const mapped: InventoryNotification[] = (data || []).map((row) => ({
        id: row.id,
        type: row.type as NotificationType,
        status: row.status as NotificationStatus,
        title: row.title,
        message: row.message,
        entityType: row.entity_type,
        entityId: row.entity_id,
        data: row.data || {},
        createdAt: row.created_at,
        readAt: row.read_at,
        dismissedAt: row.dismissed_at,
      }))

      setNotifications(mapped)
    } catch (err) {
      console.error('Error fetching inventory notifications:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const createNotification = useCallback(async (notification: NotificationInsert): Promise<InventoryNotification | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('inventory_notifications')
        .insert({
          type: notification.type,
          title: notification.title,
          message: notification.message,
          entity_type: notification.entityType || null,
          entity_id: notification.entityId || null,
          data: notification.data || {},
        })
        .select()
        .single()

      if (insertError) throw insertError

      await fetchNotifications()
      return data as unknown as InventoryNotification
    } catch (err) {
      console.error('Error creating notification:', err)
      throw err
    }
  }, [supabase, fetchNotifications])

  const markAsRead = useCallback(async (id: string): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('inventory_notifications')
        .update({
          status: 'read',
          read_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) throw updateError

      await fetchNotifications()
    } catch (err) {
      console.error('Error marking notification as read:', err)
      throw err
    }
  }, [supabase, fetchNotifications])

  const markAllAsRead = useCallback(async (): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('inventory_notifications')
        .update({
          status: 'read',
          read_at: new Date().toISOString(),
        })
        .eq('status', 'unread')

      if (updateError) throw updateError

      await fetchNotifications()
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      throw err
    }
  }, [supabase, fetchNotifications])

  const dismissNotification = useCallback(async (id: string): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('inventory_notifications')
        .update({
          status: 'dismissed',
          dismissed_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) throw updateError

      await fetchNotifications()
    } catch (err) {
      console.error('Error dismissing notification:', err)
      throw err
    }
  }, [supabase, fetchNotifications])

  const deleteNotification = useCallback(async (id: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase
        .from('inventory_notifications')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      await fetchNotifications()
    } catch (err) {
      console.error('Error deleting notification:', err)
      throw err
    }
  }, [supabase, fetchNotifications])

  // Get counts
  const unreadNotifications = notifications.filter((n) => n.status === 'unread')
  const unreadCount = unreadNotifications.length
  const criticalCount = unreadNotifications.filter((n) => n.type === 'critical_stock').length
  const warningCount = unreadNotifications.filter((n) => n.type === 'warning_stock').length

  return {
    notifications,
    unreadNotifications,
    unreadCount,
    criticalCount,
    warningCount,
    loading,
    error,
    refetch: fetchNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    deleteNotification,
  }
}

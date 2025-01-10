"use client"

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { queryKeys } from "@/lib/react-query"
import { useAuth } from "@/contexts/auth-context"
import { useSettings } from "@/contexts/settings-context"
import { playNotificationSound } from "@/lib/sounds"
import { NotificationType } from "@/types/database"
import React from "react"

interface NotificationMetadata {
  projectId?: string
  taskId?: string
  teamId?: string
  userId?: string
  action?: string
  entityType?: string
  entityId?: string
}

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  read: boolean
  created_at: string
  type: NotificationType
  metadata: NotificationMetadata
  action_url?: string
  task_id?: string
  project_id?: string
}

const supabase = createClient()

async function getNotifications(userId: string, { limit = 5, offset = 0 }) {
  const { data, error, count } = await supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return { 
    notifications: data as Notification[],
    count: count ?? 0
  }
}

async function getUnreadCount(userId: string) {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false)

  if (error) throw error
  return count ?? 0
}

async function markAsRead(notificationId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)

  if (error) throw error
}

async function markAllAsRead(userId: string) {
  const { error } = await supabase
    .rpc("mark_all_notifications_read", {
      p_user_id: userId,
    })

  if (error) throw error
}

async function deleteNotification(notificationId: string) {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)

  if (error) throw error
}

async function deleteAllNotifications(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", userId)

  if (error) throw error
}

export function useNotificationsQuery(limit: number = 5, isInfinite: boolean = false) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { soundEnabled } = useSettings()

  // Prefetch notifications
  React.useEffect(() => {
    if (user?.id) {
      queryClient.prefetchQuery({
        queryKey: queryKeys.notifications.all(user.id),
        queryFn: () => getNotifications(user.id, { limit }),
        staleTime: 5 * 60 * 1000, // 5 minutes
      })

      queryClient.prefetchQuery({
        queryKey: queryKeys.notifications.unread(user.id),
        queryFn: () => getUnreadCount(user.id),
        staleTime: 5 * 60 * 1000,
      })
    }
  }, [user?.id, queryClient, limit])

  // Regular query for menu
  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications.all(user?.id ?? ""),
    queryFn: () => {
      if (!user?.id) throw new Error("User ID is required")
      return getNotifications(user.id, { limit })
    },
    enabled: !!user?.id && !isInfinite,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 2,
    retryDelay: 1000,
    placeholderData: (oldData) => oldData,
    select: (data) => data.notifications,
  })

  // Infinite query for full page
  const infiniteQuery = useInfiniteQuery({
    queryKey: queryKeys.notifications.infinite(user?.id ?? ""),
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id) throw new Error("User ID is required")
      return getNotifications(user.id, { limit, offset: pageParam * limit })
    },
    enabled: !!user?.id && isInfinite,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.length * limit
      return totalFetched < lastPage.count ? allPages.length : undefined
    },
    initialPageParam: 0,
  })

  const unreadCountQuery = useQuery({
    queryKey: queryKeys.notifications.unread(user?.id ?? ""),
    queryFn: () => {
      if (!user?.id) throw new Error("User ID is required")
      return getUnreadCount(user.id)
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 2,
    retryDelay: 1000,
    placeholderData: (oldData) => oldData,
  })

  // Mutations
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => markAsRead(notificationId),
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all(user.id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.infinite(user.id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread(user.id) })
      }
    }
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error("User ID is required")
      return markAllAsRead(user.id)
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all(user.id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.infinite(user.id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread(user.id) })
      }
    }
  })

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => deleteNotification(notificationId),
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all(user.id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.infinite(user.id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread(user.id) })
      }
    }
  })

  const deleteAllNotificationsMutation = useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error("User ID is required")
      return deleteAllNotifications(user.id)
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all(user.id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.infinite(user.id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread(user.id) })
      }
    }
  })

  // Subscribe to realtime notifications
  React.useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          // Play sound for new notifications if enabled
          if (payload.eventType === 'INSERT' && soundEnabled) {
            await playNotificationSound()
          }
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all(user.id) })
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.infinite(user.id) })
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread(user.id) })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user?.id, queryClient, soundEnabled])

  return {
    notifications: isInfinite 
      ? infiniteQuery.data?.pages.flatMap(page => page.notifications) ?? []
      : notificationsQuery.data ?? [],
    isLoading: isInfinite ? infiniteQuery.isLoading : notificationsQuery.isLoading,
    error: isInfinite ? infiniteQuery.error : notificationsQuery.error,
    hasNextPage: isInfinite ? infiniteQuery.hasNextPage : false,
    fetchNextPage: isInfinite ? infiniteQuery.fetchNextPage : undefined,
    isFetchingNextPage: isInfinite ? infiniteQuery.isFetchingNextPage : false,
    unreadCount: unreadCountQuery.data ?? 0,
    isLoadingUnreadCount: unreadCountQuery.isLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    deleteAllNotifications: deleteAllNotificationsMutation.mutate,
  }
} 
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { notificationsApi } from "@/services/notifications"
import { toast } from "sonner"
import { Notification } from "@/types/database"

interface UseNotificationsQueryProps {
  userId: string
  limit?: number
  isMenu?: boolean // To differentiate between menu and full page
}

interface NotificationsResponse {
  notifications: Notification[]
  hasMore: boolean
}

interface InfiniteNotificationsData {
  pages: NotificationsResponse[]
  pageParams: number[]
}

export function useNotificationsQuery({ 
  userId, 
  limit = 20,
  isMenu = false 
}: UseNotificationsQueryProps) {
  const queryClient = useQueryClient()

  // Menu query
  const menuQuery = useQuery<NotificationsResponse>({
    queryKey: ["notifications", userId, "menu"],
    queryFn: () => notificationsApi.getAllNotifications(userId, 1, limit),
    staleTime: 1000 * 60, // 1 minute
    enabled: isMenu,
  })

  // Infinite query for full page
  const infiniteQuery = useInfiniteQuery<NotificationsResponse, Error, InfiniteNotificationsData, string[], number>({
    queryKey: ["notifications", userId, "infinite"],
    queryFn: async ({ pageParam }) => {
      const offset = ((pageParam as number) - 1) * limit
      return notificationsApi.getAllNotifications(userId, pageParam as number, limit, offset)
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined
      return allPages.length + 1
    },
    initialPageParam: 1,
    staleTime: 1000 * 60, // 1 minute
    enabled: !isMenu,
  })

  // Query for unread notifications count
  const { data: unreadNotifications } = useQuery<Notification[]>({
    queryKey: ["notifications", userId, "unread"],
    queryFn: () => notificationsApi.getUnreadNotifications(userId),
    staleTime: 1000 * 60, // 1 minute
  })

  // Mutation to mark a notification as read
  const { mutate: markAsRead } = useMutation({
    mutationFn: async (notificationId: string) => {
      await notificationsApi.markAsRead(notificationId)
    },
    onSuccess: () => {
      // Invalidate both notifications queries
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] })
    },
    onError: (error) => {
      toast.error("Failed to mark notification as read")
      console.error("Error marking notification as read:", error)
    },
  })

  // Mutation to mark all notifications as read
  const { mutate: markAllAsRead } = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] })
      toast.success("All notifications marked as read")
    },
    onError: (error) => {
      toast.error("Failed to mark all notifications as read")
      console.error("Error marking all notifications as read:", error)
    },
  })

  // Mutation to delete a notification
  const { mutate: deleteNotification } = useMutation({
    mutationFn: (notificationId: string) => 
      notificationsApi.deleteNotification(notificationId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] })
      toast.success("Notification removed")
    },
    onError: (error) => {
      toast.error("Failed to delete notification")
      console.error("Error deleting notification:", error)
    },
  })

  // Mutation to delete all notifications
  const { mutate: deleteAllNotifications } = useMutation({
    mutationFn: () => notificationsApi.deleteAllNotifications(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] })
      toast.success("All notifications removed")
    },
    onError: (error) => {
      toast.error("Failed to delete all notifications")
      console.error("Error deleting all notifications:", error)
    },
  })

  // Mutation to delete multiple notifications
  const { mutate: deleteMultipleNotifications } = useMutation({
    mutationFn: (notificationIds: string[]) => 
      notificationsApi.deleteMultiple(notificationIds, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] })
      toast.success("Selected notifications removed")
    },
    onError: (error) => {
      toast.error("Failed to delete selected notifications")
      console.error("Error deleting multiple notifications:", error)
    },
  })

  // Mutation to mark multiple notifications as read
  const { mutate: markMultipleAsRead } = useMutation({
    mutationFn: (notificationIds: string[]) => 
      notificationsApi.markMultipleAsRead(notificationIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] })
      toast.success("Selected notifications marked as read")
    },
    onError: (error) => {
      toast.error("Failed to mark selected notifications as read")
      console.error("Error marking multiple notifications as read:", error)
    },
  })

  // Process and return data based on query type
  const notifications = isMenu 
    ? menuQuery.data?.notifications ?? []
    : infiniteQuery.data?.pages.flatMap((page: NotificationsResponse) => page.notifications) ?? []

  const hasMore = isMenu
    ? menuQuery.data?.hasMore ?? false
    : infiniteQuery.hasNextPage ?? false

  return {
    notifications,
    hasMore,
    isLoading: isMenu ? menuQuery.isLoading : infiniteQuery.isLoading,
    error: isMenu ? menuQuery.error : infiniteQuery.error,
    refetch: isMenu ? menuQuery.refetch : infiniteQuery.refetch,
    fetchNextPage: !isMenu ? infiniteQuery.fetchNextPage : undefined,
    isFetchingNextPage: !isMenu ? infiniteQuery.isFetchingNextPage : undefined,
    unreadCount: unreadNotifications?.length ?? 0,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    deleteMultipleNotifications,
    markMultipleAsRead,
  }
} 
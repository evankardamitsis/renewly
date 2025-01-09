"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { notificationsApi } from "@/services/notifications"
import { Notification } from "@/types/database"
import { createClient } from "@/lib/supabase/client"
import { RealtimeChannel } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { NotificationItem } from "@/components/notifications/notification-item"
import { Checkbox } from "@/components/ui/checkbox"

interface AllNotificationsProps {
    userId: string
}

const NOTIFICATIONS_PER_PAGE = 20

export function AllNotifications({ userId }: AllNotificationsProps) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [hasMore, setHasMore] = useState(false)
    const [page, setPage] = useState(1)
    const [isBulkEditMode, setIsBulkEditMode] = useState(false)
    const router = useRouter()
    const channelRef = useRef<RealtimeChannel | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)
    const isInitialLoadRef = useRef(true)
    const totalItemsRef = useRef(0)

    // Memoized notification handlers
    const handleNewNotification = useCallback((newNotification: Notification) => {
        setNotifications(prev => {
            // Avoid duplicate notifications
            if (prev.some(n => n.id === newNotification.id)) {
                return prev;
            }

            // If we're on page 1, add to the top and remove last item if needed
            if (page === 1) {
                const updatedNotifications = [newNotification, ...prev];
                if (updatedNotifications.length > NOTIFICATIONS_PER_PAGE) {
                    updatedNotifications.pop();
                }
                return updatedNotifications;
            }

            // If we're not on page 1, show a toast and don't update the list
            toast.info('New notification received', {
                description: 'Refresh to see the latest notifications',
                action: {
                    label: 'Refresh',
                    onClick: () => {
                        setPage(1);
                        notificationsApi.invalidateCache(userId);
                    }
                }
            });
            return prev;
        });

        totalItemsRef.current += 1;
        setHasMore(true);

        toast.info(newNotification.title, {
            description: newNotification.message,
        });
    }, [page, userId]);

    const handleUpdatedNotification = useCallback((updatedNotification: Notification) => {
        setNotifications(prev => {
            // Only update if the notification is in the current page
            if (!prev.some(n => n.id === updatedNotification.id)) {
                return prev;
            }
            return prev.map(n =>
                n.id === updatedNotification.id ? updatedNotification : n
            );
        });
    }, []);

    const handleDeletedNotification = useCallback((deletedNotification: Notification) => {
        setNotifications(prev => {
            // Only update if the notification is in the current page
            if (!prev.some(n => n.id === deletedNotification.id)) {
                return prev;
            }
            const filtered = prev.filter(n => n.id !== deletedNotification.id);
            totalItemsRef.current = Math.max(0, totalItemsRef.current - 1);

            // Update hasMore based on total items
            if (filtered.length < NOTIFICATIONS_PER_PAGE && totalItemsRef.current > filtered.length) {
                // We need to fetch more items to fill the page
                setPage(1);
                notificationsApi.invalidateCache(userId);
            }

            return filtered;
        });
    }, [userId]);

    // Handle real-time notifications subscription
    useEffect(() => {
        const supabase = createClient()
        channelRef.current = supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        handleNewNotification(payload.new as Notification);
                    } else if (payload.eventType === 'UPDATE') {
                        handleUpdatedNotification(payload.new as Notification);
                    } else if (payload.eventType === 'DELETE') {
                        handleDeletedNotification(payload.old as Notification);
                    }
                }
            )
            .subscribe()

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current)
                channelRef.current = null
            }
        }
    }, [userId, handleNewNotification, handleUpdatedNotification, handleDeletedNotification])

    // Handle notifications loading
    useEffect(() => {
        const loadNotifications = async () => {
            try {
                // Cancel any ongoing requests
                if (abortControllerRef.current) {
                    abortControllerRef.current.abort()
                }

                // Create new AbortController for this request
                abortControllerRef.current = new AbortController()

                // Only show loading indicator on initial load or when loading more
                if (isInitialLoadRef.current || page > 1) {
                    setLoading(true)
                }

                const result = await notificationsApi.getAllNotifications(
                    userId,
                    page,
                    NOTIFICATIONS_PER_PAGE,
                    abortControllerRef.current.signal
                )

                setNotifications(prev => {
                    if (page === 1) {
                        totalItemsRef.current = result.notifications.length;
                        return result.notifications;
                    }
                    // Filter out any duplicates when appending new notifications
                    const newNotifications = result.notifications.filter(
                        newNotif => !prev.some(existingNotif => existingNotif.id === newNotif.id)
                    );
                    totalItemsRef.current = prev.length + newNotifications.length;
                    return [...prev, ...newNotifications];
                });

                setHasMore(result.hasMore)
                isInitialLoadRef.current = false
            } catch (error) {
                // Only show error if it's not an abort error
                if (error instanceof Error && error.name !== 'AbortError') {
                    console.error('Failed to load notifications:', error)
                    toast.error('Failed to load notifications')
                }
            } finally {
                setLoading(false)
            }
        }

        loadNotifications()

        return () => {
            // Cleanup: abort any ongoing requests when component unmounts or dependencies change
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
                abortControllerRef.current = null
            }
        }
    }, [userId, page])

    const handleRefresh = useCallback(async () => {
        try {
            setLoading(true);
            // Reset to first page
            setPage(1);
            // Invalidate cache
            notificationsApi.invalidateCache(userId);

            // Create new AbortController for this request
            const controller = new AbortController();

            // Fetch fresh data
            const result = await notificationsApi.getAllNotifications(
                userId,
                1,
                NOTIFICATIONS_PER_PAGE,
                controller.signal
            );

            // Update state with fresh data
            setNotifications(result.notifications);
            setHasMore(result.hasMore);
            totalItemsRef.current = result.notifications.length;

            toast.success('Notifications refreshed');
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                console.error('Failed to refresh notifications:', error);
                toast.error('Failed to refresh notifications');
            }
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const handleLoadMore = () => {
        setPage(prev => prev + 1)
    }

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            const controller = new AbortController()
            try {
                await notificationsApi.markAsRead(notification.id, controller.signal)
                setNotifications(prev =>
                    prev.map(n =>
                        n.id === notification.id ? { ...n, read: true } : n
                    )
                )
            } catch (error) {
                if (error instanceof Error && error.name !== 'AbortError') {
                    console.error('Failed to mark notification as read:', error)
                    toast.error('Failed to mark notification as read')
                }
            } finally {
                controller.abort() // Cleanup
            }
        }

        if (notification.action_url) {
            router.push(notification.action_url)
        }
    }

    const handleMarkAllAsRead = async () => {
        const controller = new AbortController()
        try {
            await notificationsApi.markAllAsRead(userId, controller.signal)
            setNotifications(prev =>
                prev.map(notification => ({
                    ...notification,
                    read: true
                }))
            )
            toast.success('All notifications marked as read')
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                console.error('Failed to mark all as read:', error)
                toast.error('Failed to mark all notifications as read')
            }
        } finally {
            controller.abort() // Cleanup
        }
    }

    const handleDeleteNotification = async (e: React.MouseEvent, notification: Notification) => {
        e.stopPropagation() // Prevent triggering the notification click
        const controller = new AbortController()
        try {
            await notificationsApi.deleteNotification(notification.id, userId, controller.signal)
            setNotifications(prev => prev.filter(n => n.id !== notification.id))
            toast.success('Notification removed')
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                console.error('Failed to delete notification:', error)
                toast.error('Failed to delete notification')
            }
        } finally {
            controller.abort() // Cleanup
        }
    }

    const handleDeleteAllNotifications = async () => {
        const controller = new AbortController()
        try {
            await notificationsApi.deleteAllNotifications(userId, controller.signal)
            setNotifications([])
            setHasMore(false)
            toast.success('All notifications removed')
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                console.error('Failed to delete all notifications:', error)
                toast.error('Failed to delete all notifications')
            }
        } finally {
            controller.abort() // Cleanup
        }
    }

    const handleSelectNotification = useCallback((notificationId: string, checked: boolean | "indeterminate") => {
        setSelectedNotifications(prev => {
            const newSet = new Set(prev);
            if (checked === true) {
                newSet.add(notificationId);
            } else {
                newSet.delete(notificationId);
            }
            return newSet;
        });
    }, []);

    const handleSelectAll = useCallback((checked: boolean | "indeterminate") => {
        if (checked === true) {
            setSelectedNotifications(new Set(notifications.map(n => n.id)));
        } else {
            setSelectedNotifications(new Set());
        }
    }, [notifications]);

    const handleDeleteSelected = async () => {
        if (selectedNotifications.size === 0) return;

        const controller = new AbortController();
        try {
            const notificationIds = Array.from(selectedNotifications);
            await notificationsApi.deleteMultiple(notificationIds, userId, controller.signal);

            setNotifications(prev => prev.filter(n => !selectedNotifications.has(n.id)));
            setSelectedNotifications(new Set());

            toast.success(`${notificationIds.length} notifications removed`);

            // If we've removed all notifications from the current page and there are more pages
            if (hasMore && notifications.length === selectedNotifications.size) {
                handleRefresh();
            }
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                console.error('Failed to delete notifications:', error);
                toast.error('Failed to delete selected notifications');
            }
        } finally {
            controller.abort();
        }
    };

    const handleMarkSelectedAsRead = async () => {
        if (selectedNotifications.size === 0) return;

        const controller = new AbortController();
        try {
            const notificationIds = Array.from(selectedNotifications);
            await notificationsApi.markMultipleAsRead(notificationIds, controller.signal);

            setNotifications(prev => prev.map(n =>
                selectedNotifications.has(n.id) ? { ...n, read: true } : n
            ));
            setSelectedNotifications(new Set());

            toast.success(`${notificationIds.length} notifications marked as read`);
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                console.error('Failed to mark notifications as read:', error);
                toast.error('Failed to mark selected notifications as read');
            }
        } finally {
            controller.abort();
        }
    };

    // Add handler to exit bulk edit mode
    const handleExitBulkEdit = useCallback(() => {
        setIsBulkEditMode(false);
        setSelectedNotifications(new Set());
    }, []);

    if (loading && page === 1) {
        return (
            <div className="min-h-[400px] w-full flex items-center justify-center p-8 border rounded-lg">
                <div className="animate-pulse text-muted-foreground">Loading notifications...</div>
            </div>
        )
    }

    const unreadCount = notifications.filter(n => !n.read).length;
    const hasSelected = selectedNotifications.size > 0;

    return (
        <div className="space-y-4">
            {notifications.length > 0 && (
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        {isBulkEditMode ? (
                            <>
                                <Checkbox
                                    checked={notifications.length > 0 && selectedNotifications.size === notifications.length}
                                    onCheckedChange={handleSelectAll}
                                    aria-label="Select all notifications"
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleExitBulkEdit}
                                >
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsBulkEditMode(true)}
                            >
                                Select Multiple
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={loading}
                        >
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        {isBulkEditMode && hasSelected ? (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleMarkSelectedAsRead}
                                >
                                    Mark selected as read ({selectedNotifications.size})
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleDeleteSelected}
                                >
                                    Remove selected ({selectedNotifications.size})
                                </Button>
                            </>
                        ) : !isBulkEditMode && (
                            <>
                                {unreadCount > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleMarkAllAsRead}
                                    >
                                        Mark all as read
                                    </Button>
                                )}
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleDeleteAllNotifications}
                                >
                                    Remove all
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {notifications.length === 0 ? (
                <div className="min-h-[400px] w-full flex flex-col items-center justify-center p-8 border rounded-lg">
                    <div className="text-muted-foreground mb-4">No notifications</div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </Button>
                </div>
            ) : (
                <div className="min-h-[400px] space-y-2">
                    {notifications.map(notification => (
                        <div key={notification.id} className="group relative flex gap-2 items-start">
                            {isBulkEditMode && (
                                <div className="pt-2 pl-2">
                                    <Checkbox
                                        checked={selectedNotifications.has(notification.id)}
                                        onCheckedChange={(checked) => handleSelectNotification(notification.id, checked)}
                                        aria-label={`Select notification: ${notification.title}`}
                                    />
                                </div>
                            )}
                            <div className={`flex-1 ${isBulkEditMode ? '' : 'pl-2'}`}>
                                <NotificationItem
                                    notification={notification}
                                    onClick={isBulkEditMode ?
                                        () => handleSelectNotification(notification.id, !selectedNotifications.has(notification.id))
                                        : handleNotificationClick}
                                    className="rounded-lg border bg-card"
                                    dateFormatter={(date) => formatDistanceToNow(date, { addSuffix: true })}
                                />
                                {!isBulkEditMode && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => handleDeleteNotification(e, notification)}
                                    >
                                        Remove
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}

                    {hasMore && (
                        <div className="flex justify-center pt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLoadMore}
                                disabled={loading}
                            >
                                {loading ? 'Loading...' : 'Load more'}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
} 
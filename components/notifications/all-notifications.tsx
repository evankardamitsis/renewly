"use client"

import { useEffect, useState } from "react"
import { notificationsApi } from "@/services/notifications"
import { Notification } from "@/types/database"
import { createClient } from "@/lib/supabase/client"
import { RealtimeChannel } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { NotificationItem } from "@/components/notifications/notification-item"

interface AllNotificationsProps {
    userId: string
}

export function AllNotifications({ userId }: AllNotificationsProps) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        let channel: RealtimeChannel | null = null;

        const loadNotifications = async () => {
            try {
                setLoading(true)
                const allNotifications = await notificationsApi.getAllNotifications(userId)
                setNotifications(allNotifications)

                // Subscribe to notification changes
                const supabase = createClient()
                channel = supabase
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
                                const newNotification = payload.new as Notification
                                setNotifications(prev => [newNotification, ...prev])
                                toast.info(newNotification.title, {
                                    description: newNotification.message,
                                })
                            } else if (payload.eventType === 'UPDATE') {
                                const updatedNotification = payload.new as Notification
                                setNotifications(prev =>
                                    prev.map(n =>
                                        n.id === updatedNotification.id ? updatedNotification : n
                                    )
                                )
                            }
                        }
                    )

                await channel.subscribe()
            } catch (error) {
                console.error('Failed to load notifications:', error)
                toast.error('Failed to load notifications')
            } finally {
                setLoading(false)
            }
        }

        loadNotifications()

        return () => {
            if (channel) {
                const supabase = createClient()
                supabase.removeChannel(channel)
            }
        }
    }, [userId])

    const handleNotificationClick = async (notification: Notification) => {
        try {
            if (!notification.read) {
                await notificationsApi.markAsRead(notification.id)
                setNotifications(prev =>
                    prev.map(n =>
                        n.id === notification.id ? { ...n, read: true } : n
                    )
                )
            }

            if (notification.action_url) {
                router.push(notification.action_url)
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error)
            toast.error('Failed to mark notification as read')
        }
    }

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsApi.markAllAsRead(userId)
            setNotifications(prev =>
                prev.map(notification => ({
                    ...notification,
                    read: true
                }))
            )
            toast.success('All notifications marked as read')
        } catch (error) {
            console.error('Failed to mark all as read:', error)
            toast.error('Failed to mark all notifications as read')
        }
    }

    const handleDeleteNotification = async (e: React.MouseEvent, notification: Notification) => {
        e.stopPropagation(); // Prevent triggering the notification click
        try {
            await notificationsApi.deleteNotification(notification.id);
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
            toast.success('Notification removed');
        } catch (error) {
            console.error('Failed to delete notification:', error);
            toast.error('Failed to delete notification');
        }
    };

    const handleDeleteAllNotifications = async () => {
        try {
            await notificationsApi.deleteAllNotifications(userId);
            setNotifications([]);
            toast.success('All notifications removed');
        } catch (error) {
            console.error('Failed to delete all notifications:', error);
            toast.error('Failed to delete all notifications');
        }
    };

    if (loading) {
        return (
            <div className="min-h-[400px] w-full flex items-center justify-center p-8 border rounded-lg">
                <div className="animate-pulse text-muted-foreground">Loading notifications...</div>
            </div>
        )
    }

    const unreadCount = notifications.filter(n => !n.read).length

    return (
        <div className="space-y-4">
            {notifications.length > 0 && (
                <div className="flex justify-end gap-2">
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
                </div>
            )}

            {notifications.length === 0 ? (
                <div className="min-h-[400px] w-full flex items-center justify-center p-8 border rounded-lg">
                    <div className="text-muted-foreground">No notifications</div>
                </div>
            ) : (
                <div className="min-h-[400px] space-y-2">
                    {notifications.map(notification => (
                        <div key={notification.id} className="group relative">
                            <NotificationItem
                                notification={notification}
                                onClick={handleNotificationClick}
                                className="rounded-lg border bg-card"
                                dateFormatter={(date) => formatDistanceToNow(date, { addSuffix: true })}
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => handleDeleteNotification(e, notification)}
                            >
                                Remove
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
} 
import { useState, useEffect, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { notificationsApi } from '@/services/notifications'
import { Notification } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { RealtimeChannel } from '@supabase/supabase-js'

export function NotificationsMenu() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [open, setOpen] = useState(false)
    const [isNavigating, setIsNavigating] = useState(false)
    const router = useRouter()

    // Close dropdown after navigation
    useEffect(() => {
        if (isNavigating) {
            setOpen(false)
            setIsNavigating(false)
        }
    }, [isNavigating])

    const handleViewAll = useCallback(() => {
        setIsNavigating(true)
        router.push('/notifications')
    }, [router])

    const handleNotificationClick = useCallback(async (notification: Notification) => {
        try {
            if (!notification.read) {
                await notificationsApi.markAsRead(notification.id)
                setNotifications(prev =>
                    prev.map(n =>
                        n.id === notification.id ? { ...n, read: true } : n
                    )
                )
                setUnreadCount(prev => Math.max(0, prev - 1))
            }

            if (notification.action_url) {
                setIsNavigating(true)
                router.push(notification.action_url)
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error)
        }
    }, [router])

    useEffect(() => {
        let channel: RealtimeChannel | null = null;

        const loadNotifications = async () => {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return;

                // Only fetch unread notifications for the menu
                const unreadNotifications = await notificationsApi.getUnreadNotifications(user.id);
                setNotifications(unreadNotifications);
                setUnreadCount(unreadNotifications.length);

                // Subscribe to new notifications
                channel = supabase
                    .channel('public:notifications')
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'notifications',
                            filter: `user_id=eq.${user.id}`,
                        },
                        (payload) => {
                            if (payload.eventType === 'INSERT') {
                                const newNotification = payload.new as Notification;
                                if (!newNotification.read) {
                                    setNotifications(prev => [newNotification, ...prev]);
                                    setUnreadCount(prev => prev + 1);
                                    toast.info(newNotification.title, {
                                        description: newNotification.message,
                                    });
                                }
                            } else if (payload.eventType === 'UPDATE') {
                                const updatedNotification = payload.new as Notification;
                                setNotifications(prev => {
                                    // Remove notification if it's now read
                                    const updated = prev.filter(n =>
                                        n.id !== updatedNotification.id || !updatedNotification.read
                                    );
                                    const newCount = updated.length;
                                    setUnreadCount(newCount);
                                    return updated;
                                });
                            }
                        }
                    );

                await channel.subscribe();
            } catch (error) {
                console.error('Failed to load notifications:', error)
            }
        }

        loadNotifications()

        return () => {
            if (channel) {
                const supabase = createClient()
                supabase.removeChannel(channel)
            }
        }
    }, [])

    const handleMarkAllAsRead = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("You must be logged in");
                return;
            }

            await notificationsApi.markAllAsRead(user.id);
            setNotifications(prev =>
                prev.map(notification => ({
                    ...notification,
                    read: true
                }))
            );
            setUnreadCount(0);
            setOpen(false);
            toast.success("All notifications marked as read");
        } catch (error) {
            console.error("Failed to mark all as read:", error);
            toast.error(error instanceof Error ? error.message : "Failed to mark all notifications as read");
        }
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between p-2 border-b">
                    <span className="text-sm font-medium">Notifications</span>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={handleMarkAllAsRead}
                            >
                                Mark all as read
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={handleViewAll}
                        >
                            View all
                        </Button>
                    </div>
                </div>
                {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                        No unread notifications
                    </div>
                ) : (
                    notifications.map(notification => (
                        <DropdownMenuItem
                            key={notification.id}
                            className="p-4 cursor-pointer bg-muted/50"
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <div>
                                <div className="font-medium">{notification.title}</div>
                                <div className="text-sm text-muted-foreground">
                                    {notification.message}
                                </div>
                            </div>
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
} 
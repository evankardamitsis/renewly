import { useState, useEffect } from 'react'
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
    const router = useRouter()

    useEffect(() => {
        let channel: RealtimeChannel | null = null;

        const loadNotifications = async () => {
            try {
                console.log("Loading notifications...");
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    console.log("No user found");
                    return;
                }

                console.log("Fetching notifications for user:", user.id);
                const allNotifications = await notificationsApi.getAllNotifications(user.id);
                const unreadNotifications = allNotifications.filter(n => !n.read);
                console.log("Fetched notifications:", allNotifications);
                console.log("Unread count:", unreadNotifications.length);
                setNotifications(allNotifications);
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
                            console.log("Received notification change:", payload);
                            if (payload.eventType === 'INSERT') {
                                const newNotification = payload.new as Notification;
                                setNotifications(prev => {
                                    const updated = [newNotification, ...prev];
                                    console.log("Updated notifications:", updated);
                                    return updated;
                                });
                                if (!newNotification.read) {
                                    setUnreadCount(prev => prev + 1);
                                }
                                toast.info(newNotification.title, {
                                    description: newNotification.message,
                                });
                            } else if (payload.eventType === 'UPDATE') {
                                const updatedNotification = payload.new as Notification;
                                setNotifications(prev => {
                                    const updated = prev.map(n =>
                                        n.id === updatedNotification.id ? updatedNotification : n
                                    );
                                    const newCount = updated.filter(n => !n.read).length;
                                    setUnreadCount(newCount);
                                    return updated;
                                });
                            }
                        }
                    );

                console.log("Subscribing to channel...");
                await channel.subscribe();
                console.log("Successfully subscribed to notifications channel");
            } catch (error) {
                console.error('Failed to load notifications:', error)
            }
        }

        loadNotifications()

        return () => {
            if (channel) {
                console.log("Cleaning up subscription...");
                const supabase = createClient()
                supabase.removeChannel(channel)
            }
        }
    }, [])

    const handleNotificationClick = async (notification: Notification) => {
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
                router.push(notification.action_url)
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error)
        }
    }

    const handleMarkAllAsRead = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await notificationsApi.markAllAsRead(user.id);

            // Update local state
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
            toast.success("Marked all notifications as read");
        } catch (error) {
            console.error("Failed to mark all as read:", error);
            toast.error("Failed to mark all as read");
        }
    };

    return (
        <DropdownMenu>
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
                {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                        No new notifications
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between p-2 border-b">
                            <span className="text-sm font-medium">Notifications</span>
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
                        </div>
                        {notifications.map(notification => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={`p-4 cursor-pointer ${!notification.read ? 'bg-muted/50' : ''}`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div>
                                    <div className="font-medium">{notification.title}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {notification.message}
                                    </div>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
} 
import { useEffect, useState } from "react";
import { Notification } from "@/types/database";
import { notificationsApi } from "@/services/notifications";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { RealtimeChannel } from "@supabase/supabase-js";

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        let channel: RealtimeChannel | null = null;

        const loadNotifications = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Fetch unread notifications
                const unreadNotifications = await notificationsApi
                    .getUnreadNotifications(user.id);
                setNotifications(unreadNotifications);
                setUnreadCount(unreadNotifications.length);

                // Subscribe to notifications changes
                channel = supabase
                    .channel("public:notifications")
                    .on(
                        "postgres_changes",
                        {
                            event: "*",
                            schema: "public",
                            table: "notifications",
                            filter: `user_id=eq.${user.id}`,
                        },
                        (payload) => {
                            if (payload.eventType === "INSERT") {
                                const newNotification = payload
                                    .new as Notification;
                                if (!newNotification.read) {
                                    setNotifications(
                                        (prev) => [newNotification, ...prev],
                                    );
                                    setUnreadCount((prev) => prev + 1);
                                    toast.info(newNotification.title, {
                                        description: newNotification.message,
                                    });
                                }
                            } else if (payload.eventType === "UPDATE") {
                                const updatedNotification = payload
                                    .new as Notification;
                                setNotifications((prev) => {
                                    const updated = prev.filter((n) =>
                                        n.id !== updatedNotification.id ||
                                        !updatedNotification.read
                                    );
                                    const newCount = updated.filter((n) =>
                                        !n.read
                                    ).length;
                                    setUnreadCount(newCount);
                                    return updated;
                                });
                            }
                        },
                    );

                await channel.subscribe();
            } catch (error) {
                console.error("Failed to load notifications:", error);
            }
        };

        loadNotifications();

        return () => {
            if (channel) {
                const supabase = createClient();
                supabase.removeChannel(channel);
            }
        };
    }, []);

    const markAsRead = async (notificationId: string) => {
        try {
            await notificationsApi.markAsRead(notificationId);
            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === notificationId ? { ...n, read: true } : n
                )
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("You must be logged in");
                return;
            }

            await notificationsApi.markAllAsRead(user.id);
            setNotifications((prev) =>
                prev.map((notification) => ({
                    ...notification,
                    read: true,
                }))
            );
            setUnreadCount(0);
            toast.success("All notifications marked as read");
        } catch (error) {
            console.error("Failed to mark all as read:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to mark all notifications as read",
            );
        }
    };

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
    };
}

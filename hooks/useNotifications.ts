import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Notification } from "@/types/database";
import { useSettings } from "@/contexts/settings-context";
import { playNotificationSound } from "@/lib/sounds";

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { soundEnabled } = useSettings();
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const supabase = createClient();

        // Get current user
        const getCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                return user.id;
            }
            return null;
        };

        // Fetch initial notifications
        const fetchNotifications = async (uid: string) => {
            const { data: notifications } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", uid)
                .order("created_at", { ascending: false })
                .limit(10);

            if (notifications) {
                setNotifications(notifications);
                setUnreadCount(notifications.filter((n) => !n.read).length);
            }
        };

        // Initialize
        getCurrentUser().then((uid) => {
            if (uid) fetchNotifications(uid);
        });

        // Subscribe to notification changes
        const channel = supabase
            .channel("notifications")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${userId}`,
                },
                async (payload) => {
                    if (payload.eventType === "INSERT") {
                        const newNotification = payload.new as Notification;
                        setNotifications((prev) => [newNotification, ...prev]);
                        setUnreadCount((prev) => prev + 1);

                        if (soundEnabled) {
                            await playNotificationSound();
                        }
                    } else if (payload.eventType === "UPDATE") {
                        const updatedNotification = payload.new as Notification;
                        setNotifications((prev) =>
                            prev.map((n) =>
                                n.id === updatedNotification.id
                                    ? updatedNotification
                                    : n
                            )
                        );
                        // Recalculate unread count
                        setUnreadCount((prev) => {
                            const wasUnread = prev > 0 && !payload.old.read;
                            const isNowRead = updatedNotification.read;
                            return wasUnread && isNowRead ? prev - 1 : prev;
                        });
                    }
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [soundEnabled, userId]);

    const markAsRead = async (id: string) => {
        const supabase = createClient();
        const { error } = await supabase
            .from("notifications")
            .update({ read: true })
            .eq("id", id)
            .eq("user_id", userId);

        if (!error) {
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
            setUnreadCount((prev) => prev - 1);
        }
    };

    const markAllAsRead = async () => {
        if (!userId) return;

        const supabase = createClient();
        const { error } = await supabase
            .rpc("mark_all_notifications_read", {
                p_user_id: userId,
            });

        if (!error) {
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        }
    };

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
    };
}

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Notification } from "@/types/database";
import { useSettings } from "@/contexts/settings-context";
import { playNotificationSound } from "@/lib/sounds";

const supabase = createClient();
const NOTIFICATION_LIMIT = 10;

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [userId, setUserId] = useState<string | null>(null);
    const { soundEnabled } = useSettings();
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // Fetch notifications with proper error handling
    const fetchNotifications = useCallback(async (uid: string) => {
        try {
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", uid)
                .order("created_at", { ascending: false })
                .limit(NOTIFICATION_LIMIT);

            if (error) throw error;

            if (data) {
                setNotifications(data);
                const unreadCount = data.filter((n) => !n.read).length;
                setUnreadCount(unreadCount);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    }, []);

    // Set up real-time subscription when userId is available
    useEffect(() => {
        if (!userId) return;

        // Cleanup previous subscription if exists
        if (channelRef.current) {
            channelRef.current.unsubscribe();
        }

        // Subscribe to notifications
        channelRef.current = supabase
            .channel(`notifications:${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${userId}`,
                },
                async (payload) => {
                    try {
                        if (payload.eventType === "INSERT") {
                            const newNotification = payload.new as Notification;
                            if (soundEnabled) {
                                await playNotificationSound();
                            }
                            setNotifications(
                                (prev) => [
                                    newNotification,
                                    ...prev.slice(0, NOTIFICATION_LIMIT - 1),
                                ],
                            );
                            setUnreadCount((prev) => prev + 1);
                        } else if (payload.eventType === "UPDATE") {
                            const updatedNotification = payload
                                .new as Notification;
                            setNotifications((prev) =>
                                prev.map((n) =>
                                    n.id === updatedNotification.id
                                        ? updatedNotification
                                        : n
                                )
                            );
                            // Update unread count if read status changed
                            if (payload.old.read !== updatedNotification.read) {
                                setUnreadCount((prev) =>
                                    updatedNotification.read
                                        ? prev - 1
                                        : prev + 1
                                );
                            }
                        } else if (payload.eventType === "DELETE") {
                            const deletedNotification = payload
                                .old as Notification;
                            setNotifications((prev) =>
                                prev.filter((n) =>
                                    n.id !== deletedNotification.id
                                )
                            );
                            if (!deletedNotification.read) {
                                setUnreadCount((prev) => Math.max(0, prev - 1));
                            }
                        }
                    } catch (error) {
                        console.error(
                            "Error handling notification change:",
                            error,
                        );
                    }
                },
            )
            .subscribe();

        return () => {
            if (channelRef.current) {
                channelRef.current.unsubscribe();
            }
        };
    }, [userId, soundEnabled]);

    // Initialize user and fetch initial notifications
    useEffect(() => {
        const initializeNotifications = async () => {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error) throw error;

                if (user) {
                    setUserId(user.id);
                    await fetchNotifications(user.id);
                }
            } catch (error) {
                console.error("Error initializing notifications:", error);
            }
        };

        initializeNotifications();

        return () => {
            if (channelRef.current) {
                channelRef.current.unsubscribe();
            }
        };
    }, [fetchNotifications]);

    const markAsRead = useCallback(async (id: string) => {
        try {
            const { error } = await supabase
                .from("notifications")
                .update({ read: true })
                .eq("id", id);

            if (error) throw error;

            setNotifications((prev) =>
                prev.map((n) => n.id === id ? { ...n, read: true } : n)
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error marking notification as read:", error);
            throw error;
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        if (!userId) return;

        try {
            const { error } = await supabase
                .rpc("mark_all_notifications_read", {
                    p_user_id: userId,
                });

            if (error) throw error;

            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
            throw error;
        }
    }, [userId]);

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        isInitialized: userId !== null,
    };
}

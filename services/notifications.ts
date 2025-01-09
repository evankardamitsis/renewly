import { createClient } from "@/lib/supabase/client";
import { Notification } from "@/types/database";

const supabase = createClient();

export const notificationsApi = {
    async getUnreadNotifications(userId: string): Promise<Notification[]> {
        const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .eq("read", false)
            .order("created_at", { ascending: false })
            .abortSignal(new AbortController().signal);

        if (error) throw error;
        return data as Notification[];
    },

    async getAllNotifications(
        userId: string,
        page = 1,
        limit = 20,
    ): Promise<{ notifications: Notification[]; hasMore: boolean }> {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await supabase
            .from("notifications")
            .select("*", {
                count: "exact",
            })
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .range(from, to)
            .abortSignal(new AbortController().signal);

        if (error) throw error;
        return {
            notifications: data as Notification[],
            hasMore: count ? count > to + 1 : false,
        };
    },

    async markAsRead(notificationId: string): Promise<void> {
        const { error } = await supabase
            .from("notifications")
            .update({ read: true })
            .eq("id", notificationId);

        if (error) throw error;
    },

    async markAllAsRead(userId: string): Promise<void> {
        const { error } = await supabase
            .from("notifications")
            .update({ read: true })
            .eq("user_id", userId)
            .eq("read", false);

        if (error) throw error;
    },

    subscribeToNotifications(
        userId: string,
        onNotification: (notification: Notification) => void,
    ) {
        return supabase
            .channel(`notifications:${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => onNotification(payload.new as Notification),
            )
            .subscribe();
    },
};

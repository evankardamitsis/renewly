import { createClient } from "@/lib/supabase/client";
import { Notification } from "@/types/database";

const supabase = createClient();

interface NotificationCache {
    [key: string]: {
        notifications: Notification[];
        hasMore: boolean;
        timestamp: number;
        totalPages: number;
    };
}

const CACHE_DURATION = 1000 * 60; // 1 minute
const notificationCache: NotificationCache = {};
const BATCH_SIZE = 50; // Maximum number of operations to batch together

function getCacheKey(userId: string, page: number): string {
    return `${userId}:${page}`;
}

function isCacheValid(cacheKey: string): boolean {
    const cache = notificationCache[cacheKey];
    if (!cache) return false;
    return Date.now() - cache.timestamp < CACHE_DURATION;
}

export const notificationsApi = {
    async getUnreadNotifications(
        userId: string,
        signal?: AbortSignal
    ): Promise<Notification[]> {
        const query = supabase
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .eq("read", false)
            .order("created_at", { ascending: false });

        if (signal) query.abortSignal(signal);

        const { data, error } = await query;

        if (error) throw error;
        return data as Notification[];
    },

    async getAllNotifications(
        userId: string,
        page = 1,
        limit = 20,
        signal?: AbortSignal
    ): Promise<{ notifications: Notification[]; hasMore: boolean }> {
        const cacheKey = getCacheKey(userId, page);
        
        // Check cache first
        if (isCacheValid(cacheKey)) {
            const cache = notificationCache[cacheKey];
            return {
                notifications: cache.notifications,
                hasMore: cache.hasMore,
            };
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const query = supabase
            .from("notifications")
            .select("*", {
                count: "exact",
            })
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .range(from, to);

        if (signal) query.abortSignal(signal);

        const { data, error, count } = await query;

        if (error) throw error;

        const hasMore = count ? count > to + 1 : false;
        const totalPages = count ? Math.ceil(count / limit) : page;

        // Update cache
        notificationCache[cacheKey] = {
            notifications: data as Notification[],
            hasMore,
            timestamp: Date.now(),
            totalPages,
        };

        return {
            notifications: data as Notification[],
            hasMore,
        };
    },

    invalidateCache(userId: string) {
        // Remove all cache entries for this user
        Object.keys(notificationCache)
            .filter(key => key.startsWith(`${userId}:`))
            .forEach(key => delete notificationCache[key]);
    },

    async markAsRead(
        notificationId: string,
        signal?: AbortSignal
    ): Promise<void> {
        const query = supabase
            .from("notifications")
            .update({ read: true })
            .eq("id", notificationId);

        if (signal) query.abortSignal(signal);

        const { error } = await query;

        if (error) throw error;
    },

    async markAllAsRead(
        userId: string,
        signal?: AbortSignal
    ): Promise<void> {
        const query = supabase
            .rpc("mark_all_notifications_read", {
                p_user_id: userId
            });

        if (signal) query.abortSignal(signal);

        const { error } = await query;

        if (error) throw error;
        
        // Invalidate cache after marking all as read
        this.invalidateCache(userId);
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
                (payload) => {
                    // Invalidate cache when new notification arrives
                    this.invalidateCache(userId);
                    onNotification(payload.new as Notification);
                },
            )
            .subscribe();
    },

    async deleteNotification(
        notificationId: string,
        userId: string,
        signal?: AbortSignal
    ): Promise<void> {
        const query = supabase
            .rpc("delete_notification", {
                p_notification_id: notificationId,
                p_user_id: userId
            });

        if (signal) query.abortSignal(signal);

        const { error } = await query;

        if (error) throw error;

        // Invalidate cache after deletion
        this.invalidateCache(userId);
    },

    async deleteAllNotifications(
        userId: string,
        signal?: AbortSignal
    ): Promise<void> {
        const query = supabase
            .rpc("delete_all_notifications", {
                p_user_id: userId
            });

        if (signal) query.abortSignal(signal);

        const { error } = await query;

        if (error) throw error;

        // Invalidate cache after deletion
        this.invalidateCache(userId);
    },

    async markMultipleAsRead(
        notificationIds: string[],
        signal?: AbortSignal
    ): Promise<void> {
        // Split into batches if needed
        for (let i = 0; i < notificationIds.length; i += BATCH_SIZE) {
            const batch = notificationIds.slice(i, i + BATCH_SIZE);
            const query = supabase
                .from("notifications")
                .update({ read: true })
                .in("id", batch);

            if (signal) query.abortSignal(signal);

            const { error } = await query;
            if (error) throw error;
        }
    },

    async deleteMultiple(
        notificationIds: string[],
        userId: string,
        signal?: AbortSignal
    ): Promise<void> {
        // Split into batches if needed
        for (let i = 0; i < notificationIds.length; i += BATCH_SIZE) {
            const batch = notificationIds.slice(i, i + BATCH_SIZE);
            const query = supabase
                .rpc("delete_multiple_notifications", {
                    p_notification_ids: batch,
                    p_user_id: userId
                });

            if (signal) query.abortSignal(signal);

            const { error } = await query;
            if (error) throw error;
        }
    },
};

import { createClient } from "@/lib/supabase/client";
import { Notification, NotificationType } from "@/types/database";

const supabase = createClient();
const BATCH_SIZE = 50; // Maximum number of operations to batch together

interface CreateNotificationData {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    projectId?: string;
    taskId?: string;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
}

export const notificationsApi = {
    async getUnreadNotifications(
        userId: string,
        signal?: AbortSignal,
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
        page: number,
        limit: number,
        offset?: number,
    ): Promise<{ notifications: Notification[]; hasMore: boolean }> {
        const query = supabase
            .from("notifications")
            .select("*", {
                count: "exact",
            })
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        // If offset is provided, use it; otherwise, calculate from page
        const calculatedOffset = offset ?? (page - 1) * limit;
        query.range(calculatedOffset, calculatedOffset + limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        const hasMore = count ? count > calculatedOffset + limit : false;

        return {
            notifications: data as Notification[],
            hasMore,
        };
    },

    async markAsRead(
        notificationId: string,
        signal?: AbortSignal,
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
        signal?: AbortSignal,
    ): Promise<void> {
        const query = supabase
            .rpc("mark_all_notifications_read", {
                p_user_id: userId,
            });

        if (signal) query.abortSignal(signal);

        const { error } = await query;

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
                (payload) => {
                    onNotification(payload.new as Notification);
                },
            )
            .subscribe();
    },

    async deleteNotification(
        notificationId: string,
        userId: string,
        signal?: AbortSignal,
    ): Promise<void> {
        const query = supabase
            .rpc("delete_notification", {
                p_notification_id: notificationId,
                p_user_id: userId,
            });

        if (signal) query.abortSignal(signal);

        const { error } = await query;

        if (error) throw error;
    },

    async deleteAllNotifications(
        userId: string,
        signal?: AbortSignal,
    ): Promise<void> {
        const query = supabase
            .rpc("delete_all_notifications", {
                p_user_id: userId,
            });

        if (signal) query.abortSignal(signal);

        const { error } = await query;

        if (error) throw error;
    },

    async markMultipleAsRead(
        notificationIds: string[],
        signal?: AbortSignal,
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
        signal?: AbortSignal,
    ): Promise<void> {
        // Split into batches if needed
        for (let i = 0; i < notificationIds.length; i += BATCH_SIZE) {
            const batch = notificationIds.slice(i, i + BATCH_SIZE);
            const query = supabase
                .rpc("delete_multiple_notifications", {
                    p_notification_ids: batch,
                    p_user_id: userId,
                });

            if (signal) query.abortSignal(signal);

            const { error } = await query;
            if (error) throw error;
        }
    },

    async createNotification(
        data: CreateNotificationData,
        signal?: AbortSignal,
    ) {
        const supabase = createClient();
        const query = supabase
            .from("notifications")
            .insert([{
                user_id: data.userId,
                type: data.type,
                title: data.title,
                message: data.message,
                project_id: data.projectId,
                task_id: data.taskId,
                action_url: data.actionUrl,
                metadata: data.metadata,
                created_at: new Date().toISOString(),
                read: false,
            }]);

        if (signal) query.abortSignal(signal);
        const { error } = await query;

        if (error) throw error;
    },
};

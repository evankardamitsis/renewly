import { createClient } from "@/lib/supabase/client";
import { Notification } from "@/types/database";

export const notificationsApi = {
    async getUnreadNotifications(userId: string): Promise<Notification[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .eq("read", false)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getAllNotifications(userId: string): Promise<Notification[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async markAsRead(notificationId: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from("notifications")
            .update({ read: true })
            .eq("id", notificationId);

        if (error) throw error;
    },

    async markAllAsRead(userId: string): Promise<void> {
        const supabase = createClient();

        const { error } = await supabase
            .rpc("mark_all_notifications_read", {
                p_user_id: userId,
            });

        if (error) {
            console.error("Error marking all notifications as read:", error);
            throw new Error(
                `Failed to mark notifications as read: ${error.message}`,
            );
        }
    },

    async deleteNotification(notificationId: string): Promise<void> {
        const supabase = createClient();

        // First get the user to ensure we're deleting our own notification
        const { data: { user }, error: userError } = await supabase.auth
            .getUser();
        if (userError) throw userError;
        if (!user) throw new Error("Not authenticated");

        const { error } = await supabase
            .rpc("delete_notification", {
                p_notification_id: notificationId,
                p_user_id: user.id,
            });

        if (error) {
            console.error("Error deleting notification:", error);
            throw new Error(`Failed to delete notification: ${error.message}`);
        }
    },

    async deleteAllNotifications(userId: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .rpc("delete_all_notifications", {
                p_user_id: userId,
            });

        if (error) {
            console.error("Error deleting all notifications:", error);
            throw new Error(
                `Failed to delete all notifications: ${error.message}`,
            );
        }
    },
};

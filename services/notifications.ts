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
        console.log("Marking all notifications as read for user:", userId);

        // First, get all unread notifications to verify the update
        const { data: unreadBefore } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", userId)
            .eq("read", false);

        console.log(
            `Found ${
                unreadBefore?.length || 0
            } unread notifications before update`,
        );

        // Update all unread notifications
        const { data: updated, error } = await supabase
            .from("notifications")
            .update({ read: true })
            .eq("user_id", userId)
            .eq("read", false)
            .select();

        if (error) {
            console.error("Error marking all as read:", error);
            throw error;
        }

        // Verify the update
        const { data: unreadAfter } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", userId)
            .eq("read", false);

        console.log(`Updated ${updated?.length || 0} notifications`);
        console.log(
            `Remaining unread notifications: ${unreadAfter?.length || 0}`,
        );

        if (unreadAfter && unreadAfter.length > 0) {
            console.error(
                "Some notifications were not marked as read:",
                unreadAfter,
            );
            throw new Error("Failed to mark all notifications as read");
        }
    },
};

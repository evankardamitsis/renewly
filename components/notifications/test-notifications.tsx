import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { playNotificationSound } from "@/lib/sounds";

export function TestNotifications() {
    const [isCreating, setIsCreating] = useState(false);
    const supabase = createClient();

    const createTestNotification = async () => {
        try {
            setIsCreating(true);

            // Play sound first to ensure it works
            await playNotificationSound();

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            // Create a test notification
            const { error: notificationError } = await supabase
                .from("notifications")
                .insert({
                    user_id: user.id,
                    type: "TEST_NOTIFICATION",
                    title: "Test Notification",
                    message: `This is a test notification (${new Date().toLocaleTimeString()})`,
                    read: false,
                    action_url: "/test"
                });

            if (notificationError) throw notificationError;

            toast.success("Test notification created!");
        } catch (error) {
            console.error("Error creating test notification:", error);
            toast.error("Failed to create test notification");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 p-4 border rounded-lg">
                <div>
                    <h3 className="font-medium">Test Notification</h3>
                    <p className="text-sm text-muted-foreground">
                        Create a test notification to check the UI and sound
                    </p>
                </div>
                <Button
                    onClick={createTestNotification}
                    variant="outline"
                    disabled={isCreating}
                >
                    {isCreating ? "Creating..." : "Create Test"}
                </Button>
            </div>

            <div className="mt-4">
                <h3 className="font-medium mb-2">Notification Types</h3>
                <ul className="space-y-2 text-sm">
                    <li>
                        <span className="font-medium">TEST_NOTIFICATION:</span>
                        {" "}Test notification for UI and sound checking
                    </li>
                    <li>
                        <span className="font-medium">DUE_DATE_APPROACHING:</span>
                        {" "}Task is due within the next 3 days
                    </li>
                    <li>
                        <span className="font-medium">TASK_ASSIGNED:</span>
                        {" "}You have been assigned to a task
                    </li>
                    <li>
                        <span className="font-medium">TASK_UPDATED:</span>
                        {" "}A task you&apos;re assigned to has been updated
                    </li>
                </ul>
            </div>
        </div>
    );
} 
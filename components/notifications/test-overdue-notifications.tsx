"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useState } from "react"
import { playNotificationSound } from "@/lib/sounds"
import { useSettings } from "@/contexts/settings-context"

export function TestOverdueNotifications() {
    const [loading, setLoading] = useState(false)
    const { soundEnabled } = useSettings()

    const handleTestOverdue = async () => {
        try {
            setLoading(true)
            const supabase = createClient()

            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("User not found")

            // Create a test notification
            const { error: notificationError } = await supabase
                .from("notifications")
                .insert({
                    user_id: user.id,
                    type: "TASK_OVERDUE",
                    title: "Test Overdue Task Notification",
                    message: "This is a test overdue task notification.",
                    read: false,
                    action_url: "/tasks"
                })

            if (notificationError) throw notificationError

            if (soundEnabled) {
                await playNotificationSound()
            }

            toast.success("Test overdue notification created!")
        } catch (error) {
            console.error("Error creating test overdue notification:", error)
            toast.error(error instanceof Error ? error.message : "Failed to create test notification")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="outline"
            onClick={handleTestOverdue}
            disabled={loading}
        >
            {loading ? "Creating..." : "Create Test Overdue"}
        </Button>
    )
} 
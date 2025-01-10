"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useState } from "react"
import { playNotificationSound } from "@/lib/sounds"
import { useSettings } from "@/contexts/settings-context"

export function TestTeamNotifications() {
    const [loading, setLoading] = useState(false)
    const { soundEnabled } = useSettings()

    const handleTestTeam = async () => {
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
                    type: "TEAM_MEMBER_JOINED",
                    title: "Test Team Member Notification",
                    message: "This is a test team member notification.",
                    read: false,
                    action_url: "/team"
                })

            if (notificationError) throw notificationError

            if (soundEnabled) {
                await playNotificationSound()
            }

            toast.success("Test team notification created!")
        } catch (error) {
            console.error("Error creating test team notification:", error)
            toast.error(error instanceof Error ? error.message : "Failed to create test notification")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="outline"
            onClick={handleTestTeam}
            disabled={loading}
        >
            {loading ? "Creating..." : "Create Test Team"}
        </Button>
    )
} 
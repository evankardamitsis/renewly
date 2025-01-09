"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useState, useRef } from "react"

export function TestTeamNotifications() {
    const [loading, setLoading] = useState(false)
    const requestInProgress = useRef(false)

    const handleTestNotification = async () => {
        if (loading || requestInProgress.current) {
            toast.error("A test is already in progress")
            return
        }

        requestInProgress.current = true

        try {
            setLoading(true)
            const supabase = createClient()

            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("User not found")

            // Get the user's current team
            const { data: profile } = await supabase
                .from("profiles")
                .select("current_team_id")
                .eq("id", user.id)
                .single()

            if (!profile?.current_team_id) {
                throw new Error("No team selected")
            }

            // Create a test team member notification
            const { error: notificationError } = await supabase
                .from("notifications")
                .insert({
                    user_id: user.id,
                    type: "TEAM_MEMBER_ADDED",
                    title: "New Team Member",
                    message: "A new member has joined the team",
                    read: false,
                    action_url: `/team`
                })

            if (notificationError) throw notificationError

            // Wait a bit for the notification to be created
            await new Promise(resolve => setTimeout(resolve, 1000))

            toast.success("Test team notification created!")
        } catch (error) {
            console.error("Error creating test team notification:", error)
            toast.error(error instanceof Error ? error.message : "Failed to create test notification")
        } finally {
            setLoading(false)
            requestInProgress.current = false
        }
    }

    return (
        <Button
            variant="outline"
            onClick={handleTestNotification}
            disabled={loading || requestInProgress.current}
        >
            {loading ? "Creating..." : "Create Test Team"}
        </Button>
    )
} 
"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useState, useRef } from "react"
import { generateSlug } from "@/utils/slug"

export function TestProjectNotifications() {
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

            const projectName = `Test Project ${Date.now()}`

            // Create a new project
            const { error: projectError } = await supabase
                .from("projects")
                .insert({
                    name: projectName,
                    description: "This is a test project",
                    created_by: user.id,
                    status: "Planning",
                    slug: generateSlug(projectName),
                    team_id: profile.current_team_id,
                    tasks: []
                })
                .select()
                .single()

            if (projectError) throw projectError

            // Create a notification for the test project
            const { error: notificationError } = await supabase
                .from("notifications")
                .insert({
                    user_id: user.id,
                    type: "PROJECT_CREATED",
                    title: "New Project Created",
                    message: `Project "${projectName}" has been created`,
                    read: false,
                    action_url: `/projects`
                })

            if (notificationError) throw notificationError

            // Wait a bit for the notification to be created
            await new Promise(resolve => setTimeout(resolve, 1000))

            toast.success("Test project notification created!")
        } catch (error) {
            console.error("Error creating test project notification:", error)
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
            {loading ? "Creating..." : "Create Test Project"}
        </Button>
    )
} 
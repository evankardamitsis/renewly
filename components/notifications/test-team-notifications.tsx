import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function TestTeamNotifications() {
    const [isCreating, setIsCreating] = useState(false)

    const createTeamMemberNotification = async () => {
        if (isCreating) return
        try {
            setIsCreating(true)
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                console.error("No user found")
                return
            }

            // Get the first available project
            const { data: project, error: projectError } = await supabase
                .from("projects")
                .select("id")
                .limit(1)
                .single()

            if (projectError) {
                console.error("Error fetching project:", projectError)
                return
            }

            // Create a notification for new team member
            const { error: notificationError } = await supabase
                .from("notifications")
                .insert({
                    user_id: user.id,
                    type: "TEAM_MEMBER_ADDED",
                    title: "New Team Member",
                    message: `${user.email} has been added to the team`,
                    project_id: project.id,
                    read: false,
                    action_url: `/team`
                })

            if (notificationError) throw notificationError
            toast.success("Team member notification created")
        } catch (error) {
            console.error("Error:", error)
            toast.error("Failed to create team member notification")
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <Button
            onClick={createTeamMemberNotification}
            disabled={isCreating}
            variant="outline"
        >
            Test Team Member Notification
        </Button>
    )
} 
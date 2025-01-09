import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { generateSlug } from "@/utils/slug"

export function TestProjectNotifications() {
    const [isCreating, setIsCreating] = useState(false)

    const createProjectNotification = async () => {
        if (isCreating) return
        try {
            setIsCreating(true)
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                console.error("No user found")
                return
            }

            // Get the user's current team
            const { data: profile } = await supabase
                .from("profiles")
                .select("current_team_id")
                .eq("id", user.id)
                .single()

            if (!profile?.current_team_id) {
                throw new Error("No team selected")
            }

            const projectName = `Test Project ${new Date().toLocaleTimeString()}`

            // Create a new project
            const { data: project, error: projectError } = await supabase
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

            if (projectError) {
                console.error("Error creating project:", projectError)
                throw projectError
            }

            // Create notification for all team members
            const { data: teamMembers, error: teamError } = await supabase
                .from("team_members")
                .select("user_id")
                .eq("team_id", profile.current_team_id)

            if (teamError) throw teamError

            // Create notifications for each team member
            const notifications = teamMembers.map(member => ({
                user_id: member.user_id,
                type: "PROJECT_CREATED",
                title: "New Project Created",
                message: `Project "${project.name}" has been created`,
                project_id: project.id,
                read: false,
                action_url: `/projects/${project.slug}`
            }))

            const { error: notificationError } = await supabase
                .from("notifications")
                .insert(notifications)

            if (notificationError) throw notificationError
            toast.success("Project notification created for all team members")
        } catch (error) {
            console.error("Error:", error)
            toast.error("Failed to create project notification")
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <Button
            onClick={createProjectNotification}
            disabled={isCreating}
            variant="outline"
        >
            Test Project Notification
        </Button>
    )
} 
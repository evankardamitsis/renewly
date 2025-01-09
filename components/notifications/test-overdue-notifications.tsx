import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function TestOverdueNotifications() {
    const [isCreating, setIsCreating] = useState(false)

    const createOverdueTaskNotification = async () => {
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

            // Create a task that's already overdue
            const overdueDate = new Date()
            overdueDate.setDate(overdueDate.getDate() - 1) // Yesterday

            const { data: task, error: taskError } = await supabase
                .from("tasks")
                .insert({
                    title: `Overdue Task ${new Date().toLocaleTimeString()}`,
                    description: "This is an overdue task",
                    status: "todo",
                    priority: "high",
                    due_date: overdueDate.toISOString(),
                    assigned_to: user.id,
                    project_id: project.id
                })
                .select()
                .single()

            if (taskError) {
                console.error("Error creating task:", taskError)
                throw taskError
            }

            // Create notification for overdue task
            const { error: notificationError } = await supabase
                .from("notifications")
                .insert({
                    user_id: user.id,
                    type: "TASK_OVERDUE",
                    title: "Task Overdue",
                    message: `Task "${task.title}" is overdue`,
                    task_id: task.id,
                    project_id: project.id,
                    read: false,
                    action_url: `/projects/${project.id}/tasks/${task.id}`
                })

            if (notificationError) throw notificationError
            toast.success("Overdue task notification created")
        } catch (error) {
            console.error("Error:", error)
            toast.error("Failed to create overdue task notification")
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <Button
            onClick={createOverdueTaskNotification}
            disabled={isCreating}
            variant="outline"
        >
            Test Overdue Task Notification
        </Button>
    )
} 
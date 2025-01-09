"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useState, useRef } from "react"

export function TestOverdueNotifications() {
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

            // Get the first available project
            const { data: projects, error: projectError } = await supabase
                .from("projects")
                .select("id")
                .limit(1)
                .single()

            if (projectError) throw new Error("No projects found. Please create a project first.")

            // Create a test task that is overdue
            const dueDate = new Date()
            dueDate.setDate(dueDate.getDate() - 1) // Due yesterday

            const { data: task, error: taskError } = await supabase
                .from("tasks")
                .insert({
                    title: `Test Overdue Task ${Date.now()}`, // Make title unique
                    description: "This is a test task that is overdue",
                    project_id: projects.id,
                    assigned_to: user.id,
                    created_by: user.id,
                    due_date: dueDate.toISOString(),
                    status: "in-progress"
                })
                .select()
                .single()

            if (taskError) throw taskError

            // Trigger the check-overdue-tasks function
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/check-overdue-tasks`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
                    },
                    body: JSON.stringify({
                        task_id: task.id
                    })
                }
            )

            if (!response.ok) {
                const error = await response.text()
                throw new Error(error)
            }

            // Wait a bit for the notification to be created
            await new Promise(resolve => setTimeout(resolve, 1000))

            toast.success("Test overdue notification created!")
        } catch (error) {
            console.error("Error creating test overdue notification:", error)
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
            {loading ? "Creating..." : "Create Test Overdue"}
        </Button>
    )
} 
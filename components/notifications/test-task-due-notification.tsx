"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useState, useRef } from "react"

export function TestTaskDueNotification() {
    const [loading, setLoading] = useState(false)
    const requestInProgress = useRef(false)

    const handleTestNotification = async () => {
        // Double check to prevent multiple submissions
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

            // Create a test task due soon
            const dueDate = new Date()
            dueDate.setDate(dueDate.getDate() + 1) // Due tomorrow

            const { data: task, error: taskError } = await supabase
                .from("tasks")
                .insert({
                    title: `Test Task Due Soon ${Date.now()}`, // Make title unique
                    description: "This is a test task that is due soon",
                    project_id: projects.id,
                    assigned_to: user.id,
                    created_by: user.id,
                    due_date: dueDate.toISOString(),
                    status: "in-progress"
                })
                .select()
                .single()

            if (taskError) throw taskError

            // Trigger the check-due-dates function
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/check-due-dates`,
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

            toast.success("Test task due notification created!")
        } catch (error) {
            console.error("Error creating test task due notification:", error)
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
            {loading ? "Creating..." : "Create Test Task"}
        </Button>
    )
} 
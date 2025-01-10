"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useState, useRef, useCallback, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Notification } from "@/types/database"

export function TestTaskDueNotification() {
    const [loading, setLoading] = useState(false)
    const requestInProgress = useRef(false)
    const abortControllerRef = useRef<AbortController | null>(null)
    const lastClickTime = useRef<number>(0)
    const createdTaskId = useRef<string | null>(null)
    const queryClient = useQueryClient()
    const supabase = createClient()

    // Set up real-time subscriptions
    useEffect(() => {
        let notificationsChannel: ReturnType<typeof supabase.channel> | null = null
        let tasksChannel: ReturnType<typeof supabase.channel> | null = null

        const setupSubscriptions = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                // Subscribe to notifications
                notificationsChannel = supabase
                    .channel('notifications-test')
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'notifications',
                            filter: `user_id=eq.${user.id}`,
                        },
                        (payload) => {
                            // Invalidate notifications queries
                            queryClient.invalidateQueries({ queryKey: ["notifications"] })

                            // Show toast for new notifications related to our test task
                            if (payload.eventType === 'INSERT') {
                                const notification = payload.new as Notification
                                if (notification.task_id === createdTaskId.current) {
                                    toast.info(notification.title, {
                                        description: notification.message,
                                    })
                                }
                            }
                        }
                    )
                    .subscribe()

                // Subscribe to tasks
                tasksChannel = supabase
                    .channel('tasks-test')
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'tasks',
                            filter: createdTaskId.current ? `id=eq.${createdTaskId.current}` : undefined,
                        },
                        (payload) => {
                            if (payload.eventType === 'DELETE' && createdTaskId.current === payload.old.id) {
                                createdTaskId.current = null
                            }
                        }
                    )
                    .subscribe()
            } catch (error) {
                console.error('Error setting up subscriptions:', error)
            }
        }

        void setupSubscriptions()

        return () => {
            if (notificationsChannel) {
                void notificationsChannel.unsubscribe()
            }
            if (tasksChannel) {
                void tasksChannel.unsubscribe()
            }
        }
    }, [queryClient, supabase])

    const cleanup = useCallback(async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }

        // Clean up created task if process was aborted
        if (createdTaskId.current) {
            try {
                await supabase
                    .from("tasks")
                    .delete()
                    .eq("id", createdTaskId.current)
            } catch (error) {
                console.error("Error cleaning up task:", error)
            }
            createdTaskId.current = null
        }

        requestInProgress.current = false
        setLoading(false)
    }, [supabase])

    const handleTestNotification = async () => {
        // Prevent multiple submissions and add debounce
        const now = Date.now()
        if (loading || requestInProgress.current || now - lastClickTime.current < 2000) {
            toast.error("Please wait before creating another test notification")
            return
        }
        lastClickTime.current = now

        // Clean up any existing request
        await cleanup()

        // Set up new request
        requestInProgress.current = true
        setLoading(true)
        abortControllerRef.current = new AbortController()

        try {
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

            // Check if aborted before creating task
            if (abortControllerRef.current?.signal.aborted) return

            // Create a test task due soon
            const dueDate = new Date()
            dueDate.setMinutes(dueDate.getMinutes() + 1) // Due in 1 minute to avoid multiple notifications

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

            // Store task ID for cleanup if needed
            createdTaskId.current = task.id

            // Only proceed if not aborted
            if (abortControllerRef.current?.signal.aborted) {
                await cleanup()
                return
            }

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
                        task_id: task.id,
                        test_mode: true // Add test mode flag
                    }),
                    signal: abortControllerRef.current.signal
                }
            )

            if (!response.ok) {
                const error = await response.text()
                throw new Error(error)
            }

            // Wait a bit for the notification to be created
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Only show success if not aborted
            if (!abortControllerRef.current?.signal.aborted) {
                toast.success("Test task due notification created!")
                // Clear task ID since process completed successfully
                createdTaskId.current = null
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                // Clean up on abort
                await cleanup()
                return
            }
            console.error("Error creating test task due notification:", error)
            toast.error(error instanceof Error ? error.message : "Failed to create test notification")
        } finally {
            await cleanup()
        }
    }

    // Clean up on unmount
    useEffect(() => {
        return () => {
            void cleanup()
        }
    }, [cleanup])

    return (
        <Button
            variant="outline"
            onClick={() => void handleTestNotification()}
            disabled={loading || requestInProgress.current}
        >
            {loading ? "Creating..." : "Create Test Task"}
        </Button>
    )
} 
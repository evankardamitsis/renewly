"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useState } from "react"

export function TestEmailNotification() {
    const [loading, setLoading] = useState(false)

    const handleTestEmail = async () => {
        try {
            setLoading(true)
            const supabase = createClient()

            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("User not found")

            // Create a test notification
            const { data: notification, error: notificationError } = await supabase
                .from("notifications")
                .insert({
                    user_id: user.id,
                    type: "TEST_EMAIL",
                    title: "Test Email Notification",
                    message: "This is a test email notification to verify the system is working correctly.",
                    read: false,
                    action_url: "/notifications"
                })
                .select()
                .single()

            if (notificationError) throw notificationError

            // Trigger email send
            const response = await fetch("/functions/v1/send-notification-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    notification_id: notification.id
                })
            })

            if (!response.ok) {
                const error = await response.text()
                throw new Error(error)
            }

            toast.success("Test email sent! Check your inbox.")
        } catch (error) {
            console.error("Error sending test email:", error)
            toast.error("Failed to send test email")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="outline"
            onClick={handleTestEmail}
            disabled={loading}
        >
            {loading ? "Sending..." : "Send Test Email"}
        </Button>
    )
} 
import { AllNotifications } from "@/components/notifications/all-notifications"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function NotificationsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="container py-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Notifications</h1>
            </div>
            <AllNotifications />
        </div>
    )
} 
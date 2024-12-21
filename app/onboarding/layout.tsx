import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user has already completed onboarding
  const { data: profile } = await supabase
    .from("profiles")
    .select("has_completed_onboarding")
    .eq("id", user.id)
    .single()

  if (profile?.has_completed_onboarding) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-3xl space-y-8">
        {children}
      </div>
    </div>
  )
} 
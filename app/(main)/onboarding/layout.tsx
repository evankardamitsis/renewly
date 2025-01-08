import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function OnboardingLayout({
  children,
  searchParams = {},
}: {
  children: React.ReactNode
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const invitationToken = typeof searchParams?.invitation_token === 'string'
    ? searchParams.invitation_token
    : undefined

  // If no user, redirect to login
  if (!user) {
    const redirectUrl = invitationToken
      ? `/login?invitation_token=${invitationToken}`
      : "/login"
    redirect(redirectUrl)
  }

  // Check if user has already completed onboarding
  const { data: profile } = await supabase
    .from("profiles")
    .select("has_completed_onboarding")
    .eq("id", user.id)
    .single()

  // If user has completed onboarding and there's no invitation token, redirect to dashboard
  if (profile?.has_completed_onboarding && !invitationToken) {
    redirect("/dashboard")
  }

  // If there's an invitation token, verify it's valid
  if (invitationToken) {
    const { data: invitation } = await supabase
      .from("team_invitations")
      .select("email")
      .eq("token", invitationToken)
      .single()

    // If invitation not found or email doesn't match, redirect to dashboard
    if (!invitation || invitation.email !== user.email) {
      redirect("/dashboard")
    }
  }

  // If user doesn't have a password set (from Supabase invite), let them proceed to onboarding
  if (!user.user_metadata?.has_password) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-3xl space-y-8">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-3xl space-y-8">
        {children}
      </div>
    </div>
  )
} 
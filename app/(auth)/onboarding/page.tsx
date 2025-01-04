import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/auth/onboarding-form";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { invitation_token?: string };
}) {
  const supabase = await createClient();

  // Get the current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no session, redirect to login with invitation token if present
  if (!session) {
    const redirectUrl = searchParams.invitation_token
      ? `/login?invitation_token=${searchParams.invitation_token}`
      : "/login";
    redirect(redirectUrl);
  }

  // Check if user already exists in profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  // If user already has a profile and completed onboarding, redirect to dashboard
  if (profile?.has_completed_onboarding) {
    redirect("/dashboard");
  }

  // If there's an invitation token, get the invitation details
  let inviteData = null;
  if (searchParams.invitation_token) {
    const { data: invitation } = await supabase
      .from("team_invitations")
      .select("*, teams(name)")
      .eq("token", searchParams.invitation_token)
      .single();

    if (invitation) {
      inviteData = {
        teamId: invitation.team_id,
        teamName: invitation.teams.name,
        role: invitation.role,
        token: searchParams.invitation_token,
      };
    }
  }

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
      <OnboardingForm user={session.user} inviteData={inviteData} />
    </div>
  );
}

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { invitation_token?: string };
}) {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If user is already logged in
  if (session) {
    // If there's an invitation token, redirect to onboarding
    if (searchParams.invitation_token) {
      redirect(`/onboarding?invitation_token=${searchParams.invitation_token}`);
    }
    // Otherwise redirect to dashboard
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
        email: invitation.email,
        teamName: invitation.teams.name,
        token: searchParams.invitation_token,
      };
    }
  }

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
      <LoginForm inviteData={inviteData} />
    </div>
  );
}

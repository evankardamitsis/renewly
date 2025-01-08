import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("has_completed_onboarding")
    .eq("id", session.user.id)
    .single();

  // Redirect based on onboarding status
  if (!profile?.has_completed_onboarding) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}

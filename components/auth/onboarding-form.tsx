import { useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface OnboardingFormProps {
  user: User;
  inviteData?: {
    teamId: string;
    teamName: string;
    role: string;
    token: string;
  } | null;
}

export function OnboardingForm({ user, inviteData }: OnboardingFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient();

      // Update password if user doesn't have one
      if (!user.user_metadata?.has_password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password,
        });

        if (passwordError) throw passwordError;
      }

      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        display_name: displayName,
        email: user.email,
        has_completed_onboarding: true,
      });

      if (profileError) throw profileError;

      // If this is an invited user, add them to the team
      if (inviteData) {
        const { error: teamMemberError } = await supabase
          .from("team_members")
          .insert({
            team_id: inviteData.teamId,
            user_id: user.id,
            role: inviteData.role,
          });

        if (teamMemberError) throw teamMemberError;

        // Delete the invitation
        await supabase
          .from("team_invitations")
          .delete()
          .eq("token", inviteData.token);
      }

      toast.success("Welcome to Renewly!");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {inviteData ? `Join ${inviteData.teamName}` : "Complete Your Profile"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {inviteData
            ? "Set up your account to join the team"
            : "Just a few more details to get you started"}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            placeholder="How should we call you?"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>

        {!user.user_metadata?.has_password && (
          <div className="space-y-2">
            <Label htmlFor="password">Set Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Choose a secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Setting up..." : "Complete Setup"}
      </Button>
    </form>
  );
}

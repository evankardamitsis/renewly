"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OnboardingFormProps {
  user: User;
  inviteData: {
    teamId: string;
    teamName: string;
    role: string;
    token: string;
  };
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
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        display_name: displayName,
        email: user.email,
        has_completed_onboarding: true,
        current_team_id: inviteData.teamId,
      });

      if (profileError) throw profileError;

      // Add user to the team
      const { error: teamMemberError } = await supabase
        .from("team_members")
        .insert({
          team_id: inviteData.teamId,
          user_id: user.id,
          role: inviteData.role,
        });

      if (teamMemberError) throw teamMemberError;

      // Update invitation status
      const { error: inviteError } = await supabase
        .from("team_invitations")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString()
        })
        .eq("team_id", inviteData.teamId)
        .eq("email", user.email);

      if (inviteError) throw inviteError;

      toast.success("Welcome to the team!");
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
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Join {inviteData.teamName}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Complete your profile to join the team
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Team</Label>
            <Input
              value={inviteData.teamName}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Input
              value={inviteData.role === "admin" ? "Admin" : "Member"}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={user.email}
              disabled
              className="bg-muted"
            />
          </div>

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
              <p className="text-sm text-muted-foreground">
                Password must be at least 8 characters long
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Setting up..." : "Complete Setup"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

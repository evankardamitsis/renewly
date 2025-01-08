"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";
import { Label } from "@/components/ui/label";
import { updatePassword, createProfile, addTeamMember } from "../actions/auth";

interface FormData {
  displayName: string;
  role: string;
  password?: string;
}

interface InviteData {
  team_id: string;
  role: "admin" | "member";
}

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [formData, setFormData] = useState<FormData>({
    displayName: "",
    role: "",
    password: "",
  });
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const getInviteData = async () => {
      try {
        const supabase = createClient();

        // Check authentication status
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          console.error("No valid session:", sessionError);
          toast.error("Please log in to continue");
          router.push("/login");
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (!user) {
          console.error("No user found");
          router.push("/login");
          return;
        }

        // Check if user was invited
        const inviteToken = searchParams.get("invitation_token");
        if (!inviteToken) {
          console.error("No invitation token found");
          toast.error("Invalid invitation link");
          return;
        }

        // Get the invitation
        const { data: invitation, error: inviteError } = await supabase
          .from("team_invitations")
          .select("*")
          .eq("token", inviteToken)
          .eq("email", user.email)
          .eq("status", "pending")
          .single();

        if (inviteError || !invitation) {
          console.error("Invalid invitation:", inviteError);
          toast.error("Invalid invitation");
          return;
        }

        setInviteData({
          team_id: invitation.team_id,
          role: invitation.role,
        });
      } catch (error) {
        console.error("Error fetching invite data:", error);
        toast.error("Something went wrong. Please try again.");
      }
    };

    getInviteData();
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted", { formData, inviteData });

    if (!formData.displayName.trim() || !formData.role.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!inviteData) {
      toast.error("Invalid invitation data. Please try again.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      console.log("Getting user...");
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Got user:", user);

      if (!user) {
        toast.error("Authentication error. Please try logging in again.");
        return;
      }

      let shouldRedirectToLogin = false;

      // Update password if provided (for existing users)
      if (formData.password) {
        console.log("Updating password...");
        const { error } = await updatePassword(formData.password);
        if (error) {
          console.error("Password update error:", error);
          toast.error("Failed to set password. Please try again.");
          return;
        }
        console.log("Password updated successfully");
        shouldRedirectToLogin = true;
      }

      // Add user to the invited team using server action first
      console.log("Adding to team...");
      const { error: teamError } = await addTeamMember({
        userId: user.id,
        teamId: inviteData.team_id,
        email: user.email!,
      });

      if (teamError) {
        console.error("Team member creation error:", teamError);
        if (teamError.includes("Invalid invitation") || teamError.includes("No valid invitation")) {
          toast.error("Your invitation has expired. Please request a new one.");
        } else if (teamError.includes("duplicate key")) {
          toast.error("You are already a member of this team.");
        } else {
          toast.error("Failed to add you to the team. Please try again.");
        }
        return;
      }
      console.log("Added to team successfully");

      // Create user profile using server action
      console.log("Creating profile...");
      const { error: profileError } = await createProfile({
        userId: user.id,
        email: user.email!,
        displayName: formData.displayName.trim(),
        role: formData.role.trim(),
        teamId: inviteData.team_id,
        hasCompletedOnboarding: true,
      });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        toast.error(profileError === "Invalid or expired invitation"
          ? "Your invitation has expired. Please request a new one."
          : "Failed to create profile. Please try again.");
        return;
      }
      console.log("Profile created successfully");

      // Only navigate after all operations are successful
      toast.success("Welcome to the team!");
      router.refresh();

      if (shouldRedirectToLogin) {
        router.push("/login");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !inviteData) {
    return (
      <Card className="w-full">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl text-center">Loading...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl text-center">Welcome to {user?.user_metadata?.team_name}</CardTitle>
        <p className="text-center text-muted-foreground">
          Set up your account to join the team
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Team Role</Label>
              <Input
                value={inviteData?.role === "admin" ? "Admin" : "Member"}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={user?.email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="How should we call you?"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    displayName: e.target.value,
                  }))
                }
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Your Role</Label>
              <Input
                id="role"
                placeholder="e.g., Product Manager, Developer"
                value={formData.role}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, role: e.target.value }))
                }
                disabled={isLoading}
                required
              />
            </div>
            {!user?.user_metadata?.has_password && (
              <div className="space-y-2">
                <Label htmlFor="password">Set Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Choose a secure password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  disabled={isLoading}
                  required
                  minLength={8}
                />
                <p className="text-sm text-muted-foreground">
                  Password must be at least 8 characters long
                </p>
              </div>
            )}
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Join Team"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

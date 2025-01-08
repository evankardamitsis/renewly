"use server";

import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";

export async function updatePassword(password: string) {
    try {
        const supabase = createClient();

        // Get session
        const supabaseClient = await supabase;
        const { data: { session }, error: sessionError } = await supabaseClient
            .auth.getSession();

        if (sessionError) throw sessionError;
        if (!session) throw new Error("No active session");

        // Update password
        const { error } = await supabaseClient.auth.updateUser({ password });
        if (error) throw error;

        // Sign out
        await supabaseClient.auth.signOut();

        return { success: true };
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: "An unexpected error occurred" };
    }
}

export async function resetPasswordForEmail(email: string) {
    try {
        const supabase = createClient();
        const supabaseClient = await supabase;

        const { error } = await supabaseClient.auth.resetPasswordForEmail(
            email,
            {
                redirectTo:
                    `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password/confirm`,
            },
        );

        if (error) throw error;

        return { success: true };
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: "An unexpected error occurred" };
    }
}

export async function sendTeamInvite({
    teamId,
    email,
    role = "member",
}: {
    teamId: string;
    email: string;
    role?: "admin" | "member";
}) {
    try {
        // Use regular client for user authentication
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error("Not authenticated");
        }

        // Get team details
        const { data: team, error: teamError } = await supabase
            .from("teams")
            .select("name")
            .eq("id", teamId)
            .single();

        if (teamError) throw teamError;

        // Generate a unique token for the invitation
        const token = crypto.randomUUID();

        // Create the invitation record
        const { error: inviteError } = await supabase
            .from("team_invitations")
            .insert({
                team_id: teamId,
                email,
                role,
                invited_by: user.id,
                token,
            });

        if (inviteError) throw inviteError;

        // Use service role client for admin operations
        const serviceRoleClient = createServiceRoleClient();

        // Send invitation email using Supabase Auth admin invite
        const { error: emailError } = await serviceRoleClient.auth.admin
            .inviteUserByEmail(email, {
                redirectTo:
                    `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding?invitation_token=${token}`,
                data: {
                    invitation_token: token,
                    team_id: teamId,
                    team_name: team.name,
                    role,
                },
            });

        if (emailError) throw emailError;

        return { success: true };
    } catch (error) {
        console.error("Team invitation error:", error);
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: "An unexpected error occurred" };
    }
}

export async function createProfile({
    userId,
    email,
    displayName,
    role,
    teamId,
    hasCompletedOnboarding = false,
}: {
    userId: string;
    email: string;
    displayName: string;
    role: string;
    teamId: string;
    hasCompletedOnboarding?: boolean;
}) {
    try {
        // Use service role client for admin operations during onboarding
        const serviceRoleClient = createServiceRoleClient();

        // Verify the user has a valid invitation
        const { data: invitation, error: inviteError } = await serviceRoleClient
            .from("team_invitations")
            .select("*")
            .eq("team_id", teamId)
            .eq("email", email)
            .eq("status", "pending")
            .single();

        if (inviteError || !invitation) {
            throw new Error("Invalid or expired invitation");
        }

        const { data: profile, error: profileError } = await serviceRoleClient
            .from("profiles")
            .insert({
                id: userId,
                email: email,
                display_name: displayName,
                role: role,
                has_completed_onboarding: hasCompletedOnboarding,
                current_team_id: teamId,
            })
            .select()
            .single();

        if (profileError) throw profileError;

        return { data: profile };
    } catch (error) {
        console.error("Profile creation error:", error);
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: "An unexpected error occurred" };
    }
}

export async function addTeamMember({
    userId,
    teamId,
    role,
    email,
}: {
    userId: string;
    teamId: string;
    role: "admin" | "member";
    email: string;
}) {
    try {
        const serviceRoleClient = createServiceRoleClient();

        // Verify the user has a valid invitation
        console.log("Checking invitation...", { teamId, email });
        const { data: invitation, error: inviteError } = await serviceRoleClient
            .from("team_invitations")
            .select("*")
            .eq("team_id", teamId)
            .eq("email", email)
            .eq("status", "pending")
            .single();

        if (inviteError) {
            console.error("Invitation verification error:", inviteError);
            throw new Error(`Invalid invitation: ${inviteError.message}`);
        }

        if (!invitation) {
            console.error("No valid invitation found");
            throw new Error("No valid invitation found");
        }

        // Add user to team
        console.log("Adding user to team...", { userId, teamId, role });
        const { error: memberError } = await serviceRoleClient
            .from("team_members")
            .insert({
                team_id: teamId,
                user_id: userId,
                role: role,
            });

        if (memberError) {
            console.error("Team member creation error:", memberError);
            throw new Error(
                `Failed to add team member: ${memberError.message}`,
            );
        }

        // Update invitation status
        console.log("Updating invitation status...");
        const { error: inviteUpdateError } = await serviceRoleClient
            .from("team_invitations")
            .update({ status: "accepted" })
            .eq("team_id", teamId)
            .eq("email", email)
            .eq("status", "pending");

        if (inviteUpdateError) {
            console.error("Invitation status update error:", inviteUpdateError);
            throw new Error(
                `Failed to update invitation: ${inviteUpdateError.message}`,
            );
        }

        // Mark onboarding as complete
        console.log("Marking onboarding as complete...");
        const { error: profileError } = await serviceRoleClient
            .from("profiles")
            .update({ has_completed_onboarding: true })
            .eq("id", userId);

        if (profileError) {
            console.error("Profile update error:", profileError);
            throw new Error(
                `Failed to complete onboarding: ${profileError.message}`,
            );
        }

        return { success: true };
    } catch (error) {
        console.error("Add team member error:", error);
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: "An unexpected error occurred" };
    }
}

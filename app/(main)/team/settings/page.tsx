"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { hasCapability, canManageRole, type TeamRole } from "@/utils/roles";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface TeamMember {
    id: string;
    user_id: string;
    role: "admin" | "member";
    is_super_admin: boolean;
    profile: {
        display_name: string;
        email: string;
    };
}

export default function TeamSettingsPage() {
    const [currentUserRole, setCurrentUserRole] = useState<TeamRole | null>(null);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
    const [isRemoving, setIsRemoving] = useState(false);
    const [showTransferOwnership, setShowTransferOwnership] = useState(false);
    const [newOwnerId, setNewOwnerId] = useState<string | null>(null);

    useEffect(() => {
        async function loadTeamData() {
            try {
                const supabase = createClient();

                // Get current user
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                setCurrentUserId(user.id);

                // Get user's profile and team
                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("current_team_id")
                    .eq("id", user.id)
                    .single();

                console.log("Profile data:", profile);
                console.log("Profile error:", profileError);

                if (!profile?.current_team_id) return;

                // Debug: Check all team members without filters
                const { data: allMembers } = await supabase
                    .from("team_members")
                    .select("*");
                console.log("All team members:", allMembers);

                // Get current user's role
                const { data: userRole } = await supabase
                    .from("team_members")
                    .select("role, is_super_admin")
                    .eq("user_id", user.id)
                    .eq("team_id", profile.current_team_id)
                    .single();

                if (userRole) {
                    setCurrentUserRole({
                        role: userRole.role,
                        is_super_admin: userRole.is_super_admin,
                    });
                }

                // Get all team members first
                const { data: members } = await supabase
                    .from("team_members")
                    .select("*")
                    .eq("team_id", profile.current_team_id);

                if (!members) return;

                // Then get their profiles
                const { data: profiles } = await supabase
                    .from("profiles")
                    .select("id, display_name, email")
                    .in("id", members.map(m => m.user_id));

                console.log("Team members:", members);
                console.log("Profiles:", profiles);

                if (members && profiles) {
                    setTeamMembers(members.map(member => {
                        const userProfile = profiles.find(p => p.id === member.user_id);
                        return {
                            ...member,
                            profile: {
                                display_name: userProfile?.display_name || 'Unknown',
                                email: userProfile?.email || 'No email'
                            }
                        };
                    }) as TeamMember[]);
                }
            } catch (error) {
                console.error("Error loading team data:", error);
                toast.error("Failed to load team data");
            } finally {
                setLoading(false);
            }
        }

        loadTeamData();
    }, []);

    const handleRoleChange = async (memberId: string, newRole: "admin" | "member") => {
        if (!currentUserRole) return;

        const member = teamMembers.find(m => m.id === memberId);
        if (!member) return;

        const targetRole: TeamRole = {
            role: member.role,
            is_super_admin: member.is_super_admin,
        };

        if (!canManageRole(currentUserRole, targetRole)) {
            toast.error("You don't have permission to change this member's role");
            return;
        }

        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("team_members")
                .update({ role: newRole })
                .eq("id", memberId);

            if (error) throw error;

            setTeamMembers(prev =>
                prev.map(m =>
                    m.id === memberId ? { ...m, role: newRole } : m
                )
            );

            toast.success("Role updated successfully");
        } catch (error) {
            console.error("Error updating role:", error);
            toast.error("Failed to update role");
        }
    };

    const handleRemoveMember = async () => {
        if (!currentUserRole || !memberToRemove) return;

        const targetRole: TeamRole = {
            role: memberToRemove.role,
            is_super_admin: memberToRemove.is_super_admin,
        };

        // Prevent self-removal
        if (memberToRemove.user_id === currentUserId) {
            toast.error("You cannot remove yourself. Use the 'Leave Team' option instead.");
            setMemberToRemove(null);
            return;
        }

        // Prevent removing super admin
        if (memberToRemove.is_super_admin) {
            toast.error("Super Admin can only be removed by transferring the role or deleting the team");
            setMemberToRemove(null);
            return;
        }

        if (!canManageRole(currentUserRole, targetRole)) {
            toast.error("You don't have permission to remove this member");
            setMemberToRemove(null);
            return;
        }

        try {
            setIsRemoving(true);
            const supabase = createClient();
            const { error } = await supabase
                .from("team_members")
                .delete()
                .eq("id", memberToRemove.id);

            if (error) throw error;

            setTeamMembers(prev => prev.filter(m => m.id !== memberToRemove.id));
            toast.success("Member removed successfully");
        } catch (error) {
            console.error("Error removing member:", error);
            toast.error("Failed to remove member");
        } finally {
            setIsRemoving(false);
            setMemberToRemove(null);
        }
    };

    const handleTransferOwnership = async () => {
        if (!currentUserRole?.is_super_admin || !newOwnerId) return;

        try {
            setIsRemoving(true);
            const supabase = createClient();

            // Start a transaction
            const { error: transferError } = await supabase
                .from("team_members")
                .update({ is_super_admin: true, role: "admin" })
                .eq("user_id", newOwnerId);

            if (transferError) throw transferError;

            // Remove super admin from current user
            const { error: updateError } = await supabase
                .from("team_members")
                .update({ is_super_admin: false, role: "member" })
                .eq("user_id", currentUserId);

            if (updateError) throw updateError;

            // Update local state
            setTeamMembers(prev => prev.map(member => {
                if (member.user_id === newOwnerId) {
                    return { ...member, is_super_admin: true, role: "admin" };
                }
                if (member.user_id === currentUserId) {
                    return { ...member, is_super_admin: false, role: "member" };
                }
                return member;
            }));

            setCurrentUserRole({ role: "member", is_super_admin: false });
            toast.success("Team ownership transferred successfully");
            setShowTransferOwnership(false);
            setNewOwnerId(null);

            // Now we can leave the team
            await handleLeaveTeam();
        } catch (error) {
            console.error("Error transferring ownership:", error);
            toast.error("Failed to transfer team ownership");
        } finally {
            setIsRemoving(false);
        }
    };

    const handleLeaveTeam = async () => {
        if (!currentUserId || !currentUserRole) return;

        // If super admin, show transfer ownership modal
        if (currentUserRole.is_super_admin) {
            setShowTransferOwnership(true);
            return;
        }

        try {
            setIsRemoving(true);
            const supabase = createClient();
            const { error } = await supabase
                .from("team_members")
                .delete()
                .eq("user_id", currentUserId);

            if (error) throw error;

            // Redirect to home or teams page after leaving
            window.location.href = "/";
        } catch (error) {
            console.error("Error leaving team:", error);
            toast.error("Failed to leave team");
        } finally {
            setIsRemoving(false);
        }
    };

    const handleDeleteTeam = async () => {
        if (!currentUserRole || !hasCapability(currentUserRole, "delete_team")) {
            toast.error("You don't have permission to delete the team");
            return;
        }

        // Add confirmation dialog and team deletion logic here
        toast.error("Team deletion not implemented yet");
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {teamMembers.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between p-4 border rounded-lg"
                            >
                                <div>
                                    <p className="font-medium">{member.profile.display_name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {member.profile.email}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    {currentUserRole && canManageRole(currentUserRole, {
                                        role: member.role,
                                        is_super_admin: member.is_super_admin,
                                    }) ? (
                                        <>
                                            <Select
                                                value={member.role}
                                                onValueChange={(value: "admin" | "member") =>
                                                    handleRoleChange(member.id, value)
                                                }
                                            >
                                                <SelectTrigger className="w-32">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="member">Member</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => setMemberToRemove(member)}
                                            >
                                                {member.user_id === currentUserId ? "Leave Team" : "Remove"}
                                            </Button>
                                        </>
                                    ) : (
                                        <span className="text-sm font-medium">
                                            {member.is_super_admin ? "Owner" : member.role}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {currentUserRole && !currentUserRole.is_super_admin && (
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">Leave Team</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="destructive"
                            onClick={() => setMemberToRemove({ ...teamMembers.find(m => m.user_id === currentUserId)! })}
                        >
                            Leave Team
                        </Button>
                    </CardContent>
                </Card>
            )}

            {currentUserRole?.is_super_admin && (
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteTeam}
                        >
                            Delete Team
                        </Button>
                    </CardContent>
                </Card>
            )}

            <ConfirmationModal
                open={!!memberToRemove}
                onOpenChange={(open) => !open && setMemberToRemove(null)}
                onConfirm={memberToRemove?.user_id === currentUserId ? handleLeaveTeam : handleRemoveMember}
                title={memberToRemove?.user_id === currentUserId ? "Leave Team" : "Remove Member"}
                description={memberToRemove?.user_id === currentUserId
                    ? "Are you sure you want to leave this team? This action cannot be undone."
                    : `Are you sure you want to remove ${memberToRemove?.profile.display_name || 'this member'}? This action cannot be undone.`}
                loading={isRemoving}
                confirmButtonText={memberToRemove?.user_id === currentUserId ? "Leave Team" : "Remove Member"}
            />

            <AlertDialog open={showTransferOwnership} onOpenChange={setShowTransferOwnership}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Transfer Team Ownership</AlertDialogTitle>
                        <AlertDialogDescription>
                            As the team owner, you must transfer ownership before leaving.
                            Select a new owner for the team:
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        {teamMembers.filter(m => m.user_id !== currentUserId && m.role === "admin").length > 0 ? (
                            <Select value={newOwnerId || ''} onValueChange={setNewOwnerId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select new owner" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teamMembers
                                        .filter(m => m.user_id !== currentUserId && m.role === "admin")
                                        .map(member => (
                                            <SelectItem key={member.user_id} value={member.user_id}>
                                                {member.profile.display_name} ({member.profile.email})
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
                                No admins available. Please promote a team member to Admin first to transfer ownership.
                            </div>
                        )}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleTransferOwnership}
                            disabled={!newOwnerId || isRemoving}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isRemoving ? <LoadingSpinner /> : "Transfer & Leave"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
} 
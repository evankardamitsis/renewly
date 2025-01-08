"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TeamMember {
  id: string;
  user_id: string;
  role: "admin" | "member";
  is_super_admin: boolean;
  profile: {
    display_name: string;
    email: string;
    role: string;
  };
}

export function TeamManagementCard({
  currentUserRole
}: {
  currentUserRole: { role: string; is_super_admin: boolean };
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<"admin" | "member">("member");
  const [isInviting, setIsInviting] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    async function loadTeamMembers() {
      try {
        const supabase = createClient();

        // Get current user first
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Then get their profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_team_id")
          .eq("id", user.id)
          .single();

        if (!profile?.current_team_id) return;

        // Get team members
        const { data: members, error: membersError } = await supabase
          .from("team_members")
          .select("id, user_id, role, is_super_admin")
          .eq("team_id", profile.current_team_id);

        if (membersError) throw membersError;
        if (!members?.length) return;

        // Get profiles for these members
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, display_name, email, role")
          .in("id", members.map(m => m.user_id));

        if (profilesError) throw profilesError;

        // Transform and combine the data
        const transformedMembers = members.map(member => ({
          ...member,
          profile: profiles?.find(p => p.id === member.user_id) || {
            display_name: "Unknown User",
            email: "no-email",
            role: "member"
          }
        }));

        setTeamMembers(transformedMembers);
      } catch (error) {
        console.error("Error loading team members:", error);
      }
    }

    loadTeamMembers();
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail) return;

    try {
      setIsInviting(true);
      const supabase = createClient();

      const { error } = await supabase
        .from("team_invites")
        .insert([
          {
            email: inviteEmail,
            role: selectedRole,
          },
        ]);

      if (error) throw error;

      toast.success("Invitation sent successfully");
      setInviteEmail("");
      setSelectedRole("member");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  // Only show add button for admins and super admins
  const canInviteMembers = currentUserRole?.is_super_admin || currentUserRole?.role === "admin";

  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle>Team Members ({teamMembers.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          <TooltipProvider>
            {teamMembers.map((member) => (
              <Tooltip key={member.id}>
                <TooltipTrigger asChild>
                  <Avatar className="cursor-pointer">
                    <AvatarFallback>
                      {member.profile.display_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-medium">{member.profile.display_name}</p>
                    <p className="text-xs">{member.profile.email}</p>
                    <p className="text-xs font-medium">
                      {member.is_super_admin ? "Owner" : member.profile.role}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
          {canInviteMembers && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="email">Email address</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="role">Role</label>
                <Select value={selectedRole} onValueChange={(value: "admin" | "member") => setSelectedRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleInvite} disabled={isInviting}>
                {isInviting ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

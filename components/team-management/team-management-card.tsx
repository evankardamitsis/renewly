"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTeamQuery } from "@/hooks/useTeamQuery";

export function TeamManagementCard({
  currentUserRole
}: {
  currentUserRole: { role: string; is_super_admin: boolean };
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<"admin" | "member">("member");
  const { members, isLoadingMembers, inviteMember } = useTeamQuery();

  const handleInvite = async () => {
    if (!inviteEmail) return;

    try {
      await inviteMember(inviteEmail, selectedRole);
      setInviteEmail("");
      setSelectedRole("member");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error sending invitation:", error);
    }
  };

  // Only show add button for admins and super admins
  const canInviteMembers = currentUserRole?.is_super_admin || currentUserRole?.role === "admin";

  if (isLoadingMembers) {
    return (
      <Card className="bg-card/50">
        <CardContent className="p-6">
          <div className="text-center">Loading team members...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle>Team Members ({members.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          <TooltipProvider>
            {members.map((member) => (
              <Tooltip key={member.id}>
                <TooltipTrigger asChild>
                  <Avatar className="cursor-pointer">
                    <AvatarFallback>
                      {member.profile.display_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-medium">{member.profile.display_name ?? "Unknown"}</p>
                    <p className="text-xs">{member.profile.email ?? "No email"}</p>
                    <p className="text-xs font-medium">
                      {member.is_super_admin ? "Owner" : member.profile.role ?? "Member"}
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
              <Button onClick={handleInvite}>
                Send Invitation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

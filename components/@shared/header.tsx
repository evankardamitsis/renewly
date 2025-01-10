"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Mic, Plus, LogOut, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/@shared/theme-toggle";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getRoleDisplay } from "@/utils/roles";
import { NotificationsMenu } from './notifications-menu';
import { useAuth } from "@/contexts/auth-context";
import { useProfile } from "@/hooks/useProfile";
import { useTeamQuery } from "@/hooks/useTeamQuery";

export function Header() {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member");
  const { user, isLoading: isAuthLoading, signOut } = useAuth();
  const { profile, isLoading: isProfileLoading } = useProfile();
  const { members, inviteMember, isLoadingTeam } = useTeamQuery();

  const isLoading = isAuthLoading || isProfileLoading || isLoadingTeam;

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inviteMember(inviteEmail, inviteRole);
      setInviteEmail("");
      setInviteRole("member");
      setIsInviteModalOpen(false);
    } catch (error) {
      console.error("Error inviting member:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6">
        <div className="flex items-center gap-6 md:gap-8">
          {/* Renewly Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="size-8 rounded bg-primary/20">
              <div className="size-full rounded-sm bg-primary p-2 text-primary-foreground">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <span className="font-bold text-xl">Renewly</span>
          </Link>

          {/* Search */}
          <div className="relative flex-1 max-w-xl">
            <div
              className={cn(
                "absolute inset-0 -z-10 rounded-lg bg-accent/50 transition-all",
                isSearchFocused ? "opacity-100 blur-xl" : "opacity-0 blur-none"
              )}
            />
            <div className="relative flex items-center">
              <Input
                type="search"
                placeholder="Search"
                className="pl-8 pr-12 bg-accent/50"
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 hover:bg-transparent"
              >
                <Mic className="size-4" />
                <span className="sr-only">Voice search</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <ThemeToggle />

          {user && (
            <>
              {/* Team Section */}
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {members?.slice(0, 2).map((member) => (
                    <Avatar key={member.id} className="border-2 border-background size-6">
                      <AvatarFallback>
                        {member.profile?.display_name?.[0]?.toUpperCase() ||
                          member.profile?.email?.[0]?.toUpperCase() ||
                          'U'}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setIsInviteModalOpen(true)}
                >
                  <span>Team mate</span>
                  <Plus className="size-3" />
                </Button>
              </div>

              {/* Invite Modal */}
              <Dialog
                open={isInviteModalOpen}
                onOpenChange={setIsInviteModalOpen}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleInviteMember} className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          placeholder="Email address"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select
                          value={inviteRole}
                          onValueChange={(value: "member" | "admin") => setInviteRole(value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          {inviteRole === "admin"
                            ? "Admins can manage team members and settings"
                            : "Members can view and collaborate on projects"}
                        </p>
                      </div>
                    </div>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Sending..." : "Send Invitation"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Notifications */}
              <NotificationsMenu />

              {/* User Menu */}
              <div className="flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {profile?.display_name?.charAt(0) ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {profile?.display_name || user.email}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                        {profile?.role && (
                          <p className={cn(
                            "text-xs font-medium",
                            {
                              'text-purple-500': profile.is_super_admin,
                              'text-blue-500': !profile.is_super_admin && profile.role === 'admin',
                              'text-gray-500': !profile.is_super_admin && profile.role === 'member'
                            }
                          )}>
                            {getRoleDisplay(profile.role, profile.is_super_admin)}
                          </p>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/account">
                        <UserIcon className="mr-2 size-4" />
                        Account Settings
                      </Link>
                    </DropdownMenuItem>
                    {profile?.role === 'admin' || profile?.is_super_admin ? (
                      <DropdownMenuItem asChild>
                        <Link href="/team/settings">
                          <UserIcon className="mr-2 size-4" />
                          Team Settings
                        </Link>
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="mr-2 size-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

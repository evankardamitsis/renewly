"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MainNav } from "@/components/@shared/main-nav";
import {
  Mic,
  Bell,
  LayoutGrid,
  Plus,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/@shared/theme-toggle";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { teamsApi } from "@/services/api";
import { useAsync } from "@/hooks/useAsync";

interface Profile {
  display_name: string | null;
  email: string | null;
  current_team_id: string | null;
}

interface Team {
  image_url: string | null;
}

export function Header() {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const { loading: isInviting, execute } = useAsync();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function getProfileAndTeam() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        setUser(user);

        const { data: profileData } = await supabase
          .from("profiles")
          .select("display_name, email, current_team_id")
          .eq("id", user.id)
          .single();

        setProfile(profileData);

        if (profileData?.current_team_id) {
          const { data: teamData } = await supabase
            .from("teams")
            .select("image_url")
            .eq("id", profileData.current_team_id)
            .single();

          if (teamData?.image_url) {
            const fileNameMatch = teamData.image_url.match(
              /([a-f0-9-]+-\d+\.png)$/i
            );
            const fileName = fileNameMatch ? fileNameMatch[1] : null;

            if (fileName) {
              const {
                data: { publicUrl },
              } = supabase.storage.from("team-images").getPublicUrl(fileName);

              setTeam({ image_url: publicUrl });
              return;
            }
          }
          setTeam(teamData);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    }

    getProfileAndTeam();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("display_name, email, current_team_id")
          .eq("id", session.user.id)
          .single();

        if (profileData?.current_team_id) {
          const { data: teamData } = await supabase
            .from("teams")
            .select("image_url")
            .eq("id", profileData.current_team_id)
            .single();

          if (teamData?.image_url) {
            const fileNameMatch = teamData.image_url.match(
              /([a-f0-9-]+-\d+\.png)$/i
            );
            const fileName = fileNameMatch ? fileNameMatch[1] : null;

            if (fileName) {
              const {
                data: { publicUrl },
              } = supabase.storage.from("team-images").getPublicUrl(fileName);

              setTeam({ image_url: publicUrl });
              return;
            }
          }
          setTeam(teamData);
        }
        setProfile(profileData);
      } else {
        setProfile(null);
        setTeam(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      router.refresh();
      router.push("/login");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Error signing out");
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.current_team_id) return;

    try {
      await execute(
        teamsApi.invite(profile.current_team_id, inviteEmail),
        "Invitation sent successfully"
      );
      setInviteEmail("");
      setIsInviteModalOpen(false);
    } catch (error) {
      // Error is handled by useAsync
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
                  <Avatar className="border-2 border-background size-6">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>CM</AvatarFallback>
                  </Avatar>
                  <Avatar className="border-2 border-background size-6">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>SO</AvatarFallback>
                  </Avatar>
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
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                    <Button type="submit" disabled={isInviting}>
                      {isInviting ? "Sending..." : "Send Invitation"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Bell className="size-5" />
                </Button>
              </div>

              {/* User */}
              <div className="flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative size-8 rounded-full"
                    >
                      <Avatar>
                        <AvatarImage
                          src={team?.image_url || "/placeholder.svg"}
                          onError={(e) =>
                            (e.currentTarget.src = "/placeholder.svg")
                          }
                          alt={`${profile?.display_name || "User"
                            }'s team avatar`}
                          className="object-cover"
                        />
                        <AvatarFallback>
                          {profile?.display_name?.[0] ||
                            user?.email?.[0].toUpperCase()}
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
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/account" className="cursor-pointer">
                        <UserIcon className="mr-2 size-4" />
                        <span>Account settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="text-destructive cursor-pointer"
                      disabled={loading}
                    >
                      <LogOut className="mr-2 size-4" />
                      <span>{loading ? "Logging out..." : "Log out"}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}

          {/* Menu */}
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="ml-2"
                onClick={toggleSidebar}
              >
                <LayoutGrid className="size-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <Sidebar>
                <MainNav />
              </Sidebar>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

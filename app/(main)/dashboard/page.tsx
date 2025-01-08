"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, Users } from "lucide-react";
import { TaskModal } from "@/components/tasks/task-modal";
import { ProjectModal } from "@/components/projects/project-modal";
import { Task } from "@/types/database";
import { ChatCard } from "@/components/dashboard/chat-card";
import { ActiveProjectsCard } from "@/components/dashboard/active-projects-card";
import { TeamManagementCard } from "@/components/team-management/team-management-card";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PerformanceCard } from "@/components/dashboard/performance-card";
import { tasksApi } from "@/services/api";
import { useProjectActions } from "@/hooks/useProjectActions";

interface TeamMemberData {
  id: string;
  user_id: string;
  role: "admin" | "member";
  is_super_admin: boolean;
  profiles: {
    display_name: string;
    email: string;
  }[];
}

interface Team {
  id: string;
  name: string;
  image_url: string | null;
  members: {
    id: string;
    profile: {
      display_name: string;
      email: string;
    };
  }[];
}

interface Profile {
  display_name: string | null;
  role: string | null;
  current_team_id: string | null;
}

export default function DashboardPage() {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<Team | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<{ role: string; is_super_admin: boolean } | null>(null);
  const router = useRouter();
  const { createProject, isCreating } = useProjectActions();

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const supabase = createClient();

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("display_name, role, current_team_id")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Get current user's role from team_members
        const { data: userRole } = await supabase
          .from("team_members")
          .select("role, is_super_admin")
          .eq("user_id", user.id)
          .eq("team_id", profileData.current_team_id)
          .single();

        setUserRole(userRole);

        // Get current team if exists
        if (profileData.current_team_id) {
          const { data: teamData, error: teamError } = await supabase
            .from("teams")
            .select(`
              id,
              name,
              image_url,
              members:team_members(
                id,
                user_id,
                role,
                is_super_admin,
                profiles(
                  display_name,
                  email
                )
              )
            `)
            .eq("id", profileData.current_team_id)
            .single();

          if (teamError) throw teamError;

          // Transform members data to match TeamMember interface
          const transformedTeam = {
            ...teamData,
            members: (teamData.members || [])
              .filter(m => m.profiles?.length > 0)
              .map((m: TeamMemberData) => ({
                id: m.id,
                user_id: m.user_id,
                role: m.role,
                is_super_admin: m.is_super_admin,
                profile: m.profiles[0]
              }))
          };
          setTeam(transformedTeam);
        }
      } catch (error) {
        console.error("Error loading dashboard:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [router]);

  const handleTaskCreate = async (taskData: Partial<Task>): Promise<void> => {
    try {
      if (!team?.id) throw new Error("No team selected");

      // Get the first project from the team or show project selection modal
      const supabase = createClient();
      const { data: project } = await supabase
        .from("projects")
        .select("id")
        .eq("team_id", team.id)
        .limit(1)
        .single();

      if (!project) throw new Error("No project found");

      await tasksApi.create(project.id, taskData);
      setIsTaskModalOpen(false);
      toast.success("Task created successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create task"
      );
    }
  };

  const handleProjectCreate = async ({
    name,
    description,
  }: {
    name: string;
    description: string;
  }) => {
    const { project } = await createProject({
      name,
      description,
    });

    if (project) {
      setIsProjectModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-8">
      {/* Welcome Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {profile?.display_name || "there"}!
          </h1>
          <p className="text-muted-foreground mt-2">
            {profile?.role || "Team Member"} ·{" "}
            {team?.name || "Personal Workspace"}
          </p>
        </div>
        <Button onClick={() => setIsProjectModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Dashboard Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* New Task Card */}
        <Card className="bg-card/50">
          <CardContent className="p-6">
            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-20 rounded-lg bg-muted/50" />
                <div className="h-20 rounded-lg bg-muted/50 col-span-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-20 rounded-lg bg-muted/50" />
                <div className="h-20 rounded-lg bg-muted/50" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold">New task</h3>
                <p className="text-sm text-muted-foreground">
                  Involves creating and assigning a new task within the project
                  management system.
                </p>
                <div className="flex gap-2 mt-2">
                  <Button
                    className="bg-primary"
                    onClick={() => setIsTaskModalOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add new task
                  </Button>
                  <Button variant="outline">Learn more</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Card */}
        <PerformanceCard />

        {/* Chat Card */}
        <ChatCard />

        {/* Active Projects Card */}
        <ActiveProjectsCard />

        {/* Team Management Card */}
        <TeamManagementCard
          currentUserRole={{
            role: userRole?.role || "member",
            is_super_admin: userRole?.is_super_admin || false
          }}
        />

        {/* Tasks Card */}
        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Tasks</CardTitle>
            <Button variant="ghost" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>U1</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Creating persona</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-full rounded-full bg-secondary">
                      <div className="h-full w-[68%] rounded-full bg-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground">68%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>U2</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Documents & sorting</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-full rounded-full bg-secondary">
                      <div className="h-full w-[45%] rounded-full bg-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground">45%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Card */}
        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming</CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="rounded-lg">
                Design
              </Badge>
              <Badge variant="outline" className="rounded-lg">
                Development
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg bg-accent/50 p-4">
                <h4 className="font-semibold">Branch meeting</h4>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span>Team:</span>
                    <div className="flex -space-x-2">
                      <Avatar className="h-6 w-6 border-2 border-background">
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback>U1</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-6 w-6 border-2 border-background">
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback>U2</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>25th Sep, 2024</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onSave={handleTaskCreate}
        />

        <ProjectModal
          open={isProjectModalOpen}
          onOpenChange={setIsProjectModalOpen}
          onSubmit={handleProjectCreate}
          loading={isCreating}
        />
      </div>
    </div>
  );
}

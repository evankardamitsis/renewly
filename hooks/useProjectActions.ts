import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Project } from "@/types/database";
import { projectsApi } from "@/services/api";

interface CreateProjectData {
  name: string;
  description?: string | null;
  status?: "Planning" | "In Progress" | "Review" | "Completed";
  due_date?: string;
}

export function useProjectActions() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Get current team ID
  const { data: teamId, isLoading: isLoadingTeam } = useQuery({
    queryKey: ["current-team"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("current_team_id")
        .eq("id", user.id)
        .single();

      if (!profile?.current_team_id) {
        throw new Error("No team selected");
      }

      return profile.current_team_id;
    }
  });

  // Get projects for current team
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects", teamId],
    queryFn: () => {
      if (!teamId) throw new Error("Team ID is required");
      return projectsApi.list(teamId);
    },
    enabled: !!teamId,
  });

  // Create project mutation
  const { mutate: createProject, isPending: isCreating } = useMutation({
    mutationFn: async (data: CreateProjectData) => {
      if (!teamId) throw new Error("Team ID is required");
      
      // Generate a URL-friendly slug from the project name
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      
      const result = await projectsApi.create(teamId, {
        ...data,
        team_id: teamId,
        slug,
      });

      return result;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["projects", teamId] });
      toast.success("Project created successfully");
      router.push(`/projects/${project.slug}`);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to create project";
      toast.error(message);
    },
  });

  // Update project mutation
  const { mutate: updateProject, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Project> }) => {
      return projectsApi.update(id, updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects", teamId] });
      queryClient.invalidateQueries({ queryKey: ["projects", variables.id] });
      toast.success("Project updated successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update project");
    },
  });

  // Delete project mutation
  const { mutate: deleteProject, isPending: isDeleting } = useMutation({
    mutationFn: projectsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", teamId] });
      toast.success("Project deleted successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete project");
    },
  });

  return {
    // Data
    teamId,
    projects,
    
    // Loading states
    isLoadingTeam,
    isLoadingProjects,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Actions
    createProject: (data: CreateProjectData) => createProject(data),
    updateProject,
    deleteProject,
  };
}

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useProjectStore } from "@/store/useProjectStore";
import { toast } from "sonner";

export function useProjectActions() {
  const router = useRouter();
  const { addProject } = useProjectStore();
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const getCurrentTeamId = async () => {
    try {
      setIsLoadingTeam(true);
      const supabase = createClient();
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
    } finally {
      setIsLoadingTeam(false);
    }
  };

  const createProject = async ({
    name,
    description = null,
    status = "Planning",
    due_date,
  }: {
    name: string;
    description?: string | null;
    status?: "Planning" | "In Progress" | "Review" | "Completed";
    due_date?: string;
  }) => {
    try {
      setIsCreating(true);
      const team_id = await getCurrentTeamId();

      const project = await addProject({
        name,
        description,
        team_id,
        status,
        due_date,
      });

      toast.success("Project created successfully");
      router.push(`/projects/${project.slug}`);
      return { project, error: null };
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : "Failed to create project";
      toast.error(message);
      return { project: null, error: message };
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createProject,
    isLoadingTeam,
    isCreating,
  };
}

import { useProjectStore } from "@/store/useProjectStore";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { generateSlug } from "@/utils/slug";
import { edgeApi } from "@/utils/api-client";

export function useProjectActions() {
  const router = useRouter();
  const { addProject, setError } = useProjectStore();

  const createProject = async ({
    name,
    description,
  }: {
    name: string;
    description: string | null;
  }) => {
    try {
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

      const projectData = {
        name,
        description,
        team_id: profile.current_team_id,
        slug: generateSlug(name),
      };

      const createdProject = await edgeApi.createProject(projectData);
      addProject(createdProject);
      toast.success("Project created successfully");
      router.push(`/projects/${createdProject.slug}`);
      return createdProject;
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : "Failed to create project";
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  return { createProject };
}

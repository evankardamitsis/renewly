"use client";

import { useEffect } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { createClient } from "@/utils/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical, Trash } from "lucide-react";
import { ProjectModal } from "@/components/projects/project-modal";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

export default function ProjectsPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const {
    projects,
    isLoading,
    error,
    fetchProjects,
    addProject,
    deleteProject,
    setError,
  } = useProjectStore();

  useEffect(() => {
    async function loadProjects() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("current_team_id")
        .eq("id", user.id)
        .single();

      if (profile?.current_team_id) {
        await fetchProjects(profile.current_team_id);
      }
    }

    loadProjects();
  }, [fetchProjects]);

  const handleProjectCreate = async (newProject: {
    name: string;
    description: string | null;
  }) => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("current_team_id")
        .eq("id", user.id)
        .single();

      if (!profile?.current_team_id) {
        throw new Error("No team selected");
      }

      const createdProject = await addProject({
        name: newProject.name,
        description: newProject.description,
        team_id: profile.current_team_id,
      });

      setIsModalOpen(false);
      toast.success("Project created successfully");
      router.push(`/projects/${createdProject.slug}`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        toast.error("Failed to create project");
      }
    }
  };

  const handleProjectDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      await deleteProject(projectToDelete);
      toast.success("Project deleted successfully");
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
    } catch (err) {
      toast.error("Failed to delete project");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-destructive">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="group bg-card rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow relative"
            onClick={() => router.push(`/projects/${project.slug}`)}
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={(e) => handleProjectDelete(project.id, e)}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <h2 className="text-xl font-semibold mb-2">{project.name}</h2>
            <p className="text-muted-foreground mb-4 line-clamp-2">
              {project.description}
            </p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {project.tasks} tasks
              </span>
              <span className="text-sm text-muted-foreground">
                Due{" "}
                {project.due_date
                  ? new Date(project.due_date).toLocaleDateString()
                  : "Not set"}
              </span>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-12">
            No projects found. Create your first project to get started!
          </div>
        )}
      </div>

      <ProjectModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleProjectCreate}
      />

      <ConfirmationModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone."
      />
    </div>
  );
}

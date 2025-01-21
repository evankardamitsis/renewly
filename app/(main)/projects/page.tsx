"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical, Trash } from "lucide-react";
import { ProjectModal } from "@/components/projects/project-modal";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { useProjects } from "@/hooks/useProjects";
import { Badge } from "@/components/ui/badge";

export default function ProjectsPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const {
    projects = [],
    isLoading,
    createProject,
    deleteProject,
    isCreating,
  } = useProjects();

  const handleProjectCreate = async (newProject: {
    name: string;
    description: string | null;
    status_id: string;
    due_date: string | null;
  }) => {
    try {
      await createProject(newProject);
      toast.success("Project created successfully");
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create project");
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
      toast.error(err instanceof Error ? err.message : "Failed to delete project");
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-muted-foreground">Loading projects...</div>
        </div>
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
            className="group bg-card rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow relative cursor-pointer"
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
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-semibold">{project.name}</h2>
              {project.status && (
                <Badge
                  className="capitalize"
                  style={{
                    backgroundColor: project.status.color,
                    color: 'white'
                  }}
                >
                  {project.status.name}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mb-4 line-clamp-2">
              {project.description}
            </p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {project.taskCount || 0} tasks
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
        {projects.length === 0 && !isLoading && (
          <div className="col-span-full text-center text-muted-foreground py-12">
            No projects found. Create your first project to get started!
          </div>
        )}
      </div>

      <ProjectModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleProjectCreate}
        loading={isCreating}
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

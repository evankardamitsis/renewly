"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Project } from "@/types/database";
import { ProjectModal } from "./project-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { generateSlug } from "@/utils/slug";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

interface ProjectListProps {
  projects: Project[];
  onProjectCreate: (project: Partial<Project>) => Promise<void>;
  onProjectUpdate: (id: string, updates: Partial<Project>) => Promise<void>;
  onProjectDelete: (id: string) => Promise<void>;
}

export function ProjectList({
  projects,
  onProjectCreate,
  onProjectUpdate,
  onProjectDelete,
}: ProjectListProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const handleProjectSave = async (project: {
    name: string;
    description: string | null;
  }) => {
    try {
      if (editingProject) {
        await onProjectUpdate(editingProject.id, {
          name: project.name,
          description: project.description,
          slug: generateSlug(project.name),
          updated_at: new Date().toISOString(),
        });
      } else {
        await onProjectCreate({
          name: project.name,
          description: project.description,
          slug: generateSlug(project.name),
        });
      }
      setIsModalOpen(false);
      setEditingProject(undefined);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save project"
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      await onProjectDelete(projectToDelete);
      toast.success("Project deleted successfully");
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Projects</h2>
        <Button onClick={() => setIsModalOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          New Project
        </Button>
      </div>

      <div className="grid gap-4">
        {projects.map((project) => (
          <Card
            key={project.id}
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => router.push(`/projects/${project.slug}`)}
          >
            <CardHeader className="p-4">
              <CardTitle className="text-lg">{project.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-sm text-muted-foreground">
                {project.description}
              </p>
              <div className="mt-2 text-sm text-muted-foreground">
                {project.tasks?.length || 0} tasks
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ProjectModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleProjectSave}
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

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ProjectModal } from "@/components/projects/project-modal";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/store/useProjectStore";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { calculateDaysLeft } from "@/utils/date";
import { toast } from "sonner";
import { Project } from "@/types/project";
import { generateSlug } from "@/utils/slug";

export function ActiveProjectsCard() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { projects, isLoading, error, addProject, setError } =
    useProjectStore();

  const activeProjects = projects.filter(
    p => p.status === "In Progress" || p.status === "Planning"
  )

  const handleProjectCreate = async (newProject: Omit<Project, "status" | "dueDate" | "slug">) => {
    try {
      const projectWithDefaults: Project = {
        ...newProject,
        slug: generateSlug(newProject.name),
        status: "Planning",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }
      addProject(projectWithDefaults)
      setIsModalOpen(false)
      toast.success("Project created successfully")
      router.push(`/projects/${projectWithDefaults.slug}`)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
        toast.error("Failed to create project")
      }
    }
  }

  if (error) {
    return (
      <Card className="bg-card/50">
        <CardContent className="p-6">
          <div className="text-destructive text-center">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-card/50">
        <CardContent className="p-6">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Active Projects</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            New Project
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between cursor-pointer hover:bg-accent/50 rounded-lg p-2 transition-colors"
                onClick={() => router.push(`/projects/${project.slug}`)}
              >
                <div>
                  <p className="font-medium">{project.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {calculateDaysLeft(project.dueDate)} days left
                  </p>
                </div>
                <Badge variant="secondary">{project.tasks.length} tasks</Badge>
              </div>
            ))}
            {activeProjects.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No active projects. Create one to get started!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleProjectCreate}
      />
    </>
  );
}


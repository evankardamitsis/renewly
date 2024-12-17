"use client";

import { useProjectStore } from "@/store/useProjectStore";
import { ProjectList } from "@/components/projects/project-list";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function ProjectsPage() {
  const { projects, isLoading, error, addProject, updateProject } =
    useProjectStore();

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return <div className="text-destructive text-center">{error}</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <ProjectList
        projects={projects}
        onProjectCreate={addProject}
        onProjectUpdate={updateProject}
      />
    </div>
  );
}

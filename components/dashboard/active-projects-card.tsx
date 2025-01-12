"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { calculateDaysLeft } from "@/utils/date";
import { useProjects } from "@/hooks/useProjects";

export function ActiveProjectsCard() {
  const router = useRouter();
  const { projects, isLoading, error } = useProjects();

  if (error) {
    return (
      <Card className="bg-card/50">
        <CardContent className="p-6">
          <div className="text-destructive text-center">
            Error: {error instanceof Error ? error.message : "Failed to load projects"}
          </div>
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
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle>Active Projects</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between cursor-pointer hover:bg-accent/50 rounded-lg p-2 transition-colors"
              onClick={() => router.push(`/projects/${project.slug}`)}
            >
              <div>
                <p className="font-medium">{project.name}</p>
                <p className="text-sm text-muted-foreground">
                  {project.due_date ? calculateDaysLeft(project.due_date) : 0}{" "}
                  days left
                </p>
              </div>
              <Badge variant="secondary">{project.taskCount || 0} tasks</Badge>
            </div>
          ))}
          {projects.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No active projects. Create one to get started!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

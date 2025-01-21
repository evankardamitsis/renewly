"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { calculateDaysLeft } from "@/utils/date";
import { useProjects } from "@/hooks/useProjects";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function ActiveProjectsCard() {
  const router = useRouter();
  const { projects, isLoading, error } = useProjects();

  if (error) {
    return (
      <Card className="bg-card/50 col-span-2">
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
      <Card className="bg-card/50 col-span-2">
        <CardContent className="p-6">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Active Projects</CardTitle>
        <Badge variant="secondary">{projects.length} Total</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {projects.map((project) => {
            return (
              <div
                key={project.id}
                className="group cursor-pointer hover:bg-accent/50 rounded-lg p-4 transition-colors"
                onClick={() => router.push(`/projects/${project.slug}`)}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{project.name}</p>
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
                    <div className="text-sm text-muted-foreground">
                      {project.due_date && (
                        <span>Due {new Date(project.due_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        {project.taskCount || 0} tasks
                      </span>
                      {project.due_date && (
                        <span className="text-muted-foreground">
                          {calculateDaysLeft(project.due_date)} days left
                        </span>
                      )}
                    </div>
                    <Progress
                      value={33}
                      className={cn(
                        "w-24",
                        project.status?.color ? `[--progress:${project.status.color}]` : undefined
                      )}
                    />
                  </div>
                </div>
              </div>
            );
          })}
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

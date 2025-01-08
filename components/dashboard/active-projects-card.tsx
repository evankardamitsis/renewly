"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { calculateDaysLeft } from "@/utils/date";
import { toast } from "sonner";
import { Project } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

export function ActiveProjectsCard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);

  useEffect(() => {
    async function fetchActiveProjects() {
      try {
        const supabase = createClient();
        const { data: projects, error } = await supabase
          .from("projects")
          .select(
            `
            *,
            tasks:tasks(count)
          `
          )
          .in("status", ["Planning", "In Progress"])
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Transform the count from tasks aggregation
        const projectsWithTaskCount = (projects || []).map((project) => ({
          ...project,
          tasks: project.tasks[0]?.count || 0,
        }));

        setActiveProjects(projectsWithTaskCount);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load projects";
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchActiveProjects();
  }, []);

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
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle>Active Projects</CardTitle>
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
                  {project.due_date ? calculateDaysLeft(project.due_date) : 0}{" "}
                  days left
                </p>
              </div>
              <Badge variant="secondary">{project.tasks} tasks</Badge>
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
  );
}

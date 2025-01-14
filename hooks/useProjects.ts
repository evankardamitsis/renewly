"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/react-query";
import { useProfile } from "./useProfile";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Project } from "@/types/project";
import React from "react";

interface CreateProjectData {
  name: string;
  description?: string | null;
  status_id?: string;
  due_date?: string;
  has_board_enabled?: boolean;
  owner_id?: string;
}

const supabase = createClient();

async function getProjects(teamId: string) {
  const { data, error } = await supabase
    .from("projects")
    .select(`
      *,
      tasks:tasks(count),
      status:project_statuses(
        id,
        name,
        color
      )
    `)
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map((project) => ({
    ...project,
    taskCount: project.tasks[0].count,
    status: project.status?.[0] || null,
  })) as Project[];
}

export function useProjects() {
  const router = useRouter();
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const teamId = profile?.current_team_id;

  // Prefetch projects data
  React.useEffect(() => {
    if (teamId) {
      queryClient.prefetchQuery({
        queryKey: queryKeys.projects.all(teamId),
        queryFn: () => getProjects(teamId),
        staleTime: 30 * 60 * 1000,
      });
    }
  }, [teamId, queryClient]);

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects.all(teamId ?? ""),
    queryFn: () => {
      if (!teamId) throw new Error("Team ID is required");
      return getProjects(teamId);
    },
    enabled: !!teamId,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 2,
    retryDelay: 1000,
    placeholderData: (oldData) => oldData,
  });

  const createProject = useMutation({
    mutationFn: async (data: CreateProjectData) => {
      if (!teamId) throw new Error("Team ID is required");

      // Generate a URL-friendly slug from the project name
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const { data: project, error } = await supabase
        .from("projects")
        .insert([{
          ...data,
          team_id: teamId,
          slug,
          has_board_enabled: data.has_board_enabled ?? false,
          owner_id: data.owner_id || profile?.id,
        }])
        .select(`
          *,
          status:project_statuses(
            id,
            name,
            color
          )
        `)
        .single();

      if (error) throw error;
      return project as Project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.all(teamId),
      });
      toast.success("Project created successfully");
      router.push(`/projects/${project.slug}`);
    },
    onError: (error) => {
      const message = error instanceof Error
        ? error.message
        : "Failed to create project";
      toast.error(message);
    },
  });

  const updateProject = useMutation({
    mutationFn: async (
      { id, updates }: { id: string; updates: Partial<Project> },
    ) => {
      const { data, error } = await supabase
        .from("projects")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select(`
          *,
          status:project_statuses(
            id,
            name,
            color
          )
        `)
        .single();

      if (error) throw error;
      return data as Project;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.all(teamId),
      });
      queryClient.invalidateQueries({ queryKey: ["projects", variables.id] });
      toast.success("Project updated successfully");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update project",
      );
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.all(teamId),
      });
      toast.success("Project deleted successfully");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete project",
      );
    },
  });

  return {
    // Data
    projects: projectsQuery.data ?? [],

    // Loading states
    isLoading: projectsQuery.isLoading,
    error: projectsQuery.error,
    isCreating: createProject.isPending,
    isUpdating: updateProject.isPending,
    isDeleting: deleteProject.isPending,

    // Actions
    createProject: createProject.mutate,
    updateProject: updateProject.mutate,
    deleteProject: deleteProject.mutate,
  };
}

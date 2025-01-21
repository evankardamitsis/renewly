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
  status_id?: string | null;
  due_date?: string | null;
  has_board_enabled?: boolean;
  owner_id?: string;
}

interface ProjectStatus {
  id: string;
  name: string;
  color: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

interface SupabaseProjectResponse {
  id: string;
  team_id: string;
  name: string;
  description: string | null;
  status_id: string | null;
  created_at: string;
  updated_at: string;
  due_date: string | null;
  slug: string;
  created_by: string | null;
  has_board_enabled: boolean;
  owner_id: string | null;
  tasks?: { count: number }[];
  status?: ProjectStatus | null;
}

const supabase = createClient();

async function getProjects(teamId: string) {
  const { data, error } = await supabase
    .from("projects")
    .select(`
      id,
      team_id,
      name,
      description,
      status_id,
      created_at,
      updated_at,
      due_date,
      slug,
      created_by,
      has_board_enabled,
      owner_id,
      tasks:tasks(count),
      status:project_statuses!projects_status_id_fkey(
        id,
        name,
        color,
        description,
        sort_order,
        created_at
      )
    `)
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data as unknown as SupabaseProjectResponse[]).map((project) => {
    const { tasks, status, ...rest } = project;
    return {
      ...rest,
      tasks: [], // Initialize with empty array as per Project type
      taskCount: tasks?.[0]?.count || 0,
      status: status || null,
    } as Project;
  });
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

      // If no status_id is provided, get the "Planning" status
      if (!data.status_id) {
        const { data: statuses, error: statusError } = await supabase
          .from("project_statuses")
          .select("*")
          .eq("name", "Planning")
          .single();

        if (statusError) {
          console.error("Error fetching default status:", statusError);
          throw new Error("Failed to fetch default status");
        }
        data.status_id = statuses.id;
      }

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
          id,
          name,
          description,
          created_at,
          updated_at,
          due_date,
          slug,
          team_id,
          has_board_enabled,
          status_id,
          created_by,
          owner_id,
          status:project_statuses(
            id,
            name,
            color,
            description,
            sort_order,
            created_at
          )
        `)
        .single();

      if (error) throw error;

      const response = project as unknown as SupabaseProjectResponse;
      const { status, ...rest } = response;
      return {
        ...rest,
        tasks: [],
        taskCount: 0,
        status: status || null,
      } as Project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.all(teamId),
      });
      toast.success("Project created successfully");
      router.push(`/projects/${project.slug}`);
    },
    onError: (error) => {
      console.error("Project creation error:", error);
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
          id,
          team_id,
          name,
          description,
          status_id,
          created_at,
          updated_at,
          due_date,
          slug,
          created_by,
          has_board_enabled,
          owner_id,
          status:project_statuses(
            id,
            name,
            color,
            description,
            sort_order,
            created_at
          )
        `)
        .single();

      if (error) throw error;

      const response = data as unknown as SupabaseProjectResponse;
      const { status, ...rest } = response;
      return {
        ...rest,
        tasks: [],
        taskCount: 0,
        status: status || null,
      } as Project;
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

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/react-query";
import { useProfile } from "./useProfile";
import { toast } from "sonner";
import { Project } from "@/types/database";

const supabase = createClient();

export function useProject(slug: string) {
    const queryClient = useQueryClient();
    const { profile } = useProfile();

    const projectQuery = useQuery({
        queryKey: queryKeys.projects.byId(slug),
        queryFn: async () => {
            const { data, error } = await supabase
                .from("projects")
                .select(`
                    *,
                    status:project_statuses(
                        id,
                        name,
                        color,
                        description,
                        sort_order,
                        created_at
                    ),
                    owner:users(
                        id,
                        email,
                        full_name,
                        avatar_url
                    ),
                    tasks:tasks(count)
                `)
                .eq("slug", slug)
                .single();

            if (error) throw error;

            const { tasks, ...rest } = data;
            return {
                ...rest,
                tasks: [], // Initialize with empty array as per Project type
                taskCount: tasks?.[0]?.count || 0,
            } as Project;
        },
        enabled: !!slug,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
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
                        color,
                        description,
                        sort_order,
                        created_at
                    ),
                    owner:users(
                        id,
                        email,
                        full_name,
                        avatar_url
                    ),
                    tasks:tasks(count)
                `)
                .single();

            if (error) throw error;

            const { tasks, ...rest } = data;
            return {
                ...rest,
                tasks: [], // Initialize with empty array as per Project type
                taskCount: tasks?.[0]?.count || 0,
            } as Project;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.projects.byId(slug),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.projects.all(
                    profile?.current_team_id ?? "",
                ),
            });
            toast.success("Project updated successfully");
        },
        onError: (error) => {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to update project",
            );
        },
    });

    return {
        project: projectQuery.data,
        isLoading: projectQuery.isLoading,
        error: projectQuery.error,
        updateProject: updateProject.mutate,
    };
}

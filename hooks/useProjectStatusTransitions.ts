"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/react-query";
import { useProfile } from "./useProfile";
import { toast } from "sonner";
import {
    ProjectStatusHistory,
    ProjectStatusTransition,
} from "@/types/database";
import { notificationsApi } from "@/services/notifications";

const supabase = createClient();

interface TransitionData {
    projectId: string;
    fromStatusId: string | null;
    toStatusId: string;
    comment?: string;
}

async function getProjectStatusHistory(projectId: string) {
    const { data, error } = await supabase
        .from("project_status_history")
        .select(`
            id,
            project_id,
            status_id,
            user_id,
            comment,
            created_at,
            status:project_statuses!inner(
                id,
                name,
                color,
                description,
                sort_order,
                created_at
            ),
            user:users!inner(
                id,
                email,
                full_name,
                avatar_url,
                created_at
            )
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data as unknown as ProjectStatusHistory[];
}

export function useProjectStatusTransitions(projectId?: string) {
    const queryClient = useQueryClient();
    const { profile } = useProfile();

    const historyQuery = useQuery({
        queryKey: queryKeys.projects.statusHistory(projectId ?? ""),
        queryFn: () => {
            if (!projectId) throw new Error("Project ID is required");
            return getProjectStatusHistory(projectId);
        },
        enabled: !!projectId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });

    const transitionStatus = useMutation({
        mutationFn: async (
            { projectId, fromStatusId, toStatusId, comment }: TransitionData,
        ) => {
            if (!profile?.id) throw new Error("User ID is required");

            // Create the transition record
            const { data: transition, error: transitionError } = await supabase
                .from("project_status_transitions")
                .insert([{
                    project_id: projectId,
                    from_status_id: fromStatusId,
                    to_status_id: toStatusId,
                    user_id: profile.id,
                    comment,
                    created_at: new Date().toISOString(),
                }])
                .select()
                .single();

            if (transitionError) throw transitionError;

            // Update the project status
            const { error: updateError } = await supabase
                .from("projects")
                .update({
                    status_id: toStatusId,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", projectId);

            if (updateError) throw updateError;

            // Get project and status details for notification
            const { data: project } = await supabase
                .from("projects")
                .select(`
                    name,
                    slug,
                    status:project_statuses!inner(
                        id,
                        name,
                        color,
                        description,
                        sort_order,
                        created_at
                    )
                `)
                .eq("id", projectId)
                .single();

            if (project && project.status && "name" in project.status) {
                // Create notification for project members
                const { data: members } = await supabase
                    .from("project_members")
                    .select("user_id")
                    .eq("project_id", projectId);

                if (members) {
                    for (const member of members) {
                        if (member.user_id !== profile.id) {
                            await notificationsApi.createNotification({
                                userId: member.user_id,
                                type: "PROJECT_STATUS_CHANGED",
                                title: "Project Status Changed",
                                message:
                                    `Project "${project.name}" status changed to "${project.status.name}"`,
                                projectId,
                                actionUrl: `/projects/${project.slug}`,
                                metadata: {
                                    projectId,
                                    fromStatusId,
                                    toStatusId,
                                },
                            });
                        }
                    }
                }
            }

            return transition as ProjectStatusTransition;
        },
        onSuccess: () => {
            if (projectId) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.projects.statusHistory(projectId),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.projects.all(
                        profile?.current_team_id ?? "",
                    ),
                });
            }
            toast.success("Project status updated successfully");
        },
        onError: (error) => {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to update project status",
            );
        },
    });

    return {
        // Data
        history: historyQuery.data ?? [],

        // Loading states
        isLoading: historyQuery.isLoading,
        error: historyQuery.error,
        isTransitioning: transitionStatus.isPending,

        // Actions
        transitionStatus: transitionStatus.mutate,
    };
}

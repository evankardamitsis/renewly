"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/react-query";
import { toast } from "sonner";

interface ProjectStatus {
    id: string;
    name: string;
    color: string;
    description?: string;
    sort_order: number;
    created_at: string;
}

interface CreateStatusData {
    name: string;
    color: string;
    description?: string;
    sort_order?: number;
}

const supabase = createClient();

async function getProjectStatuses() {
    const { data, error } = await supabase
        .from("project_statuses")
        .select("*")
        .order("sort_order", { ascending: true });

    if (error) throw error;
    return data as ProjectStatus[];
}

export function useProjectStatuses() {
    const queryClient = useQueryClient();

    const statusesQuery = useQuery({
        queryKey: queryKeys.projects.getStatuses(),
        queryFn: getProjectStatuses,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });

    const createStatus = useMutation({
        mutationFn: async (data: CreateStatusData) => {
            const { data: status, error } = await supabase
                .from("project_statuses")
                .insert([{
                    ...data,
                    sort_order: data.sort_order ?? 0,
                }])
                .select()
                .single();

            if (error) throw error;
            return status as ProjectStatus;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.projects.getStatuses(),
            });
            toast.success("Status created successfully");
        },
        onError: (error) => {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to create status",
            );
        },
    });

    const updateStatus = useMutation({
        mutationFn: async (
            { id, updates }: { id: string; updates: Partial<ProjectStatus> },
        ) => {
            const { data, error } = await supabase
                .from("project_statuses")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data as ProjectStatus;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.projects.getStatuses(),
            });
            toast.success("Status updated successfully");
        },
        onError: (error) => {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to update status",
            );
        },
    });

    const deleteStatus = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("project_statuses")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.projects.getStatuses(),
            });
            toast.success("Status deleted successfully");
        },
        onError: (error) => {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to delete status",
            );
        },
    });

    const reorderStatuses = useMutation({
        mutationFn: async (statuses: { id: string; sort_order: number }[]) => {
            const { error } = await supabase
                .from("project_statuses")
                .upsert(
                    statuses.map(({ id, sort_order }) => ({
                        id,
                        sort_order,
                        updated_at: new Date().toISOString(),
                    })),
                );

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.projects.getStatuses(),
            });
        },
        onError: (error) => {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to reorder statuses",
            );
        },
    });

    return {
        // Data
        statuses: statusesQuery.data ?? [],

        // Loading states
        isLoading: statusesQuery.isLoading,
        error: statusesQuery.error,
        isCreating: createStatus.isPending,
        isUpdating: updateStatus.isPending,
        isDeleting: deleteStatus.isPending,
        isReordering: reorderStatuses.isPending,

        // Actions
        createStatus: createStatus.mutate,
        updateStatus: updateStatus.mutate,
        deleteStatus: deleteStatus.mutate,
        reorderStatuses: reorderStatuses.mutate,
    };
}

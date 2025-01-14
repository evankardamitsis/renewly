"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/react-query";
import { toast } from "sonner";

interface ProjectFile {
    id: string;
    project_id: string;
    name: string;
    url: string;
    size: number;
    type: string;
    uploaded_by: string;
    created_at: string;
}

interface UploadFileData {
    projectId: string;
    file: File;
}

const supabase = createClient();

async function getProjectFiles(projectId: string) {
    const { data, error } = await supabase
        .from("project_files")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data as ProjectFile[];
}

export function useProjectFiles(projectId: string) {
    const queryClient = useQueryClient();

    const filesQuery = useQuery({
        queryKey: queryKeys.projects.files(projectId),
        queryFn: () => getProjectFiles(projectId),
        enabled: !!projectId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });

    const uploadFile = useMutation({
        mutationFn: async ({ projectId, file }: UploadFileData) => {
            // 1. Upload to Supabase Storage
            const fileExt = file.name.split(".").pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from("project-files")
                .upload(`${projectId}/${fileName}`, file);

            if (uploadError) throw uploadError;

            // 2. Create file record in database
            const { data: fileRecord, error: dbError } = await supabase
                .from("project_files")
                .insert({
                    project_id: projectId,
                    name: file.name,
                    url: uploadData.path,
                    size: file.size,
                    type: file.type,
                })
                .select()
                .single();

            if (dbError) throw dbError;
            return fileRecord as ProjectFile;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.projects.files(projectId),
            });
            toast.success("File uploaded successfully");
        },
        onError: (error) => {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to upload file",
            );
        },
    });

    const deleteFile = useMutation({
        mutationFn: async (fileId: string) => {
            // 1. Get file URL
            const { data: file, error: fetchError } = await supabase
                .from("project_files")
                .select("url")
                .eq("id", fileId)
                .single();

            if (fetchError) throw fetchError;

            // 2. Delete from storage
            if (file) {
                const { error: storageError } = await supabase
                    .storage
                    .from("project-files")
                    .remove([file.url]);

                if (storageError) throw storageError;
            }

            // 3. Delete record
            const { error: dbError } = await supabase
                .from("project_files")
                .delete()
                .eq("id", fileId);

            if (dbError) throw dbError;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.projects.files(projectId),
            });
            toast.success("File deleted successfully");
        },
        onError: (error) => {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to delete file",
            );
        },
    });

    return {
        // Data
        files: filesQuery.data ?? [],

        // Loading states
        isLoading: filesQuery.isLoading,
        error: filesQuery.error,
        isUploading: uploadFile.isPending,
        isDeleting: deleteFile.isPending,

        // Actions
        uploadFile: uploadFile.mutate,
        deleteFile: deleteFile.mutate,
    };
}

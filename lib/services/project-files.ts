import { createClient } from "@/lib/supabase/client";
import { FileUploadResponse, ProjectFile } from "@/lib/types/project-files";
import { getFileTypeFromName } from "@/lib/utils/file-utils";

const supabase = createClient();

export async function uploadProjectFile({
    file,
    projectId,
    userId,
}: {
    file: File;
    projectId: string;
    userId: string;
}): Promise<FileUploadResponse> {
    const timestamp = new Date().getTime();
    const fileName = `${file.name.split(".")[0]}_${timestamp}.${
        file.name.split(".").pop()
    }`;
    const filePath = `${projectId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: fileData, error: insertError } = await supabase
        .from("project_files")
        .insert({
            project_id: projectId,
            name: file.name,
            size: file.size,
            type: getFileTypeFromName(file.name),
            storage_path: filePath,
            uploaded_by: userId,
        })
        .select()
        .single();

    if (insertError) throw insertError;

    return {
        path: filePath,
        id: fileData.id,
    };
}

export async function deleteProjectFile(fileId: string): Promise<void> {
    const { data: file, error: fetchError } = await supabase
        .from("project_files")
        .select("project_id, name")
        .eq("id", fileId)
        .single();

    if (fetchError) throw fetchError;

    const filePath = `${file.project_id}/${file.name}`;

    const { error: storageError } = await supabase.storage
        .from("project-files")
        .remove([filePath]);

    if (storageError) throw storageError;

    const { error: deleteError } = await supabase
        .from("project_files")
        .delete()
        .eq("id", fileId);

    if (deleteError) throw deleteError;
}

export async function getProjectFiles(
    projectId: string,
): Promise<ProjectFile[]> {
    const { data, error } = await supabase
        .from("project_files")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}

export async function getProjectFile(fileId: string): Promise<ProjectFile> {
    const { data, error } = await supabase
        .from("project_files")
        .select("*")
        .eq("id", fileId)
        .single();

    if (error) throw error;
    return data;
}

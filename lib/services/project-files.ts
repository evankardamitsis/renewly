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
    // Check if file with same name exists
    const { data: existingFiles, error: checkError } = await supabase
        .from("project_files")
        .select("name")
        .eq("project_id", projectId)
        .eq("name", file.name)
        .single();

    if (checkError && checkError.code !== "PGRST116") throw checkError; // PGRST116 is "no rows returned" error
    if (existingFiles) {
        throw new Error("A file with this name already exists in the project");
    }

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
        .select("storage_path")
        .eq("id", fileId)
        .single();

    if (fetchError) throw fetchError;

    const { error: storageError } = await supabase.storage
        .from("project-files")
        .remove([file.storage_path]);

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

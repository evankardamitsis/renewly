export interface ProjectFile {
    id: string;
    project_id: string;
    name: string;
    size: number;
    type: string;
    storage_path: string;
    uploaded_by: string;
    created_at: string;
    updated_at: string;
}

export type ProjectFileCreate = Omit<
    ProjectFile,
    "id" | "created_at" | "updated_at"
>;

export interface FileUploadResponse {
    path: string;
    id: string;
}

export interface FileUploadError {
    message: string;
    code?: string;
}

import {
    QueryClient,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { createClient } from "./supabase/client";
import {
    deleteProjectFile,
    getProjectFile,
    getProjectFiles,
    uploadProjectFile,
} from "./services/project-files";

type ProjectQueryKey =
    | readonly ["projects", string]
    | readonly ["projects", string, "active"]
    | readonly ["projects", "detail", string]
    | readonly ["projects", "files", string]
    | readonly ["projects", "file", string]
    | readonly ["projects", string, "files"]
    | readonly ["projects", "statuses"]
    | readonly ["projects", string, "status-history"]
    | readonly ["projects", string, "status-transitions"];

type NotificationQueryKey =
    | readonly ["notifications", string]
    | readonly ["notifications", string, "infinite"]
    | readonly ["notifications", string, "unread"];

type AuthQueryKey = readonly ["auth", "profile", string];

type TeamQueryKey =
    | readonly ["teams", "detail", string]
    | readonly ["teams", "members", string];

export const queryKeys: {
    projects: {
        all: (teamId: string) => ProjectQueryKey;
        active: (teamId: string) => ProjectQueryKey;
        byId: (projectId: string) => ProjectQueryKey;
        files: (projectId: string) => ProjectQueryKey;
        file: (fileId: string) => ProjectQueryKey;
        getFiles: (projectId: string) => ProjectQueryKey;
        getStatuses: () => ProjectQueryKey;
        statusHistory: (projectId: string) => ProjectQueryKey;
        statusTransitions: (projectId: string) => ProjectQueryKey;
    };
    notifications: {
        all: (userId: string) => NotificationQueryKey;
        infinite: (userId: string) => NotificationQueryKey;
        unread: (userId: string) => NotificationQueryKey;
    };
    auth: {
        profile: (userId: string) => AuthQueryKey;
    };
    teams: {
        byId: (teamId: string) => TeamQueryKey;
        members: (teamId: string) => TeamQueryKey;
    };
} = {
    projects: {
        all: (teamId: string) => ["projects", teamId] as const,
        active: (teamId: string) => ["projects", teamId, "active"] as const,
        byId: (projectId: string) => ["projects", "detail", projectId] as const,
        files: (projectId: string) => ["projects", "files", projectId] as const,
        file: (fileId: string) => ["projects", "file", fileId] as const,
        getFiles: (projectId: string) =>
            ["projects", projectId, "files"] as const,
        getStatuses: () => ["projects", "statuses"] as const,
        statusHistory: (projectId: string) =>
            ["projects", projectId, "status-history"] as const,
        statusTransitions: (projectId: string) =>
            ["projects", projectId, "status-transitions"] as const,
    },
    notifications: {
        all: (userId: string) => ["notifications", userId] as const,
        infinite: (userId: string) =>
            ["notifications", userId, "infinite"] as const,
        unread: (userId: string) =>
            ["notifications", userId, "unread"] as const,
    },
    auth: {
        profile: (userId: string) => ["auth", "profile", userId] as const,
    },
    teams: {
        byId: (teamId: string) => ["teams", "detail", teamId] as const,
        members: (teamId: string) => ["teams", "members", teamId] as const,
    },
};

// Default stale time for queries (5 minutes)
const DEFAULT_STALE_TIME = 5 * 60 * 1000;

// Create a client with default options
export function createQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: DEFAULT_STALE_TIME,
                retry: 1,
                refetchOnWindowFocus: false,
            },
        },
    });
}

// Supabase query utilities
export const queryUtils = {
    profile: {
        getById: async (userId: string) => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();

            if (error) throw error;
            return data;
        },
        getCurrentTeam: async (userId: string) => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("profiles")
                .select("current_team_id")
                .eq("id", userId)
                .single();

            if (error) throw error;
            return data.current_team_id;
        },
    },
    teams: {
        getById: async (teamId: string) => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("teams")
                .select(`
                    id,
                    name,
                    image_url,
                    members:team_members(
                        id,
                        user_id,
                        role,
                        is_super_admin,
                        profile:profiles!team_members_email_fkey(
                            id,
                            display_name,
                            email,
                            role
                        )
                    )
                `)
                .eq("id", teamId)
                .single();

            if (error) throw error;
            return data;
        },
        getMembers: async (teamId: string) => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("team_members")
                .select(`
                    id,
                    user_id,
                    role,
                    is_super_admin,
                    profile:profiles(
                        id,
                        display_name,
                        email,
                        role
                    )
                `)
                .eq("team_id", teamId);

            if (error) throw error;
            return data;
        },
    },
    projects: {
        getAll: async (teamId: string) => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("projects")
                .select(`
                    id,
                    name,
                    description,
                    status_id,
                    status:project_statuses(
                        id,
                        name,
                        color,
                        description,
                        sort_order
                    ),
                    created_at,
                    updated_at,
                    due_date,
                    tasks:tasks(count),
                    created_by,
                    has_board_enabled,
                    owner_id
                `)
                .eq("team_id", teamId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
        getActive: async (teamId: string) => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("projects")
                .select(`
                    *,
                    status:project_statuses(
                        id,
                        name,
                        color,
                        description,
                        sort_order
                    ),
                    tasks:tasks(count)
                `)
                .eq("team_id", teamId)
                .in("status_id", ["1", "2"]) // Assuming 1 and 2 are Planning and In Progress
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
        getFiles: async (projectId: string) => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("project_files")
                .select(`
                    id,
                    project_id,
                    name,
                    storage_path,
                    size,
                    type,
                    uploaded_by,
                    created_at
                `)
                .eq("project_id", projectId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
        getStatuses: async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("project_statuses")
                .select("*")
                .order("sort_order", { ascending: true });

            if (error) throw error;
            return data;
        },
    },
};

// Project Files
export function useProjectFiles(projectId: string) {
    return useQuery({
        queryKey: queryKeys.projects.files(projectId),
        queryFn: () => getProjectFiles(projectId),
    });
}

export function useProjectFile(fileId: string) {
    return useQuery({
        queryKey: queryKeys.projects.file(fileId),
        queryFn: () => getProjectFile(fileId),
    });
}

export function useUploadProjectFile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: uploadProjectFile,
        onSuccess: (_, { projectId }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.projects.files(projectId),
            });
        },
    });
}

export function useDeleteProjectFile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteProjectFile,
        onSuccess: async (_, fileId) => {
            // Get the project ID from the cache
            const file = queryClient.getQueryData<any>(
                queryKeys.projects.file(fileId),
            );
            if (file?.project_id) {
                await queryClient.invalidateQueries({
                    queryKey: queryKeys.projects.files(file.project_id),
                });
            }
        },
    });
}

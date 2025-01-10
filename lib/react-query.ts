import { QueryClient } from "@tanstack/react-query"
import { createClient } from "./supabase/client"

// Key factories for consistent query keys
export const queryKeys = {
    auth: {
        user: () => ["auth", "user"] as const,
        profile: (userId: string) => ["auth", "profile", userId] as const,
        teamMember: (userId: string, teamId: string) => ["auth", "teamMember", userId, teamId] as const,
    },
    teams: {
        all: () => ["teams"] as const,
        byId: (teamId: string) => ["teams", teamId] as const,
        members: (teamId: string) => ["teams", teamId, "members"] as const,
    },
    projects: {
        all: (teamId: string) => ["projects", teamId] as const,
        active: (teamId: string) => ["projects", teamId, "active"] as const,
        byId: (projectId: string) => ["projects", "detail", projectId] as const,
    },
    notifications: {
        all: (userId: string) => ["notifications", userId] as const,
        unread: (userId: string) => ["notifications", userId, "unread"] as const,
        infinite: (userId: string) => ["notifications", userId, "infinite"] as const,
    },
}

// Default stale time for queries (5 minutes)
const DEFAULT_STALE_TIME = 5 * 60 * 1000

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
    })
}

// Supabase query utilities
export const queryUtils = {
    profile: {
        getById: async (userId: string) => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single()

            if (error) throw error
            return data
        },
        getCurrentTeam: async (userId: string) => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from("profiles")
                .select("current_team_id")
                .eq("id", userId)
                .single()

            if (error) throw error
            return data.current_team_id
        },
    },
    teams: {
        getById: async (teamId: string) => {
            const supabase = createClient()
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
                .single()

            if (error) throw error
            return data
        },
        getMembers: async (teamId: string) => {
            const supabase = createClient()
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
                .eq("team_id", teamId)

            if (error) throw error
            return data
        },
    },
    projects: {
        getAll: async (teamId: string) => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from("projects")
                .select(`
                    id,
                    name,
                    description,
                    status,
                    created_at,
                    updated_at,
                    due_date,
                    tasks:tasks(count)
                `)
                .eq("team_id", teamId)
                .order("created_at", { ascending: false })

            if (error) throw error
            return data
        },
        getActive: async (teamId: string) => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from("projects")
                .select(`
                    *,
                    tasks:tasks(count)
                `)
                .eq("team_id", teamId)
                .in("status", ["Planning", "In Progress"])
                .order("created_at", { ascending: false })

            if (error) throw error
            return data
        },
    },
} 
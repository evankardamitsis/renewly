"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useUserContext } from "./useUserContext";

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    image?: string;
    role?: string;
    is_super_admin?: boolean;
}

export function useTeamMembers() {
    const supabase = createClient();
    const { data: userContext, isLoading: isLoadingContext } = useUserContext();

    const { data: teamMembers = [], isLoading, error } = useQuery<
        TeamMember[],
        Error
    >({
        queryKey: ["teamMembers", userContext?.currentTeamId],
        queryFn: async () => {
            if (!userContext?.currentTeamId) return [];

            // Get team members with profiles in a single query using joins
            const { data: members, error: membersError } = await supabase
                .from("team_members")
                .select(`
                    user_id,
                    role,
                    is_super_admin
                `)
                .eq("team_id", userContext.currentTeamId);

            if (membersError) throw membersError;
            if (!members || !members.length) return [];

            // Get profiles for these members
            const { data: profiles, error: profilesError } = await supabase
                .from("profiles")
                .select("id, display_name, email, avatar_url")
                .in("id", members.map((m) => m.user_id));

            if (profilesError) throw profilesError;
            if (!profiles) return [];

            // Map the data combining both arrays
            return members.map((member) => {
                const profile = profiles.find((p) => p.id === member.user_id);
                return {
                    id: member.user_id,
                    name: profile?.display_name ||
                        profile?.email?.split("@")[0] || "Unknown",
                    email: profile?.email || "",
                    image: profile?.avatar_url || undefined,
                    role: member.role,
                    is_super_admin: member.is_super_admin,
                };
            });
        },
        enabled: !!userContext?.currentTeamId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
    });

    return {
        teamMembers,
        loading: isLoading || isLoadingContext,
        error,
    };
}

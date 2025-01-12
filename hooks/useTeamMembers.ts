"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    image?: string;
    role: string;
    is_super_admin: boolean;
}

interface UserContextData {
    currentTeamId: string;
}

export function useTeamMembers() {
    const userContext = useQuery<UserContextData>({
        queryKey: ["userContext"],
    });
    const currentTeamId = userContext.data?.currentTeamId;

    return useQuery({
        queryKey: ["teamMembers", currentTeamId],
        queryFn: async () => {
            if (!currentTeamId) throw new Error("No team ID available");

            const supabase = createClient();
            const { data: members, error: membersError } = await supabase
                .from("team_members")
                .select("*")
                .eq("team_id", currentTeamId);

            if (membersError) throw membersError;
            if (!members) return [];

            // Get all user IDs from team members
            const userIds = members.map((member) => member.user_id);

            // Fetch profiles for these users
            const { data: profiles, error: profilesError } = await supabase
                .from("profiles")
                .select("id, display_name, email, avatar_url")
                .in("id", userIds);

            if (profilesError) throw profilesError;
            if (!profiles) return [];

            // Map team members with their profile information
            return members.map((member) => {
                const profile = profiles.find((p) => p.id === member.user_id);
                return {
                    id: member.user_id,
                    name: profile?.display_name || "Unknown",
                    email: profile?.email || "",
                    image: profile?.avatar_url,
                    role: member.role,
                    is_super_admin: member.is_super_admin,
                };
            });
        },
        enabled: !!currentTeamId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
    });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

interface UserContext {
    user: User | null;
    currentTeamId: string | null;
    userProfile: {
        id: string;
        display_name: string | null;
        email: string | null;
        role: string | null;
        avatar_url: string | null;
    } | null;
    isLoading: boolean;
    error: Error | null;
}

export function useUserContext() {
    const supabase = createClient();

    return useQuery<UserContext, Error>({
        queryKey: ["userContext"],
        queryFn: async () => {
            // Get user first
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // Then get profile with user ID
            const { data: profile } = await supabase
                .from("profiles")
                .select(
                    "id, display_name, email, role, avatar_url, current_team_id",
                )
                .eq("id", user.id)
                .single();

            if (!profile) throw new Error("No profile found");

            return {
                user,
                currentTeamId: profile.current_team_id,
                userProfile: profile,
                isLoading: false,
                error: null,
            };
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
    });
}

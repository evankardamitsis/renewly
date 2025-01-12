"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

interface UserProfile {
    id: string;
    display_name: string;
    email: string;
    role: string;
    current_team_id: string;
}

interface UserContextData {
    user: User;
    profile: UserProfile;
    currentTeamId: string;
    isLoading: boolean;
    error: Error | null;
}

export function useUserContext() {
    const router = useRouter();
    const supabase = createClient();

    const query = useQuery<UserContextData, Error>({
        queryKey: ["userContext"],
        queryFn: async () => {
            // Get user
            const { data: { user }, error: userError } = await supabase.auth
                .getUser();
            if (userError) throw userError;
            if (!user) {
                router.push("/login");
                throw new Error("No user found");
            }

            // Get profile with current team ID
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("id, display_name, email, role, current_team_id")
                .eq("id", user.id)
                .single();

            if (profileError) throw profileError;
            if (!profile?.current_team_id) {
                router.push("/teams");
                throw new Error("No team selected");
            }

            return {
                user,
                profile: profile as UserProfile,
                currentTeamId: profile.current_team_id,
                isLoading: false,
                error: null,
            };
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        gcTime: 30 * 60 * 1000, // Keep unused data for 30 minutes
    });

    return query;
}

"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { queryKeys } from "@/lib/react-query"

interface Profile {
  id: string
  display_name: string | null
  email: string | null
  current_team_id: string | null
  has_completed_onboarding: boolean
  role: "admin" | "member" | null
  is_super_admin?: boolean
  team?: {
    id: string
    name: string
    image_url: string | null
  } | null
}

const supabase = createClient()

async function getProfile(userId: string) {
  // Get the profile data
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select(`
      id,
      display_name,
      email,
      role,
      current_team_id,
      has_completed_onboarding
    `)
    .eq("id", userId)
    .single();

  if (profileError) throw profileError;

  // Get team data if we have a current_team_id
  let team = null;
  if (profileData.current_team_id) {
    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .select("id, name, image_url")
      .eq("id", profileData.current_team_id)
      .single();

    if (!teamError && teamData) {
      team = teamData;
    }
  }

  // Get team member data separately
  const { data: teamMemberData, error: teamMemberError } = await supabase
    .from("team_members")
    .select("role, is_super_admin")
    .eq("user_id", userId)
    .eq("team_id", profileData.current_team_id)
    .single();

  if (teamMemberError) throw teamMemberError;

  return {
    id: profileData.id,
    display_name: profileData.display_name,
    email: profileData.email,
    role: profileData.role,
    current_team_id: profileData.current_team_id,
    has_completed_onboarding: profileData.has_completed_onboarding,
    is_super_admin: teamMemberData?.is_super_admin ?? false,
    team: team ? {
      id: team.id,
      name: team.name,
      image_url: team.image_url
    } : null
  } satisfies Profile;
}

async function updateProfile(userId: string, data: Partial<Profile>) {
  const { error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", userId)

  if (error) throw error
}

export function useProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const {
    data: profile,
    isLoading,
    error
  } = useQuery({
    queryKey: queryKeys.auth.profile(user?.id ?? ""),
    queryFn: () => {
      if (!user?.id) throw new Error("User ID is required")
      return getProfile(user.id)
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: false, // Only refetch if stale
    refetchOnWindowFocus: false, // Only refetch if stale
  })

  const { mutate: updateProfileMutation, isPending: isUpdating } = useMutation({
    mutationFn: (data: Partial<Profile>) => {
      if (!user?.id) throw new Error("User ID is required")
      return updateProfile(user.id, data)
    },
    onSuccess: () => {
      if (user?.id) {
        // Invalidate all related queries
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile(user.id) })
        if (profile?.current_team_id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.teams.byId(profile.current_team_id) })
          queryClient.invalidateQueries({ queryKey: queryKeys.teams.members(profile.current_team_id) })
        }
      }
    },
  })

  return {
    profile,
    isLoading,
    error,
    updateProfile: updateProfileMutation,
    isUpdating,
  }
} 
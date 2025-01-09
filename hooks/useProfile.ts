import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"

interface Profile {
  id: string
  display_name: string | null
  email: string | null
  current_team_id: string | null
  role: "admin" | "member" | null
  is_super_admin?: boolean
  team?: {
    image_url: string | null
  } | null
}

const supabase = createClient()

async function getProfile(userId: string) {
  // First get the profile
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, email, current_team_id")
    .eq("id", userId)
    .single()

  if (profileError) throw profileError

  // Then get the team member role
  const { data: teamMemberData, error: teamMemberError } = await supabase
    .from("team_members")
    .select("role, is_super_admin")
    .eq("user_id", userId)
    .eq("team_id", profileData.current_team_id)
    .single()

  if (teamMemberError && teamMemberError.code !== "PGRST116") { // Ignore not found error
    throw teamMemberError
  }

  // Get team data if we have a team
  let teamData = null
  if (profileData.current_team_id) {
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("image_url")
      .eq("id", profileData.current_team_id)
      .single()

    if (teamError) throw teamError
    teamData = team
  }

  return {
    ...profileData,
    ...teamMemberData,
    team: teamData
  }
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
    queryKey: ["profile", user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error("User ID is required")
      return getProfile(user.id)
    },
    enabled: !!user?.id,
  })

  const { mutate: updateProfileMutation, isPending: isUpdating } = useMutation({
    mutationFn: (data: Partial<Profile>) => {
      if (!user?.id) throw new Error("User ID is required")
      return updateProfile(user.id, data)
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ["profile", user.id] })
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
"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { queryKeys, queryUtils } from "@/lib/react-query"
import { useProfile } from "./useProfile"

export interface TeamMember {
    id: string
    user_id: string
    role: "admin" | "member"
    is_super_admin: boolean
    profile: {
        id: string
        display_name: string | null
        email: string | null
        role: string | null
    }
}

export interface Team {
    id: string
    name: string
    image_url: string | null
    members: TeamMember[]
}

interface RawTeamMember {
    id: string
    user_id: string
    role: "admin" | "member"
    is_super_admin: boolean
    profile: {
        id: string
        display_name: string | null
        email: string | null
        role: string | null
    }[]
}

interface RawTeam {
    id: string
    name: string
    image_url: string | null
    members: RawTeamMember[]
}

const supabase = createClient()

export function useTeamQuery() {
    const { profile } = useProfile()
    const queryClient = useQueryClient()
    const teamId = profile?.current_team_id

    // Combined query for team data and members
    const teamQuery = useQuery<Team | null>({
        queryKey: queryKeys.teams.byId(teamId ?? ""),
        queryFn: async () => {
            if (!teamId) return null
            const data = await queryUtils.teams.getById(teamId) as RawTeam
            
            // Transform the data to match our expected types
            return {
                ...data,
                members: data.members.map(member => ({
                    ...member,
                    profile: member.profile[0] // Take the first profile from the array
                }))
            }
        },
        enabled: !!teamId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })

    // Update team
    const updateTeam = async (data: Partial<Team>) => {
        if (!teamId) throw new Error("Team ID is required")

        const { error } = await supabase
            .from("teams")
            .update(data)
            .eq("id", teamId)

        if (error) throw error

        // Invalidate team queries
        await queryClient.invalidateQueries({ queryKey: queryKeys.teams.byId(teamId) })
    }

    // Invite team member
    const inviteMember = async (email: string, role: "admin" | "member" = "member") => {
        if (!teamId) throw new Error("Team ID is required")

        const { error } = await supabase.functions.invoke("invite-team-member", {
            body: { teamId, email, role }
        })

        if (error) throw error

        // Invalidate team query to refresh members
        await queryClient.invalidateQueries({ queryKey: queryKeys.teams.byId(teamId) })
    }

    // Remove team member
    const removeMember = async (memberId: string) => {
        if (!teamId) throw new Error("Team ID is required")

        const { error } = await supabase
            .from("team_members")
            .delete()
            .eq("id", memberId)
            .eq("team_id", teamId)

        if (error) throw error

        // Invalidate team query to refresh members
        await queryClient.invalidateQueries({ queryKey: queryKeys.teams.byId(teamId) })
    }

    // Update member role
    const updateMemberRole = async (memberId: string, role: "admin" | "member") => {
        if (!teamId) throw new Error("Team ID is required")

        const { error } = await supabase
            .from("team_members")
            .update({ role })
            .eq("id", memberId)
            .eq("team_id", teamId)

        if (error) throw error

        // Invalidate team query to refresh members
        await queryClient.invalidateQueries({ queryKey: queryKeys.teams.byId(teamId) })
    }

    return {
        team: teamQuery.data,
        isLoadingTeam: teamQuery.isLoading,
        members: teamQuery.data?.members ?? [] as TeamMember[],
        isLoadingMembers: teamQuery.isLoading,
        updateTeam,
        inviteMember,
        removeMember,
        updateMemberRole,
    }
} 
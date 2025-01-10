"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { queryKeys } from "@/lib/react-query"
import { useProfile } from "./useProfile"
import React from "react"

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

const supabase = createClient()

async function getTeamById(teamId: string): Promise<Team> {
    // Get team data
    const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId)
        .single()

    if (teamError) throw teamError

    // Get team members
    const { data: members, error: membersError } = await supabase
        .from("team_members")
        .select("id, user_id, role, is_super_admin")
        .eq("team_id", teamId)

    if (membersError) throw membersError

    // Get profiles for all members
    const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, display_name, email, role")
        .in("id", members.map(m => m.user_id))

    if (profilesError) throw profilesError

    // Transform the data to match our interface
    const transformedMembers = members.map(member => ({
        ...member,
        profile: profiles.find(p => p.id === member.user_id) || {
            id: member.user_id,
            display_name: "Unknown User",
            email: null,
            role: member.role
        }
    }))

    return {
        ...team,
        members: transformedMembers
    }
}

export function useTeamQuery() {
    const { profile } = useProfile()
    const queryClient = useQueryClient()
    const teamId = profile?.current_team_id

    // Prefetch team data
    React.useEffect(() => {
        if (teamId) {
            queryClient.prefetchQuery({
                queryKey: queryKeys.teams.byId(teamId),
                queryFn: () => getTeamById(teamId),
                staleTime: 30 * 60 * 1000,
            })
        }
    }, [teamId, queryClient])

    // Combined query for team data and members with optimized caching
    const teamQuery = useQuery<Team | null>({
        queryKey: queryKeys.teams.byId(teamId ?? ""),
        queryFn: async () => {
            if (!teamId) return null
            return getTeamById(teamId)
        },
        enabled: !!teamId,
        staleTime: 30 * 60 * 1000, // 30 minutes
        gcTime: 60 * 60 * 1000, // 1 hour
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        retry: 2,
        retryDelay: 1000,
        placeholderData: (oldData) => oldData,
    })

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
        members: teamQuery.data?.members ?? [],
        isLoadingMembers: teamQuery.isLoading,
        inviteMember,
        removeMember,
        updateMemberRole,
    }
} 
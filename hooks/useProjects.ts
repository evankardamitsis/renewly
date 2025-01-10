"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { queryKeys } from "@/lib/react-query"
import { useProfile } from "./useProfile"
import React from "react"

interface Project {
  id: string
  name: string
  description: string | null
  status: "Planning" | "In Progress" | "Completed"
  tasks_count: number
  slug: string
  due_date: string | null
}

const supabase = createClient()

async function getProjects(teamId: string) {
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

  return data.map(project => ({
    ...project,
    tasks_count: project.tasks[0].count
  })) as Project[]
}

export function useProjects() {
  const { profile } = useProfile()
  const queryClient = useQueryClient()
  const teamId = profile?.current_team_id

  // Prefetch projects data
  React.useEffect(() => {
    if (teamId) {
      queryClient.prefetchQuery({
        queryKey: queryKeys.projects.all(teamId),
        queryFn: () => getProjects(teamId),
        staleTime: 30 * 60 * 1000,
      })
    }
  }, [teamId, queryClient])

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects.all(teamId ?? ""),
    queryFn: () => {
      if (!teamId) throw new Error("Team ID is required")
      return getProjects(teamId)
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

  const createProject = useMutation({
    mutationFn: async (data: Partial<Project>) => {
      if (!teamId) throw new Error("Team ID is required")
      const { error } = await supabase
        .from("projects")
        .insert([{ ...data, team_id: teamId }])
      if (error) throw error
    },
    onSuccess: () => {
      if (teamId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.all(teamId) })
      }
    },
  })

  return {
    projects: projectsQuery.data ?? [],
    isLoading: projectsQuery.isLoading,
    error: projectsQuery.error,
    createProject: createProject.mutate,
    isCreating: createProject.isPending,
  }
} 
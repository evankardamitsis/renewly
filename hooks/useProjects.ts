import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { projectsApi } from "@/services/api"
import { Project } from "@/types/database"
import { toast } from "sonner"

interface CreateProjectData {
  name: string
  description?: string | null
  status?: string
  due_date?: string | null
  slug?: string
  teamId: string
}

interface UpdateProjectData {
  id: string
  updates: Partial<Project>
}

// Get all projects for a team
export function useProjects(teamId: string | undefined) {
  return useQuery({
    queryKey: ["projects", teamId],
    queryFn: () => {
      if (!teamId) throw new Error("Team ID is required")
      return projectsApi.list(teamId)
    },
    enabled: !!teamId,
  })
}

// Get a single project by ID
export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ["projects", projectId],
    queryFn: async () => {
      if (!projectId) throw new Error("Project ID is required")
      const { data, error } = await projectsApi.get(projectId)
      if (error) throw error
      return data
    },
    enabled: !!projectId,
  })
}

// Mutations for projects (create, update, delete)
export function useProjectMutations() {
  const queryClient = useQueryClient()

  const createProject = useMutation({
    mutationFn: async (data: CreateProjectData) => {
      const result = await projectsApi.create(data.teamId, {
        name: data.name,
        description: data.description,
        status: data.status,
        due_date: data.due_date,
        slug: data.slug,
      })
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects", variables.teamId] })
      toast.success("Project created successfully")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create project")
    },
  })

  const updateProject = useMutation({
    mutationFn: async ({ id, updates }: UpdateProjectData) => {
      const result = await projectsApi.update(id, updates)
      return result
    },
    onSuccess: (_, variables) => {
      // Invalidate both the list and the individual project
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["projects", variables.id] })
      toast.success("Project updated successfully")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update project")
    },
  })

  const deleteProject = useMutation({
    mutationFn: async (projectId: string) => {
      await projectsApi.delete(projectId)
    },
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast.success("Project deleted successfully")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete project")
    },
  })

  return {
    createProject,
    updateProject,
    deleteProject,
  }
} 
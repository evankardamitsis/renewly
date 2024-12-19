import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { Project } from '@/types/project'
import { Task } from '@/types/task'

const supabase = createClient()

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'ApiError'
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleError(error: any) {
  const message = error?.message || 'An unexpected error occurred'
  toast.error(message)
  throw new ApiError(message, error?.status)
}

export const teamsApi = {
  create: async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({ name })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      handleError(error)
    }
  },

  invite: async (teamId: string, email: string, role: 'admin' | 'member') => {
    const { data, error } = await supabase
      .from('team_invitations')
      .insert({ team_id: teamId, email, role })
      .select()
      .single()
    if (error) throw error
    return data
  },

  getInvitations: async (teamId: string) => {
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('team_id', teamId)
      .eq('status', 'pending')
    if (error) throw error
    return data
  },

  acceptInvitation: async (invitationId: string) => {
    const { data, error } = await supabase
      .from('team_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitationId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  rejectInvitation: async (invitationId: string) => {
    const { data, error } = await supabase
      .from('team_invitations')
      .update({ status: 'rejected' })
      .eq('id', invitationId)
      .select()
      .single()
    if (error) throw error
    return data
  }
}

export const projectsApi = {
  create: async (teamId: string, project: Partial<Project>) => {
    const { data, error } = await supabase
      .from('projects')
      .insert({ ...project, team_id: teamId })
      .select()
      .single()
    if (error) throw error
    return data
  },

  update: async (id: string, updates: Partial<Project>) => {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },
}

export const tasksApi = {
  create: async (projectId: string, task: Partial<Task>) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...task, project_id: projectId })
      .select()
      .single()
    if (error) throw error
    return data
  },

  update: async (id: string, updates: Partial<Task>) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },
} 
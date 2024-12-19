import { useEffect } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { supabase } from '@/lib/supabase'
import { Project, Task } from '@/types/database'

export function useRealtimeSubscription() {
  const { addProject, updateProject, addTask, updateTask } = useProjectStore()

  useEffect(() => {
    // Projects channel
    const projectsSubscription = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects'
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const project = payload.new as Project
            addProject(project.team_id, project)
          } else if (payload.eventType === 'UPDATE') {
            const project = payload.new as Project
            updateProject(project.id, project)
          }
        }
      )
      .subscribe()

    // Tasks channel
    const tasksSubscription = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const task = payload.new as Task
            addTask(task.project_id, task)
          } else if (payload.eventType === 'UPDATE') {
            const task = payload.new as Task
            updateTask(task.id, task)
          }
        }
      )
      .subscribe()

    return () => {
      projectsSubscription.unsubscribe()
      tasksSubscription.unsubscribe()
    }
  }, [addProject, updateProject, addTask, updateTask])
} 
export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          status: string
          created_at: string
          updated_at: string
          due_date: string | null
          slug: string
          team_id: string
          tasks: string[]
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string
          priority: 'low' | 'medium' | 'high'
          due_date: string | null
          assignees: unknown[]
          comments: number
          progress: number
          status: 'todo' | 'in-progress' | 'done'
          custom_fields: unknown[]
          is_recurring: boolean
          recurring_interval: string
          created_at: string
          updated_at: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          image_url: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
      }
    }
  }
} 
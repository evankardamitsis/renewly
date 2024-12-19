import { create } from "zustand"
import { Project, Task } from "@/types/database"
import { projectsApi, tasksApi } from "@/services/api"

interface ProjectState {
  projects: Project[]
  tasks: Record<string, Task>
  isLoading: boolean
  error: string | null
  selectedProjectId: string | null
  // Actions
  setProjects: (projects: Project[]) => void
  addProject: (teamId: string, project: Partial<Project>) => Promise<void>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => void
  setSelectedProject: (id: string | null) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  getActiveProjects: () => Project[]
  setTasks: (tasks: Record<string, Task>) => void
  addTask: (projectId: string, task: Partial<Task>) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => void
}

// Sample data
const initialProjects: Project[] = [
  {
      id: "1",
      name: "Website Redesign",
      description: "Redesigning the company website",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tasks: [],
      dueDate: "",
      status: "Planning",
      slug: ""
  },
]

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: initialProjects,
  isLoading: false,
  error: null,
  selectedProjectId: null,
  tasks: {},

  setProjects: (projects) => set({ projects }),
  addProject: async (teamId, project) => {
    const newProject = await projectsApi.create(teamId, project)
    set((state) => ({
      projects: [...state.projects, newProject]
    }))
  },
  updateProject: async (id, updates) => {
    const updated = await projectsApi.update(id, updates)
    set((state) => ({
      projects: state.projects.map((p) => 
        p.id === id ? updated : p
      )
    }))
  },
  deleteProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    })),
  setSelectedProject: (id) => set({ selectedProjectId: id }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  getActiveProjects: () => {
    const state = get()
    return state.projects.filter(
      p => p.status === "In Progress" || p.status === "Planning"
    )
  },
  setTasks: (tasks) => set({ tasks }),
  addTask: async (projectId, task) => {
    const newTask = await tasksApi.create(projectId, task)
    set((state) => ({
      tasks: { ...state.tasks, [newTask.id]: newTask }
    }))
  },
  updateTask: async (id, updates) => {
    const updated = await tasksApi.update(id, updates)
    set((state) => ({
      tasks: {
        ...state.tasks,
        [id]: updated
      }
    }))
  },
  deleteTask: (id) => set((state) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [id]: _, ...remainingTasks } = state.tasks
    return { tasks: remainingTasks }
  }),
})) 
import { create } from "zustand"
import { Project } from "@/types/project"
import { Task } from "@/types/task"

interface ProjectState {
  projects: Project[]
  tasks: Record<string, Task>
  isLoading: boolean
  error: string | null
  selectedProjectId: string | null
  // Actions
  setProjects: (projects: Project[]) => void
  addProject: (project: Project) => void
  updateProject: (project: Project) => void
  deleteProject: (id: string) => void
  setSelectedProject: (id: string | null) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  getActiveProjects: () => Project[]
  setTasks: (tasks: Record<string, Task>) => void
  addTask: (task: Task) => void
  updateTask: (updatedTask: Task) => void
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
  addProject: (project) => 
    set((state) => ({ projects: [...state.projects, project] })),
  updateProject: (project) =>
    set((state) => ({
      projects: state.projects.map((p) => 
        p.id === project.id ? project : p
      ),
    })),
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
  addTask: (task) => set((state) => ({ 
    tasks: { ...state.tasks, [task.id]: task } 
  })),
  updateTask: (updatedTask) => {
    set((state) => ({
      tasks: {
        ...state.tasks,
        [updatedTask.id]: updatedTask,
      },
    }));
  },
  deleteTask: (id) => set((state) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [id]: _, ...remainingTasks } = state.tasks
    return { tasks: remainingTasks }
  }),
})) 
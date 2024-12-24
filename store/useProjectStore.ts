import { create } from "zustand";
import { Project, Task } from "@/types/database";
import { projectsApi, tasksApi } from "@/services/api";
import { generateSlug } from "@/utils/slug";

interface ProjectState {
  projects: Project[];
  tasks: Record<string, Task>;
  isLoading: boolean;
  error: string | null;
  selectedProjectId: string | null;
  isCreating: boolean;
  createError: string | null;

  // Project actions
  setProjects: (projects: Project[]) => void;
  fetchProjects: (teamId: string) => Promise<void>;
  addProject: (input: CreateProjectInput) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => void;
  setSelectedProject: (id: string | null) => void;

  // Task actions
  setTasks: (tasks: Record<string, Task>) => void;
  addTask: (projectId: string, task: Partial<Task>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => void;
  fetchProjectTasks: (projectId: string) => Promise<void>;

  // UI state
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export interface CreateProjectInput {
  name: string;
  description?: string | null;
  team_id: string;
  status?: "Planning" | "In Progress" | "Review" | "Completed";
  due_date?: string;
}

export interface CreateProjectResponse {
  project: Project | null;
  error: string | null;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  tasks: {},
  isLoading: false,
  error: null,
  selectedProjectId: null,
  isCreating: false,
  createError: null,

  // Project actions
  setProjects: (projects) => set({ projects }),
  fetchProjects: async (teamId: string) => {
    try {
      set({ isLoading: true, error: null });
      const projects = await projectsApi.list(teamId);
      if (projects) {
        set({ projects, isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error
          ? error.message
          : "Failed to fetch projects",
        isLoading: false,
      });
    }
  },
  addProject: async (input: CreateProjectInput) => {
    try {
      set({ isCreating: true, createError: null });

      const projectData = {
        ...input,
        slug: generateSlug(input.name),
        status: input.status || "Planning",
        due_date: input.due_date ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        tasks: [],
      };

      const newProject = await projectsApi.create(input.team_id, projectData);

      set((state) => ({
        projects: [...state.projects, newProject],
        isCreating: false,
      }));

      return newProject;
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Failed to create project";
      set({ createError: message, isCreating: false });
      throw error;
    }
  },
  updateProject: async (id, updates) => {
    try {
      const updated = await projectsApi.update(id, updates);
      if (updated) {
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? updated : p)),
        }));
      }
    } catch (error) {
      throw error;
    }
  },
  deleteProject: async (id: string) => {
    try {
      await projectsApi.delete(id);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
      }));
    } catch (error) {
      throw error;
    }
  },
  setSelectedProject: (id) => set({ selectedProjectId: id }),

  // Task actions
  setTasks: (tasks) => set({ tasks }),
  addTask: async (projectId, task) => {
    try {
      const newTask = await tasksApi.create(projectId, task);
      if (newTask) {
        set((state) => ({
          tasks: { ...state.tasks, [newTask.id]: newTask },
        }));
      }
    } catch (error) {
      throw error;
    }
  },
  updateTask: async (id, updates) => {
    try {
      const updated = await tasksApi.update(id, updates);
      if (updated) {
        set((state) => ({
          tasks: {
            ...state.tasks,
            [id]: { ...state.tasks[id], ...updated },
          },
        }));
      }
    } catch (error) {
      throw error;
    }
  },
  deleteTask: (id) =>
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _, ...remainingTasks } = state.tasks;
      return { tasks: remainingTasks };
    }),
  fetchProjectTasks: async (projectId: string) => {
    try {
      const tasks = await tasksApi.getByProject(projectId);
      if (tasks) {
        const tasksMap = tasks.reduce(
          (acc, task) => ({ ...acc, [task.id]: task }),
          {},
        );
        set((state) => ({
          tasks: { ...state.tasks, ...tasksMap },
        }));
      }
    } catch (error) {
      throw error;
    }
  },

  // UI state
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

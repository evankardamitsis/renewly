import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Project, Task } from "@/types/database";

const supabase = createClient();

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

function handleError(error: unknown): never {
  const message = error instanceof Error
    ? error.message
    : "An unexpected error occurred";
  toast.error(message);
  throw new ApiError(message);
}

export const projectsApi = {
  list: async (teamId: string): Promise<Project[]> => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*, tasks(*)")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Project[];
    } catch (error) {
      return handleError(error);
    }
  },

  create: async (
    team_id: string,
    data: CreateProjectData,
  ): Promise<Project> => {
    try {
      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          ...data,
          team_id,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          status: data.status || "Planning",
        })
        .select()
        .single();

      if (error) {
        const message = error.message || "Failed to create project";
        toast.error(message);
        throw new ApiError(message);
      }

      return project;
    } catch (error) {
      return handleError(error);
    }
  },

  update: async (id: string, updates: Partial<Project>): Promise<Project> => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new ApiError("Project not found");
      return data as Project;
    } catch (error) {
      return handleError(error);
    }
  },

  delete: async (id: string) => {
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);
      if (error) throw error;
    } catch (error) {
      handleError(error);
    }
  },
};

export const tasksApi = {
  create: async (projectId: string, data: Partial<Task>): Promise<Task> => {
    try {
      const { data: task, error } = await supabase
        .from("tasks")
        .insert([
          {
            project_id: projectId,
            title: data.title,
            description: data.description,
            priority: data.priority,
            status: data.status,
            due_date: data.due_date,
            custom_fields: data.custom_fields || [],
            is_recurring: data.is_recurring || false,
            recurring_interval: data.is_recurring
              ? data.recurring_interval
              : null,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return task;
    } catch (error) {
      return handleError(error);
    }
  },

  fetchProjectTasks: async (projectId: string): Promise<Task[]> => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError(error);
    }
  },

  update: async (taskId: string, updates: Partial<Task>): Promise<Task> => {
    try {
      const { data: task, error } = await supabase
        .from("tasks")
        .update({
          ...updates,
          custom_fields: updates.custom_fields || [],
          is_recurring: updates.is_recurring || false,
          recurring_interval: updates.is_recurring
            ? updates.recurring_interval
            : null,
        })
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;
      return task;
    } catch (error) {
      return handleError(error);
    }
  },

  delete: async (taskId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;
    } catch (error) {
      return handleError(error);
    }
  },

  getByProject: async (projectId: string): Promise<Task[]> => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Task[];
    } catch (error) {
      return handleError(error);
    }
  },
};

interface CreateProjectData {
  name: string;
  description?: string | null;
  team_id: string;
  slug: string;
  status?: "Planning" | "In Progress" | "Review" | "Completed";
  due_date?: string;
  tasks?: never[];
}

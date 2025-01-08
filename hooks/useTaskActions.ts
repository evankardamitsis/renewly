import { useState } from "react";
import { Task } from "@/types/database";
import { tasksApi } from "@/services/api";
import { notificationsApi } from "@/services/notifications";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export interface CustomField {
    label: string;
    value: string;
    type: "string" | "text";
}

export interface CreateTaskData extends Partial<Task> {
    custom_fields?: CustomField[];
    is_recurring?: boolean;
    recurring_interval?: "annual" | "6month" | "3month" | "monthly" | null;
}

export function useTaskActions() {
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const createTask = async (projectId: string, taskData: CreateTaskData) => {
        setIsCreating(true);
        try {
            const result = await tasksApi.create(projectId, {
                ...taskData,
                custom_fields: taskData.custom_fields || [],
                is_recurring: taskData.is_recurring || false,
                recurring_interval: taskData.is_recurring
                    ? taskData.recurring_interval
                    : null,
            });

            if (!result || typeof result === "object" && "error" in result) {
                const errorMessage =
                    typeof result === "object" && "error" in result
                        ? String(result.error)
                        : "Failed to create task";
                throw new Error(errorMessage);
            }

            // Create notification for assigned user
            if (result.assignees && result.assignees.length > 0) {
                const supabase = createClient();
                const { data: project } = await supabase
                    .from("projects")
                    .select("name, slug")
                    .eq("id", projectId)
                    .single();

                if (project) {
                    for (const assignee of result.assignees) {
                        if (
                            typeof assignee === "object" && assignee !== null &&
                            "id" in assignee && typeof assignee.id === "string"
                        ) {
                            await notificationsApi.createNotification({
                                userId: assignee.id,
                                type: "TASK_ASSIGNED",
                                title: "New Task Assigned",
                                message:
                                    `You have been assigned to task "${result.title}" in project "${project.name}"`,
                                taskId: result.id,
                                projectId: projectId,
                                actionUrl:
                                    `/projects/${project.slug}/tasks/${result.id}`,
                            });
                        }
                    }
                }
            }

            toast.success("Task created successfully");
            return { task: result, error: null };
        } catch (err) {
            const message = err instanceof Error
                ? err.message
                : "Failed to create task";
            toast.error(message);
            return { task: null, error: message };
        } finally {
            setIsCreating(false);
        }
    };

    const updateTask = async (taskId: string, updates: CreateTaskData) => {
        setIsUpdating(true);
        try {
            const result = await tasksApi.update(taskId, {
                ...updates,
                custom_fields: updates.custom_fields || [],
                is_recurring: updates.is_recurring || false,
                recurring_interval: updates.is_recurring
                    ? updates.recurring_interval
                    : null,
            });

            if (!result || typeof result === "object" && "error" in result) {
                const errorMessage =
                    typeof result === "object" && "error" in result
                        ? String(result.error)
                        : "Failed to update task";
                throw new Error(errorMessage);
            }

            // Create notification for task updates if there are assignees
            if (result.assignees && result.assignees.length > 0) {
                const supabase = createClient();
                const { data: project } = await supabase
                    .from("projects")
                    .select("name, slug")
                    .eq("id", result.project_id)
                    .single();

                if (project) {
                    for (const assignee of result.assignees) {
                        if (
                            typeof assignee === "object" && assignee !== null &&
                            "id" in assignee && typeof assignee.id === "string"
                        ) {
                            await notificationsApi.createNotification({
                                userId: assignee.id,
                                type: "TASK_UPDATED",
                                title: "Task Updated",
                                message:
                                    `Task "${result.title}" in project "${project.name}" has been updated`,
                                taskId: result.id,
                                projectId: result.project_id,
                                actionUrl:
                                    `/projects/${project.slug}/tasks/${result.id}`,
                            });
                        }
                    }
                }
            }

            toast.success("Task updated successfully");
            return { task: result, error: null };
        } catch (err) {
            const message = err instanceof Error
                ? err.message
                : "Failed to update task";
            toast.error(message);
            return { task: null, error: message };
        } finally {
            setIsUpdating(false);
        }
    };

    const deleteTask = async (taskId: string) => {
        try {
            await tasksApi.delete(taskId);
            toast.success("Task deleted successfully");
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Failed to delete task";
            toast.error(message);
            throw error;
        }
    };

    return {
        createTask,
        updateTask,
        deleteTask,
        isCreating,
        isUpdating,
    };
}

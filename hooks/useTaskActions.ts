import { useState } from "react";
import { Task } from "@/types/database";
import { tasksApi } from "@/services/api";
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
        try {
            setIsCreating(true);
            const task = await tasksApi.create(projectId, {
                ...taskData,
                custom_fields: taskData.custom_fields || [],
                is_recurring: taskData.is_recurring || false,
                recurring_interval: taskData.is_recurring
                    ? taskData.recurring_interval
                    : null,
            });
            toast.success("Task created successfully");
            return { task, error: null };
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
        try {
            setIsUpdating(true);
            const task = await tasksApi.update(taskId, {
                ...updates,
                custom_fields: updates.custom_fields || [],
                is_recurring: updates.is_recurring || false,
                recurring_interval: updates.is_recurring
                    ? updates.recurring_interval
                    : null,
            });
            toast.success("Task updated successfully");
            return { task, error: null };
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
        console.log("useTaskActions: deleteTask called with id:", taskId);
        try {
            await tasksApi.delete(taskId);
            console.log("useTaskActions: task deleted successfully");
        } catch (error) {
            console.error("useTaskActions: delete failed:", error);
            throw error;
        }
    };

    return {
        createTask,
        updateTask,
        isCreating,
        isUpdating,
        deleteTask,
    };
}

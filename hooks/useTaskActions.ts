import { useState } from "react";
import { Task } from "@/types/database";
import { tasksApi } from "@/services/api";
import { toast } from "sonner";

export function useTaskActions() {
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const createTask = async (projectId: string, taskData: Partial<Task>) => {
        try {
            setIsCreating(true);
            const task = await tasksApi.create(projectId, taskData);
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

    const updateTask = async (taskId: string, updates: Partial<Task>) => {
        try {
            setIsUpdating(true);
            const task = await tasksApi.update(taskId, updates);
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

    return {
        createTask,
        updateTask,
        isCreating,
        isUpdating,
    };
}

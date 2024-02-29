'use client'

import React, {createContext, ReactNode, useCallback, useContext, useEffect, useState} from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {useUser} from "@clerk/nextjs";

export interface Task {
    id: string;
    title: string
    description?: string
    isCompleted: boolean
    isImportant: boolean
    createdAt: string
    updatedAt: string
}

const TasksContext = createContext<{
    tasks: Task[];
    isLoading: boolean;
    allTasks: () => Promise<void>;
    updateTask: (task: { id: string; isCompleted: boolean }) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
    completedTasks: Task[];
    importantTasks: Task[];
    incompleteTasks: Task[];
}>({
    tasks: [],
    isLoading: false,
    allTasks: async () => {},
    updateTask: async () => {},
    deleteTask: async () => {},
    completedTasks: [],
    importantTasks: [],
    incompleteTasks: [],
});

interface TasksProviderProps {
    children: ReactNode;
}

export const TasksProvider: React.FC<TasksProviderProps> = ({ children }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const { user } = useUser();

    const allTasks = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get('/api/tasks');

            const sortedTasks = res.data.sort((a: Task, b: Task) => {
                console.log(a, b)
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });

            setTasks(sortedTasks);
        } catch (error) {
            console.error(error);
            toast.error('Error getting dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    const deleteTask = async (taskId: string) => {
        setIsLoading(true);
        try {
            await axios.delete(`/api/tasks/${taskId}`);
            toast.success('Task deleted');
            await allTasks();
        } catch (error) {
            console.error(error);
            toast.error('Error deleting task');
        } finally {
            setIsLoading(false);
        }
    }


    const updateTask = async (task: { id: string; isCompleted: boolean }) => {
        setIsLoading(true);
        try {
            await axios.put(`/api/tasks/${task.id}`, task);
            toast.success('Task updated');
            await allTasks();
        } catch (error) {
            console.error(error);
            toast.error('Error updating task');
        } finally {
            setIsLoading(false);
        }
    }

    const completedTasks = tasks.filter((task) => task.isCompleted);
    const importantTasks = tasks.filter((task) => task.isImportant);
    const incompleteTasks = tasks.filter((task) => !task.isCompleted);


    useEffect(() => {
        if(user) allTasks()
    }, [user]);


    return (
        <TasksContext.Provider value={{ tasks, isLoading, allTasks, deleteTask, updateTask, completedTasks, importantTasks, incompleteTasks  }}>
            {children}
        </TasksContext.Provider>
    );
};

export const useTasks = () => useContext(TasksContext);

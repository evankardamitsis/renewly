'use client'

import React, {createContext, ReactNode, useContext, useState} from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export interface Task {
    id: string;
    title: string
    description?: string
    isCompleted: boolean
    isImportant: boolean
}

const TasksContext = createContext<{
    tasks: Task[];
    isLoading: boolean;
    allTasks: () => Promise<void>;
}>({
    tasks: [],
    isLoading: false,
    allTasks: async () => {},
});

interface TasksProviderProps {
    children: ReactNode;
}

export const TasksProvider: React.FC<TasksProviderProps> = ({ children }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const allTasks = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get('/api/tasks');
            setTasks(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Error getting tasks');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <TasksContext.Provider value={{ tasks, isLoading, allTasks }}>
            {children}
        </TasksContext.Provider>
    );
};

export const useTasks = () => useContext(TasksContext);

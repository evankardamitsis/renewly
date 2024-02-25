'use client'

import React from 'react';
import {Stack, Title} from "@mantine/core";
import TaskItem from "@/app/components/TaskItem/TaskItem";
import {useTasks} from "@/app/providers/TasksProvider";
import CreateTaskCard from "@/app/components/CreateTaskCard/CreateTaskCard";

interface Props {
    title?: string;
}

const Tasks = ({ title }: Props) => {
    const { tasks } = useTasks();
    return (
        <Stack className="rounded-md overflow-y-auto border border-amber-300 shadow-xs">
            <Stack w="100%" h="89.5dvh" p={22}>
                <Title>{title}</Title>
                <Stack gap="md">
                    {tasks.map((task) => (
                        <TaskItem key={task.id} task={{...task}} />
                    ))}
            </Stack>
        </Stack>
        </Stack>
    );
};

export default Tasks;

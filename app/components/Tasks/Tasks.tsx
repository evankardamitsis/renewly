'use client'

import React, {useEffect} from 'react';
import {Button, SimpleGrid, Stack, Title} from "@mantine/core";
import TaskItem from "@/app/components/TaskItem/TaskItem";
import CreateTaskCard from "@/app/components/CreateTaskCard/CreateTaskCard";

interface Props {
    title: string;
    tasks: any[];
}

const Tasks = ({ title, tasks }: Props) => {

    return (
        <Stack className="rounded-md overflow-y-auto border border-amber-300 shadow-xs">
            <Stack w="100%" h="89.5dvh" p={22}>
                <Title>{title}</Title>
                <Stack gap="md">
                    <SimpleGrid
                        cols={{ base: 1, sm: 2, lg: 4}}
                        spacing={{ base: 10, sm: 'xl' }}
                        verticalSpacing={{ base: 'md', sm: 'xl' }}
                    >
                        {tasks.map((task) => (
                            <TaskItem
                                key={task.id}
                                title={task.title}
                                description={task.description}
                                date={task.date}
                                isCompleted={task.isCompleted}
                                id={task.id}
                            />
                        ))}
                        <CreateTaskCard />
                    </SimpleGrid>
            </Stack>
        </Stack>
        </Stack>
    );
};

export default Tasks;

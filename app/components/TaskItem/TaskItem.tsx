'use client'

import React from 'react';
import {Badge, Card, Flex, Pill, SimpleGrid, Stack, Text, Title} from "@mantine/core";
import {IconPencil, IconTrash} from "@tabler/icons-react";
import {formatDate} from "@/app/utils/common";
import {useTasks} from "@/app/providers/TasksProvider";


interface Props {
    title: string;
    description: string;
    date: string;
    isCompleted: boolean;
    id: string;
}

const TaskItem = ({ title, description, date, isCompleted, id }: Props) => {

    const {deleteTask, updateTask} = useTasks();

    const formattedDate = formatDate(date);


    return (
                <Card key={id} radius="lg" shadow="xs">
                    <Stack gap="lg">
                            <Flex justify="space-between" align="center">
                                <Title order={3}>{title}</Title>
                                <Flex gap={8}>
                                   <IconPencil className="cursor-pointer"  />
                                   <IconTrash className="cursor-pointer" onClick={() => {deleteTask(id)}} />
                                </Flex>
                            </Flex>
                                <Text>{description}</Text>
                                <Text>{formattedDate}</Text>
                                <Flex className="cursor-pointer">
                                    {isCompleted ? (
                                        <Badge
                                            p="sm"
                                            bg="green"
                                            size="md"
                                            onClick={() => {
                                                const task = {
                                                    id,
                                                    isCompleted: !isCompleted,
                                                };

                                                updateTask(task);
                                            }}
                                        >
                                            Completed
                                        </Badge>
                                        ) :
                                        <Badge
                                            p="sm"
                                            bg="red"
                                            size="md"
                                            onClick={() => {
                                                const task = {
                                                    id,
                                                    isCompleted: !isCompleted,
                                                }
                                                updateTask(task);
                                            }}
                                        >
                                            Incomplete
                                        </Badge>
                                    }
                                </Flex>
                            <Flex>
                        </Flex>
                    </Stack>
                </Card>
    );
};

export default TaskItem;

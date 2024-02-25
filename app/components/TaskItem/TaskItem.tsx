'use client'

import React from 'react';
import {Badge, Card, Flex, Pill, SimpleGrid, Stack, Text, Title} from "@mantine/core";
import {IconPencil, IconTrash} from "@tabler/icons-react";
import dayjs from "dayjs";
import {formatDate} from "@/app/utils/common";
import CreateTaskCard from "@/app/components/CreateTaskCard/CreateTaskCard";


interface Props {
    task: any;
}

const TaskItem = ({task}:Props) => {

    const formattedDate = formatDate(task.date);

    return (
        <SimpleGrid
            cols={{ base: 1, sm: 2, lg: 4}}
            spacing={{ base: 10, sm: 'xl' }}
            verticalSpacing={{ base: 'md', sm: 'xl' }}
        >
                <Card key={task.id} radius="lg" shadow="xs">
                    <Stack gap="lg">
                            <Flex justify="space-between" align="center">
                                <Title order={3}>{task.title}</Title>
                                <Flex gap={8}>
                                   <IconPencil />
                                   <IconTrash />
                                </Flex>
                            </Flex>
                                <Text>{task.description}</Text>
                                <Text>{formattedDate}</Text>
                                <Flex className="cursor-pointer">
                                    {task.isCompleted ? (
                                        <Badge p="sm" bg="green" size="md">Completed</Badge>
                                        ) :
                                        <Badge p="sm" bg="red" size="md">Incomplete</Badge>
                                    }
                                </Flex>
                            <Flex>
                        </Flex>
                    </Stack>
                </Card>
            <CreateTaskCard />
        </SimpleGrid>
    );
};

export default TaskItem;

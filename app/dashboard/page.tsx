'use client'

import Tasks from "@/app/components/Tasks/Tasks";
import {CustomLayout} from "@/app/components/CustomLayout";
import {useTasks} from "@/app/providers/TasksProvider";
import {Title} from "@mantine/core";

export default function Dashboard() {

    const { tasks, } = useTasks();

    return (
        <CustomLayout>
            <Title>I am the dashboard page</Title>
        </CustomLayout>

    );
}

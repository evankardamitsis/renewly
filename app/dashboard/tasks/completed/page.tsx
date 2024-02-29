'use client'

import React, { useEffect } from 'react';
import { CustomLayout } from "@/app/components/CustomLayout";
import { useTasks } from "@/app/providers/TasksProvider";
import Tasks from "@/app/components/Tasks/Tasks";

const CompletedTasks = () => {

    const { completedTasks } = useTasks();

    return (
        <CustomLayout>
            <Tasks title="Completed Tasks" tasks={completedTasks} />
        </CustomLayout>
            );
};

export default CompletedTasks;

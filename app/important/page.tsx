'use client'

import React from 'react';
import {CustomLayout} from "@/app/components/CustomLayout";
import {useTasks} from "@/app/providers/TasksProvider";
import Tasks from "@/app/components/Tasks/Tasks";

const Page = () => {
    const {importantTasks} = useTasks();

    return (
        <CustomLayout>
           <Tasks title="Important Tasks" tasks={importantTasks} />
        </CustomLayout>
    );
};

export default Page;

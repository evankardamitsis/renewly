'use client'

import {CustomLayout} from "@/app/components/CustomLayout";
import {useTasks} from "@/app/providers/TasksProvider";
import Tasks from "@/app/components/Tasks/Tasks";

const PendingPage = () => {
    const { incompleteTasks } = useTasks();

    return (
        <CustomLayout>
            <Tasks title="Pending Tasks" tasks={incompleteTasks} />
        </CustomLayout>
    )
}

export default PendingPage

'use client'

import Tasks from "@/app/components/Tasks/Tasks";
import {CustomLayout} from "@/app/components/CustomLayout";
import {useTasks} from "@/app/providers/TasksProvider";

export default function Home() {

    const { tasks, } = useTasks();

  return (
      <CustomLayout>
          <Tasks title="All Tasks" tasks={tasks} />
      </CustomLayout>

  );
}

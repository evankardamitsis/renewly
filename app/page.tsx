'use client'

import Tasks from "@/app/components/Tasks/Tasks";
import {CustomLayout} from "@/app/components/CustomLayout";
import {useTasks} from "@/app/providers/TasksProvider";
import {useEffect} from "react";

export default function Home() {

    const { tasks, isLoading, allTasks } = useTasks();

    useEffect(() => {
        allTasks();
    }, []);

  return (
      <CustomLayout>
          <Tasks  />
      </CustomLayout>

  );
}

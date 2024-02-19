'use client'

import {Stack} from "@mantine/core";
import Tasks from "@/app/components/Tasks/Tasks";
import {CustomLayout} from "@/app/components/CustomLayout";

export default function Home() {

  return (
      <CustomLayout>
          <Tasks />
      </CustomLayout>

  );
}

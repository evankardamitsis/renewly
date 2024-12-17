"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Task } from "@/types/task";
import { Card, CardContent } from "@/components/ui/card";

interface ProgressChartProps {
  tasks: Task[];
}

export function ProgressChart({ tasks }: ProgressChartProps) {
  // Generate sample data for the last 7 days
  const data = [
    { name: "Mon", completed: 4, pending: 2 },
    { name: "Tue", completed: 3, pending: 4 },
    { name: "Wed", completed: 5, pending: 3 },
    { name: "Thu", completed: 2, pending: 4 },
    { name: "Fri", completed: 6, pending: 2 },
    { name: "Sat", completed: 4, pending: 3 },
    { name: "Sun", completed: 3, pending: 5 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-sm font-medium">Tasks Overview</div>
          <div className="text-sm text-muted-foreground">
            {tasks.filter((t) => t.status === "done").length} completed
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-xs">Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-muted" />
            <span className="text-xs">Pending</span>
          </div>
        </div>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="completed"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="pending"
              stroke="hsl(var(--muted))"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

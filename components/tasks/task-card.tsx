"use client";

import { Task } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CalendarDays, MessageSquare, Users } from "lucide-react";

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const priorityColors = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <h4 className="font-medium">{task.title}</h4>
        <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
      </div>
      {task.description && (
        <p className="text-sm text-muted-foreground">{task.description}</p>
      )}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {task.due_date && (
          <div className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            <span>{format(new Date(task.due_date), "MMM d")}</span>
          </div>
        )}
        {task.assignees?.length > 0 && (
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{task.assignees.length}</span>
          </div>
        )}
        {task.comments > 0 && (
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>{task.comments}</span>
          </div>
        )}
      </div>
    </div>
  );
}

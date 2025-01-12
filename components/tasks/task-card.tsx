"use client";

import { Task } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CalendarDays, MessageSquare, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTeamMembers } from "@/hooks/useTeamMembers";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const { teamMembers } = useTeamMembers();
  const assignee = teamMembers.find((m) => m.id === task.assigned_to);

  const priorityColors = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  };

  return (
    <div
      className="rounded-lg border bg-card p-3 hover:bg-accent/50 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h4 className="font-medium">{task.title}</h4>
          {task.is_recurring && (
            <Badge variant="secondary" className="text-xs">
              Recurring: {task.recurring_interval}
            </Badge>
          )}
        </div>
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
        {assignee ? (
          <div className="flex items-center gap-1">
            <Avatar className="h-4 w-4">
              <AvatarImage src={assignee.image} />
              <AvatarFallback>{assignee.name[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <span>{assignee.name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span>Unassigned</span>
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

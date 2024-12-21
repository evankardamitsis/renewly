"use client";

import { Task } from "@/types/task";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface TaskDetailsProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

const priorityColors = {
  low: "bg-green-500/10 text-green-500",
  medium: "bg-yellow-500/10 text-yellow-500",
  high: "bg-red-500/10 text-red-500",
};

export function TaskDetails({ task, isOpen, onClose }: TaskDetailsProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Description</h3>
            <p className="text-sm text-muted-foreground">{task.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Priority</h3>
              <Badge
                variant="secondary"
                className={priorityColors[task.priority]}
              >
                {task.priority}
              </Badge>
            </div>
            <div>
              <h3 className="font-medium mb-2">Status</h3>
              <Badge variant="outline">{task.status}</Badge>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Due Date</h3>
            <p className="text-sm text-muted-foreground">
              {task.due_date
                ? formatDistanceToNow(new Date(task.due_date), {
                    addSuffix: true,
                  })
                : "No due date"}
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">Assignees</h3>
            <div className="flex -space-x-2">
              {task.assignees.map((assignee, i) => (
                <Avatar key={i} className="h-8 w-8 border-2 border-background">
                  <AvatarImage src={assignee.image} />
                  <AvatarFallback>{assignee.name[0]}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Progress</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{task.progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          </div>

          {task.custom_fields.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Custom Fields</h3>
              <div className="space-y-2">
                {task.custom_fields.map((field, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{field.label}</span>
                    <span>{field.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {task.is_recurring && (
            <div>
              <h3 className="font-medium mb-2">Recurring</h3>
              <p className="text-sm text-muted-foreground">
                {task.recurring_interval}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

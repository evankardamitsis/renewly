"use client";

import { Task } from "@/types/database";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Users,
  MessageSquare,
  Calendar,
  MoreVertical,
  Trash,
} from "lucide-react";
import { useState } from "react";
import { TaskDrawer } from "./task-drawer";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

interface TaskTableProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => Promise<void>;
}

const PRIORITY_VARIANTS = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  medium:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
} as const;

const STATUS_VARIANTS = {
  todo: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  "in-progress":
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  done: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
} as const;

export function TaskTable({
  tasks = [],
  onTaskClick,
  onTaskDelete,
}: TaskTableProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleClose = () => {
    setSelectedTask(null);
  };

  const handleDeleteClick = (taskId: string) => {
    setTaskToDelete(taskId);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete || !onTaskDelete) return;
    try {
      setIsDeleting(true);
      await onTaskDelete(taskToDelete);
    } finally {
      setIsDeleting(false);
      setTaskToDelete(null);
    }
  };

  // Get unique custom field labels across all tasks
  const customFieldLabels = Array.from(
    new Set(
      tasks
        .flatMap(
          (task) => task.custom_fields?.map((field) => field.label) || []
        )
        .filter(Boolean)
    )
  );

  if (!tasks?.length) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No tasks found
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Recurring</TableHead>
              {customFieldLabels.map((label) => (
                <TableHead key={label}>{label}</TableHead>
              ))}
              <TableHead>Assignees</TableHead>
              <TableHead>Comments</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell
                  className="font-medium cursor-pointer"
                  onClick={() => handleTaskClick(task)}
                >
                  {task.title}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={PRIORITY_VARIANTS[task.priority]}
                  >
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={STATUS_VARIANTS[task.status]}
                  >
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {task.due_date ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(task.due_date), "MMM d, yyyy")}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {task.is_recurring ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {task.recurring_interval}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                {customFieldLabels.map((label) => (
                  <TableCell key={label}>
                    {task.custom_fields?.find((f) => f.label === label)
                      ?.value || "-"}
                  </TableCell>
                ))}
                <TableCell>
                  {task.assignees?.length ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {task.assignees.length}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {task.comments ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                      {task.comments}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleTaskClick(task)}
                        className="cursor-pointer"
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(task.id)}
                        className="text-destructive cursor-pointer"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={handleClose}
          onUpdate={onTaskClick}
          onDelete={onTaskDelete}
          loading={false}
        />
      )}

      <ConfirmationModal
        open={!!taskToDelete}
        onOpenChange={(open) => !open && setTaskToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        loading={isDeleting}
      />
    </>
  );
}

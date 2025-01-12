"use client";

import { useState, useEffect, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash, RefreshCw } from "lucide-react";
import { Database } from "@/types/database";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { AssigneeSelect } from "./assignee-select";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { useQueryClient } from "@tanstack/react-query";
import { addDays, addMonths, addWeeks, addYears, isWithinInterval, subDays, format } from "date-fns";
import { TaskDetails } from "./task-details";

interface TaskTableProps {
  tasks: Database["public"]["Tables"]["tasks"]["Row"][];
  onTaskDelete: (taskId: string) => void;
  onTaskUpdate: () => void;
}

const PRIORITY_VARIANTS = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
};

const STATUS_VARIANTS = {
  todo: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300",
  "in-progress": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  done: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
};

const getNextDueDate = (currentDueDate: string, interval: string) => {
  const date = new Date(currentDueDate);
  switch (interval.toLowerCase()) {
    case 'daily':
      return addDays(date, 1);
    case 'weekly':
      return addWeeks(date, 1);
    case 'monthly':
      return addMonths(date, 1);
    case 'annual':
      return addYears(date, 1);
    default:
      return date;
  }
};

const isNearDueDate = (dueDate: string | null) => {
  if (!dueDate) return false;
  const date = new Date(dueDate);
  const now = new Date();
  return isWithinInterval(now, {
    start: subDays(date, 7), // 7 days before due date
    end: date
  });
};

export function TaskTable({ tasks, onTaskDelete, onTaskUpdate }: TaskTableProps) {
  const { teamMembers } = useTeamMembers();
  const [editingAssignee, setEditingAssignee] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Database["public"]["Tables"]["tasks"]["Row"] | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  // Get unique custom field labels across all tasks
  const customFieldLabels = Array.from(
    new Set(
      tasks.flatMap((task) =>
        Array.isArray(task.custom_fields)
          ? task.custom_fields.map((field) => field.label)
          : []
      ).filter(Boolean)
    )
  );

  useEffect(() => {
    // Subscribe to task updates
    const channel = supabase
      .channel('task_updates')
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks'
        },
        () => {
          // Refresh tasks when there's an update
          onTaskUpdate();
          // Also refresh team members to get latest assignee data
          queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    }
  }, [onTaskUpdate, supabase, queryClient]);

  const handleAssigneeSelect = async (taskId: string, userId: string | null) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ assigned_to: userId })
        .eq('id', taskId);

      if (error) throw error;

      // Show success toast
      const assignee = userId ? teamMembers.find(m => m.id === userId)?.name : 'no one';
      toast.success(`Task has been assigned to ${assignee}`);

      // Create notification for the assigned user
      if (userId) {
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'task_assigned',
            title: 'New Task Assignment',
            message: `You have been assigned a new task`,
            task_id: taskId
          });
      }

      // Update local state immediately
      onTaskUpdate();
      setEditingAssignee(null);
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error("Failed to assign task. Please try again.");
    }
  };

  const handleRenewTask = async (task: Database["public"]["Tables"]["tasks"]["Row"]) => {
    if (!task.due_date || !task.recurring_interval) return;

    try {
      const nextDueDate = getNextDueDate(task.due_date, task.recurring_interval);
      const { error } = await supabase
        .from('tasks')
        .update({
          due_date: nextDueDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (error) throw error;

      toast.success("Task renewed successfully");
      onTaskUpdate();
    } catch (error) {
      console.error('Error renewing task:', error);
      toast.error("Failed to renew task");
    }
  };

  return (
    <>
      <div className="rounded-md border">
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
              <TableHead>Assignee</TableHead>
              <TableHead>Comments</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow
                key={task.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedTask(task)}
              >
                <TableCell>{task.title}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={PRIORITY_VARIANTS[task.priority.toLowerCase() as keyof typeof PRIORITY_VARIANTS]}>
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={STATUS_VARIANTS[task.status.toLowerCase() as keyof typeof STATUS_VARIANTS]}>
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell>{task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : "Not set"}</TableCell>
                <TableCell>
                  {task.is_recurring ? (
                    <div className="flex items-center gap-2">
                      <span>{task.recurring_interval}</span>
                      {task.is_recurring && isNearDueDate(task.due_date) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenewTask(task);
                          }}
                          className="h-6 w-6"
                          title="Renew task"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    "No"
                  )}
                </TableCell>
                {customFieldLabels.map((label) => (
                  <TableCell key={label}>
                    {Array.isArray(task.custom_fields)
                      ? task.custom_fields.find((f) => f.label === label)?.value || "-"
                      : "-"
                    }
                  </TableCell>
                ))}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {editingAssignee === task.id ? (
                    <AssigneeSelect
                      teamMembers={teamMembers}
                      selectedAssigneeId={task.assigned_to}
                      onAssigneeSelect={(userId) => handleAssigneeSelect(task.id, userId)}
                    />
                  ) : (
                    <div
                      className="flex items-center gap-2 cursor-pointer hover:bg-accent rounded-md p-1"
                      onClick={() => setEditingAssignee(task.id)}
                    >
                      {task.assigned_to ? (
                        <>
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={teamMembers.find((m) => m.id === task.assigned_to)?.image}
                              alt={teamMembers.find((m) => m.id === task.assigned_to)?.name}
                            />
                            <AvatarFallback>
                              {teamMembers.find((m) => m.id === task.assigned_to)?.name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span>{teamMembers.find((m) => m.id === task.assigned_to)?.name}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>{Array.isArray(task.comments) ? task.comments.length : 0}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTaskToDelete(task.id);
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedTask && (
        <TaskDetails
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={onTaskUpdate}
        />
      )}

      <ConfirmationModal
        open={!!taskToDelete}
        onOpenChange={(open) => !open && setTaskToDelete(null)}
        onConfirm={async () => {
          if (!taskToDelete) return;
          setIsDeleting(true);
          try {
            await onTaskDelete(taskToDelete);
            toast.success("Task deleted successfully");
            setTaskToDelete(null);
          } catch (error) {
            toast.error("Failed to delete task");
          } finally {
            setIsDeleting(false);
          }
        }}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        loading={isDeleting}
      />
    </>
  );
}

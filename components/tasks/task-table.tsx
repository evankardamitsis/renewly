"use client";

import { useState, useEffect, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash, RefreshCw, Pencil } from "lucide-react";
import { Task } from "@/types/task";
import { TeamMember, useTeamMembers } from "@/hooks/useTeamMembers";
import { AssigneeSelect } from "./assignee-select";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { useQueryClient } from "@tanstack/react-query";
import { addDays, addMonths, addWeeks, addYears, isWithinInterval, subDays, format, formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TaskDetails } from "./task-details";
import { tasksApi } from "@/services/api";

interface TaskTableProps {
  tasks: Task[];
  onTaskDelete: (taskId: string) => void;
  onTaskUpdate: () => void;
}

type TaskFieldValue = string | number | boolean | null;

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

function getNextDueDate(currentDueDate: string, recurringInterval: string): string {
  const date = new Date(currentDueDate);

  switch (recurringInterval) {
    case "annual":
      return addYears(date, 1).toISOString();
    case "6month":
      return addMonths(date, 6).toISOString();
    case "3month":
      return addMonths(date, 3).toISOString();
    case "monthly":
      return addMonths(date, 1).toISOString();
    case "weekly":
      return addWeeks(date, 1).toISOString();
    case "daily":
      return addDays(date, 1).toISOString();
    default:
      return date.toISOString();
  }
}

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
  const [editingCell, setEditingCell] = useState<{ taskId: string; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [selectedTaskForComments, setSelectedTaskForComments] = useState<Task | null>(null);
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<Task | null>(null);
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

  const handleStartEdit = (taskId: string, field: string, value: string) => {
    setEditingCell({ taskId, field });
    setEditingValue(value);
  };

  const handleSave = async (taskId: string, field: string, value: TaskFieldValue) => {
    try {
      // Check if this is a custom field
      const isCustomField = customFieldLabels.includes(field);

      if (isCustomField) {
        // Get current task
        const task = tasks.find(t => t.id === taskId);
        if (!task) throw new Error("Task not found");

        // Update the custom field
        const updatedFields = task.custom_fields.map(f => ({
          ...f,
          value: f.label === field ? String(value) : f.value
        }));

        await tasksApi.updateCustomFields(taskId, updatedFields);
      } else {
        // Handle regular field update
        const { error } = await supabase
          .from('tasks')
          .update({
            [field]: value,
            updated_at: new Date().toISOString()
          })
          .eq('id', taskId);

        if (error) throw error;
      }

      toast.success("Task updated successfully");
      onTaskUpdate();
      setEditingCell(null);
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error("Failed to update task");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, taskId: string, field: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave(taskId, field, editingValue);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const handleRenewTask = async (task: Task) => {
    if (!task.is_recurring || !task.recurring_interval || !task.due_date) return;

    try {
      const supabase = createClient();
      const nextDueDate = getNextDueDate(task.due_date, task.recurring_interval);

      const { error } = await supabase
        .from('tasks')
        .update({
          due_date: nextDueDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (error) throw error;

      toast.success("Task renewed successfully");
      if (onTaskUpdate) {
        onTaskUpdate();
      }

      // Create notification for assigned user
      if (task.assigned_to) {
        await supabase.from('notifications').insert({
          user_id: task.assigned_to,
          type: 'task_renewed',
          title: 'Task Renewed',
          description: `Task "${task.title}" has been renewed and is now due ${formatDistanceToNow(new Date(nextDueDate), { addSuffix: true })}`,
          task_id: task.id
        });
      }
    } catch (error) {
      console.error('Error renewing task:', error);
      toast.error("Failed to renew task");
    }
  };

  const handleCommentsClick = (task: Task) => {
    setSelectedTaskForComments(task);
    setIsCommentsModalOpen(true);
    setEditingValue(String(task.comments || ""));
  };

  const handleSaveComments = async () => {
    if (!selectedTaskForComments) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          comments: editingValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTaskForComments.id);

      if (error) throw error;

      toast.success("Comments updated successfully");
      onTaskUpdate();
      setIsCommentsModalOpen(false);
      setSelectedTaskForComments(null);
    } catch (error) {
      console.error('Error updating comments:', error);
      toast.error("Failed to update comments");
    }
  };

  const handleEditClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setSelectedTaskForDetails(task);
    setIsTaskDetailsOpen(true);
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
              <TableHead className="w-[200px]">Comments</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  {editingCell?.taskId === task.id && editingCell.field === 'title' ? (
                    <Input
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={() => handleSave(task.id, 'title', editingValue)}
                      onKeyDown={(e) => handleKeyDown(e, task.id, 'title')}
                      autoFocus
                    />
                  ) : (
                    <div
                      className="cursor-pointer hover:bg-muted/50 p-2 rounded"
                      onClick={() => handleStartEdit(task.id, 'title', task.title)}
                    >
                      {task.title}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {editingCell?.taskId === task.id && editingCell.field === 'priority' ? (
                    <Select
                      value={editingValue}
                      onValueChange={(value) => {
                        handleSave(task.id, 'priority', value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div
                      className="cursor-pointer"
                      onClick={() => handleStartEdit(task.id, 'priority', task.priority)}
                    >
                      <Badge variant="secondary" className={PRIORITY_VARIANTS[task.priority.toLowerCase() as keyof typeof PRIORITY_VARIANTS]}>
                        {task.priority}
                      </Badge>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {editingCell?.taskId === task.id && editingCell.field === 'status' ? (
                    <Select
                      value={editingValue}
                      onValueChange={(value) => {
                        handleSave(task.id, 'status', value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div
                      className="cursor-pointer"
                      onClick={() => handleStartEdit(task.id, 'status', task.status)}
                    >
                      <Badge variant="secondary" className={STATUS_VARIANTS[task.status.toLowerCase() as keyof typeof STATUS_VARIANTS]}>
                        {task.status}
                      </Badge>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {editingCell?.taskId === task.id && editingCell.field === 'due_date' ? (
                    <Input
                      type="datetime-local"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={() => handleSave(task.id, 'due_date', editingValue)}
                      onKeyDown={(e) => handleKeyDown(e, task.id, 'due_date')}
                      autoFocus
                    />
                  ) : (
                    <div
                      className="cursor-pointer hover:bg-muted/50 p-2 rounded"
                      onClick={() => handleStartEdit(task.id, 'due_date', task.due_date || "")}
                    >
                      {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : "Not set"}
                    </div>
                  )}
                </TableCell>
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
                    {editingCell?.taskId === task.id && editingCell.field === label ? (
                      <Input
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={() => handleSave(task.id, label, editingValue)}
                        onKeyDown={(e) => handleKeyDown(e, task.id, label)}
                        autoFocus
                      />
                    ) : (
                      <div
                        className="cursor-pointer hover:bg-muted/50 p-2 rounded"
                        onClick={() => handleStartEdit(task.id, label, task.custom_fields.find((f) => f.label === label)?.value || "")}
                      >
                        {Array.isArray(task.custom_fields)
                          ? task.custom_fields.find((f) => f.label === label)?.value || "-"
                          : "-"
                        }
                      </div>
                    )}
                  </TableCell>
                ))}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {editingCell?.taskId === task.id && editingCell.field === 'assigned_to' ? (
                    <AssigneeSelect
                      teamMembers={teamMembers}
                      selectedAssigneeId={task.assigned_to}
                      onAssigneeSelect={(userId) => handleSave(task.id, 'assigned_to', userId)}
                    />
                  ) : (
                    <div
                      className="flex items-center gap-2 cursor-pointer hover:bg-accent rounded-md p-1"
                      onClick={() => handleStartEdit(task.id, 'assigned_to', task.assigned_to || "")}
                    >
                      {task.assigned_to ? (
                        <>
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={teamMembers.find((m: TeamMember) => m.id === task.assigned_to)?.image}
                              alt={teamMembers.find((m: TeamMember) => m.id === task.assigned_to)?.name}
                            />
                            <AvatarFallback>
                              {teamMembers.find((m: TeamMember) => m.id === task.assigned_to)?.name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span>{teamMembers.find((m: TeamMember) => m.id === task.assigned_to)?.name}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="w-[200px]">
                  <div
                    className="cursor-pointer hover:bg-muted/50 p-2 rounded line-clamp-1 overflow-hidden text-ellipsis"
                    onClick={() => handleCommentsClick(task)}
                  >
                    {task.comments || "Add comments"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleEditClick(e, task)}
                      title="Edit task"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTaskToDelete(task.id);
                      }}
                      title="Delete task"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isCommentsModalOpen} onOpenChange={(open) => !open && setIsCommentsModalOpen(false)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Task Comments</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Comments</label>
              <Textarea
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                className="min-h-[200px]"
                placeholder="Add your comments here..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCommentsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveComments}>
              Save Comments
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

      {selectedTaskForDetails && (
        <TaskDetails
          task={selectedTaskForDetails}
          isOpen={isTaskDetailsOpen}
          onClose={() => {
            setIsTaskDetailsOpen(false);
            setSelectedTaskForDetails(null);
          }}
          onUpdate={() => {
            onTaskUpdate();
            setIsTaskDetailsOpen(false);
            setSelectedTaskForDetails(null);
          }}
        />
      )}
    </>
  );
}

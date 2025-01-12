"use client";

import { CustomField, RecurringInterval, Task } from "@/types/task";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AssigneeSelect } from "./assignee-select";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

interface TaskDetailsProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (task: Task) => void;
}

interface ExtendedCustomField extends CustomField {
  type: "string" | "text";
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

export function TaskDetails({
  task,
  isOpen,
  onClose,
  onUpdate,
}: TaskDetailsProps) {
  const { teamMembers } = useTeamMembers();
  const [isEditing, setIsEditing] = useState(false);
  const [editingTask, setEditingTask] = useState<{
    title: string;
    description: string;
    priority: Task["priority"];
    status: Task["status"];
    dueDate: string | null;
    isRecurring: boolean;
    recurringInterval: RecurringInterval | null;
    customFields: ExtendedCustomField[];
    assignedTo: string | null;
  } | null>(null);

  const handleEditClick = () => {
    setIsEditing(true);
    setEditingTask({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      status: task.status,
      dueDate: task.due_date || "",
      isRecurring: task.is_recurring || false,
      recurringInterval: task.recurring_interval as RecurringInterval || "monthly",
      customFields: (task.custom_fields || []).map(field => ({ ...field, type: "string" })),
      assignedTo: task.assigned_to
    });
  };

  const handleSave = async () => {
    if (!editingTask) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title: editingTask.title,
          description: editingTask.description,
          priority: editingTask.priority,
          status: editingTask.status,
          due_date: editingTask.dueDate || null,
          is_recurring: editingTask.isRecurring,
          recurring_interval: editingTask.isRecurring ? editingTask.recurringInterval : null,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          custom_fields: editingTask.customFields.map(({ type, ...field }) => field),
          assigned_to: editingTask.assignedTo || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id)
        .select()
        .single();

      if (error) throw error;

      toast.success("Task updated successfully");
      onUpdate(data);
      setIsEditing(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error("Failed to update task");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{task.title}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isEditing) {
                    setIsEditing(false);
                    setEditingTask(null);
                  } else {
                    handleEditClick();
                  }
                }}
              >
                {isEditing ? "Cancel" : "Edit"}
              </Button>
              {isEditing && (
                <Button size="sm" onClick={handleSave}>
                  Save
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            {isEditing ? (
              <Input
                value={editingTask?.title}
                onChange={(e) => setEditingTask(prev => prev ? { ...prev, title: e.target.value } : null)}
              />
            ) : (
              <p className="text-sm">{task.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            {isEditing ? (
              <Textarea
                value={editingTask?.description}
                onChange={(e) => setEditingTask(prev => prev ? { ...prev, description: e.target.value } : null)}
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap">
                {task.description || "No description provided"}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              {isEditing ? (
                <Select
                  value={editingTask?.priority}
                  onValueChange={(value: Task["priority"]) =>
                    setEditingTask(prev => prev ? { ...prev, priority: value } : null)
                  }
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
                <Badge variant="secondary" className={PRIORITY_VARIANTS[task.priority.toLowerCase() as keyof typeof PRIORITY_VARIANTS]}>
                  {task.priority}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              {isEditing ? (
                <Select
                  value={editingTask?.status}
                  onValueChange={(value: Task["status"]) =>
                    setEditingTask(prev => prev ? { ...prev, status: value } : null)
                  }
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
                <Badge variant="secondary" className={STATUS_VARIANTS[task.status.toLowerCase() as keyof typeof STATUS_VARIANTS]}>
                  {task.status}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Due Date</label>
            {isEditing ? (
              <Input
                type="datetime-local"
                value={editingTask?.dueDate || ""}
                onChange={(e) => setEditingTask(prev => prev ? { ...prev, dueDate: e.target.value } : null)}
              />
            ) : (
              <p className="text-sm">
                {task.due_date ? formatDistanceToNow(new Date(task.due_date), { addSuffix: true }) : "Not set"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Recurring Task</label>
            {isEditing ? (
              <div className="flex items-center gap-4">
                <Switch
                  checked={editingTask?.isRecurring}
                  onCheckedChange={(checked) => setEditingTask(prev => prev ? { ...prev, isRecurring: checked } : null)}
                />
                {editingTask?.isRecurring && (
                  <Select
                    value={editingTask.recurringInterval || "monthly"}
                    onValueChange={(value: RecurringInterval) =>
                      setEditingTask(prev => prev ? { ...prev, recurringInterval: value } : null)
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            ) : (
              <p className="text-sm">
                {task.is_recurring
                  ? `Recurring: ${task.recurring_interval}`
                  : "Not recurring"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Assignee</label>
            {isEditing ? (
              <AssigneeSelect
                teamMembers={teamMembers}
                selectedAssigneeId={editingTask?.assignedTo || null}
                onAssigneeSelect={(userId) => setEditingTask(prev => prev ? { ...prev, assignedTo: userId } : null)}
              />
            ) : (
              <div className="flex items-center gap-2">
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
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Custom Fields</label>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingTask(prev => prev ? {
                    ...prev,
                    customFields: [...prev.customFields, { label: "", value: "", type: "string" }]
                  } : null)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-4">
                {editingTask?.customFields.map((field, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={field.label}
                          onChange={(e) => {
                            const newFields = [...(editingTask?.customFields || [])];
                            newFields[index] = {
                              ...field,
                              label: e.target.value,
                            };
                            setEditingTask(prev => prev ? { ...prev, customFields: newFields } : null);
                          }}
                          placeholder="Label"
                        />
                        <Select
                          value={field.type}
                          onValueChange={(value: "string" | "text") => {
                            const newFields = [...(editingTask?.customFields || [])];
                            newFields[index] = {
                              ...field,
                              type: value,
                            };
                            setEditingTask(prev => prev ? { ...prev, customFields: newFields } : null);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Field type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="string">Short Text</SelectItem>
                            <SelectItem value="text">Long Text</SelectItem>
                          </SelectContent>
                        </Select>
                        {field.type === "text" ? (
                          <Textarea
                            value={field.value}
                            onChange={(e) => {
                              const newFields = [...(editingTask?.customFields || [])];
                              newFields[index] = {
                                ...field,
                                value: e.target.value,
                              };
                              setEditingTask(prev => prev ? { ...prev, customFields: newFields } : null);
                            }}
                            placeholder="Value"
                          />
                        ) : (
                          <Input
                            value={field.value}
                            onChange={(e) => {
                              const newFields = [...(editingTask?.customFields || [])];
                              newFields[index] = {
                                ...field,
                                value: e.target.value,
                              };
                              setEditingTask(prev => prev ? { ...prev, customFields: newFields } : null);
                            }}
                            placeholder="Value"
                          />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newFields = editingTask?.customFields.filter((_, i) => i !== index) || [];
                          setEditingTask(prev => prev ? { ...prev, customFields: newFields } : null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {Array.isArray(task.custom_fields) && task.custom_fields.length > 0 ? (
                  task.custom_fields.map((field, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-sm font-medium">{field.label}:</span>
                      <span className="text-sm text-muted-foreground">{field.value}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No custom fields</p>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Task } from "@/types/database";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "../ui/loading-spinner";
import { Plus, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { CreateTaskData } from "@/hooks/useTaskActions";
import { AssigneeSelect } from "./assignee-select";
import { useTeamMembers } from "@/hooks/useTeamMembers";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: CreateTaskData) => Promise<void>;
  task?: Task;
  projectId?: string;
  loading?: boolean;
}

interface CustomField {
  label: string;
  value: string;
  type: "string" | "text";
}

type RecurringInterval = "annual" | "6month" | "3month" | "monthly";

export function TaskModal({
  isOpen,
  onClose,
  onSave,
  task,
  projectId,
  loading,
}: TaskModalProps) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState<Task["priority"]>(
    task?.priority || "medium"
  );
  const [status, setStatus] = useState<Task["status"]>(task?.status || "todo");
  const [dueDate, setDueDate] = useState(task?.due_date || "");
  const [isRecurring, setIsRecurring] = useState(task?.is_recurring || false);
  const [recurringInterval, setRecurringInterval] = useState<RecurringInterval>(
    (task?.recurring_interval as RecurringInterval) || "monthly"
  );
  const [customFields, setCustomFields] = useState<CustomField[]>(
    task?.custom_fields || []
  );
  const [assignedTo, setAssignedTo] = useState<string | null>(task?.assigned_to || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { teamMembers } = useTeamMembers();

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority);
      setStatus(task.status);
      setDueDate(task.due_date || "");
      setIsRecurring(task.is_recurring || false);
      setRecurringInterval(
        (task.recurring_interval as RecurringInterval) || "monthly"
      );
      setCustomFields(task.custom_fields || []);
      setAssignedTo(task.assigned_to || null);
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title,
        description,
        priority,
        status,
        due_date: dueDate || null,
        is_recurring: isRecurring,
        recurring_interval: isRecurring ? recurringInterval : null,
        custom_fields: customFields,
        assigned_to: assignedTo,
        project_id: projectId,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCustomField = () => {
    setCustomFields([
      ...customFields,
      { label: "", value: "", type: "string" },
    ]);
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleCustomFieldChange = (
    index: number,
    field: keyof CustomField,
    value: string
  ) => {
    const newFields = [...customFields];
    newFields[index] = { ...newFields[index], [field]: value };
    setCustomFields(newFields);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select
                value={priority}
                onValueChange={(value: Task["priority"]) => setPriority(value)}
                disabled={loading}
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
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={status}
                onValueChange={(value: Task["status"]) => setStatus(value)}
                disabled={loading}
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
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Due Date</label>
            <Input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Assignee</label>
            <AssigneeSelect
              teamMembers={teamMembers}
              selectedAssigneeId={assignedTo}
              onAssigneeSelect={setAssignedTo}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Recurring Task</label>
            <div className="flex items-center gap-4">
              <Switch
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
                disabled={loading}
              />
              {isRecurring && (
                <Select
                  value={recurringInterval}
                  onValueChange={(value: RecurringInterval) =>
                    setRecurringInterval(value)
                  }
                  disabled={loading}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="6month">Every 6 Months</SelectItem>
                    <SelectItem value="3month">Every 3 Months</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Custom Fields</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCustomField}
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>
            <div className="space-y-4">
              {customFields.map((field, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={field.label}
                      onChange={(e) =>
                        handleCustomFieldChange(index, "label", e.target.value)
                      }
                      placeholder="Label"
                      disabled={loading}
                    />
                    <Select
                      value={field.type}
                      onValueChange={(value) =>
                        handleCustomFieldChange(index, "type", value)
                      }
                      disabled={loading}
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
                        onChange={(e) =>
                          handleCustomFieldChange(index, "value", e.target.value)
                        }
                        placeholder="Value"
                        disabled={loading}
                      />
                    ) : (
                      <Input
                        value={field.value}
                        onChange={(e) =>
                          handleCustomFieldChange(index, "value", e.target.value)
                        }
                        placeholder="Value"
                        disabled={loading}
                      />
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCustomField(index)}
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || isSubmitting}>
              {loading ? <LoadingSpinner /> : task ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

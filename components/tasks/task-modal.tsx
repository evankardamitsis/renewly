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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isRecurring, setIsRecurring] = useState(task?.is_recurring || false);
  const [recurringInterval, setRecurringInterval] = useState<RecurringInterval>(
    (task?.recurring_interval as RecurringInterval) || "monthly"
  );
  const [customFields, setCustomFields] = useState<CustomField[]>(
    (task?.custom_fields as CustomField[]) || []
  );

  useEffect(() => {
    setTitle(task?.title || "");
    setDescription(task?.description || "");
    setPriority(task?.priority || "medium");
    setStatus(task?.status || "todo");
    setDueDate(task?.due_date || "");
    setError("");
  }, [task, isOpen]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await onSave({
        title: title.trim(),
        description: description.trim(),
        priority,
        status,
        due_date: dueDate || null,
        project_id: projectId,
        is_recurring: isRecurring,
        recurring_interval: isRecurring ? recurringInterval : null,
        custom_fields: customFields || [],
      });
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create New Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="title">Title</label>
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setError("");
                }}
                className={error ? "border-destructive" : ""}
                disabled={isSubmitting}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <div className="grid gap-2">
              <label htmlFor="description">Description</label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="priority">Priority</label>
              <Select
                value={priority}
                onValueChange={(value: Task["priority"]) => setPriority(value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="status">Status</label>
              <Select
                value={status}
                onValueChange={(value: Task["status"]) => setStatus(value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="dueDate">Due Date</label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
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
                      <SelectValue placeholder="Select interval" />
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

            <div className="space-y-4">
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

              {customFields.map((field, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Label"
                      value={field.label}
                      onChange={(e) =>
                        handleCustomFieldChange(index, "label", e.target.value)
                      }
                      disabled={loading}
                    />
                    {field.type === "text" ? (
                      <Textarea
                        placeholder="Value"
                        value={field.value}
                        onChange={(e) =>
                          handleCustomFieldChange(
                            index,
                            "value",
                            e.target.value
                          )
                        }
                        disabled={loading}
                      />
                    ) : (
                      <Input
                        placeholder="Value"
                        value={field.value}
                        onChange={(e) =>
                          handleCustomFieldChange(
                            index,
                            "value",
                            e.target.value
                          )
                        }
                        disabled={loading}
                      />
                    )}
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

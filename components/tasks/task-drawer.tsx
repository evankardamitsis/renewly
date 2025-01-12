"use client";

import { CustomField, Task } from "@/types/database";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Trash, Plus, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RecurringInterval } from "@/types/task";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { AssigneeSelect } from "./assignee-select";
import { useTeamMembers } from "../../hooks/useTeamMembers";

interface TaskDrawerProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (task: Task) => void;
  onDelete?: (taskId: string) => Promise<void>;
  loading?: boolean;
}

export function TaskDrawer({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  loading,
}: TaskDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState(task.priority);
  const [status, setStatus] = useState(task.status);
  const [dueDate, setDueDate] = useState(task.due_date || "");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRecurring, setIsRecurring] = useState(task.is_recurring || false);
  const [recurringInterval, setRecurringInterval] = useState<RecurringInterval>(
    (task.recurring_interval as RecurringInterval) || "monthly"
  );
  const [customFields, setCustomFields] = useState<CustomField[]>(
    task.custom_fields || []
  );
  const [assignedTo, setAssignedTo] = useState<string | null>(task.assigned_to);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { teamMembers } = useTeamMembers();

  const handleSave = async () => {
    if (!onUpdate) return;
    await onUpdate({
      ...task,
      title,
      description,
      priority,
      status,
      due_date: dueDate || null,
      is_recurring: isRecurring,
      recurring_interval: isRecurring ? recurringInterval : null,
      custom_fields: customFields || [],
      assigned_to: assignedTo,
    });
    setIsEditing(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    try {
      setIsDeleting(true);
      await onDelete(task.id);
      onClose();
    } catch (error) {
      console.error("Failed to delete task:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
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

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader className="flex flex-row items-center justify-between">
            <SheetTitle className="text-lg font-semibold">
              {isEditing ? "Edit Task" : task.title}
            </SheetTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                disabled={loading}
              >
                {isEditing ? "Cancel" : "Edit"}
              </Button>
              {isEditing ? (
                <Button size="sm" onClick={handleSave} disabled={loading}>
                  Save
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDeleteClick}
                  disabled={loading || isDeleting}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}
            </div>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              {isEditing ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={loading}
                />
              ) : (
                <p className="text-sm">{title}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              {isEditing ? (
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                />
              ) : (
                <p className="text-sm whitespace-pre-wrap">
                  {description || "-"}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                {isEditing ? (
                  <Select
                    value={priority}
                    onValueChange={(value: Task["priority"]) =>
                      setPriority(value)
                    }
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
                ) : (
                  <p className="text-sm capitalize">{priority}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                {isEditing ? (
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
                ) : (
                  <p className="text-sm capitalize">
                    {status.replace("-", " ")}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              {isEditing ? (
                <Input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={loading}
                />
              ) : (
                <p className="text-sm">
                  {dueDate ? new Date(dueDate).toLocaleString() : "-"}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Assignee</label>
              {isEditing ? (
                <AssigneeSelect
                  teamMembers={teamMembers}
                  selectedAssigneeId={assignedTo}
                  onAssigneeSelect={setAssignedTo}
                />
              ) : (
                <p className="text-sm">
                  {teamMembers.find((m) => m.id === assignedTo)?.name || "-"}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Recurring Task</label>
              {isEditing ? (
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
              ) : (
                <p className="text-sm">
                  {isRecurring
                    ? `Recurring: ${recurringInterval}`
                    : "Not recurring"}
                </p>
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
                    onClick={handleAddCustomField}
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
                )}
              </div>
              {isEditing ? (
                <div className="space-y-4">
                  {customFields.map((field, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 space-y-2">
                          <Input
                            value={field.label}
                            onChange={(e) => {
                              const newFields = [...customFields];
                              newFields[index] = {
                                ...field,
                                label: e.target.value,
                              };
                              setCustomFields(newFields);
                            }}
                            placeholder="Label"
                            disabled={loading}
                          />
                          <Select
                            value={field.type}
                            onValueChange={(value: "string" | "text") => {
                              const newFields = [...customFields];
                              newFields[index] = {
                                ...field,
                                type: value,
                              };
                              setCustomFields(newFields);
                            }}
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
                              onChange={(e) => {
                                const newFields = [...customFields];
                                newFields[index] = {
                                  ...field,
                                  value: e.target.value,
                                };
                                setCustomFields(newFields);
                              }}
                              placeholder="Value"
                              disabled={loading}
                            />
                          ) : (
                            <Input
                              value={field.value}
                              onChange={(e) => {
                                const newFields = [...customFields];
                                newFields[index] = {
                                  ...field,
                                  value: e.target.value,
                                };
                                setCustomFields(newFields);
                              }}
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {customFields.map((field, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="font-medium">{field.label}:</span>
                      <span>{field.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmationModal
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        loading={isDeleting}
      />
    </>
  );
}

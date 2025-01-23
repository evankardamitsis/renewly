"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AssigneeSelect } from "./assignee-select";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, X } from "lucide-react";
import { tasksApi } from "@/services/api";

interface TaskDetailsProps {
  task: Database["public"]["Tables"]["tasks"]["Row"];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

type Priority = "low" | "medium" | "high";
type Status = "todo" | "in-progress" | "done";
type AssigneeId = Database["public"]["Tables"]["tasks"]["Row"]["assigned_to"];
type RecurringInterval = "annual" | "6month" | "3month" | "monthly" | "weekly" | "custom" | null;

interface CustomField {
  type: "string";
  label: string;
  value: string;
}

type EditedTask = Omit<Database["public"]["Tables"]["tasks"]["Row"], "custom_fields" | "comments" | "recurring_interval"> & {
  custom_fields: CustomField[];
  comments: string | null;
  recurring_interval: RecurringInterval;
};

const PRIORITY_VARIANTS = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
} as const;

const STATUS_VARIANTS = {
  todo: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300",
  "in-progress": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  done: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
} as const;

export function TaskDetails({ task, isOpen, onClose, onUpdate }: TaskDetailsProps) {
  const [editedTask, setEditedTask] = useState<EditedTask>(() => {
    // Preserve existing custom fields structure, only ensure value is a string
    const customFields = task.custom_fields ? task.custom_fields.map(field => ({
      type: "string" as const,
      label: field.label,
      value: String(field.value || "")
    })) : [];

    return {
      ...task,
      custom_fields: customFields,
      comments: task.comments ? String(task.comments) : null,
      recurring_interval: task.recurring_interval
    };
  });
  const [isSaving, setIsSaving] = useState(false);
  const { teamMembers } = useTeamMembers();
  const supabase = createClient();

  const handleAddCustomField = () => {
    // Check if we already have this field
    const newField = { type: "string" as const, label: "", value: "" };
    setEditedTask(prev => ({
      ...prev,
      custom_fields: [...prev.custom_fields, newField]
    }));
  };

  const handleRemoveCustomField = (index: number) => {
    setEditedTask(prev => ({
      ...prev,
      custom_fields: prev.custom_fields.filter((_, i) => i !== index)
    }));
  };

  const handleCustomFieldChange = (index: number, field: "label" | "value", value: string) => {
    console.log('Custom field change:', {
      index,
      field,
      value,
      currentFields: editedTask.custom_fields
    });

    const updatedFields = editedTask.custom_fields.map((f, i) => {
      if (i === index) {
        // If changing the value, preserve the type and label
        if (field === "value") {
          const updated = { ...f, value };
          console.log('Updating value for field:', { original: f, updated });
          return updated;
        }
        // If changing the label, this must be a new field
        const updated = { ...f, [field]: value };
        console.log('Updating label for field:', { original: f, updated });
        return updated;
      }
      return f;
    });

    console.log('Updated custom fields:', updatedFields);

    setEditedTask(prev => {
      const updated = {
        ...prev,
        custom_fields: updatedFields
      };
      console.log('New task state:', updated);
      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // First update basic task fields
      const { error: basicError } = await supabase
        .from('tasks')
        .update({
          title: editedTask.title,
          description: editedTask.description,
          priority: editedTask.priority,
          status: editedTask.status,
          due_date: editedTask.due_date,
          is_recurring: editedTask.is_recurring,
          recurring_interval: editedTask.recurring_interval,
          assigned_to: editedTask.assigned_to,
          comments: editedTask.comments,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (basicError) throw basicError;

      // Then update custom fields using the dedicated function
      await tasksApi.updateCustomFields(task.id, editedTask.custom_fields);

      toast.success("Task updated successfully");
      onUpdate();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error("Failed to update task");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Task Details</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6">
          <div className="py-4 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editedTask.title}
                onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editedTask.description || ""}
                onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={editedTask.priority}
                  onValueChange={(value: Priority) => setEditedTask({ ...editedTask, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue>
                      <Badge variant="secondary" className={PRIORITY_VARIANTS[editedTask.priority.toLowerCase() as Priority]}>
                        {editedTask.priority}
                      </Badge>
                    </SelectValue>
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
                  value={editedTask.status}
                  onValueChange={(value: Status) => setEditedTask({ ...editedTask, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue>
                      <Badge variant="secondary" className={STATUS_VARIANTS[editedTask.status.toLowerCase() as Status]}>
                        {editedTask.status}
                      </Badge>
                    </SelectValue>
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
                value={editedTask.due_date || ""}
                onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value })}
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="recurring"
                  checked={editedTask.is_recurring}
                  onCheckedChange={(checked) => setEditedTask({ ...editedTask, is_recurring: checked })}
                />
                <Label htmlFor="recurring">Recurring Task</Label>
              </div>
              {editedTask.is_recurring && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recurring Interval</label>
                  <Select
                    value={editedTask.recurring_interval || ""}
                    onValueChange={(value) => setEditedTask({ ...editedTask, recurring_interval: value as RecurringInterval })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="6month">6 Months</SelectItem>
                      <SelectItem value="3month">3 Months</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Assignee</label>
              <AssigneeSelect
                teamMembers={teamMembers}
                selectedAssigneeId={editedTask.assigned_to}
                onAssigneeSelect={(userId) => setEditedTask({ ...editedTask, assigned_to: userId as AssigneeId })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Comments</label>
              <Textarea
                value={editedTask.comments || ""}
                onChange={(e) => setEditedTask({ ...editedTask, comments: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Custom Fields</label>
                <Button variant="outline" size="sm" onClick={handleAddCustomField}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </div>
              {editedTask.custom_fields.map((field, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Input
                    placeholder="Label"
                    value={field.label}
                    onChange={(e) => handleCustomFieldChange(index, "label", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value"
                    value={field.value}
                    onChange={(e) => handleCustomFieldChange(index, "value", e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCustomField(index)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 p-4 border-t mt-auto">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
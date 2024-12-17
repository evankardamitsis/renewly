"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Task } from "@/types/task";
import { Plus, Trash } from "lucide-react";
import { CustomField, RecurringInterval } from "@/types/task";

/**
 * Interface defining the props for the TaskModal component
 * @interface TaskModalProps
 * @property {boolean} isOpen - Controls the visibility of the modal
 * @property {() => void} onClose - Callback function to handle modal closure
 * @property {(task: Task) => void} onSave - Callback function to handle task saving
 * @property {Task} [task] - Optional existing task for editing mode
 */
interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  task?: Task;
}

/**
 * TaskModal Component
 *
 * A modal component for creating or editing tasks. Provides form fields for all task properties
 * and handles the state management for the form inputs.
 *
 * @param {TaskModalProps} props - Component props
 * @returns {JSX.Element} A modal dialog with task form fields
 */
export function TaskModal({ isOpen, onClose, onSave, task }: TaskModalProps) {
  // State management for form fields
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [status, setStatus] = useState(task?.status || "todo");
  const [dueDate, setDueDate] = useState(task?.dueDate || "");
  const [customFields, setCustomFields] = useState<CustomField[]>(
    task?.customFields || []
  );
  const [isRecurring, setIsRecurring] = useState(task?.isRecurring || false);
  const [recurringInterval, setRecurringInterval] = useState<RecurringInterval>(
    task?.recurringInterval || "none"
  );

  /**
   * Effect hook to reset form fields when task prop changes
   * or when modal is opened/closed
   */
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setPriority(task.priority);
      setStatus(task.status);
      setDueDate(task.dueDate);
      setCustomFields(task.customFields);
      setIsRecurring(task.isRecurring);
      setRecurringInterval(task.recurringInterval);
    } else {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setStatus("todo");
      setDueDate("");
      setCustomFields([]);
      setIsRecurring(false);
      setRecurringInterval("none");
    }
  }, [task]);

  /**
   * Handles the save action when form is submitted
   * Creates or updates a task with current form values
   */
  const handleSave = () => {
    const updatedTask: Task = {
      id: task?.id || Date.now().toString(),
      title,
      description,
      priority: priority as Task["priority"],
      status: status as Task["status"],
      dueDate,
      assignees: task?.assignees || [],
      comments: task?.comments || 0,
      progress: task?.progress || 0,
      customFields,
      isRecurring,
      recurringInterval,
      projectId: task?.projectId || "",
    };
    onSave(updatedTask);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create New Task"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="title">Title</label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="description">Description</label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="priority">Priority</label>
            <Select
              value={priority}
              onValueChange={(value: "low" | "medium" | "high") =>
                setPriority(value)
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
          </div>
          <div className="grid gap-2">
            <label htmlFor="status">Status</label>
            <Select
              value={status}
              onValueChange={(value: "todo" | "in-progress" | "done") =>
                setStatus(value)
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
          </div>
          <div className="grid gap-2">
            <label htmlFor="dueDate">Due Date</label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="recurring">Recurring Task</label>
              <input
                type="checkbox"
                id="recurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
            </div>

            {isRecurring && (
              <Select
                value={recurringInterval}
                onValueChange={(value: RecurringInterval) =>
                  setRecurringInterval(value)
                }
              >
                <SelectTrigger>
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Custom Fields</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setCustomFields([...customFields, { label: "", value: "" }])
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Field
                </Button>
              </div>
              {customFields.map((field, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="Label"
                    value={field.label}
                    onChange={(e) =>
                      setCustomFields(
                        customFields.map((f, i) =>
                          i === index ? { ...f, label: e.target.value } : f
                        )
                      )
                    }
                  />
                  <Input
                    placeholder="Value"
                    value={field.value}
                    onChange={(e) =>
                      setCustomFields(
                        customFields.map((f, i) =>
                          i === index ? { ...f, value: e.target.value } : f
                        )
                      )
                    }
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setCustomFields(
                        customFields.filter((_, i) => i !== index)
                      )
                    }
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

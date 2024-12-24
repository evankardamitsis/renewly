"use client";

import { Task } from "@/types/database";
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
import { LoadingSpinner } from "../ui/loading-spinner";
import { Trash } from "lucide-react";

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

  const handleSave = async () => {
    if (!onUpdate) return;
    await onUpdate({
      ...task,
      title,
      description,
      priority,
      status,
      due_date: dueDate || null,
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    try {
      setIsDeleting(true);
      await onDelete(task.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex justify-between">
            <div>Task Details</div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={loading}>
                    {loading ? <LoadingSpinner /> : "Save"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={loading || isDeleting}
                  >
                    {isDeleting ? (
                      <LoadingSpinner />
                    ) : (
                      <Trash className="h-4 w-4" />
                    )}
                  </Button>
                </>
              )}
            </div>
          </SheetTitle>
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
                <p className="text-sm capitalize">{status.replace("-", " ")}</p>
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
        </div>
      </SheetContent>
    </Sheet>
  );
}

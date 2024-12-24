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

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => Promise<void>;
  task?: Task;
  projectId?: string;
  loading?: boolean;
}

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

  useEffect(() => {
    setTitle(task?.title || "");
    setDescription(task?.description || "");
    setPriority(task?.priority || "medium");
    setStatus(task?.status || "todo");
    setDueDate(task?.due_date || "");
    setError("");
  }, [task, isOpen]);

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

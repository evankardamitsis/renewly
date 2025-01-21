"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ProjectStatusSelect } from "./project-status-select";
import { toast } from "sonner";

interface ProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    description: string | null;
    status_id: string;
    due_date: string | null;
  }) => void;
  loading?: boolean;
}

export function ProjectModal({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
}: ProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState<string | null>("");
  const [statusId, setStatusId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submission started');
    console.log('Form data:', { name, description, statusId, dueDate });

    if (!statusId) {
      console.log('Validation failed: No status selected');
      toast.error('Please select a project status');
      return;
    }
    if (!name.trim()) {
      console.log('Validation failed: No name entered');
      toast.error('Please enter a project name');
      return;
    }

    const formData = {
      name: name.trim(),
      description: description?.trim() || null,
      status_id: statusId,
      due_date: dueDate || null
    };

    console.log('Submitting form data:', formData);
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description || ""}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <ProjectStatusSelect
              value={statusId}
              onChange={setStatusId}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

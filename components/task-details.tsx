"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Task } from "@/types/task";

interface TaskDetailsProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskDetails({ task, isOpen, onClose }: TaskDetailsProps) {
  const [comment, setComment] = useState("");

  const addComment = () => {
    if (comment) {
      // In a real app, you would update the task with the new comment
      console.log("Adding comment:", comment);
      setComment("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <h3 className="font-semibold">Description</h3>
            <p>{task.description}</p>
          </div>
          <div>
            <h3 className="font-semibold">Priority</h3>
            <Badge>{task.priority}</Badge>
          </div>
          <div>
            <h3 className="font-semibold">Status</h3>
            <Badge>{task.status}</Badge>
          </div>
          <div>
            <h3 className="font-semibold">Due Date</h3>
            <p>{new Date(task.dueDate).toLocaleDateString()}</p>
          </div>
          <div>
            <h3 className="font-semibold">Assignees</h3>
            <div className="flex space-x-2">
              {task.assignees.map((assignee) => (
                <Avatar key={assignee.name}>
                  <AvatarImage src={assignee.image} />
                  <AvatarFallback>
                    {assignee.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold">Comments</h3>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
            />
            <Button onClick={addComment} className="mt-2">
              Add Comment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

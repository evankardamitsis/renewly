"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { TaskDetails } from "./task-details";
import { Task } from "@/types/task";

interface TaskDrawerProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdate: () => void;
}

export function TaskDrawer({ task, isOpen, onClose, onTaskUpdate }: TaskDrawerProps) {
  if (!task) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-xl">
        <TaskDetails
          task={task}
          isOpen={true}
          onClose={onClose}
          onUpdate={() => {
            onTaskUpdate();
            onClose();
          }}
        />
      </SheetContent>
    </Sheet>
  );
}

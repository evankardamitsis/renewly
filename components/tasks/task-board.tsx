"use client";

import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { TaskCard } from "./task-card";
import { Task } from "@/types/task";
import { cn } from "@/lib/utils";

const columns = {
  todo: "To Do",
  "in-progress": "In Progress",
  done: "Done",
};

interface TaskBoardProps {
  tasks: Task[];
  onTaskUpdate: (updatedTask: Task) => void;
}

export function TaskBoard({ tasks, onTaskUpdate }: TaskBoardProps) {
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;

    onTaskUpdate({
      ...task,
      status: destination.droppableId as Task["status"],
    });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid gap-6 md:grid-cols-3">
        {Object.entries(columns).map(([columnId, label]) => (
          <div key={columnId} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{label}</h2>
              <span className="text-sm text-muted-foreground">
                {tasks.filter((t) => t.status === columnId).length}
              </span>
            </div>
            <Droppable droppableId={columnId}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={cn(
                    "space-y-4 rounded-lg border-2 border-dashed p-4 min-h-[400px]",
                    snapshot.isDraggingOver
                      ? "border-primary/50 bg-primary/10"
                      : "border-transparent"
                  )}
                >
                  {tasks
                    .filter((task) => task.status === columnId)
                    .map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "rounded-lg border bg-card p-4 shadow-sm",
                              snapshot.isDragging && "opacity-50"
                            )}
                          >
                            <TaskCard {...task} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}

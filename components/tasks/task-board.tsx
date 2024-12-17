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

const columns = ["todo", "in-progress", "done"];

interface TaskBoardProps {
  tasks: Task[];
  onTaskUpdate: (updatedTask: Task) => void;
}

export function TaskBoard({ tasks, onTaskUpdate }: TaskBoardProps) {
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const updatedTask = tasks.find((task) => task.id === draggableId);
    if (updatedTask) {
      updatedTask.status = destination.droppableId as Task["status"];
      onTaskUpdate(updatedTask);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid gap-6 md:grid-cols-3">
        {columns.map((column) => (
          <div key={column} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold capitalize">
                {column.replace("-", " ")}
              </h2>
              <span className="text-sm text-muted-foreground">
                {tasks.filter((t) => t.status === column).length}
              </span>
            </div>
            <Droppable droppableId={column}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={cn(
                    "space-y-4 rounded-lg border-2 border-dashed p-4 transition-colors",
                    snapshot.isDraggingOver ? "border-primary/50 bg-primary/10" : "border-transparent"
                  )}
                >
                  {tasks
                    .filter((task) => task.status === column)
                    .map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
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

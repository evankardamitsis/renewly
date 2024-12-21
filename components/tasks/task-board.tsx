"use client";

import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Task } from "@/types/database";
import { TaskCard } from "./task-card";

interface TaskBoardProps {
  tasks: Task[];
  onTaskUpdate: (task: Task) => void;
}

const COLUMNS: { id: Task["status"]; title: string }[] = [
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

export function TaskBoard({ tasks = [], onTaskUpdate }: TaskBoardProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;

    const newStatus = destination.droppableId as Task["status"];
    onTaskUpdate({ ...task, status: newStatus });
  };

  const getTasksByStatus = (status: Task["status"]) => {
    return tasks?.filter((task) => task.status === status) ?? [];
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map((column) => (
          <div
            key={column.id}
            className="flex flex-col rounded-lg border bg-muted/50 p-4"
          >
            <h3 className="mb-4 text-lg font-semibold">{column.title}</h3>
            <Droppable droppableId={column.id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex flex-col gap-2"
                >
                  {getTasksByStatus(column.id).map((task, index) => (
                    <Draggable
                      key={task.id}
                      draggableId={task.id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="transition-opacity"
                          style={provided.draggableProps.style}
                        >
                          <TaskCard task={task} />
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

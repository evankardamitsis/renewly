"use client";

import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Task } from "@/types/database";
import { TaskCard } from "./task-card";
import { useState } from "react";
import { TaskDetails } from "./task-details";

interface TaskBoardProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

const COLUMNS: { id: Task["status"]; title: string }[] = [
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

export function TaskBoard({
  tasks = [],
  onTaskClick,
}: TaskBoardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleClose = () => {
    setSelectedTask(null);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onTaskClick) return;

    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;

    const newStatus = destination.droppableId as Task["status"];
    onTaskClick({
      ...task,
      status: newStatus,
      is_recurring: task.is_recurring || false,
      recurring_interval: task.recurring_interval || null,
      custom_fields: task.custom_fields || [],
    });
  };

  const getTasksByStatus = (status: Task["status"]) => {
    return tasks?.filter((task) => task.status === status) ?? [];
  };

  const handleTaskUpdate = (task: Task) => {
    if (onTaskClick) {
      onTaskClick(task);
      setSelectedTask(null);
    }
  };

  return (
    <>
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
                            <TaskCard
                              task={task}
                              onClick={() => handleTaskClick(task)}
                            />
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

      {selectedTask && (
        <TaskDetails
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={handleClose}
          onUpdate={handleTaskUpdate}
        />
      )}
    </>
  );
}

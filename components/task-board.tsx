"use client"

import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { TaskCard } from './task-card'
import { Task } from '@/types/task'

const columns = ['todo', 'in-progress', 'done']

interface TaskBoardProps {
  tasks: Task[]
  onTaskUpdate: (updatedTask: Task) => void
}

export function TaskBoard({ tasks, onTaskUpdate }: TaskBoardProps) {
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) {
      return
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const updatedTask = tasks.find(task => task.id === draggableId)
    if (updatedTask) {
      updatedTask.status = destination.droppableId as Task['status']
      onTaskUpdate(updatedTask)
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid gap-6 md:grid-cols-3">
        {columns.map((column) => (
          <div key={column} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold capitalize">{column.replace('-', ' ')}</h2>
              <span className="text-sm text-muted-foreground">
                {tasks.filter(t => t.status === column).length}
              </span>
            </div>
            <Droppable droppableId={column}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {tasks
                    .filter(task => task.status === column)
                    .map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
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
  )
}


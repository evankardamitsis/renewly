"use client";

import { useState } from "react";
import { TaskBoard } from "@/components/task-board";
import { TaskTable } from "@/components/task-table";
import { TaskFilters } from "@/components/task-filters";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { Task } from "@/types/task";
import { TaskModal } from "@/components/task-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Sample data
const initialTasks: Task[] = [
  {
    id: "1",
    title: "Design System Updates",
    description: "Update color palette and typography in Figma",
    priority: "high",
    dueDate: "2024-12-20",
    assignees: [
      { name: "Alex Smith", image: "/placeholder.svg" },
      { name: "Sarah Johnson", image: "/placeholder.svg" },
    ],
    comments: 5,
    progress: 75,
    status: "in-progress",
  },
  // ... other tasks
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(tasks);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTaskUpdate = (updatedTask: Task) => {
    const updatedTasks = tasks.map((task) =>
      task.id === updatedTask.id ? updatedTask : task
    );
    setTasks(updatedTasks);
    setFilteredTasks(updatedTasks);
  };

  const handleTaskCreate = (newTask: Task) => {
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    setFilteredTasks(updatedTasks);
  };

  const handleSearch = (searchTerm: string) => {
    const filtered = tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTasks(filtered);
  };

  return (
    <div className="p-6">
      <Card className="bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tasks</CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                className="pl-8 bg-muted/50"
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <TaskFilters onSortChange={() => {}} onFilterChange={() => {}} />
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="board" className="w-full">
            <TabsList>
              <TabsTrigger value="board">Board</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
            </TabsList>
            <TabsContent value="board">
              <TaskBoard
                tasks={filteredTasks}
                onTaskUpdate={handleTaskUpdate}
              />
            </TabsContent>
            <TabsContent value="table">
              <TaskTable
                tasks={filteredTasks}
                onTaskUpdate={handleTaskUpdate}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(newTask) => {
          handleTaskCreate(newTask);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}

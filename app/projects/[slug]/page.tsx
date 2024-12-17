"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProjectStore } from "@/store/useProjectStore";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskTable } from "@/components/tasks/task-table";
import { TaskFilters } from "@/components/tasks/task-filters";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { TaskModal } from "@/components/tasks/task-modal";
import { Task } from "@/types/task";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function ProjectPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const {
    projects,
    isLoading,
    error,
    setSelectedProject,
    updateProject,
    addTask,
  } = useProjectStore();

  const project = projects.find((p) => p.slug === slug);
  const projectTasks = useMemo(
    () =>
      project?.tasks.map(
        (taskId) => useProjectStore.getState().tasks[taskId]
      ) || [],
    [project?.tasks]
  );

  useEffect(() => {
    if (project) {
      setSelectedProject(project.id);
      setFilteredTasks(projectTasks);
    } else if (!isLoading) {
      router.push("/projects");
    }
  }, [project, projectTasks, isLoading, router, setSelectedProject]);

  const handleTaskCreate = (task: Task) => {
    if (project) {
      addTask({ ...task, projectId: project.id });
      const updatedProject = {
        ...project,
        tasks: [...project.tasks, task.id],
      };
      updateProject(updatedProject);
      setIsTaskModalOpen(false);
      toast.success("Task created successfully");
    }
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    if (project) {
      const { updateTask } = useProjectStore.getState();
      updateTask(updatedTask);
      
      // Force refresh the filtered tasks
      setFilteredTasks(prev => 
        prev.map(t => t.id === updatedTask.id ? updatedTask : t)
      );
      
      toast.success("Task updated successfully");
    }
  };

  const handleSearch = (searchTerm: string) => {
    const filtered = projectTasks.filter(
      (task) =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTasks(filtered);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-destructive">Error: {error}</div>;
  if (!project) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
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
          <Button onClick={() => setIsTaskModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      <Tabs defaultValue="board" className="w-full">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
        </TabsList>
        <TabsContent value="board">
          <TaskBoard tasks={filteredTasks} onTaskUpdate={handleTaskUpdate} />
        </TabsContent>
        <TabsContent value="table">
          <TaskTable tasks={filteredTasks} onTaskUpdate={handleTaskUpdate} />
        </TabsContent>
      </Tabs>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleTaskCreate}
      />
    </div>
  );
}

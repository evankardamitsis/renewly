"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProjectStore } from "@/store/useProjectStore";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskTable } from "@/components/tasks/task-table";
import { TaskFilters } from "@/components/tasks/task-filters";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, MoreVertical, Trash } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { TaskModal } from "@/components/tasks/task-modal";
import { Task } from "@/types/database";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const {
    projects,
    tasks,
    isLoading,
    error,
    setSelectedProject,
    updateTask,
    addTask,
    fetchProjects,
    fetchProjectTasks,
    deleteProject,
  } = useProjectStore();

  const project = projects.find((p) => p.slug === params?.slug);

  const initializeData = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("current_team_id")
        .eq("id", user.id)
        .single();

      if (!profile?.current_team_id) {
        toast.error("No team selected");
        router.push("/teams");
        return;
      }

      await fetchProjects(profile.current_team_id);
      setIsInitialLoad(false);
    } catch (error) {
      toast.error("Failed to load project data");
      setIsInitialLoad(false);
    }
  }, [fetchProjects, router]);

  const loadProjectTasks = useCallback(async () => {
    if (!project?.id) return;

    try {
      setSelectedProject(project.id);
      const projectTasks = await fetchProjectTasks(project.id);
      setFilteredTasks(projectTasks);
    } catch (error) {
      toast.error("Failed to load tasks");
    }
  }, [project?.id, setSelectedProject, fetchProjectTasks]);

  useEffect(() => {
    if (isInitialLoad) {
      initializeData();
    }
  }, [isInitialLoad, initializeData]);

  useEffect(() => {
    if (!isInitialLoad && !project && !isLoading) {
      router.push("/projects");
      return;
    }

    if (!isInitialLoad && project) {
      loadProjectTasks();
    }
  }, [isInitialLoad, project, isLoading, router, loadProjectTasks]);

  const handleTaskCreate = async (task: Partial<Task>) => {
    if (!project) return;

    try {
      await addTask(project.id, {
        ...task,
        project_id: project.id,
      });
      toast.success("Task created successfully");
      setIsTaskModalOpen(false);
      loadProjectTasks();
    } catch (error) {
      toast.error("Failed to create task");
    }
  };

  const handleTaskUpdate = async (updatedTask: Task) => {
    if (!project) return;

    try {
      await updateTask(updatedTask.id, updatedTask);
      setFilteredTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
      toast.success("Task updated successfully");
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const handleSearch = (searchTerm: string) => {
    if (!project) return;

    const projectTasks = Object.values(tasks).filter(
      (task) => task.project_id === project.id
    );

    const filtered = projectTasks.filter(
      (task) =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTasks(filtered);
  };

  const handleProjectDelete = async () => {
    if (!project) return;

    try {
      await deleteProject(project.id);
      toast.success("Project deleted successfully");
      router.push("/projects");
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  if (isInitialLoad || isLoading) return <LoadingSpinner />;
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive"
                onClick={handleProjectDelete}
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

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
import { TaskModal } from "@/components/tasks/task-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTaskActions } from "@/hooks/useTaskActions";
import { tasksApi } from "@/services/api";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { Database } from "@/types/database";
import { ProjectFiles } from "@/components/projects/project-files";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/types/project";
import { ProjectStatusDialog } from "@/components/projects/project-status-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskDetails } from "@/components/tasks/task-details";
type ProjectWithTasks = Project & {
  tasks: Database["public"]["Tables"]["tasks"]["Row"][];
};

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Database["public"]["Tables"]["tasks"]["Row"] | null>(null);
  const [filteredTasks, setFilteredTasks] = useState<Database["public"]["Tables"]["tasks"]["Row"][]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const supabase = createClient();

  const {
    projects,
    isLoading,
    error,
    setSelectedProject,
    fetchProjects,
    deleteProject,
    setProjects,
  } = useProjectStore();

  const project = projects.find((p) => p.slug === params?.slug) as ProjectWithTasks;

  const {
    createTask,
    isCreating,
  } = useTaskActions();

  const initializeData = useCallback(async () => {
    try {
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
  }, [fetchProjects, router, supabase]);

  const loadProjectTasks = useCallback(async () => {
    if (!project?.id) return;

    try {
      setSelectedProject(project.id);
      const tasks = await tasksApi.fetchProjectTasks(project.id);
      setFilteredTasks(tasks);
    } catch (error) {
      toast.error("Failed to load tasks");
      setFilteredTasks([]);
    }
  }, [project?.id, setSelectedProject]);

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

    if (!isInitialLoad && project?.id) {
      loadProjectTasks();
    }
  }, [isInitialLoad, project, isLoading, router, loadProjectTasks]);

  const handleTaskCreate = async (task: Partial<Database["public"]["Tables"]["tasks"]["Row"]>) => {
    if (!project) return;

    const result = await createTask(project.id, {
      ...task,
      project_id: project.id,
    });

    if (result.task) {
      setIsTaskModalOpen(false);
      setFilteredTasks((prev) => [...prev, result.task!]);
      await loadProjectTasks();
    }
  };

  const handleSearch = (searchTerm: string) => {
    if (!project) return;

    const filtered = filteredTasks.filter(
      (task) =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        )
    );
    setFilteredTasks(filtered);
  };

  const handleProjectDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!project) return;

    try {
      await deleteProject(project.id);
      toast.success("Project deleted successfully");
      router.push("/projects");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete project");
      setIsDeleteModalOpen(false);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!project) return;

    try {
      await tasksApi.delete(taskId);
      setFilteredTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success("Task deleted successfully");
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  if (isInitialLoad || isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-muted-foreground">Loading project...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-destructive">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-muted-foreground">Project not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.status && (
              <Badge
                className="capitalize"
                style={{
                  backgroundColor: project.status.color,
                  color: 'white'
                }}
              >
                {project.status.name}
              </Badge>
            )}
          </div>
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
          <TaskFilters onSortChange={() => { }} onFilterChange={() => { }} />
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

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Tabs defaultValue="tasks" className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  <TabsTrigger value="board" disabled={!project.has_board_enabled}>
                    Board
                  </TabsTrigger>
                  <TabsTrigger value="files">Files</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2">
                  <Label htmlFor="board-view" className="text-sm">Enable Board View</Label>
                  <Switch
                    id="board-view"
                    checked={project.has_board_enabled}
                    onCheckedChange={async (checked) => {
                      const { error } = await supabase
                        .from('projects')
                        .update({
                          has_board_enabled: checked,
                          updated_at: new Date().toISOString()
                        })
                        .eq('id', project.id);

                      if (error) {
                        toast.error("Failed to update board view settings");
                        return;
                      }

                      // Update the local project state
                      const updatedProject = { ...project, has_board_enabled: checked };
                      const updatedProjects = projects.map(p =>
                        p.id === project.id ? updatedProject : p
                      );
                      setProjects(updatedProjects);

                      toast.success(checked ? "Board view enabled" : "Board view disabled");
                    }}
                  />
                </div>
              </div>

              <TabsContent value="tasks" className="space-y-4">
                <TaskFilters onSortChange={() => { }} onFilterChange={() => { }} />
                <TaskTable
                  tasks={filteredTasks}
                  onTaskDelete={handleTaskDelete}
                  onTaskUpdate={loadProjectTasks}
                />
              </TabsContent>

              <TabsContent value="board">
                <TaskBoard
                  tasks={filteredTasks}
                  onTaskClick={async (task) => {
                    setSelectedTask(task);
                    return Promise.resolve();
                  }}
                />
              </TabsContent>

              <TabsContent value="files">
                <ProjectFiles projectId={project.id} />
              </TabsContent>

              <TabsContent value="settings">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Statuses</CardTitle>
                      <CardDescription>
                        Manage and customize project status options
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ProjectStatusDialog />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleTaskCreate}
        loading={isCreating}
        projectId={project.id}
      />

      {selectedTask && (
        <TaskDetails
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => {
            loadProjectTasks();
            setSelectedTask(null);
          }}
        />
      )}

      <ConfirmationModal
        open={!!isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone."
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

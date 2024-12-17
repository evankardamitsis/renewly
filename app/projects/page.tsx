"use client";

import { useState } from "react";
import { Project } from "@/types/project";
import { Task } from "@/types/task";
import { ProjectList } from "@/components/projects/project-list";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskModal } from "@/components/tasks/task-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const handleProjectCreate = (project: Project) => {
    setProjects([...projects, project]);
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    setProjects(
      projects.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
  };

  const handleTaskCreate = (task: Task) => {
    if (selectedProjectId) {
      const newTask = { ...task, projectId: selectedProjectId };
      setTasks([...tasks, newTask]);
      setProjects(
        projects.map((p) =>
          p.id === selectedProjectId
            ? { ...p, tasks: [...p.tasks, newTask.id] }
            : p
        )
      );
    }
    setIsTaskModalOpen(false);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };

  const filteredTasks = tasks.filter(
    (task) => task.projectId === selectedProjectId
  );

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1">
          <ProjectList
            projects={projects}
            selectedProjectId={selectedProjectId}
            onProjectSelect={setSelectedProjectId}
            onProjectCreate={handleProjectCreate}
            onProjectUpdate={handleProjectUpdate}
          />
        </div>

        <div className="col-span-3">
          {selectedProjectId ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">
                  {projects.find((p) => p.id === selectedProjectId)?.name}
                </h1>
                <Button onClick={() => setIsTaskModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  New Task
                </Button>
              </div>
              <TaskBoard
                tasks={filteredTasks}
                onTaskUpdate={handleTaskUpdate}
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">
                Select a project to view its tasks
              </p>
            </div>
          )}
        </div>
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleTaskCreate}
      />
    </div>
  );
}

"use client"

import { useState } from "react"
import { Project } from "@/types/project"
import { ProjectModal } from "./project-modal"
import { Button } from "../ui/button"
import { Plus } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"
import { cn } from "@/lib/utils"

interface ProjectListProps {
  projects: Project[]
  selectedProjectId?: string
  onProjectSelect: (projectId: string) => void
  onProjectCreate: (project: Project) => void
  onProjectUpdate: (project: Project) => void
}

export function ProjectList({
  projects,
  selectedProjectId,
  onProjectSelect,
  onProjectCreate,
  onProjectUpdate,
}: ProjectListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | undefined>()

  const handleProjectSave = (project: Project) => {
    if (editingProject) {
      onProjectUpdate(project)
    } else {
      onProjectCreate(project)
    }
    setIsModalOpen(false)
    setEditingProject(undefined)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Projects</h2>
        <Button onClick={() => setIsModalOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          New Project
        </Button>
      </div>

      <div className="grid gap-4">
        {projects.map((project) => (
          <Card
            key={project.id}
            className={cn(
              "cursor-pointer hover:bg-accent transition-colors",
              selectedProjectId === project.id && "border-primary"
            )}
            onClick={() => onProjectSelect(project.id)}
          >
            <CardHeader className="p-4">
              <CardTitle className="text-lg">{project.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-sm text-muted-foreground">{project.description}</p>
              <div className="mt-2 text-sm text-muted-foreground">
                {project.tasks.length} tasks
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingProject(undefined)
        }}
        onSave={handleProjectSave}
        project={editingProject}
      />
    </div>
  )
} 
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ProjectModal } from "@/components/projects/project-modal";
import { Project } from "@/types/project";

export function ActiveProjectsCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const projects = [
    { name: "Website Redesign", status: "In Progress", daysLeft: 5 },
    { name: "Mobile App", status: "Planning", daysLeft: 12 },
    { name: "Marketing Campaign", status: "Review", daysLeft: 2 },
  ];

  const handleProjectCreate = (project: Project) => {
    // TODO: Implement project creation logic
    setIsModalOpen(false);
  };

  return (
    <>
      <Card className="bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Active Projects</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            New Project
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.map((project, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{project.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {project.daysLeft} days left
                  </p>
                </div>
                <Badge
                  variant={
                    project.status === "In Progress" ? "default" : "secondary"
                  }
                >
                  {project.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleProjectCreate}
      />
    </>
  );
}

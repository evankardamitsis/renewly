"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, Users } from "lucide-react";
import { Task } from "@/types/task";
import { PerformanceCard } from "@/components/dashboard/performance-card";
import { ChatCard } from "@/components/dashboard/chat-card";
import { ActiveProjectsCard } from "@/components/dashboard/active-projects-card";
import { TeamManagementCard } from "@/components/team-management/team-management-card";
import { TaskModal } from "@/components/tasks/task-modal";

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTaskCreate = (newTask: Task) => {
    console.log("New task created:", newTask);
    // Here you would typically update your task list or send the data to an API
    setIsModalOpen(false);
  };

  return (
    <div className="grid gap-6 p-6 md:grid-cols-2 lg:grid-cols-3">
      {/* New Task Card */}
      <Card className="bg-card/50">
        <CardContent className="p-6">
          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="h-20 rounded-lg bg-muted/50" />
              <div className="h-20 rounded-lg bg-muted/50 col-span-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 rounded-lg bg-muted/50" />
              <div className="h-20 rounded-lg bg-muted/50" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold">New task</h3>
              <p className="text-sm text-muted-foreground">
                Involves creating and assigning a new task within the project
                management system.
              </p>
              <div className="flex gap-2 mt-2">
                <Button
                  className="bg-primary"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add new task
                </Button>
                <Button variant="outline">Learn more</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Card */}
      <PerformanceCard />

      {/* Chat Card */}
      <ChatCard />

      {/* Active Projects Card */}
      <ActiveProjectsCard />

      {/* Team Management Card */}
      <TeamManagementCard />

      {/* Tasks Card */}
      <Card className="bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tasks</CardTitle>
          <Button variant="ghost" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>U1</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Creating persona</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-full rounded-full bg-secondary">
                    <div className="h-full w-[68%] rounded-full bg-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">68%</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>U2</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Documents & sorting</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-full rounded-full bg-secondary">
                    <div className="h-full w-[45%] rounded-full bg-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">45%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Card */}
      <Card className="bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Upcoming</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="rounded-lg">
              Design
            </Badge>
            <Badge variant="outline" className="rounded-lg">
              Development
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg bg-accent/50 p-4">
              <h4 className="font-semibold">Branch meeting</h4>
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  <span>Team:</span>
                  <div className="flex -space-x-2">
                    <Avatar className="h-6 w-6 border-2 border-background">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback>U1</AvatarFallback>
                    </Avatar>
                    <Avatar className="h-6 w-6 border-2 border-background">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback>U2</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>25th Sep, 2024</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleTaskCreate}
      />
    </div>
  );
}

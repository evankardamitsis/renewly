import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageSquare, Clock, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskCardProps {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  dueDate: string;
  assignees: Array<{
    name: string;
    image?: string;
  }>;
  comments: number;
  progress: number;
}

export function TaskCard({
  title,
  description,
  priority,
  dueDate,
  assignees,
  comments,
  progress,
}: TaskCardProps) {
  return (
    <Card className="group relative bg-card/50 hover:bg-card/80 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Badge
          variant={
            priority === "high"
              ? "destructive"
              : priority === "medium"
              ? "default"
              : "secondary"
          }
        >
          {priority}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <h3 className="font-medium mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {description}
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex -space-x-2">
              {assignees.map((assignee, i) => (
                <Avatar key={i} className="border-2 border-background h-6 w-6">
                  <AvatarImage src={assignee.image} />
                  <AvatarFallback className="text-xs">
                    {assignee.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs">{comments}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

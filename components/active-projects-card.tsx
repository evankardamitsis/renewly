import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ActiveProjectsCard() {
  const projects = [
    { name: "Website Redesign", status: "In Progress", daysLeft: 5 },
    { name: "Mobile App", status: "Planning", daysLeft: 12 },
    { name: "Marketing Campaign", status: "Review", daysLeft: 2 },
  ];

  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle>Active Projects</CardTitle>
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
  );
}

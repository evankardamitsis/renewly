"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressChart } from "@/components/progress-chart";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="p-6">
      <div className="grid gap-6">
        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Performance</CardTitle>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Worker
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-4">
              <Avatar>
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>GM</AvatarFallback>
              </Avatar>
              <div>
                <Badge variant="outline">2 tasks</Badge>
              </div>
            </div>
            <ProgressChart tasks={[]} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

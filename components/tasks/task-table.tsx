"use client";

import { Task } from "@/types/database";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Users, MessageSquare } from "lucide-react";

interface TaskTableProps {
  tasks: Task[];
  onTaskUpdate: (task: Task) => void;
}

export function TaskTable({ tasks }: TaskTableProps) {
  const priorityColors = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  };

  const statusColors = {
    todo: "bg-gray-100 text-gray-800",
    "in-progress": "bg-blue-100 text-blue-800",
    done: "bg-green-100 text-green-800",
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Assignees</TableHead>
          <TableHead>Comments</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell className="font-medium">{task.title}</TableCell>
            <TableCell>
              <Badge className={priorityColors[task.priority]}>
                {task.priority}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge className={statusColors[task.status]}>{task.status}</Badge>
            </TableCell>
            <TableCell>
              {task.due_date
                ? format(new Date(task.due_date), "MMM d, yyyy")
                : "-"}
            </TableCell>
            <TableCell>
              {task.assignees?.length > 0 ? (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{task.assignees.length}</span>
                </div>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell>
              {task.comments > 0 ? (
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{task.comments}</span>
                </div>
              ) : (
                "-"
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

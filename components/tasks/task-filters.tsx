"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskFiltersProps {
  onSortChange: (value: string) => void;
  onFilterChange: (value: string) => void;
}

export function TaskFilters({
  onSortChange,
  onFilterChange,
}: TaskFiltersProps) {
  return (
    <div className="flex items-center gap-4">
      <Select onValueChange={onSortChange} defaultValue="created">
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created">Created Date</SelectItem>
          <SelectItem value="due">Due Date</SelectItem>
          <SelectItem value="priority">Priority</SelectItem>
        </SelectContent>
      </Select>

      <Select onValueChange={onFilterChange} defaultValue="all">
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Tasks</SelectItem>
          <SelectItem value="high">High Priority</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
          <SelectItem value="today">Due Today</SelectItem>
          <SelectItem value="week">Due This Week</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  status: "Planning" | "In Progress" | "Review" | "Completed";
  due_date: string | null;
  tasks: string[];
  taskCount: number;
  team_id: string;
  created_at: string;
  updated_at: string;
} 
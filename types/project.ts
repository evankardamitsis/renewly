export interface Project {
  id: string
  slug: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  dueDate: string
  status: "Planning" | "In Progress" | "Review" | "Completed"
  tasks: string[] // Array of task IDs
} 
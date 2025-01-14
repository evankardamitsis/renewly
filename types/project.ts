export interface ProjectStatus {
  id: string;
  name: string;
  color: string;
  description?: string;
  sort_order: number;
  created_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploaded_by: string;
  created_at: string;
}

export interface Project {
  id: string;
  team_id: string;
  name: string;
  description: string | null;
  status_id: string | null;
  status?: ProjectStatus | null;
  created_at: string;
  updated_at: string;
  due_date: string | null;
  slug: string;
  created_by: string | null;
  has_board_enabled: boolean;
  owner_id: string | null;
  taskCount?: number;
}

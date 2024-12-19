export type Team = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export type TeamMember = {
  id: string;
  team_id: string;
  user_id: string;
  role: 'admin' | 'member';
  created_at: string;
}

export type Project = {
  id: string;
  team_id: string;
  name: string;
  description: string | null;
  status: 'Planning' | 'In Progress' | 'Completed';
  created_at: string;
  updated_at: string;
  due_date: string | null;
  slug: string;
}

export type Task = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  due_date: string | null;
}

export type TaskAssignment = {
  id: string;
  task_id: string;
  user_id: string;
  created_at: string;
}

export type TeamInvitation = {
  id: string;
  team_id: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  expires_at: string;
} 
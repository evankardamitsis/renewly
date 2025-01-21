import { RecurringInterval } from "./task";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Assignee {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at?: string;
          updated_at?: string;
          email: string | null;
          display_name: string | null;
          role: string | null;
          has_completed_onboarding: boolean;
          current_team_id: string | null;
          avatar_url: string | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          email?: string | null;
          display_name?: string | null;
          role?: string | null;
          has_completed_onboarding?: boolean;
          current_team_id?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          email?: string | null;
          display_name?: string | null;
          role?: string | null;
          has_completed_onboarding?: boolean;
          current_team_id?: string | null;
          avatar_url?: string | null;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          status_id: string | null;
          created_at: string;
          updated_at: string;
          due_date: string | null;
          slug: string;
          team_id: string;
          has_board_enabled: boolean;
          created_by: string | null;
          owner_id: string | null;
          tasks: string[];
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          status_id?: string | null;
          created_at?: string;
          updated_at?: string;
          due_date?: string | null;
          slug: string;
          team_id: string;
          has_board_enabled?: boolean;
          created_by?: string | null;
          owner_id?: string | null;
          tasks?: string[];
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          status_id?: string | null;
          created_at?: string;
          updated_at?: string;
          due_date?: string | null;
          slug?: string;
          team_id?: string;
          has_board_enabled?: boolean;
          created_by?: string | null;
          owner_id?: string | null;
          tasks?: string[];
        };
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string;
          priority: "low" | "medium" | "high";
          due_date: string | null;
          assigned_to: string | null;
          comments: number;
          progress: number;
          status: "todo" | "in-progress" | "done";
          custom_fields: CustomField[];
          is_recurring: boolean;
          recurring_interval: RecurringInterval | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string;
          priority?: "low" | "medium" | "high";
          due_date?: string | null;
          assigned_to?: string | null;
          comments?: number;
          progress?: number;
          status?: "todo" | "in-progress" | "done";
          custom_fields?: CustomField[];
          is_recurring?: boolean;
          recurring_interval?: RecurringInterval | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string;
          priority?: "low" | "medium" | "high";
          due_date?: string | null;
          assigned_to?: string | null;
          comments?: number;
          progress?: number;
          status?: "todo" | "in-progress" | "done";
          custom_fields?: CustomField[];
          is_recurring?: boolean;
          recurring_interval?: RecurringInterval | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
      };
      teams: {
        Row: {
          id: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          image_url: string | null;
          created_by: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          image_url?: string | null;
          created_by: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name?: string;
          image_url?: string | null;
          created_by?: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          created_at?: string;
          updated_at?: string;
          team_id: string;
          user_id: string;
          role: "admin" | "member";
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          team_id: string;
          user_id: string;
          role?: "admin" | "member";
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          team_id?: string;
          user_id?: string;
          role?: "admin" | "member";
        };
      };
      team_invitations: {
        Row: {
          id: string;
          created_at: string;
          team_id: string;
          email: string;
          role: "admin" | "member";
          invited_by: string;
          status: "pending" | "accepted" | "declined";
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          team_id: string;
          email: string;
          role?: "admin" | "member";
          invited_by: string;
          status?: "pending" | "accepted" | "declined";
          accepted_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          team_id?: string;
          email?: string;
          role?: "admin" | "member";
          invited_by?: string;
          status?: "pending" | "accepted" | "declined";
          accepted_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export interface CustomField {
  label: string;
  value: string;
  type: "string" | "text";
}

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];

export type NotificationType =
  | "DUE_DATE_APPROACHING"
  | "TASK_ASSIGNED"
  | "TASK_COMPLETED"
  | "TASK_UPDATED"
  | "PROJECT_CREATED"
  | "TEAM_MEMBER_ADDED"
  | "DUE_DATE"
  | "TASK_OVERDUE"
  | "TEST_EMAIL";

export interface Notification {
  id: string;
  created_at: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  task_id?: string;
  project_id?: string;
  read: boolean;
  action_url?: string;
}

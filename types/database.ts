import { RecurringInterval } from "./task";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          status: string;
          created_at: string;
          updated_at: string;
          due_date: string | null;
          slug: string;
          team_id: string;
          tasks: string[];
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          due_date?: string | null;
          slug: string;
          team_id: string;
          tasks?: string[];
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          due_date?: string | null;
          slug?: string;
          team_id?: string;
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
          assignees: Json[];
          comments: number;
          progress: number;
          status: "todo" | "in-progress" | "done";
          custom_fields: CustomField[];
          is_recurring: boolean;
          recurring_interval: RecurringInterval | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string;
          priority?: "low" | "medium" | "high";
          due_date?: string | null;
          assignees?: Json[];
          comments?: number;
          progress?: number;
          status?: "todo" | "in-progress" | "done";
          custom_fields?: CustomField[];
          is_recurring?: boolean;
          recurring_interval?: RecurringInterval | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string;
          priority?: "low" | "medium" | "high";
          due_date?: string | null;
          assignees?: Json[];
          comments?: number;
          progress?: number;
          status?: "todo" | "in-progress" | "done";
          custom_fields?: CustomField[];
          is_recurring?: boolean;
          recurring_interval?: RecurringInterval | null;
          created_at?: string;
          updated_at?: string;
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

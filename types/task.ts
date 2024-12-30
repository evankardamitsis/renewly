import { Task as DatabaseTask } from "./database";

export type TaskStatus = DatabaseTask["status"];
export type TaskPriority = DatabaseTask["priority"];
export type RecurringInterval = "annual" | "6month" | "3month" | "monthly";

export interface CustomField {
  label: string;
  value: string;
}

export type Task = DatabaseTask;

export type { Json } from "./database";

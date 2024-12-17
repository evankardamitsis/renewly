/**
 * Task Interface
 * 
 * Defines the structure of a task in the application
 * 
 * @interface Task
 * @property {string} id - Unique identifier for the task
 * @property {string} projectId - Unique identifier for the project
 * @property {string} title - Title of the task
 * @property {string} description - Detailed description of the task
 * @property {'low' | 'medium' | 'high'} priority - Priority level of the task
 * @property {string} dueDate - Due date for the task completion
 * @property {Array<{name: string, image?: string}>} assignees - Array of team members assigned to the task
 * @property {number} comments - Number of comments on the task
 * @property {number} progress - Progress percentage of the task completion
 * @property {'todo' | 'in-progress' | 'done'} status - Current status of the task
 * @property {CustomField[]} customFields - Array of custom fields for the task
 * @property {boolean} isRecurring - Indicates whether the task is recurring
 * @property {RecurringInterval} recurringInterval - Recurring interval for the task
 */
export type RecurringInterval = 'none' | 'annual' | '6month' | '3month' | 'monthly'

export interface CustomField {
  label: string
  value: string
}

export interface Task {
  id: string
  projectId: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  dueDate: string
  assignees: Array<{
    name: string
    image?: string
  }>
  comments: number
  progress: number
  status: 'todo' | 'in-progress' | 'done'
  customFields: CustomField[]
  isRecurring: boolean
  recurringInterval: RecurringInterval
}
  
  
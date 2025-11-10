import { Priority } from './project';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  assignee?: string;
  estimatedHours?: number;
  actualHours?: number;
  startDate?: string;
  endDate?: string;
  parentTaskId?: string;
  orderIndex?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  projectId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  assignee?: string;
  estimatedHours?: number;
  actualHours?: number;
  startDate?: string;
  endDate?: string;
  parentTaskId?: string;
  tags?: string[];
}

export type MilestoneStatus = 'pending' | 'achieved' | 'missed';

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  targetDate: string;
  status: MilestoneStatus;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneInput {
  projectId: string;
  name: string;
  description?: string;
  targetDate: string;
  status?: MilestoneStatus;
  color?: string;
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  resourceId: string;
  allocationPercentage: number; // 0-100%
  createdAt: string;
}

export interface TaskAssignmentInput {
  taskId: string;
  resourceId: string;
  allocationPercentage?: number;
}

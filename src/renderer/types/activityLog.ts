export interface ActivityLog {
  id: string;
  entityType: string; // 'project', 'task', 'milestone'
  entityId: string;
  action: string; // 'created', 'updated', 'deleted', 'status_changed', etc.
  author?: string;
  changes?: string; // JSON string
  createdAt: string;
}

export interface ActivityLogInput {
  entityType: string;
  entityId: string;
  action: string;
  author?: string;
  changes?: any;
}

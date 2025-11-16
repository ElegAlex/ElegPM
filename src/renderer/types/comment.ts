export interface Comment {
  id: string;
  taskId?: string;
  projectId?: string;
  author: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentInput {
  taskId?: string;
  projectId?: string;
  author: string;
  content: string;
}

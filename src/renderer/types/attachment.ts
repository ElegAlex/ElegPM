export interface Attachment {
  id: string;
  taskId?: string;
  projectId?: string;
  filename: string;
  filepath: string;
  fileType?: string;
  fileSize?: number;
  createdAt: string;
}

export interface AttachmentInput {
  taskId?: string;
  projectId?: string;
  filename: string;
  filepath: string;
  fileType?: string;
  fileSize?: number;
}

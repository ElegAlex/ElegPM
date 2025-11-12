import { contextBridge, ipcRenderer } from 'electron';
import type { Project, ProjectInput } from '../renderer/types/project';
import type { Task, TaskInput } from '../renderer/types/task';
import type { Milestone, MilestoneInput } from '../renderer/types/milestone';
import type { Resource, ResourceInput } from '../renderer/types/resource';
import type { Comment, CommentInput } from '../renderer/types/comment';
import type { Attachment, AttachmentInput } from '../renderer/types/attachment';
import type { TaskAssignment, TaskAssignmentInput } from '../renderer/types/taskAssignment';
import type { ActivityLog, ActivityLogInput } from '../renderer/types/activityLog';

// Define the API that will be exposed to the renderer process
export interface ElectronAPI {
  // Test API
  ping: () => Promise<string>;

  // System API
  openExternal: (url: string) => Promise<void>;

  // Projects API
  projects: {
    getAll: () => Promise<Project[]>;
    getAllWithProgress: () => Promise<Project[]>;
    getById: (id: string) => Promise<Project | null>;
    getWithProgress: (id: string) => Promise<Project | null>;
    create: (data: ProjectInput) => Promise<Project>;
    update: (id: string, data: Partial<ProjectInput>) => Promise<Project>;
    delete: (id: string) => Promise<void>;
    search: (query: string) => Promise<Project[]>;
  };

  // Tasks API
  tasks: {
    getAll: (projectId?: string) => Promise<Task[]>;
    getById: (id: string) => Promise<Task | null>;
    create: (data: TaskInput) => Promise<Task>;
    update: (id: string, data: Partial<TaskInput>) => Promise<Task>;
    updateStatus: (id: string, status: string) => Promise<Task>;
    delete: (id: string) => Promise<void>;
    reorder: (taskId: string, newIndex: number) => Promise<void>;
    move: (taskId: string, newParentId: string | null) => Promise<void>;
  };

  // Milestones API
  milestones: {
    getAll: (projectId?: string) => Promise<Milestone[]>;
    getById: (id: string) => Promise<Milestone | null>;
    create: (data: MilestoneInput) => Promise<Milestone>;
    update: (id: string, data: Partial<MilestoneInput>) => Promise<Milestone>;
    delete: (id: string) => Promise<void>;
  };

  // Resources API
  resources: {
    getAll: () => Promise<Resource[]>;
    getById: (id: string) => Promise<Resource | null>;
    create: (data: ResourceInput) => Promise<Resource>;
    update: (id: string, data: Partial<ResourceInput>) => Promise<Resource>;
    delete: (id: string) => Promise<void>;
  };

  // Task Assignments API
  taskAssignments: {
    getAll: (options?: { taskId?: string; resourceId?: string }) => Promise<TaskAssignment[]>;
    getById: (id: string) => Promise<TaskAssignment | null>;
    create: (data: TaskAssignmentInput) => Promise<TaskAssignment>;
    update: (id: string, data: Partial<TaskAssignmentInput>) => Promise<TaskAssignment>;
    delete: (id: string) => Promise<void>;
    assignResources: (taskId: string, resourceIds: string[], allocationPercentage?: number) => Promise<TaskAssignment[]>;
    getResourceWorkload: (resourceId: string) => Promise<TaskAssignment[]>;
  };

  // Comments API
  comments: {
    getAll: (options?: { taskId?: string; projectId?: string }) => Promise<Comment[]>;
    getById: (id: string) => Promise<Comment | null>;
    create: (data: CommentInput) => Promise<Comment>;
    update: (id: string, data: Partial<CommentInput>) => Promise<Comment>;
    delete: (id: string) => Promise<void>;
  };

  // Attachments API
  attachments: {
    getAll: (options?: { taskId?: string; projectId?: string }) => Promise<Attachment[]>;
    getById: (id: string) => Promise<Attachment | null>;
    create: (data: AttachmentInput) => Promise<Attachment>;
    delete: (id: string) => Promise<void>;
  };

  // Files API
  files: {
    openExcelDialog: () => Promise<{ canceled: boolean; filePath?: string; fileName?: string; fileBuffer?: number[] }>;
    saveExcelDialog: (defaultName?: string) => Promise<{ canceled: boolean; filePath?: string }>;
    savePDFDialog: (defaultName?: string) => Promise<{ canceled: boolean; filePath?: string }>;
    saveBuffer: (filePath: string, buffer: number[]) => Promise<{ success: boolean }>;
    readFile: (filePath: string) => Promise<{ success: boolean; fileBuffer?: number[]; fileName?: string }>;
  };

  // PDF API
  pdf: {
    generateFromImage: (data: {
      type: 'dashboard' | 'gantt' | 'project-report';
      filename: string;
      title?: string;
      orientation?: 'portrait' | 'landscape';
      imageData: string;
    }) => Promise<{ success: boolean; path?: string; error?: string; canceled?: boolean }>;

    generateProjectReport: (data: {
      project: any;
      tasks: any[];
      milestones: any[];
      resources: any[];
    }) => Promise<{ success: boolean; path?: string; error?: string; canceled?: boolean }>;
  };

  // Activity Log API
  activityLog: {
    getAll: (options?: { entityType?: string; entityId?: string; limit?: number }) => Promise<ActivityLog[]>;
    getByProject: (projectId: string, limit?: number) => Promise<ActivityLog[]>;
    create: (data: ActivityLogInput) => Promise<ActivityLog>;
    getRecent: (limit?: number) => Promise<ActivityLog[]>;
  };
}

// Expose protected API to renderer process via contextBridge
const api: ElectronAPI = {
  ping: () => ipcRenderer.invoke('ping'),

  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  projects: {
    getAll: () => ipcRenderer.invoke('projects:getAll'),
    getAllWithProgress: () => ipcRenderer.invoke('projects:getAllWithProgress'),
    getById: (id) => ipcRenderer.invoke('projects:getById', id),
    getWithProgress: (id) => ipcRenderer.invoke('projects:getWithProgress', id),
    create: (data) => ipcRenderer.invoke('projects:create', data),
    update: (id, data) => ipcRenderer.invoke('projects:update', id, data),
    delete: (id) => ipcRenderer.invoke('projects:delete', id),
    search: (query) => ipcRenderer.invoke('projects:search', query),
  },

  tasks: {
    getAll: (projectId) => ipcRenderer.invoke('tasks:getAll', projectId),
    getById: (id) => ipcRenderer.invoke('tasks:getById', id),
    create: (data) => ipcRenderer.invoke('tasks:create', data),
    update: (id, data) => ipcRenderer.invoke('tasks:update', id, data),
    updateStatus: (id, status) => ipcRenderer.invoke('tasks:updateStatus', id, status),
    delete: (id) => ipcRenderer.invoke('tasks:delete', id),
    reorder: (taskId, newIndex) => ipcRenderer.invoke('tasks:reorder', taskId, newIndex),
    move: (taskId, newParentId) => ipcRenderer.invoke('tasks:move', taskId, newParentId),
  },

  milestones: {
    getAll: (projectId) => ipcRenderer.invoke('milestones:getAll', projectId),
    getById: (id) => ipcRenderer.invoke('milestones:getById', id),
    create: (data) => ipcRenderer.invoke('milestones:create', data),
    update: (id, data) => ipcRenderer.invoke('milestones:update', id, data),
    delete: (id) => ipcRenderer.invoke('milestones:delete', id),
  },

  resources: {
    getAll: () => ipcRenderer.invoke('resources:getAll'),
    getById: (id) => ipcRenderer.invoke('resources:getById', id),
    create: (data) => ipcRenderer.invoke('resources:create', data),
    update: (id, data) => ipcRenderer.invoke('resources:update', id, data),
    delete: (id) => ipcRenderer.invoke('resources:delete', id),
  },

  taskAssignments: {
    getAll: (options) => ipcRenderer.invoke('taskAssignments:getAll', options),
    getById: (id) => ipcRenderer.invoke('taskAssignments:getById', id),
    create: (data) => ipcRenderer.invoke('taskAssignments:create', data),
    update: (id, data) => ipcRenderer.invoke('taskAssignments:update', id, data),
    delete: (id) => ipcRenderer.invoke('taskAssignments:delete', id),
    assignResources: (taskId, resourceIds, allocationPercentage) =>
      ipcRenderer.invoke('taskAssignments:assignResources', taskId, resourceIds, allocationPercentage),
    getResourceWorkload: (resourceId) => ipcRenderer.invoke('taskAssignments:getResourceWorkload', resourceId),
  },

  comments: {
    getAll: (options) => ipcRenderer.invoke('comments:getAll', options),
    getById: (id) => ipcRenderer.invoke('comments:getById', id),
    create: (data) => ipcRenderer.invoke('comments:create', data),
    update: (id, data) => ipcRenderer.invoke('comments:update', id, data),
    delete: (id) => ipcRenderer.invoke('comments:delete', id),
  },

  attachments: {
    getAll: (options) => ipcRenderer.invoke('attachments:getAll', options),
    getById: (id) => ipcRenderer.invoke('attachments:getById', id),
    create: (data) => ipcRenderer.invoke('attachments:create', data),
    delete: (id) => ipcRenderer.invoke('attachments:delete', id),
  },

  files: {
    openExcelDialog: () => ipcRenderer.invoke('files:openExcelDialog'),
    saveExcelDialog: (defaultName) => ipcRenderer.invoke('files:saveExcelDialog', defaultName),
    savePDFDialog: (defaultName) => ipcRenderer.invoke('files:savePDFDialog', defaultName),
    saveBuffer: (filePath, buffer) => ipcRenderer.invoke('files:saveBuffer', filePath, buffer),
    readFile: (filePath) => ipcRenderer.invoke('files:readFile', filePath),
  },

  pdf: {
    generateFromImage: (data) => ipcRenderer.invoke('generate-pdf-from-image', data),
    generateProjectReport: (data) => ipcRenderer.invoke('generate-project-report-pdf', data),
  },

  activityLog: {
    getAll: (options) => ipcRenderer.invoke('activityLog:getAll', options),
    getByProject: (projectId, limit) => ipcRenderer.invoke('activityLog:getByProject', projectId, limit),
    create: (data) => ipcRenderer.invoke('activityLog:create', data),
    getRecent: (limit) => ipcRenderer.invoke('activityLog:getRecent', limit),
  },
};

contextBridge.exposeInMainWorld('api', api);

// Type declaration for window.api (will be used in renderer)
declare global {
  interface Window {
    api: ElectronAPI;
  }
}

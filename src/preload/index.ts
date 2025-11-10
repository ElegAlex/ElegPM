import { contextBridge, ipcRenderer } from 'electron';
import { Project, ProjectInput } from '../renderer/types/project';
import { Task, TaskInput } from '../renderer/types/task';

// Define the API that will be exposed to the renderer process
export interface ElectronAPI {
  // Test API
  ping: () => Promise<string>;

  // Projects API
  projects: {
    getAll: () => Promise<Project[]>;
    getById: (id: string) => Promise<Project | null>;
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
}

// Expose protected API to renderer process via contextBridge
const api: ElectronAPI = {
  ping: () => ipcRenderer.invoke('ping'),

  projects: {
    getAll: () => ipcRenderer.invoke('projects:getAll'),
    getById: (id) => ipcRenderer.invoke('projects:getById', id),
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
};

contextBridge.exposeInMainWorld('api', api);

// Type declaration for window.api (will be used in renderer)
declare global {
  interface Window {
    api: ElectronAPI;
  }
}

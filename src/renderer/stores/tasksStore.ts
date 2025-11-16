import { create } from 'zustand';
import type { Task, TaskInput } from '../types/task';

interface TasksState {
  tasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTasks: (projectId?: string) => Promise<void>;
  fetchTaskById: (id: string) => Promise<void>;
  createTask: (data: TaskInput) => Promise<Task>;
  updateTask: (id: string, data: Partial<TaskInput>) => Promise<void>;
  updateTaskStatus: (id: string, status: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  reorderTask: (taskId: string, newIndex: number) => Promise<void>;
  moveTask: (taskId: string, newParentId: string | null) => Promise<void>;
  setCurrentTask: (task: Task | null) => void;
  clearError: () => void;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  currentTask: null,
  isLoading: false,
  error: null,

  fetchTasks: async (projectId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await window.api.tasks.getAll(projectId);
      set({ tasks, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch tasks',
        isLoading: false
      });
    }
  },

  fetchTaskById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const task = await window.api.tasks.getById(id);
      set({ currentTask: task, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch task',
        isLoading: false
      });
    }
  },

  createTask: async (data: TaskInput) => {
    set({ isLoading: true, error: null });
    try {
      const newTask = await window.api.tasks.create(data);
      set(state => ({
        tasks: [...state.tasks, newTask],
        isLoading: false
      }));
      return newTask;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create task',
        isLoading: false
      });
      throw error;
    }
  },

  updateTask: async (id: string, data: Partial<TaskInput>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedTask = await window.api.tasks.update(id, data);
      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? updatedTask : t),
        currentTask: state.currentTask?.id === id ? updatedTask : state.currentTask,
        isLoading: false
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update task',
        isLoading: false
      });
      throw error;
    }
  },

  updateTaskStatus: async (id: string, status: string) => {
    set({ isLoading: true, error: null });
    try {
      const updatedTask = await window.api.tasks.updateStatus(id, status);
      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? updatedTask : t),
        currentTask: state.currentTask?.id === id ? updatedTask : state.currentTask,
        isLoading: false
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update task status',
        isLoading: false
      });
      throw error;
    }
  },

  deleteTask: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await window.api.tasks.delete(id);
      set(state => ({
        tasks: state.tasks.filter(t => t.id !== id),
        currentTask: state.currentTask?.id === id ? null : state.currentTask,
        isLoading: false
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete task',
        isLoading: false
      });
      throw error;
    }
  },

  reorderTask: async (taskId: string, newIndex: number) => {
    set({ isLoading: true, error: null });
    try {
      await window.api.tasks.reorder(taskId, newIndex);
      // Refresh tasks to get updated order
      await get().fetchTasks();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to reorder task',
        isLoading: false
      });
      throw error;
    }
  },

  moveTask: async (taskId: string, newParentId: string | null) => {
    set({ isLoading: true, error: null });
    try {
      await window.api.tasks.move(taskId, newParentId);
      // Refresh tasks to get updated hierarchy
      await get().fetchTasks();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to move task',
        isLoading: false
      });
      throw error;
    }
  },

  setCurrentTask: (task: Task | null) => {
    set({ currentTask: task });
  },

  clearError: () => {
    set({ error: null });
  },
}));

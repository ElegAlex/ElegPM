import { create } from 'zustand';
import type { TaskAssignment, TaskAssignmentInput } from '../types/taskAssignment';

interface TaskAssignmentsState {
  assignments: TaskAssignment[];
  currentAssignment: TaskAssignment | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAssignments: (options?: { taskId?: string; resourceId?: string }) => Promise<void>;
  fetchAssignmentById: (id: string) => Promise<void>;
  createAssignment: (data: TaskAssignmentInput) => Promise<TaskAssignment>;
  updateAssignment: (id: string, data: Partial<TaskAssignmentInput>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  assignResourcesToTask: (taskId: string, resourceIds: string[], allocationPercentage?: number) => Promise<void>;
  fetchResourceWorkload: (resourceId: string) => Promise<TaskAssignment[]>;
  setCurrentAssignment: (assignment: TaskAssignment | null) => void;
  clearError: () => void;
}

export const useTaskAssignmentsStore = create<TaskAssignmentsState>((set, get) => ({
  assignments: [],
  currentAssignment: null,
  isLoading: false,
  error: null,

  fetchAssignments: async (options) => {
    set({ isLoading: true, error: null });
    try {
      const assignments = await window.api.taskAssignments.getAll(options);
      set({ assignments, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch assignments',
        isLoading: false
      });
    }
  },

  fetchAssignmentById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const assignment = await window.api.taskAssignments.getById(id);
      set({ currentAssignment: assignment, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch assignment',
        isLoading: false
      });
    }
  },

  createAssignment: async (data: TaskAssignmentInput) => {
    set({ isLoading: true, error: null });
    try {
      const newAssignment = await window.api.taskAssignments.create(data);
      set(state => ({
        assignments: [...state.assignments, newAssignment],
        isLoading: false
      }));
      return newAssignment;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create assignment',
        isLoading: false
      });
      throw error;
    }
  },

  updateAssignment: async (id: string, data: Partial<TaskAssignmentInput>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedAssignment = await window.api.taskAssignments.update(id, data);
      set(state => ({
        assignments: state.assignments.map(a => a.id === id ? updatedAssignment : a),
        currentAssignment: state.currentAssignment?.id === id ? updatedAssignment : state.currentAssignment,
        isLoading: false
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update assignment',
        isLoading: false
      });
      throw error;
    }
  },

  deleteAssignment: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await window.api.taskAssignments.delete(id);
      set(state => ({
        assignments: state.assignments.filter(a => a.id !== id),
        currentAssignment: state.currentAssignment?.id === id ? null : state.currentAssignment,
        isLoading: false
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete assignment',
        isLoading: false
      });
      throw error;
    }
  },

  assignResourcesToTask: async (taskId: string, resourceIds: string[], allocationPercentage?: number) => {
    set({ isLoading: true, error: null });
    try {
      const newAssignments = await window.api.taskAssignments.assignResources(taskId, resourceIds, allocationPercentage);
      // Refresh assignments for this task
      const assignments = await window.api.taskAssignments.getAll({ taskId });
      set(state => ({
        assignments: [
          ...state.assignments.filter(a => a.taskId !== taskId),
          ...assignments
        ],
        isLoading: false
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to assign resources',
        isLoading: false
      });
      throw error;
    }
  },

  fetchResourceWorkload: async (resourceId: string) => {
    try {
      const workload = await window.api.taskAssignments.getResourceWorkload(resourceId);
      return workload;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch resource workload',
      });
      throw error;
    }
  },

  setCurrentAssignment: (assignment: TaskAssignment | null) => {
    set({ currentAssignment: assignment });
  },

  clearError: () => {
    set({ error: null });
  },
}));

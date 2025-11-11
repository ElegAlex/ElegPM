import { create } from 'zustand';
import type { Milestone, MilestoneInput } from '../types/milestone';

interface MilestonesState {
  milestones: Milestone[];
  currentMilestone: Milestone | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchMilestones: (projectId?: string) => Promise<void>;
  fetchMilestoneById: (id: string) => Promise<void>;
  createMilestone: (data: MilestoneInput) => Promise<Milestone>;
  updateMilestone: (id: string, data: Partial<MilestoneInput>) => Promise<void>;
  deleteMilestone: (id: string) => Promise<void>;
  setCurrentMilestone: (milestone: Milestone | null) => void;
  clearError: () => void;
}

export const useMilestonesStore = create<MilestonesState>((set, get) => ({
  milestones: [],
  currentMilestone: null,
  isLoading: false,
  error: null,

  fetchMilestones: async (projectId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const milestones = await window.api.milestones.getAll(projectId);
      set({ milestones, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch milestones',
        isLoading: false
      });
    }
  },

  fetchMilestoneById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const milestone = await window.api.milestones.getById(id);
      set({ currentMilestone: milestone, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch milestone',
        isLoading: false
      });
    }
  },

  createMilestone: async (data: MilestoneInput) => {
    set({ isLoading: true, error: null });
    try {
      const newMilestone = await window.api.milestones.create(data);
      set(state => ({
        milestones: [...state.milestones, newMilestone],
        isLoading: false
      }));
      return newMilestone;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create milestone',
        isLoading: false
      });
      throw error;
    }
  },

  updateMilestone: async (id: string, data: Partial<MilestoneInput>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedMilestone = await window.api.milestones.update(id, data);
      set(state => ({
        milestones: state.milestones.map(m => m.id === id ? updatedMilestone : m),
        currentMilestone: state.currentMilestone?.id === id ? updatedMilestone : state.currentMilestone,
        isLoading: false
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update milestone',
        isLoading: false
      });
      throw error;
    }
  },

  deleteMilestone: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await window.api.milestones.delete(id);
      set(state => ({
        milestones: state.milestones.filter(m => m.id !== id),
        currentMilestone: state.currentMilestone?.id === id ? null : state.currentMilestone,
        isLoading: false
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete milestone',
        isLoading: false
      });
      throw error;
    }
  },

  setCurrentMilestone: (milestone: Milestone | null) => {
    set({ currentMilestone: milestone });
  },

  clearError: () => {
    set({ error: null });
  },
}));

import { create } from 'zustand';
import type { Resource, ResourceInput } from '../types/resource';

interface ResourcesState {
  resources: Resource[];
  currentResource: Resource | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchResources: () => Promise<void>;
  fetchResourceById: (id: string) => Promise<void>;
  createResource: (data: ResourceInput) => Promise<Resource>;
  updateResource: (id: string, data: Partial<ResourceInput>) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
  setCurrentResource: (resource: Resource | null) => void;
  clearError: () => void;
}

export const useResourcesStore = create<ResourcesState>((set, get) => ({
  resources: [],
  currentResource: null,
  isLoading: false,
  error: null,

  fetchResources: async () => {
    set({ isLoading: true, error: null });
    try {
      const resources = await window.api.resources.getAll();
      set({ resources, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch resources',
        isLoading: false
      });
    }
  },

  fetchResourceById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const resource = await window.api.resources.getById(id);
      set({ currentResource: resource, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch resource',
        isLoading: false
      });
    }
  },

  createResource: async (data: ResourceInput) => {
    set({ isLoading: true, error: null });
    try {
      const newResource = await window.api.resources.create(data);
      set(state => ({
        resources: [...state.resources, newResource],
        isLoading: false
      }));
      return newResource;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create resource',
        isLoading: false
      });
      throw error;
    }
  },

  updateResource: async (id: string, data: Partial<ResourceInput>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedResource = await window.api.resources.update(id, data);
      set(state => ({
        resources: state.resources.map(r => r.id === id ? updatedResource : r),
        currentResource: state.currentResource?.id === id ? updatedResource : state.currentResource,
        isLoading: false
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update resource',
        isLoading: false
      });
      throw error;
    }
  },

  deleteResource: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await window.api.resources.delete(id);
      set(state => ({
        resources: state.resources.filter(r => r.id !== id),
        currentResource: state.currentResource?.id === id ? null : state.currentResource,
        isLoading: false
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete resource',
        isLoading: false
      });
      throw error;
    }
  },

  setCurrentResource: (resource: Resource | null) => {
    set({ currentResource: resource });
  },

  clearError: () => {
    set({ error: null });
  },
}));

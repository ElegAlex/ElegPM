import { ipcMain } from 'electron';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import db from '../database/db';
import { resources } from '../database/schema';
import type { ResourceInput } from '../../renderer/types/resource';

// Get all resources
ipcMain.handle('resources:getAll', async () => {
  try {
    const allResources = await db.select().from(resources).all();
    return allResources;
  } catch (error) {
    console.error('Error fetching resources:', error);
    throw error;
  }
});

// Get resource by ID
ipcMain.handle('resources:getById', async (_event, id: string) => {
  try {
    const resource = await db.select().from(resources).where(eq(resources.id, id)).get();
    return resource || null;
  } catch (error) {
    console.error('Error fetching resource:', error);
    throw error;
  }
});

// Create resource
ipcMain.handle('resources:create', async (_event, data: ResourceInput) => {
  try {
    const newResource = {
      id: nanoid(),
      name: data.name,
      role: data.role || null,
      email: data.email || null,
      department: data.department || null,
      availability: data.availability ?? 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.insert(resources).values(newResource).run();

    return newResource;
  } catch (error) {
    console.error('Error creating resource:', error);
    throw error;
  }
});

// Update resource
ipcMain.handle('resources:update', async (_event, id: string, data: Partial<ResourceInput>) => {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await db.update(resources).set(updateData).where(eq(resources.id, id)).run();

    const updatedResource = await db.select().from(resources).where(eq(resources.id, id)).get();

    return updatedResource;
  } catch (error) {
    console.error('Error updating resource:', error);
    throw error;
  }
});

// Delete resource
ipcMain.handle('resources:delete', async (_event, id: string) => {
  try {
    await db.delete(resources).where(eq(resources.id, id)).run();
  } catch (error) {
    console.error('Error deleting resource:', error);
    throw error;
  }
});

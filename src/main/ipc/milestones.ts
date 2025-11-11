import { ipcMain } from 'electron';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import db from '../database/db';
import { milestones } from '../database/schema';
import type { MilestoneInput } from '../../renderer/types/milestone';

// Get all milestones (optionally filtered by project)
ipcMain.handle('milestones:getAll', async (_event, projectId?: string) => {
  try {
    if (projectId) {
      const projectMilestones = await db
        .select()
        .from(milestones)
        .where(eq(milestones.projectId, projectId))
        .all();
      return projectMilestones;
    } else {
      const allMilestones = await db.select().from(milestones).all();
      return allMilestones;
    }
  } catch (error) {
    console.error('Error fetching milestones:', error);
    throw error;
  }
});

// Get milestone by ID
ipcMain.handle('milestones:getById', async (_event, id: string) => {
  try {
    const milestone = await db.select().from(milestones).where(eq(milestones.id, id)).get();
    return milestone || null;
  } catch (error) {
    console.error('Error fetching milestone:', error);
    throw error;
  }
});

// Create milestone
ipcMain.handle('milestones:create', async (_event, data: MilestoneInput) => {
  try {
    const newMilestone = {
      id: nanoid(),
      projectId: data.projectId,
      name: data.name,
      description: data.description || null,
      targetDate: data.targetDate,
      status: data.status || 'pending',
      color: data.color || '#10B981',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.insert(milestones).values(newMilestone).run();

    return newMilestone;
  } catch (error) {
    console.error('Error creating milestone:', error);
    throw error;
  }
});

// Update milestone
ipcMain.handle('milestones:update', async (_event, id: string, data: Partial<MilestoneInput>) => {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await db.update(milestones).set(updateData).where(eq(milestones.id, id)).run();

    const updatedMilestone = await db.select().from(milestones).where(eq(milestones.id, id)).get();

    return updatedMilestone;
  } catch (error) {
    console.error('Error updating milestone:', error);
    throw error;
  }
});

// Delete milestone
ipcMain.handle('milestones:delete', async (_event, id: string) => {
  try {
    await db.delete(milestones).where(eq(milestones.id, id)).run();
  } catch (error) {
    console.error('Error deleting milestone:', error);
    throw error;
  }
});

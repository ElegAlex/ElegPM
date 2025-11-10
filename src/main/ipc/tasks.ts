import { ipcMain } from 'electron';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import db from '../database/db';
import { tasks } from '../database/schema';

// Get all tasks (optionally filtered by project)
ipcMain.handle('tasks:getAll', async (_event, projectId?: string) => {
  try {
    if (projectId) {
      const projectTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, projectId))
        .all();
      return projectTasks;
    } else {
      const allTasks = await db.select().from(tasks).all();
      return allTasks;
    }
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
});

// Get task by ID
ipcMain.handle('tasks:getById', async (_event, id: string) => {
  try {
    const task = await db.select().from(tasks).where(eq(tasks.id, id)).get();
    return task || null;
  } catch (error) {
    console.error('Error fetching task:', error);
    throw error;
  }
});

// Create task
ipcMain.handle('tasks:create', async (_event, data: any) => {
  try {
    const newTask = {
      id: nanoid(),
      projectId: data.projectId,
      title: data.title,
      description: data.description || null,
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      assignee: data.assignee || null,
      estimatedHours: data.estimatedHours || null,
      actualHours: data.actualHours || null,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      parentTaskId: data.parentTaskId || null,
      orderIndex: data.orderIndex || null,
      tags: data.tags ? JSON.stringify(data.tags) : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.insert(tasks).values(newTask).run();

    return newTask;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
});

// Update task
ipcMain.handle('tasks:update', async (_event, id: string, data: any) => {
  try {
    const updateData: any = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    if (data.tags) {
      updateData.tags = JSON.stringify(data.tags);
    }

    await db.update(tasks).set(updateData).where(eq(tasks.id, id)).run();

    const updatedTask = await db.select().from(tasks).where(eq(tasks.id, id)).get();

    return updatedTask;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
});

// Update task status
ipcMain.handle('tasks:updateStatus', async (_event, id: string, status: string) => {
  try {
    await db
      .update(tasks)
      .set({
        status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(tasks.id, id))
      .run();

    const updatedTask = await db.select().from(tasks).where(eq(tasks.id, id)).get();

    return updatedTask;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
});

// Delete task
ipcMain.handle('tasks:delete', async (_event, id: string) => {
  try {
    await db.delete(tasks).where(eq(tasks.id, id)).run();
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
});

// Reorder task
ipcMain.handle('tasks:reorder', async (_event, taskId: string, newIndex: number) => {
  try {
    await db
      .update(tasks)
      .set({
        orderIndex: newIndex,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(tasks.id, taskId))
      .run();
  } catch (error) {
    console.error('Error reordering task:', error);
    throw error;
  }
});

// Move task to new parent
ipcMain.handle('tasks:move', async (_event, taskId: string, newParentId: string | null) => {
  try {
    await db
      .update(tasks)
      .set({
        parentTaskId: newParentId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(tasks.id, taskId))
      .run();
  } catch (error) {
    console.error('Error moving task:', error);
    throw error;
  }
});

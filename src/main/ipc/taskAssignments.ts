import { ipcMain } from 'electron';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import db from '../database/db';
import { taskAssignments } from '../database/schema';
import type { TaskAssignmentInput } from '../../renderer/types/taskAssignment';

// Get all task assignments with optional filters
ipcMain.handle('taskAssignments:getAll', async (_event, options?: { taskId?: string; resourceId?: string }) => {
  try {
    let query = db.select().from(taskAssignments);

    if (options?.taskId && options?.resourceId) {
      query = query.where(
        and(
          eq(taskAssignments.taskId, options.taskId),
          eq(taskAssignments.resourceId, options.resourceId)
        )
      ) as any;
    } else if (options?.taskId) {
      query = query.where(eq(taskAssignments.taskId, options.taskId)) as any;
    } else if (options?.resourceId) {
      query = query.where(eq(taskAssignments.resourceId, options.resourceId)) as any;
    }

    const allAssignments = await query.all();
    return allAssignments;
  } catch (error) {
    console.error('Error fetching task assignments:', error);
    throw error;
  }
});

// Get task assignment by ID
ipcMain.handle('taskAssignments:getById', async (_event, id: string) => {
  try {
    const assignment = await db
      .select()
      .from(taskAssignments)
      .where(eq(taskAssignments.id, id))
      .get();
    return assignment || null;
  } catch (error) {
    console.error('Error fetching task assignment:', error);
    throw error;
  }
});

// Create task assignment
ipcMain.handle('taskAssignments:create', async (_event, data: TaskAssignmentInput) => {
  try {
    const newAssignment = {
      id: nanoid(),
      taskId: data.taskId,
      resourceId: data.resourceId,
      allocationPercentage: data.allocationPercentage ?? 100,
      createdAt: new Date().toISOString(),
    };

    await db.insert(taskAssignments).values(newAssignment).run();

    return newAssignment;
  } catch (error) {
    console.error('Error creating task assignment:', error);
    throw error;
  }
});

// Update task assignment
ipcMain.handle('taskAssignments:update', async (_event, id: string, data: Partial<TaskAssignmentInput>) => {
  try {
    await db.update(taskAssignments).set(data).where(eq(taskAssignments.id, id)).run();

    const updatedAssignment = await db
      .select()
      .from(taskAssignments)
      .where(eq(taskAssignments.id, id))
      .get();

    return updatedAssignment;
  } catch (error) {
    console.error('Error updating task assignment:', error);
    throw error;
  }
});

// Delete task assignment
ipcMain.handle('taskAssignments:delete', async (_event, id: string) => {
  try {
    await db.delete(taskAssignments).where(eq(taskAssignments.id, id)).run();
  } catch (error) {
    console.error('Error deleting task assignment:', error);
    throw error;
  }
});

// Assign multiple resources to a task (convenience method)
ipcMain.handle('taskAssignments:assignResources', async (_event, taskId: string, resourceIds: string[], allocationPercentage?: number) => {
  try {
    const assignments = resourceIds.map(resourceId => ({
      id: nanoid(),
      taskId,
      resourceId,
      allocationPercentage: allocationPercentage ?? 100,
      createdAt: new Date().toISOString(),
    }));

    // Delete existing assignments for this task
    await db.delete(taskAssignments).where(eq(taskAssignments.taskId, taskId)).run();

    // Insert new assignments
    if (assignments.length > 0) {
      await db.insert(taskAssignments).values(assignments).run();
    }

    return assignments;
  } catch (error) {
    console.error('Error assigning resources to task:', error);
    throw error;
  }
});

// Get resource workload (all task assignments for a resource)
ipcMain.handle('taskAssignments:getResourceWorkload', async (_event, resourceId: string) => {
  try {
    const assignments = await db
      .select()
      .from(taskAssignments)
      .where(eq(taskAssignments.resourceId, resourceId))
      .all();

    return assignments;
  } catch (error) {
    console.error('Error fetching resource workload:', error);
    throw error;
  }
});

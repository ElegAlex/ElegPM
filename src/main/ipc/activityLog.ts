import { ipcMain } from 'electron';
import { eq, and, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import db from '../database/db';
import { activityLog } from '../database/schema';

// Get activity logs by entity
ipcMain.handle('activityLog:getAll', async (_event, options?: { entityType?: string; entityId?: string; limit?: number }) => {
  try {
    let query = db.select().from(activityLog);

    if (options) {
      const conditions = [];
      if (options.entityType) {
        conditions.push(eq(activityLog.entityType, options.entityType));
      }
      if (options.entityId) {
        conditions.push(eq(activityLog.entityId, options.entityId));
      }

      if (conditions.length > 0) {
        query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions)) as any;
      }
    }

    // Always order by date descending
    query = query.orderBy(desc(activityLog.createdAt)) as any;

    // Apply limit if specified
    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }

    const logs = await query.all();
    return logs;
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    throw error;
  }
});

// Get activity logs for a project (including all related tasks and milestones)
ipcMain.handle('activityLog:getByProject', async (_event, projectId: string, limit?: number) => {
  try {
    // Get all logs for the project and its tasks/milestones
    // This would require joining with tasks and milestones tables to get project-related activities
    // For now, we'll just get direct project logs
    const logs = await db
      .select()
      .from(activityLog)
      .where(and(eq(activityLog.entityType, 'project'), eq(activityLog.entityId, projectId)))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit || 100)
      .all();

    return logs;
  } catch (error) {
    console.error('Error fetching project activity logs:', error);
    throw error;
  }
});

// Create activity log entry
ipcMain.handle('activityLog:create', async (_event, data: {
  entityType: string;
  entityId: string;
  action: string;
  author?: string;
  changes?: any;
}) => {
  try {
    const newLog = {
      id: nanoid(),
      entityType: data.entityType,
      entityId: data.entityId,
      action: data.action,
      author: data.author || null,
      changes: data.changes ? JSON.stringify(data.changes) : null,
      createdAt: new Date().toISOString(),
    };

    await db.insert(activityLog).values(newLog).run();

    return newLog;
  } catch (error) {
    console.error('Error creating activity log:', error);
    throw error;
  }
});

// Get recent activity logs across all entities
ipcMain.handle('activityLog:getRecent', async (_event, limit: number = 50) => {
  try {
    const logs = await db
      .select()
      .from(activityLog)
      .orderBy(desc(activityLog.createdAt))
      .limit(limit)
      .all();

    return logs;
  } catch (error) {
    console.error('Error fetching recent activity logs:', error);
    throw error;
  }
});

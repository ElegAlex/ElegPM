import { ipcMain } from 'electron';
import { eq, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import db from '../database/db';
import { attachments } from '../database/schema';
import type { AttachmentInput } from '../../renderer/types/attachment';

// Get attachments by task or project
ipcMain.handle('attachments:getAll', async (_event, options?: { taskId?: string; projectId?: string }) => {
  try {
    if (!options || (!options.taskId && !options.projectId)) {
      const allAttachments = await db.select().from(attachments).all();
      return allAttachments;
    }

    const conditions = [];
    if (options.taskId) {
      conditions.push(eq(attachments.taskId, options.taskId));
    }
    if (options.projectId) {
      conditions.push(eq(attachments.projectId, options.projectId));
    }

    const filteredAttachments = await db
      .select()
      .from(attachments)
      .where(conditions.length === 1 ? conditions[0] : or(...conditions))
      .all();

    return filteredAttachments;
  } catch (error) {
    console.error('Error fetching attachments:', error);
    throw error;
  }
});

// Get attachment by ID
ipcMain.handle('attachments:getById', async (_event, id: string) => {
  try {
    const attachment = await db.select().from(attachments).where(eq(attachments.id, id)).get();
    return attachment || null;
  } catch (error) {
    console.error('Error fetching attachment:', error);
    throw error;
  }
});

// Create attachment
ipcMain.handle('attachments:create', async (_event, data: AttachmentInput) => {
  try {
    const newAttachment = {
      id: nanoid(),
      taskId: data.taskId || null,
      projectId: data.projectId || null,
      filename: data.filename,
      filepath: data.filepath,
      fileType: data.fileType || null,
      fileSize: data.fileSize || null,
      createdAt: new Date().toISOString(),
    };

    await db.insert(attachments).values(newAttachment).run();

    return newAttachment;
  } catch (error) {
    console.error('Error creating attachment:', error);
    throw error;
  }
});

// Delete attachment
ipcMain.handle('attachments:delete', async (_event, id: string) => {
  try {
    await db.delete(attachments).where(eq(attachments.id, id)).run();
  } catch (error) {
    console.error('Error deleting attachment:', error);
    throw error;
  }
});

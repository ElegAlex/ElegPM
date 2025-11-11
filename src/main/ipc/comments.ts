import { ipcMain } from 'electron';
import { eq, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import db from '../database/db';
import { comments } from '../database/schema';
import type { CommentInput } from '../../renderer/types/comment';

// Get comments by task or project
ipcMain.handle('comments:getAll', async (_event, options?: { taskId?: string; projectId?: string }) => {
  try {
    if (!options || (!options.taskId && !options.projectId)) {
      const allComments = await db.select().from(comments).all();
      return allComments;
    }

    const conditions = [];
    if (options.taskId) {
      conditions.push(eq(comments.taskId, options.taskId));
    }
    if (options.projectId) {
      conditions.push(eq(comments.projectId, options.projectId));
    }

    const filteredComments = await db
      .select()
      .from(comments)
      .where(conditions.length === 1 ? conditions[0] : or(...conditions))
      .all();

    return filteredComments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
});

// Get comment by ID
ipcMain.handle('comments:getById', async (_event, id: string) => {
  try {
    const comment = await db.select().from(comments).where(eq(comments.id, id)).get();
    return comment || null;
  } catch (error) {
    console.error('Error fetching comment:', error);
    throw error;
  }
});

// Create comment
ipcMain.handle('comments:create', async (_event, data: CommentInput) => {
  try {
    const newComment = {
      id: nanoid(),
      taskId: data.taskId || null,
      projectId: data.projectId || null,
      author: data.author,
      content: data.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.insert(comments).values(newComment).run();

    return newComment;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
});

// Update comment
ipcMain.handle('comments:update', async (_event, id: string, data: Partial<CommentInput>) => {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await db.update(comments).set(updateData).where(eq(comments.id, id)).run();

    const updatedComment = await db.select().from(comments).where(eq(comments.id, id)).get();

    return updatedComment;
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
});

// Delete comment
ipcMain.handle('comments:delete', async (_event, id: string) => {
  try {
    await db.delete(comments).where(eq(comments.id, id)).run();
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
});

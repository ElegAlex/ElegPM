import { ipcMain } from 'electron';
import { loadData, saveData } from '../database/storage';
import { nanoid } from 'nanoid';

ipcMain.handle('comments:getAll', async (_, options?: { taskId?: string; projectId?: string }) => {
  const data = loadData();

  if (!options || (!options.taskId && !options.projectId)) {
    return data.comments;
  }

  return data.comments.filter(c => {
    if (options.taskId && options.projectId) {
      return c.taskId === options.taskId || c.projectId === options.projectId;
    }
    if (options.taskId) {
      return c.taskId === options.taskId;
    }
    if (options.projectId) {
      return c.projectId === options.projectId;
    }
    return false;
  });
});

ipcMain.handle('comments:getById', async (_, id: string) => {
  const data = loadData();
  return data.comments.find(c => c.id === id);
});

ipcMain.handle('comments:create', async (_, comment) => {
  const data = loadData();
  const newComment = {
    ...comment,
    id: nanoid(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  data.comments.push(newComment);
  saveData(data);
  return newComment;
});

ipcMain.handle('comments:update', async (_, id: string, updates) => {
  const data = loadData();
  const index = data.comments.findIndex(c => c.id === id);
  if (index === -1) throw new Error('Comment not found');

  data.comments[index] = {
    ...data.comments[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  saveData(data);
  return data.comments[index];
});

ipcMain.handle('comments:delete', async (_, id: string) => {
  const data = loadData();
  data.comments = data.comments.filter(c => c.id !== id);
  saveData(data);
});

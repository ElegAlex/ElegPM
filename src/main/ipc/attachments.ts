import { ipcMain } from 'electron';
import { loadData, saveData } from '../database/storage';
import { nanoid } from 'nanoid';

ipcMain.handle('attachments:getAll', async (_, options?: { taskId?: string; projectId?: string }) => {
  const data = loadData();

  if (!options || (!options.taskId && !options.projectId)) {
    return data.attachments;
  }

  return data.attachments.filter(a => {
    if (options.taskId && options.projectId) {
      return a.taskId === options.taskId || a.projectId === options.projectId;
    }
    if (options.taskId) {
      return a.taskId === options.taskId;
    }
    if (options.projectId) {
      return a.projectId === options.projectId;
    }
    return false;
  });
});

ipcMain.handle('attachments:getById', async (_, id: string) => {
  const data = loadData();
  return data.attachments.find(a => a.id === id);
});

ipcMain.handle('attachments:create', async (_, attachment) => {
  const data = loadData();
  const newAttachment = {
    ...attachment,
    id: nanoid(),
    createdAt: new Date().toISOString()
  };
  data.attachments.push(newAttachment);
  saveData(data);
  return newAttachment;
});

ipcMain.handle('attachments:delete', async (_, id: string) => {
  const data = loadData();
  data.attachments = data.attachments.filter(a => a.id !== id);
  saveData(data);
});

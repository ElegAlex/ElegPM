import { ipcMain } from 'electron';
import { loadData, saveData } from '../database/storage';
import { nanoid } from 'nanoid';

ipcMain.handle('tasks:getAll', async (_, projectId?: string) => {
  const data = loadData();
  if (projectId) {
    return data.tasks.filter(t => t.projectId === projectId);
  }
  return data.tasks;
});

ipcMain.handle('tasks:getById', async (_, id: string) => {
  const data = loadData();
  return data.tasks.find(t => t.id === id);
});

ipcMain.handle('tasks:getByProject', async (_, projectId: string) => {
  const data = loadData();
  return data.tasks.filter(t => t.projectId === projectId);
});

ipcMain.handle('tasks:create', async (_, task) => {
  const data = loadData();
  const newTask = {
    ...task,
    id: nanoid(),
    tags: task.tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  data.tasks.push(newTask);
  saveData(data);
  return newTask;
});

ipcMain.handle('tasks:update', async (_, id: string, updates) => {
  const data = loadData();
  const index = data.tasks.findIndex(t => t.id === id);
  if (index === -1) throw new Error('Task not found');

  data.tasks[index] = {
    ...data.tasks[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  saveData(data);
  return data.tasks[index];
});

ipcMain.handle('tasks:updateStatus', async (_, id: string, status: string) => {
  const data = loadData();
  const index = data.tasks.findIndex(t => t.id === id);
  if (index === -1) throw new Error('Task not found');

  data.tasks[index] = {
    ...data.tasks[index],
    status,
    updatedAt: new Date().toISOString()
  };
  saveData(data);
  return data.tasks[index];
});

ipcMain.handle('tasks:delete', async (_, id: string) => {
  const data = loadData();
  data.tasks = data.tasks.filter(t => t.id !== id);
  saveData(data);
});

ipcMain.handle('tasks:reorder', async (_, taskId: string, newIndex: number) => {
  const data = loadData();
  const index = data.tasks.findIndex(t => t.id === taskId);
  if (index === -1) throw new Error('Task not found');

  data.tasks[index] = {
    ...data.tasks[index],
    orderIndex: newIndex,
    updatedAt: new Date().toISOString()
  };
  saveData(data);
});

ipcMain.handle('tasks:move', async (_, taskId: string, newParentId: string | null) => {
  const data = loadData();
  const index = data.tasks.findIndex(t => t.id === taskId);
  if (index === -1) throw new Error('Task not found');

  data.tasks[index] = {
    ...data.tasks[index],
    parentTaskId: newParentId,
    updatedAt: new Date().toISOString()
  };
  saveData(data);
});

ipcMain.handle('tasks:getByTags', async (_, tags: string[]) => {
  const data = loadData();

  if (!tags || tags.length === 0) {
    return data.tasks;
  }

  // Filtrer les tâches qui ont AU MOINS UN des tags demandés
  return data.tasks.filter(task => {
    if (!task.tags || !Array.isArray(task.tags)) return false;
    return tags.some(tag => task.tags.includes(tag));
  });
});

ipcMain.handle('tasks:getByProjectAndTags', async (_, projectId: string, tags: string[]) => {
  const data = loadData();
  let tasks = data.tasks.filter(t => t.projectId === projectId);

  if (tags && tags.length > 0) {
    tasks = tasks.filter(task => {
      if (!task.tags || !Array.isArray(task.tags)) return false;
      return tags.some(tag => task.tags.includes(tag));
    });
  }

  return tasks;
});

ipcMain.handle('tasks:getAllTags', async () => {
  const data = loadData();
  const allTags = new Set<string>();

  data.tasks.forEach(task => {
    if (task.tags && Array.isArray(task.tags)) {
      task.tags.forEach(tag => allTags.add(tag));
    }
  });

  return Array.from(allTags).sort();
});

import { ipcMain } from 'electron';
import { loadData, saveData } from '../database/storage';
import { nanoid } from 'nanoid';

ipcMain.handle('resources:getAll', async () => {
  const data = loadData();
  return data.resources;
});

ipcMain.handle('resources:getById', async (_, id: string) => {
  const data = loadData();
  return data.resources.find(r => r.id === id);
});

ipcMain.handle('resources:create', async (_, resource) => {
  const data = loadData();
  const newResource = {
    ...resource,
    id: nanoid(),
    createdAt: new Date().toISOString()
  };
  data.resources.push(newResource);
  saveData(data);
  return newResource;
});

ipcMain.handle('resources:update', async (_, id: string, updates) => {
  const data = loadData();
  const index = data.resources.findIndex(r => r.id === id);
  if (index === -1) throw new Error('Resource not found');

  data.resources[index] = {
    ...data.resources[index],
    ...updates
  };
  saveData(data);
  return data.resources[index];
});

ipcMain.handle('resources:delete', async (_, id: string) => {
  const data = loadData();
  data.resources = data.resources.filter(r => r.id !== id);
  saveData(data);
});

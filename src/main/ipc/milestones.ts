import { ipcMain } from 'electron';
import { loadData, saveData } from '../database/storage';
import { nanoid } from 'nanoid';

ipcMain.handle('milestones:getAll', async (_, projectId?: string) => {
  const data = loadData();
  if (projectId) {
    return data.milestones.filter(m => m.projectId === projectId);
  }
  return data.milestones;
});

ipcMain.handle('milestones:getById', async (_, id: string) => {
  const data = loadData();
  return data.milestones.find(m => m.id === id);
});

ipcMain.handle('milestones:getByProject', async (_, projectId: string) => {
  const data = loadData();
  return data.milestones.filter(m => m.projectId === projectId);
});

ipcMain.handle('milestones:create', async (_, milestone) => {
  const data = loadData();
  const newMilestone = {
    ...milestone,
    id: nanoid(),
    createdAt: new Date().toISOString()
  };
  data.milestones.push(newMilestone);
  saveData(data);
  return newMilestone;
});

ipcMain.handle('milestones:update', async (_, id: string, updates) => {
  const data = loadData();
  const index = data.milestones.findIndex(m => m.id === id);
  if (index === -1) throw new Error('Milestone not found');

  data.milestones[index] = {
    ...data.milestones[index],
    ...updates
  };
  saveData(data);
  return data.milestones[index];
});

ipcMain.handle('milestones:delete', async (_, id: string) => {
  const data = loadData();
  data.milestones = data.milestones.filter(m => m.id !== id);
  saveData(data);
});

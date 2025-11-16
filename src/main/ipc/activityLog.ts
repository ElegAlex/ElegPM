import { ipcMain } from 'electron';

// Activity log handlers - stubbed for now (returns empty arrays)
ipcMain.handle('activityLog:getAll', async () => {
  return [];
});

ipcMain.handle('activityLog:getByProject', async () => {
  return [];
});

ipcMain.handle('activityLog:create', async () => {
  return null;
});

ipcMain.handle('activityLog:getRecent', async () => {
  return [];
});

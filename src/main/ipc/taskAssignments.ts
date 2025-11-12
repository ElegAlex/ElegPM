import { ipcMain } from 'electron';
import { loadData, saveData } from '../database/storage';
import { nanoid } from 'nanoid';

ipcMain.handle('taskAssignments:getAll', async (_, options?: { taskId?: string; resourceId?: string }) => {
  const data = loadData();

  if (!options || (!options.taskId && !options.resourceId)) {
    return data.taskAssignments;
  }

  return data.taskAssignments.filter(ta => {
    if (options.taskId && options.resourceId) {
      return ta.taskId === options.taskId && ta.resourceId === options.resourceId;
    }
    if (options.taskId) {
      return ta.taskId === options.taskId;
    }
    if (options.resourceId) {
      return ta.resourceId === options.resourceId;
    }
    return false;
  });
});

ipcMain.handle('taskAssignments:getById', async (_, id: string) => {
  const data = loadData();
  return data.taskAssignments.find(ta => ta.id === id);
});

ipcMain.handle('taskAssignments:create', async (_, taskAssignment) => {
  const data = loadData();
  const newTaskAssignment = {
    ...taskAssignment,
    id: nanoid(),
    allocationPercentage: taskAssignment.allocationPercentage ?? 100,
    createdAt: new Date().toISOString()
  };
  data.taskAssignments.push(newTaskAssignment);
  saveData(data);
  return newTaskAssignment;
});

ipcMain.handle('taskAssignments:update', async (_, id: string, updates) => {
  const data = loadData();
  const index = data.taskAssignments.findIndex(ta => ta.id === id);
  if (index === -1) throw new Error('Task assignment not found');

  data.taskAssignments[index] = {
    ...data.taskAssignments[index],
    ...updates
  };
  saveData(data);
  return data.taskAssignments[index];
});

ipcMain.handle('taskAssignments:delete', async (_, id: string) => {
  const data = loadData();
  data.taskAssignments = data.taskAssignments.filter(ta => ta.id !== id);
  saveData(data);
});

ipcMain.handle('taskAssignments:assignResources', async (_, taskId: string, resourceIds: string[], allocationPercentage?: number) => {
  const data = loadData();

  // Delete existing assignments for this task
  data.taskAssignments = data.taskAssignments.filter(ta => ta.taskId !== taskId);

  // Create new assignments
  const assignments = resourceIds.map(resourceId => ({
    id: nanoid(),
    taskId,
    resourceId,
    allocationPercentage: allocationPercentage ?? 100,
    createdAt: new Date().toISOString()
  }));

  data.taskAssignments.push(...assignments);
  saveData(data);
  return assignments;
});

ipcMain.handle('taskAssignments:getResourceWorkload', async (_, resourceId: string) => {
  const data = loadData();
  return data.taskAssignments.filter(ta => ta.resourceId === resourceId);
});

import { ipcMain } from 'electron';
import { loadData, saveData } from '../database/storage';
import { nanoid } from 'nanoid';

ipcMain.handle('projects:getAll', async () => {
  const data = loadData();
  return data.projects;
});

ipcMain.handle('projects:getById', async (_, id: string) => {
  const data = loadData();
  return data.projects.find(p => p.id === id);
});

ipcMain.handle('projects:create', async (_, project) => {
  const data = loadData();
  const newProject = {
    ...project,
    id: nanoid(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  data.projects.push(newProject);
  saveData(data);
  return newProject;
});

ipcMain.handle('projects:update', async (_, id: string, updates) => {
  const data = loadData();
  const index = data.projects.findIndex(p => p.id === id);
  if (index === -1) throw new Error('Project not found');

  data.projects[index] = {
    ...data.projects[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  saveData(data);
  return data.projects[index];
});

ipcMain.handle('projects:delete', async (_, id: string) => {
  const data = loadData();
  data.projects = data.projects.filter(p => p.id !== id);
  saveData(data);
});

ipcMain.handle('projects:getWithProgress', async (_, projectId: string) => {
  const data = loadData();
  const project = data.projects.find(p => p.id === projectId);
  if (!project) throw new Error('Project not found');

  // Calculer la progression basée sur les tâches
  const tasks = data.tasks.filter(t => t.projectId === projectId);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;

  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    ...project,
    progress,
    totalTasks,
    completedTasks
  };
});

ipcMain.handle('projects:getAllWithProgress', async () => {
  const data = loadData();

  return data.projects.map(project => {
    const tasks = data.tasks.filter(t => t.projectId === project.id);
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      ...project,
      progress,
      totalTasks,
      completedTasks
    };
  });
});

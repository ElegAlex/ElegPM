import { ipcMain } from 'electron';
import { eq, like } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import db from '../database/db';
import { projects } from '../database/schema';
import type { ProjectInput } from '../../renderer/types/project';

// Get all projects
ipcMain.handle('projects:getAll', async () => {
  try {
    const allProjects = await db.select().from(projects).all();
    return allProjects;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
});

// Get project by ID
ipcMain.handle('projects:getById', async (_event, id: string) => {
  try {
    const project = await db.select().from(projects).where(eq(projects.id, id)).get();
    return project || null;
  } catch (error) {
    console.error('Error fetching project:', error);
    throw error;
  }
});

// Create project
ipcMain.handle('projects:create', async (_event, data: ProjectInput) => {
  try {
    const newProject = {
      id: nanoid(),
      name: data.name,
      description: data.description || null,
      status: data.status || 'not_started',
      priority: data.priority || 'medium',
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      progress: 0,
      color: data.color || '#3B82F6',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.insert(projects).values(newProject).run();

    return newProject;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
});

// Update project
ipcMain.handle('projects:update', async (_event, id: string, data: Partial<ProjectInput>) => {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await db.update(projects).set(updateData).where(eq(projects.id, id)).run();

    const updatedProject = await db.select().from(projects).where(eq(projects.id, id)).get();

    return updatedProject;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
});

// Delete project
ipcMain.handle('projects:delete', async (_event, id: string) => {
  try {
    await db.delete(projects).where(eq(projects.id, id)).run();
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
});

// Search projects
ipcMain.handle('projects:search', async (_event, query: string) => {
  try {
    const results = await db
      .select()
      .from(projects)
      .where(like(projects.name, `%${query}%`))
      .all();

    return results;
  } catch (error) {
    console.error('Error searching projects:', error);
    throw error;
  }
});

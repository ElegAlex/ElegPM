# Guide de Démarrage - Application Electron

## Installation et Initialisation

### 1. Créer le projet avec Electron Forge

```bash
# Créer le projet avec le template TypeScript + Webpack
npm init electron-app@latest gestion-projet -- --template=webpack-typescript

cd gestion-projet

# Installer les dépendances principales
npm install better-sqlite3 drizzle-orm zustand
npm install react react-dom lucide-react date-fns
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select
npm install recharts jspdf html2canvas xlsx

# Installer les dépendances de développement
npm install -D @types/react @types/react-dom @types/better-sqlite3
npm install -D tailwindcss postcss autoprefixer
npm install -D drizzle-kit eslint prettier

# Initialiser Tailwind CSS
npx tailwindcss init -p
```

### 2. Structure du Projet

```
gestion-projet/
├── src/
│   ├── main.ts                    # Point d'entrée Electron
│   ├── preload.ts                 # Preload script
│   ├── database/
│   │   ├── schema.ts              # Schémas Drizzle
│   │   ├── db.ts                  # Configuration SQLite
│   │   └── migrations/
│   │       └── 001_initial.sql
│   ├── ipc/
│   │   ├── projects.ts
│   │   ├── tasks.ts
│   │   └── index.ts
│   └── renderer/
│       ├── index.html
│       ├── App.tsx
│       ├── main.tsx
│       ├── components/
│       ├── stores/
│       ├── hooks/
│       ├── lib/
│       └── styles/
│           └── globals.css
├── forge.config.ts
├── tsconfig.json
├── tailwind.config.js
└── package.json
```

---

## Configuration de Base

### 1. Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./src/renderer/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        foreground: "#171717",
        card: "#FFFFFF",
        'card-foreground': "#171717",
        border: "#E5E7EB",
        input: "#F3F4F6",
        primary: {
          DEFAULT: "#3B82F6",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F3F4F6",
          foreground: "#171717",
        },
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#3B82F6",
        status: {
          todo: "#94A3B8",
          progress: "#3B82F6",
          review: "#F59E0B",
          done: "#10B981",
          blocked: "#EF4444",
        },
        priority: {
          low: "#94A3B8",
          medium: "#3B82F6",
          high: "#F59E0B",
          urgent: "#EF4444",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

### 2. Styles Globaux

```css
/* src/renderer/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

@layer utilities {
  .scrollbar-thin::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-track {
    @apply bg-secondary;
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb {
    @apply bg-gray-400 rounded-full;
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-500;
  }
}
```

---

## Configuration SQLite et Drizzle

### 1. Schéma de Base de Données

```typescript
// src/database/schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status', { 
    enum: ['not_started', 'in_progress', 'on_hold', 'completed', 'archived'] 
  }).notNull().default('not_started'),
  priority: text('priority', { 
    enum: ['low', 'medium', 'high', 'urgent'] 
  }).notNull().default('medium'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  progress: integer('progress').default(0),
  color: text('color').default('#3B82F6'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', { 
    enum: ['todo', 'in_progress', 'review', 'done', 'blocked'] 
  }).notNull().default('todo'),
  priority: text('priority', { 
    enum: ['low', 'medium', 'high', 'urgent'] 
  }).notNull().default('medium'),
  assignee: text('assignee'),
  estimatedHours: real('estimated_hours'),
  actualHours: real('actual_hours'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  parentTaskId: text('parent_task_id').references((): any => tasks.id, { onDelete: 'set null' }),
  orderIndex: integer('order_index'),
  tags: text('tags'), // JSON array
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

export const milestones = sqliteTable('milestones', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  targetDate: text('target_date').notNull(),
  status: text('status', { 
    enum: ['pending', 'achieved', 'missed'] 
  }).notNull().default('pending'),
  color: text('color').default('#10B981'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

export const resources = sqliteTable('resources', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role'),
  email: text('email'),
  department: text('department'),
  availability: real('availability').default(100),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

export const taskAssignments = sqliteTable('task_assignments', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  resourceId: text('resource_id').notNull().references(() => resources.id, { onDelete: 'cascade' }),
  allocationPercentage: real('allocation_percentage').default(100),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

// Types TypeScript
export type Project = typeof projects.$inferSelect;
export type ProjectInsert = typeof projects.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type TaskInsert = typeof tasks.$inferInsert;
export type Milestone = typeof milestones.$inferSelect;
export type MilestoneInsert = typeof milestones.$inferInsert;
export type Resource = typeof resources.$inferSelect;
export type ResourceInsert = typeof resources.$inferInsert;
```

### 2. Configuration de la Base de Données

```typescript
// src/database/db.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

// Chemin de la base de données dans userData
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'database.db');

// Créer le dossier si nécessaire
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}

// Initialiser SQLite
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL'); // Write-Ahead Logging pour meilleures performances

// Initialiser Drizzle
export const db = drizzle(sqlite, { schema });

// Fonction pour exécuter les migrations
export function runMigrations() {
  // Migration initiale
  const migration = `
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT CHECK(status IN ('not_started', 'in_progress', 'on_hold', 'completed', 'archived')) DEFAULT 'not_started',
      priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
      start_date TEXT,
      end_date TEXT,
      progress INTEGER DEFAULT 0,
      color TEXT DEFAULT '#3B82F6',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT CHECK(status IN ('todo', 'in_progress', 'review', 'done', 'blocked')) DEFAULT 'todo',
      priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
      assignee TEXT,
      estimated_hours REAL,
      actual_hours REAL,
      start_date TEXT,
      end_date TEXT,
      parent_task_id TEXT,
      order_index INTEGER,
      tags TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      target_date TEXT NOT NULL,
      status TEXT CHECK(status IN ('pending', 'achieved', 'missed')) DEFAULT 'pending',
      color TEXT DEFAULT '#10B981',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT,
      email TEXT,
      department TEXT,
      availability REAL DEFAULT 100,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS task_assignments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      allocation_percentage REAL DEFAULT 100,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id);
    CREATE INDEX IF NOT EXISTS idx_task_assignments_task ON task_assignments(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_assignments_resource ON task_assignments(resource_id);
  `;

  sqlite.exec(migration);
  console.log('✓ Migrations executées avec succès');
}

export { sqlite };
```

---

## IPC Handlers

### 1. Projects Handler

```typescript
// src/ipc/projects.ts
import { ipcMain } from 'electron';
import { db } from '../database/db';
import { projects, Project, ProjectInsert } from '../database/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export function setupProjectsHandlers() {
  
  // Récupérer tous les projets
  ipcMain.handle('projects:getAll', async () => {
    try {
      const allProjects = await db.select().from(projects);
      return { success: true, data: allProjects };
    } catch (error) {
      console.error('Error fetching projects:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Récupérer un projet par ID
  ipcMain.handle('projects:getById', async (_event, { id }: { id: string }) => {
    try {
      const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
      return { success: true, data: project[0] || null };
    } catch (error) {
      console.error('Error fetching project:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Créer un projet
  ipcMain.handle('projects:create', async (_event, { data }: { data: Omit<ProjectInsert, 'id'> }) => {
    try {
      const newProject: ProjectInsert = {
        id: nanoid(),
        ...data,
      };
      
      await db.insert(projects).values(newProject);
      
      return { success: true, data: newProject };
    } catch (error) {
      console.error('Error creating project:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Mettre à jour un projet
  ipcMain.handle('projects:update', async (_event, { id, data }: { id: string, data: Partial<ProjectInsert> }) => {
    try {
      const updatedData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      
      await db.update(projects).set(updatedData).where(eq(projects.id, id));
      
      const updated = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
      
      return { success: true, data: updated[0] };
    } catch (error) {
      console.error('Error updating project:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Supprimer un projet
  ipcMain.handle('projects:delete', async (_event, { id }: { id: string }) => {
    try {
      await db.delete(projects).where(eq(projects.id, id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting project:', error);
      return { success: false, error: (error as Error).message };
    }
  });
}
```

### 2. Tasks Handler

```typescript
// src/ipc/tasks.ts
import { ipcMain } from 'electron';
import { db } from '../database/db';
import { tasks, Task, TaskInsert } from '../database/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export function setupTasksHandlers() {
  
  // Récupérer toutes les tâches (avec filtre optionnel par projet)
  ipcMain.handle('tasks:getAll', async (_event, { projectId }: { projectId?: string } = {}) => {
    try {
      let query = db.select().from(tasks);
      
      if (projectId) {
        query = query.where(eq(tasks.projectId, projectId));
      }
      
      const allTasks = await query;
      return { success: true, data: allTasks };
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Créer une tâche
  ipcMain.handle('tasks:create', async (_event, { data }: { data: Omit<TaskInsert, 'id'> }) => {
    try {
      const newTask: TaskInsert = {
        id: nanoid(),
        ...data,
      };
      
      await db.insert(tasks).values(newTask);
      
      return { success: true, data: newTask };
    } catch (error) {
      console.error('Error creating task:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Mettre à jour une tâche
  ipcMain.handle('tasks:update', async (_event, { id, data }: { id: string, data: Partial<TaskInsert> }) => {
    try {
      const updatedData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      
      await db.update(tasks).set(updatedData).where(eq(tasks.id, id));
      
      const updated = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
      
      return { success: true, data: updated[0] };
    } catch (error) {
      console.error('Error updating task:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Mettre à jour le statut d'une tâche
  ipcMain.handle('tasks:updateStatus', async (_event, { id, status }: { id: string, status: string }) => {
    try {
      await db.update(tasks).set({ 
        status: status as any,
        updatedAt: new Date().toISOString() 
      }).where(eq(tasks.id, id));
      
      const updated = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
      
      return { success: true, data: updated[0] };
    } catch (error) {
      console.error('Error updating task status:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Supprimer une tâche
  ipcMain.handle('tasks:delete', async (_event, { id }: { id: string }) => {
    try {
      await db.delete(tasks).where(eq(tasks.id, id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting task:', error);
      return { success: false, error: (error as Error).message };
    }
  });
}
```

### 3. Index IPC

```typescript
// src/ipc/index.ts
import { setupProjectsHandlers } from './projects';
import { setupTasksHandlers } from './tasks';

export function setupIpcHandlers() {
  setupProjectsHandlers();
  setupTasksHandlers();
  // setupMilestonesHandlers();
  // setupResourcesHandlers();
  // setupExportHandlers();
}
```

---

## Main Process

```typescript
// src/main.ts
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { runMigrations } from './database/db';
import { setupIpcHandlers } from './ipc';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

let mainWindow: BrowserWindow | null = null;

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    backgroundColor: '#FFFFFF',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
    titleBarStyle: 'default',
    frame: true,
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Ouvrir DevTools en développement
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.on('ready', async () => {
  // Initialiser la base de données
  console.log('Initialisation de la base de données...');
  runMigrations();
  
  // Setup IPC handlers
  setupIpcHandlers();
  
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
```

---

## Preload Script

```typescript
// src/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

// API exposée au renderer
const api = {
  // Projects
  projects: {
    getAll: () => ipcRenderer.invoke('projects:getAll'),
    getById: (id: string) => ipcRenderer.invoke('projects:getById', { id }),
    create: (data: any) => ipcRenderer.invoke('projects:create', { data }),
    update: (id: string, data: any) => ipcRenderer.invoke('projects:update', { id, data }),
    delete: (id: string) => ipcRenderer.invoke('projects:delete', { id }),
  },
  
  // Tasks
  tasks: {
    getAll: (projectId?: string) => ipcRenderer.invoke('tasks:getAll', { projectId }),
    getById: (id: string) => ipcRenderer.invoke('tasks:getById', { id }),
    create: (data: any) => ipcRenderer.invoke('tasks:create', { data }),
    update: (id: string, data: any) => ipcRenderer.invoke('tasks:update', { id, data }),
    updateStatus: (id: string, status: string) => ipcRenderer.invoke('tasks:updateStatus', { id, status }),
    delete: (id: string) => ipcRenderer.invoke('tasks:delete', { id }),
  },
};

contextBridge.exposeInMainWorld('api', api);

// Types pour TypeScript
export type ElectronAPI = typeof api;
```

---

## Types Frontend

```typescript
// src/renderer/types/window.d.ts
import { ElectronAPI } from '../../preload';

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
```

---

## Stores Zustand

### Project Store

```typescript
// src/renderer/stores/projectStore.ts
import { create } from 'zustand';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate?: string;
  endDate?: string;
  progress: number;
  color: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;

  fetchProjects: () => Promise<void>;
  fetchProjectById: (id: string) => Promise<void>;
  createProject: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await window.api.projects.getAll();
      if (result.success) {
        set({ projects: result.data, isLoading: false });
      } else {
        set({ error: result.error, isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchProjectById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await window.api.projects.getById(id);
      if (result.success) {
        set({ currentProject: result.data, isLoading: false });
      } else {
        set({ error: result.error, isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createProject: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const result = await window.api.projects.create(data);
      if (result.success) {
        set((state) => ({
          projects: [...state.projects, result.data],
          isLoading: false,
        }));
      } else {
        set({ error: result.error, isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateProject: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const result = await window.api.projects.update(id, data);
      if (result.success) {
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? result.data : p)),
          currentProject: state.currentProject?.id === id ? result.data : state.currentProject,
          isLoading: false,
        }));
      } else {
        set({ error: result.error, isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteProject: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const result = await window.api.projects.delete(id);
      if (result.success) {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProject: state.currentProject?.id === id ? null : state.currentProject,
          isLoading: false,
        }));
      } else {
        set({ error: result.error, isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  setCurrentProject: (project) => {
    set({ currentProject: project });
  },
}));
```

---

## Composants UI de Base

### Button Component

```typescript
// src/renderer/components/ui/Button.tsx
import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-blue-600',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-gray-200',
    ghost: 'hover:bg-secondary text-foreground',
    danger: 'bg-error text-white hover:bg-red-600',
  };
  
  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4',
    lg: 'h-12 px-6 text-lg',
  };
  
  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
};
```

### Input Component

```typescript
// src/renderer/components/ui/Input.tsx
import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className,
  ...props
}) => {
  return (
    <div className="flex flex-col space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          'placeholder:text-gray-400',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-error focus:ring-error',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-error">{error}</p>
      )}
    </div>
  );
};
```

---

## Script de Démarrage Rapide

```json
// package.json (extraits pertinents)
{
  "name": "gestion-projet",
  "version": "1.0.0",
  "main": ".webpack/main",
  "scripts": {
    "start": "electron-forge start",
    "package": "electron-forge package",
    "make": "electron-forge make",
    "lint": "eslint --ext .ts,.tsx .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "better-sqlite3": "^11.0.0",
    "drizzle-orm": "^0.33.0",
    "zustand": "^4.5.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "lucide-react": "^0.344.0",
    "date-fns": "^3.0.0",
    "recharts": "^2.12.0",
    "jspdf": "^2.5.1",
    "html2canvas": "^1.4.1",
    "xlsx": "^0.18.5",
    "nanoid": "^5.0.0"
  },
  "devDependencies": {
    "@electron-forge/cli": "^7.4.0",
    "@electron-forge/maker-squirrel": "^7.4.0",
    "@electron-forge/maker-zip": "^7.4.0",
    "@electron-forge/plugin-webpack": "^7.4.0",
    "@types/better-sqlite3": "^7.6.9",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "autoprefixer": "^10.4.18",
    "drizzle-kit": "^0.24.0",
    "electron": "^30.0.0",
    "eslint": "^8.57.0",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.4.0"
  }
}
```

---

## Prochaines Étapes

1. **Initialiser le projet**: Exécuter les commandes d'installation
2. **Configuration**: Mettre en place Tailwind, TypeScript configs
3. **Base de données**: Tester la connexion SQLite et les migrations
4. **Premier composant**: Créer la liste de projets
5. **Test**: Créer, lire, modifier un projet

Une fois ce squelette en place, on pourra itérer rapidement sur les fonctionnalités!

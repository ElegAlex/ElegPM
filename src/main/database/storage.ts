import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { app } from 'electron';

interface AppData {
  projects: any[];
  tasks: any[];
  resources: any[];
  milestones: any[];
  attachments: any[];
  comments: any[];
  taskAssignments: any[];
}

let dataPath: string;
let cachedData: AppData | null = null;

export function initStorage() {
  dataPath = join(app.getPath('userData'), 'data.json');

  // Créer le dossier si nécessaire
  const dir = dirname(dataPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Créer le fichier si nécessaire
  if (!existsSync(dataPath)) {
    const initialData: AppData = {
      projects: [],
      tasks: [],
      resources: [],
      milestones: [],
      attachments: [],
      comments: [],
      taskAssignments: []
    };
    writeFileSync(dataPath, JSON.stringify(initialData, null, 2));
  }

  // Charger en cache
  cachedData = JSON.parse(readFileSync(dataPath, 'utf-8'));
}

export function loadData(): AppData {
  if (!cachedData) {
    throw new Error('Storage not initialized');
  }
  return cachedData;
}

export function saveData(data: AppData) {
  cachedData = data;
  writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

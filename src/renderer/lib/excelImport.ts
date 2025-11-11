import * as XLSX from 'xlsx';
import { parse, isValid } from 'date-fns';
import type { ProjectInput, ProjectStatus, Priority } from '../types/project';
import type { TaskInput, TaskStatus } from '../types/task';
import type { MilestoneInput, MilestoneStatus } from '../types/milestone';
import type { ResourceInput } from '../types/resource';

/**
 * Résultat d'import avec succès et erreurs
 */
export interface ImportResult<T> {
  success: T[];
  errors: ImportError[];
  totalRows: number;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

/**
 * Conversion des labels français vers les valeurs
 */
const STATUS_VALUES = {
  project: {
    'Non démarré': 'not_started',
    'En cours': 'in_progress',
    'En pause': 'on_hold',
    'Terminé': 'completed',
    'Archivé': 'archived',
  } as Record<string, ProjectStatus>,
  task: {
    'À faire': 'todo',
    'En cours': 'in_progress',
    'En révision': 'review',
    'Terminé': 'done',
    'Bloqué': 'blocked',
  } as Record<string, TaskStatus>,
  milestone: {
    'En attente': 'pending',
    'Atteint': 'achieved',
    'Manqué': 'missed',
  } as Record<string, MilestoneStatus>,
};

const PRIORITY_VALUES = {
  'Basse': 'low',
  'Moyenne': 'medium',
  'Haute': 'high',
  'Urgente': 'urgent',
} as Record<string, Priority>;

/**
 * Parse une date depuis différents formats
 */
const parseDate = (value: any): string | undefined => {
  if (!value) return undefined;

  // Si c'est déjà une string ISO
  if (typeof value === 'string') {
    // Essayer format dd/MM/yyyy
    const parsed = parse(value, 'dd/MM/yyyy', new Date());
    if (isValid(parsed)) {
      return parsed.toISOString();
    }

    // Essayer format ISO
    const isoDate = new Date(value);
    if (isValid(isoDate)) {
      return isoDate.toISOString();
    }
  }

  // Si c'est un nombre Excel (nombre de jours depuis 1900)
  if (typeof value === 'number') {
    const excelEpoch = new Date(1900, 0, 1);
    const date = new Date(excelEpoch.getTime() + (value - 2) * 24 * 60 * 60 * 1000);
    if (isValid(date)) {
      return date.toISOString();
    }
  }

  return undefined;
};

/**
 * Parse un tableau de tags
 */
const parseTags = (value: any): string[] | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') {
    return value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  }
  return undefined;
};

/**
 * Valide et convertit un statut de projet
 */
const validateProjectStatus = (value: any): ProjectStatus | undefined => {
  if (!value) return 'not_started';

  // Si c'est déjà une valeur valide
  const validStatuses: ProjectStatus[] = ['not_started', 'in_progress', 'on_hold', 'completed', 'archived'];
  if (validStatuses.includes(value as ProjectStatus)) {
    return value as ProjectStatus;
  }

  // Essayer de convertir depuis label français
  const converted = STATUS_VALUES.project[value];
  return converted || 'not_started';
};

/**
 * Valide et convertit un statut de tâche
 */
const validateTaskStatus = (value: any): TaskStatus | undefined => {
  if (!value) return 'todo';

  const validStatuses: TaskStatus[] = ['todo', 'in_progress', 'review', 'done', 'blocked'];
  if (validStatuses.includes(value as TaskStatus)) {
    return value as TaskStatus;
  }

  const converted = STATUS_VALUES.task[value];
  return converted || 'todo';
};

/**
 * Valide et convertit un statut de jalon
 */
const validateMilestoneStatus = (value: any): MilestoneStatus | undefined => {
  if (!value) return 'pending';

  const validStatuses: MilestoneStatus[] = ['pending', 'achieved', 'missed'];
  if (validStatuses.includes(value as MilestoneStatus)) {
    return value as MilestoneStatus;
  }

  const converted = STATUS_VALUES.milestone[value];
  return converted || 'pending';
};

/**
 * Valide et convertit une priorité
 */
const validatePriority = (value: any): Priority | undefined => {
  if (!value) return 'medium';

  const validPriorities: Priority[] = ['low', 'medium', 'high', 'urgent'];
  if (validPriorities.includes(value as Priority)) {
    return value as Priority;
  }

  const converted = PRIORITY_VALUES[value];
  return converted || 'medium';
};

/**
 * Importe des projets depuis un fichier Excel
 */
export const importProjectsFromExcel = async (file: File): Promise<ImportResult<ProjectInput>> => {
  const errors: ImportError[] = [];
  const success: ProjectInput[] = [];

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    // Chercher la feuille "Projets" ou prendre la première
    const sheetName = workbook.SheetNames.find(name => name.toLowerCase() === 'projets') || workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('Aucune feuille trouvée dans le fichier Excel');
    }

    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    data.forEach((row: any, index: number) => {
      const rowNumber = index + 2; // +2 car index commence à 0 et la ligne 1 est l'en-tête

      // Validation du nom (requis)
      if (!row['Nom'] || typeof row['Nom'] !== 'string' || row['Nom'].trim().length === 0) {
        errors.push({
          row: rowNumber,
          field: 'Nom',
          message: 'Le nom est requis',
          value: row['Nom'],
        });
        return;
      }

      const project: ProjectInput = {
        name: row['Nom'].trim(),
        description: row['Description']?.trim() || undefined,
        status: validateProjectStatus(row['Statut']),
        priority: validatePriority(row['Priorité']),
        startDate: parseDate(row['Date début']),
        endDate: parseDate(row['Date fin']),
        color: row['Couleur']?.trim() || undefined,
      };

      // Validation de la couleur (format hex)
      if (project.color && !/^#[0-9A-F]{6}$/i.test(project.color)) {
        errors.push({
          row: rowNumber,
          field: 'Couleur',
          message: 'Format de couleur invalide (attendu: #RRGGBB)',
          value: project.color,
        });
        project.color = undefined;
      }

      success.push(project);
    });

    return {
      success,
      errors,
      totalRows: data.length,
    };
  } catch (error) {
    throw new Error(`Erreur lors de la lecture du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

/**
 * Importe des tâches depuis un fichier Excel
 */
export const importTasksFromExcel = async (
  file: File,
  projectIdMap: Map<string, string> // Map nom projet -> ID projet
): Promise<ImportResult<TaskInput>> => {
  const errors: ImportError[] = [];
  const success: TaskInput[] = [];

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    const sheetName = workbook.SheetNames.find(name => name.toLowerCase() === 'tâches' || name.toLowerCase() === 'taches') || workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('Aucune feuille trouvée dans le fichier Excel');
    }

    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    data.forEach((row: any, index: number) => {
      const rowNumber = index + 2;

      // Validation projet (requis)
      let projectId: string | undefined;
      if (row['Projet']) {
        projectId = projectIdMap.get(row['Projet'].trim());
        if (!projectId) {
          errors.push({
            row: rowNumber,
            field: 'Projet',
            message: `Projet "${row['Projet']}" introuvable`,
            value: row['Projet'],
          });
          return;
        }
      } else {
        errors.push({
          row: rowNumber,
          field: 'Projet',
          message: 'Le projet est requis',
          value: row['Projet'],
        });
        return;
      }

      // Validation titre (requis)
      if (!row['Titre'] || typeof row['Titre'] !== 'string' || row['Titre'].trim().length === 0) {
        errors.push({
          row: rowNumber,
          field: 'Titre',
          message: 'Le titre est requis',
          value: row['Titre'],
        });
        return;
      }

      const task: TaskInput = {
        projectId,
        title: row['Titre'].trim(),
        description: row['Description']?.trim() || undefined,
        status: validateTaskStatus(row['Statut']),
        priority: validatePriority(row['Priorité']),
        assignee: row['Assigné à']?.trim() || undefined,
        estimatedHours: row['Heures estimées'] ? Number(row['Heures estimées']) : undefined,
        actualHours: row['Heures réelles'] ? Number(row['Heures réelles']) : undefined,
        startDate: parseDate(row['Date début']),
        endDate: parseDate(row['Date fin']),
        tags: parseTags(row['Tags']),
      };

      // Validation des heures
      if (task.estimatedHours !== undefined && (isNaN(task.estimatedHours) || task.estimatedHours < 0)) {
        errors.push({
          row: rowNumber,
          field: 'Heures estimées',
          message: 'Valeur invalide pour les heures estimées',
          value: row['Heures estimées'],
        });
        task.estimatedHours = undefined;
      }

      if (task.actualHours !== undefined && (isNaN(task.actualHours) || task.actualHours < 0)) {
        errors.push({
          row: rowNumber,
          field: 'Heures réelles',
          message: 'Valeur invalide pour les heures réelles',
          value: row['Heures réelles'],
        });
        task.actualHours = undefined;
      }

      success.push(task);
    });

    return {
      success,
      errors,
      totalRows: data.length,
    };
  } catch (error) {
    throw new Error(`Erreur lors de la lecture du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

/**
 * Importe des jalons depuis un fichier Excel
 */
export const importMilestonesFromExcel = async (
  file: File,
  projectIdMap: Map<string, string>
): Promise<ImportResult<MilestoneInput>> => {
  const errors: ImportError[] = [];
  const success: MilestoneInput[] = [];

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    const sheetName = workbook.SheetNames.find(name => name.toLowerCase() === 'jalons') || workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('Aucune feuille trouvée dans le fichier Excel');
    }

    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    data.forEach((row: any, index: number) => {
      const rowNumber = index + 2;

      // Validation projet (requis)
      let projectId: string | undefined;
      if (row['Projet']) {
        projectId = projectIdMap.get(row['Projet'].trim());
        if (!projectId) {
          errors.push({
            row: rowNumber,
            field: 'Projet',
            message: `Projet "${row['Projet']}" introuvable`,
            value: row['Projet'],
          });
          return;
        }
      } else {
        errors.push({
          row: rowNumber,
          field: 'Projet',
          message: 'Le projet est requis',
          value: row['Projet'],
        });
        return;
      }

      // Validation nom (requis)
      if (!row['Nom'] || typeof row['Nom'] !== 'string' || row['Nom'].trim().length === 0) {
        errors.push({
          row: rowNumber,
          field: 'Nom',
          message: 'Le nom est requis',
          value: row['Nom'],
        });
        return;
      }

      // Validation date cible (requise)
      const targetDate = parseDate(row['Date cible']);
      if (!targetDate) {
        errors.push({
          row: rowNumber,
          field: 'Date cible',
          message: 'La date cible est requise',
          value: row['Date cible'],
        });
        return;
      }

      const milestone: MilestoneInput = {
        projectId,
        name: row['Nom'].trim(),
        description: row['Description']?.trim() || undefined,
        targetDate,
        status: validateMilestoneStatus(row['Statut']),
        color: row['Couleur']?.trim() || undefined,
      };

      // Validation de la couleur
      if (milestone.color && !/^#[0-9A-F]{6}$/i.test(milestone.color)) {
        errors.push({
          row: rowNumber,
          field: 'Couleur',
          message: 'Format de couleur invalide (attendu: #RRGGBB)',
          value: milestone.color,
        });
        milestone.color = undefined;
      }

      success.push(milestone);
    });

    return {
      success,
      errors,
      totalRows: data.length,
    };
  } catch (error) {
    throw new Error(`Erreur lors de la lecture du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

/**
 * Importe des ressources depuis un fichier Excel
 */
export const importResourcesFromExcel = async (file: File): Promise<ImportResult<ResourceInput>> => {
  const errors: ImportError[] = [];
  const success: ResourceInput[] = [];

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    const sheetName = workbook.SheetNames.find(name => name.toLowerCase() === 'ressources') || workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('Aucune feuille trouvée dans le fichier Excel');
    }

    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    data.forEach((row: any, index: number) => {
      const rowNumber = index + 2;

      // Validation nom (requis)
      if (!row['Nom'] || typeof row['Nom'] !== 'string' || row['Nom'].trim().length === 0) {
        errors.push({
          row: rowNumber,
          field: 'Nom',
          message: 'Le nom est requis',
          value: row['Nom'],
        });
        return;
      }

      const resource: ResourceInput = {
        name: row['Nom'].trim(),
        role: row['Rôle']?.trim() || undefined,
        email: row['Email']?.trim() || undefined,
        department: row['Département']?.trim() || undefined,
        availability: row['Disponibilité (%)'] !== undefined ? Number(row['Disponibilité (%)']) : undefined,
      };

      // Validation email
      if (resource.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resource.email)) {
        errors.push({
          row: rowNumber,
          field: 'Email',
          message: 'Format d\'email invalide',
          value: resource.email,
        });
        resource.email = undefined;
      }

      // Validation disponibilité
      if (resource.availability !== undefined) {
        if (isNaN(resource.availability) || resource.availability < 0 || resource.availability > 100) {
          errors.push({
            row: rowNumber,
            field: 'Disponibilité (%)',
            message: 'La disponibilité doit être entre 0 et 100',
            value: row['Disponibilité (%)'],
          });
          resource.availability = undefined;
        }
      }

      success.push(resource);
    });

    return {
      success,
      errors,
      totalRows: data.length,
    };
  } catch (error) {
    throw new Error(`Erreur lors de la lecture du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

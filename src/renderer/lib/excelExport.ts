import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Project } from '../types/project';
import type { Task } from '../types/task';
import type { Milestone } from '../types/milestone';
import type { Resource } from '../types/resource';

/**
 * Formate une date pour l'affichage dans Excel
 */
const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  try {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr });
  } catch {
    return dateString;
  }
};

/**
 * Formate un tableau de tags pour Excel
 */
const formatTags = (tags?: string[]): string => {
  if (!tags || tags.length === 0) return '';
  return tags.join(', ');
};

/**
 * Labels français pour les statuts
 */
const STATUS_LABELS = {
  project: {
    not_started: 'Non démarré',
    in_progress: 'En cours',
    on_hold: 'En pause',
    completed: 'Terminé',
    archived: 'Archivé',
  },
  task: {
    todo: 'À faire',
    in_progress: 'En cours',
    review: 'En révision',
    done: 'Terminé',
    blocked: 'Bloqué',
  },
  milestone: {
    pending: 'En attente',
    achieved: 'Atteint',
    missed: 'Manqué',
  },
};

const PRIORITY_LABELS = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  urgent: 'Urgente',
};

/**
 * Exporte les projets vers Excel
 */
export const exportProjectsToExcel = async (projects: Project[]): Promise<void> => {
  const data = projects.map(project => ({
    'ID': project.id,
    'Nom': project.name,
    'Description': project.description || '',
    'Statut': STATUS_LABELS.project[project.status],
    'Priorité': PRIORITY_LABELS[project.priority],
    'Date début': formatDate(project.startDate),
    'Date fin': formatDate(project.endDate),
    'Progression (%)': project.progress,
    'Couleur': project.color,
    'Créé le': formatDate(project.createdAt),
    'Modifié le': formatDate(project.updatedAt),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Ajuster la largeur des colonnes
  const columnWidths = [
    { wch: 25 }, // ID
    { wch: 30 }, // Nom
    { wch: 50 }, // Description
    { wch: 15 }, // Statut
    { wch: 12 }, // Priorité
    { wch: 12 }, // Date début
    { wch: 12 }, // Date fin
    { wch: 15 }, // Progression
    { wch: 10 }, // Couleur
    { wch: 12 }, // Créé le
    { wch: 12 }, // Modifié le
  ];
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Projets');

  // Générer le fichier
  const fileName = `projets_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

/**
 * Exporte les tâches vers Excel
 */
export const exportTasksToExcel = async (tasks: Task[], projects: Project[]): Promise<void> => {
  // Créer un map pour accès rapide aux noms de projets
  const projectMap = new Map(projects.map(p => [p.id, p.name]));

  const data = tasks.map(task => ({
    'ID': task.id,
    'Projet': projectMap.get(task.projectId) || task.projectId,
    'Titre': task.title,
    'Description': task.description || '',
    'Statut': STATUS_LABELS.task[task.status],
    'Priorité': PRIORITY_LABELS[task.priority],
    'Assigné à': task.assignee || '',
    'Heures estimées': task.estimatedHours || '',
    'Heures réelles': task.actualHours || '',
    'Date début': formatDate(task.startDate),
    'Date fin': formatDate(task.endDate),
    'Tâche parente': task.parentTaskId || '',
    'Tags': formatTags(task.tags),
    'Créé le': formatDate(task.createdAt),
    'Modifié le': formatDate(task.updatedAt),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Ajuster la largeur des colonnes
  const columnWidths = [
    { wch: 25 }, // ID
    { wch: 25 }, // Projet
    { wch: 30 }, // Titre
    { wch: 50 }, // Description
    { wch: 15 }, // Statut
    { wch: 12 }, // Priorité
    { wch: 20 }, // Assigné à
    { wch: 15 }, // Heures estimées
    { wch: 15 }, // Heures réelles
    { wch: 12 }, // Date début
    { wch: 12 }, // Date fin
    { wch: 25 }, // Tâche parente
    { wch: 30 }, // Tags
    { wch: 12 }, // Créé le
    { wch: 12 }, // Modifié le
  ];
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tâches');

  // Générer le fichier
  const fileName = `taches_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

/**
 * Exporte les jalons vers Excel
 */
export const exportMilestonesToExcel = async (milestones: Milestone[], projects: Project[]): Promise<void> => {
  const projectMap = new Map(projects.map(p => [p.id, p.name]));

  const data = milestones.map(milestone => ({
    'ID': milestone.id,
    'Projet': projectMap.get(milestone.projectId) || milestone.projectId,
    'Nom': milestone.name,
    'Description': milestone.description || '',
    'Date cible': formatDate(milestone.targetDate),
    'Statut': STATUS_LABELS.milestone[milestone.status],
    'Couleur': milestone.color,
    'Créé le': formatDate(milestone.createdAt),
    'Modifié le': formatDate(milestone.updatedAt),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Ajuster la largeur des colonnes
  const columnWidths = [
    { wch: 25 }, // ID
    { wch: 25 }, // Projet
    { wch: 30 }, // Nom
    { wch: 50 }, // Description
    { wch: 12 }, // Date cible
    { wch: 15 }, // Statut
    { wch: 10 }, // Couleur
    { wch: 12 }, // Créé le
    { wch: 12 }, // Modifié le
  ];
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Jalons');

  // Générer le fichier
  const fileName = `jalons_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

/**
 * Exporte les ressources vers Excel
 */
export const exportResourcesToExcel = async (resources: Resource[]): Promise<void> => {
  const data = resources.map(resource => ({
    'ID': resource.id,
    'Nom': resource.name,
    'Rôle': resource.role || '',
    'Email': resource.email || '',
    'Département': resource.department || '',
    'Disponibilité (%)': resource.availability,
    'Créé le': formatDate(resource.createdAt),
    'Modifié le': formatDate(resource.updatedAt),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Ajuster la largeur des colonnes
  const columnWidths = [
    { wch: 25 }, // ID
    { wch: 25 }, // Nom
    { wch: 20 }, // Rôle
    { wch: 30 }, // Email
    { wch: 20 }, // Département
    { wch: 18 }, // Disponibilité
    { wch: 12 }, // Créé le
    { wch: 12 }, // Modifié le
  ];
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ressources');

  // Générer le fichier
  const fileName = `ressources_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

/**
 * Exporte toutes les données vers un seul fichier Excel avec plusieurs feuilles
 */
export const exportAllDataToExcel = async (
  projects: Project[],
  tasks: Task[],
  milestones: Milestone[],
  resources: Resource[]
): Promise<void> => {
  const projectMap = new Map(projects.map(p => [p.id, p.name]));

  // Feuille Projets
  const projectsData = projects.map(project => ({
    'ID': project.id,
    'Nom': project.name,
    'Description': project.description || '',
    'Statut': STATUS_LABELS.project[project.status],
    'Priorité': PRIORITY_LABELS[project.priority],
    'Date début': formatDate(project.startDate),
    'Date fin': formatDate(project.endDate),
    'Progression (%)': project.progress,
    'Couleur': project.color,
    'Créé le': formatDate(project.createdAt),
    'Modifié le': formatDate(project.updatedAt),
  }));
  const projectsSheet = XLSX.utils.json_to_sheet(projectsData);
  projectsSheet['!cols'] = [
    { wch: 25 }, { wch: 30 }, { wch: 50 }, { wch: 15 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 12 }
  ];

  // Feuille Tâches
  const tasksData = tasks.map(task => ({
    'ID': task.id,
    'Projet': projectMap.get(task.projectId) || task.projectId,
    'Titre': task.title,
    'Description': task.description || '',
    'Statut': STATUS_LABELS.task[task.status],
    'Priorité': PRIORITY_LABELS[task.priority],
    'Assigné à': task.assignee || '',
    'Heures estimées': task.estimatedHours || '',
    'Heures réelles': task.actualHours || '',
    'Date début': formatDate(task.startDate),
    'Date fin': formatDate(task.endDate),
    'Tâche parente': task.parentTaskId || '',
    'Tags': formatTags(task.tags),
    'Créé le': formatDate(task.createdAt),
    'Modifié le': formatDate(task.updatedAt),
  }));
  const tasksSheet = XLSX.utils.json_to_sheet(tasksData);
  tasksSheet['!cols'] = [
    { wch: 25 }, { wch: 25 }, { wch: 30 }, { wch: 50 }, { wch: 15 },
    { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
    { wch: 12 }, { wch: 25 }, { wch: 30 }, { wch: 12 }, { wch: 12 }
  ];

  // Feuille Jalons
  const milestonesData = milestones.map(milestone => ({
    'ID': milestone.id,
    'Projet': projectMap.get(milestone.projectId) || milestone.projectId,
    'Nom': milestone.name,
    'Description': milestone.description || '',
    'Date cible': formatDate(milestone.targetDate),
    'Statut': STATUS_LABELS.milestone[milestone.status],
    'Couleur': milestone.color,
    'Créé le': formatDate(milestone.createdAt),
    'Modifié le': formatDate(milestone.updatedAt),
  }));
  const milestonesSheet = XLSX.utils.json_to_sheet(milestonesData);
  milestonesSheet['!cols'] = [
    { wch: 25 }, { wch: 25 }, { wch: 30 }, { wch: 50 }, { wch: 12 },
    { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 12 }
  ];

  // Feuille Ressources
  const resourcesData = resources.map(resource => ({
    'ID': resource.id,
    'Nom': resource.name,
    'Rôle': resource.role || '',
    'Email': resource.email || '',
    'Département': resource.department || '',
    'Disponibilité (%)': resource.availability,
    'Créé le': formatDate(resource.createdAt),
    'Modifié le': formatDate(resource.updatedAt),
  }));
  const resourcesSheet = XLSX.utils.json_to_sheet(resourcesData);
  resourcesSheet['!cols'] = [
    { wch: 25 }, { wch: 25 }, { wch: 20 }, { wch: 30 }, { wch: 20 },
    { wch: 18 }, { wch: 12 }, { wch: 12 }
  ];

  // Créer le classeur
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, projectsSheet, 'Projets');
  XLSX.utils.book_append_sheet(workbook, tasksSheet, 'Tâches');
  XLSX.utils.book_append_sheet(workbook, milestonesSheet, 'Jalons');
  XLSX.utils.book_append_sheet(workbook, resourcesSheet, 'Ressources');

  // Générer le fichier
  const fileName = `export_complet_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

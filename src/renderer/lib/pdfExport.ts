import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Project } from '../types/project';
import type { Task } from '../types/task';
import type { Milestone } from '../types/milestone';
import type { Resource } from '../types/resource';

/**
 * Exporte un élément DOM en PDF via le main process
 */
export const exportElementToPDF = async (
  element: HTMLElement,
  filename: string,
  options?: {
    orientation?: 'portrait' | 'landscape';
    title?: string;
    type?: 'dashboard' | 'gantt' | 'project-report';
  }
): Promise<void> => {
  try {
    // Capturer l'élément en canvas avec html2canvas (dans le renderer)
    const canvas = await html2canvas(element, {
      scale: 2, // Meilleure qualité
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
    });

    // Convertir le canvas en base64
    const imageData = canvas.toDataURL('image/png');

    // Envoyer au main process pour génération PDF
    const result = await window.api.pdf.generateFromImage({
      type: options?.type || 'dashboard',
      filename,
      title: options?.title,
      orientation: options?.orientation || 'portrait',
      imageData,
    });

    if (result.success) {
      console.log('PDF généré avec succès:', result.path);
    } else if (result.canceled) {
      console.log('Export PDF annulé');
    } else {
      throw new Error(result.error || 'Erreur lors de la génération PDF');
    }
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error);
    throw new Error(`Impossible d'exporter en PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

/**
 * Exporte le dashboard en PDF
 */
export const exportDashboardToPDF = async (dashboardElement: HTMLElement): Promise<void> => {
  const filename = `dashboard_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.pdf`;
  await exportElementToPDF(dashboardElement, filename, {
    orientation: 'portrait',
    title: 'Tableau de Bord - Gestion de Projet',
    type: 'dashboard',
  });
};

/**
 * Exporte le Gantt en PDF
 */
export const exportGanttToPDF = async (ganttElement: HTMLElement): Promise<void> => {
  const filename = `gantt_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.pdf`;
  await exportElementToPDF(ganttElement, filename, {
    orientation: 'landscape',
    title: 'Diagramme de Gantt',
    type: 'gantt',
  });
};

/**
 * Génère un rapport PDF complet du projet via le main process
 */
export const generateProjectReportPDF = async (
  project: Project,
  tasks: Task[],
  milestones: Milestone[],
  resources: Resource[]
): Promise<void> => {
  try {
    const result = await window.api.pdf.generateProjectReport({
      project,
      tasks,
      milestones,
      resources,
    });

    if (result.success) {
      console.log('Rapport PDF généré avec succès:', result.path);
    } else if (result.canceled) {
      console.log('Export PDF annulé');
    } else {
      throw new Error(result.error || 'Erreur lors de la génération PDF');
    }
  } catch (error) {
    console.error('Erreur lors de la génération du rapport PDF:', error);
    throw new Error(`Impossible de générer le rapport PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

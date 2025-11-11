import { ipcMain, dialog } from 'electron';
import jsPDF from 'jspdf';
import { writeFileSync } from 'fs';

/**
 * Types pour les données de génération PDF
 */
interface GeneratePDFData {
  type: 'dashboard' | 'gantt' | 'project-report';
  filename: string;
  title?: string;
  orientation?: 'portrait' | 'landscape';
  imageData?: string; // base64 image data from html2canvas
  reportData?: any; // Pour les rapports de projet
}

interface PDFResult {
  success: boolean;
  path?: string;
  error?: string;
  canceled?: boolean;
}

/**
 * Configure les handlers IPC pour la génération PDF
 */
export function setupPdfHandler() {
  /**
   * Génère un PDF à partir d'une image (capture d'écran HTML)
   */
  ipcMain.handle('generate-pdf-from-image', async (_event, data: GeneratePDFData): Promise<PDFResult> => {
    try {
      if (!data.imageData) {
        return { success: false, error: 'Aucune image fournie' };
      }

      // Ouvrir le dialogue de sauvegarde
      const { filePath, canceled } = await dialog.showSaveDialog({
        title: 'Sauvegarder le PDF',
        defaultPath: data.filename,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      });

      if (canceled || !filePath) {
        return { success: false, canceled: true };
      }

      // Créer le PDF
      const orientation = data.orientation || 'portrait';
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
      });

      // Dimensions A4
      const imgWidth = orientation === 'landscape' ? 297 : 210;
      const imgHeight = orientation === 'landscape' ? 210 : 297;

      // Ajouter le titre si fourni
      if (data.title) {
        pdf.setFontSize(16);
        pdf.text(data.title, 10, 15);

        // Date de génération
        pdf.setFontSize(10);
        pdf.setTextColor(128, 128, 128);
        const now = new Date();
        const dateStr = `Généré le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')}`;
        pdf.text(dateStr, 10, 23);
        pdf.setTextColor(0, 0, 0);
      }

      // Calculer les dimensions pour l'image
      const yPosition = data.title ? 30 : 10;
      const availableHeight = imgHeight - yPosition - 10;
      const pdfWidth = imgWidth - 20; // Marges de 10mm de chaque côté

      // Extraire les dimensions de l'image depuis le base64
      // Format: data:image/png;base64,<data>
      const base64Data = data.imageData.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');

      // Lire les dimensions depuis l'en-tête PNG
      // Les bytes 16-23 contiennent la largeur et hauteur pour PNG
      let imgPixelWidth = 1920;  // Valeur par défaut
      let imgPixelHeight = 1080; // Valeur par défaut

      if (buffer[0] === 0x89 && buffer[1] === 0x50) { // PNG signature
        imgPixelWidth = buffer.readUInt32BE(16);
        imgPixelHeight = buffer.readUInt32BE(20);
      }

      const ratio = imgPixelWidth / imgPixelHeight;
      let pdfHeight = pdfWidth / ratio;

      // Si l'image est trop haute, ajuster
      if (pdfHeight > availableHeight) {
        pdfHeight = availableHeight;
        const adjustedWidth = pdfHeight * ratio;
        // Ajouter l'image au PDF (centrée si réduite)
        const xPosition = 10 + (pdfWidth - adjustedWidth) / 2;
        pdf.addImage(data.imageData, 'PNG', xPosition, yPosition, adjustedWidth, pdfHeight);
      } else {
        // Ajouter l'image au PDF
        pdf.addImage(data.imageData, 'PNG', 10, yPosition, pdfWidth, pdfHeight);
      }

      // Sauvegarder le fichier
      const pdfBuffer = pdf.output('arraybuffer');
      writeFileSync(filePath, Buffer.from(pdfBuffer));

      return { success: true, path: filePath };
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  });

  /**
   * Génère un rapport de projet complet en PDF
   */
  ipcMain.handle('generate-project-report-pdf', async (_event, reportData: any): Promise<PDFResult> => {
    try {
      const { project, tasks, milestones, resources } = reportData;

      // Ouvrir le dialogue de sauvegarde
      const sanitizedName = project.name.replace(/[^a-z0-9]/gi, '_');
      const defaultFilename = `rapport_${sanitizedName}_${new Date().toISOString().split('T')[0]}.pdf`;

      const { filePath, canceled } = await dialog.showSaveDialog({
        title: 'Sauvegarder le rapport PDF',
        defaultPath: defaultFilename,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      });

      if (canceled || !filePath) {
        return { success: false, canceled: true };
      }

      // Créer le PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      let yPosition = 20;
      const lineHeight = 7;
      const pageHeight = 297;
      const margin = 20;

      // Helper pour ajouter une nouvelle page si nécessaire
      const checkNewPage = () => {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
      };

      // Titre du rapport
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Rapport de Projet: ${project.name}`, margin, yPosition);
      yPosition += lineHeight * 2;

      // Date de génération
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(128, 128, 128);
      const now = new Date();
      pdf.text(
        `Généré le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')}`,
        margin,
        yPosition
      );
      pdf.setTextColor(0, 0, 0);
      yPosition += lineHeight * 2;

      // Section: Informations du projet
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Informations du Projet', margin, yPosition);
      yPosition += lineHeight;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      const projectInfo = [
        ['Statut:', getStatusLabel(project.status, 'project')],
        ['Priorité:', getPriorityLabel(project.priority)],
        ['Progression:', `${project.progress}%`],
        ['Date de début:', project.startDate ? formatDate(project.startDate) : 'Non définie'],
        ['Date de fin:', project.endDate ? formatDate(project.endDate) : 'Non définie'],
      ];

      projectInfo.forEach(([label, value]) => {
        checkNewPage();
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value, margin + 40, yPosition);
        yPosition += lineHeight;
      });

      if (project.description) {
        yPosition += lineHeight;
        checkNewPage();
        pdf.setFont('helvetica', 'bold');
        pdf.text('Description:', margin, yPosition);
        yPosition += lineHeight;
        pdf.setFont('helvetica', 'normal');

        const descLines = pdf.splitTextToSize(project.description, 170);
        descLines.forEach((line: string) => {
          checkNewPage();
          pdf.text(line, margin, yPosition);
          yPosition += lineHeight;
        });
      }

      yPosition += lineHeight;

      // Section: Statistiques
      checkNewPage();
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Statistiques', margin, yPosition);
      yPosition += lineHeight;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      const taskStats = {
        total: tasks.length,
        todo: tasks.filter((t: any) => t.status === 'todo').length,
        inProgress: tasks.filter((t: any) => t.status === 'in_progress').length,
        review: tasks.filter((t: any) => t.status === 'review').length,
        done: tasks.filter((t: any) => t.status === 'done').length,
        blocked: tasks.filter((t: any) => t.status === 'blocked').length,
      };

      const milestoneStats = {
        total: milestones.length,
        pending: milestones.filter((m: any) => m.status === 'pending').length,
        achieved: milestones.filter((m: any) => m.status === 'achieved').length,
        missed: milestones.filter((m: any) => m.status === 'missed').length,
      };

      const stats = [
        ['Tâches totales:', taskStats.total.toString()],
        ['  - À faire:', taskStats.todo.toString()],
        ['  - En cours:', taskStats.inProgress.toString()],
        ['  - En révision:', taskStats.review.toString()],
        ['  - Terminées:', taskStats.done.toString()],
        ['  - Bloquées:', taskStats.blocked.toString()],
        ['', ''],
        ['Jalons totaux:', milestoneStats.total.toString()],
        ['  - En attente:', milestoneStats.pending.toString()],
        ['  - Atteints:', milestoneStats.achieved.toString()],
        ['  - Manqués:', milestoneStats.missed.toString()],
      ];

      stats.forEach(([label, value]) => {
        if (label === '' && value === '') {
          yPosition += lineHeight / 2;
          return;
        }
        checkNewPage();
        pdf.text(label, margin, yPosition);
        pdf.text(value, margin + 60, yPosition);
        yPosition += lineHeight;
      });

      yPosition += lineHeight;

      // Section: Jalons
      if (milestones.length > 0) {
        checkNewPage();
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Jalons', margin, yPosition);
        yPosition += lineHeight * 1.5;

        const sortedMilestones = [...milestones].sort((a: any, b: any) =>
          new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
        );

        sortedMilestones.forEach((milestone: any) => {
          checkNewPage();
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.text(milestone.name, margin, yPosition);
          yPosition += lineHeight;

          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.text(
            `Date cible: ${formatDate(milestone.targetDate)} - Statut: ${getStatusLabel(milestone.status, 'milestone')}`,
            margin + 5,
            yPosition
          );
          yPosition += lineHeight;

          if (milestone.description) {
            const descLines = pdf.splitTextToSize(milestone.description, 160);
            descLines.forEach((line: string) => {
              checkNewPage();
              pdf.text(line, margin + 5, yPosition);
              yPosition += lineHeight - 1;
            });
          }

          yPosition += lineHeight / 2;
        });
      }

      yPosition += lineHeight;

      // Section: Tâches critiques
      const criticalTasks = tasks.filter(
        (t: any) => t.status === 'blocked' || t.priority === 'urgent' || t.priority === 'high'
      );

      if (criticalTasks.length > 0) {
        checkNewPage();
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Tâches Critiques', margin, yPosition);
        yPosition += lineHeight * 1.5;

        criticalTasks.forEach((task: any) => {
          checkNewPage();
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');

          // Indicateur de statut
          if (task.status === 'blocked') {
            pdf.setTextColor(220, 38, 38); // Rouge
            pdf.text('[BLOQUÉ] ', margin, yPosition);
          } else if (task.priority === 'urgent') {
            pdf.setTextColor(239, 68, 68); // Rouge
            pdf.text('[URGENT] ', margin, yPosition);
          } else {
            pdf.setTextColor(251, 146, 60); // Orange
            pdf.text('[HAUTE] ', margin, yPosition);
          }

          pdf.setTextColor(0, 0, 0);
          pdf.text(task.title, margin + 20, yPosition);
          yPosition += lineHeight;

          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');

          const taskInfo: string[] = [];
          if (task.assignee) taskInfo.push(`Assigné à: ${task.assignee}`);
          if (task.endDate) taskInfo.push(`Échéance: ${formatDate(task.endDate)}`);

          if (taskInfo.length > 0) {
            pdf.text(taskInfo.join(' | '), margin + 5, yPosition);
            yPosition += lineHeight;
          }

          yPosition += lineHeight / 2;
        });
      }

      // Sauvegarder le fichier
      const pdfBuffer = pdf.output('arraybuffer');
      writeFileSync(filePath, Buffer.from(pdfBuffer));

      return { success: true, path: filePath };
    } catch (error) {
      console.error('Erreur génération rapport PDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  });

  console.log('PDF handlers registered');
}

// Helper functions
const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('fr-FR');
  } catch {
    return dateString;
  }
};

const getStatusLabel = (status: string, type: 'project' | 'milestone'): string => {
  const labels: Record<string, Record<string, string>> = {
    project: {
      not_started: 'Non démarré',
      in_progress: 'En cours',
      on_hold: 'En pause',
      completed: 'Terminé',
      archived: 'Archivé',
    },
    milestone: {
      pending: 'En attente',
      achieved: 'Atteint',
      missed: 'Manqué',
    },
  };
  return labels[type]?.[status] || status;
};

const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute',
    urgent: 'Urgente',
  };
  return labels[priority] || priority;
};

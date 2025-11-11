import { ipcMain, dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Handlers IPC pour les dialogues de fichiers et opérations fichiers
 */

/**
 * Ouvre un dialogue pour sélectionner un fichier Excel à importer
 */
ipcMain.handle('files:openExcelDialog', async () => {
  try {
    const result = await dialog.showOpenDialog({
      title: 'Importer un fichier Excel',
      filters: [
        { name: 'Fichiers Excel', extensions: ['xlsx', 'xls'] },
        { name: 'Tous les fichiers', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true };
    }

    const filePath = result.filePaths[0];

    // Lire le fichier et le retourner en tant que buffer
    const fileBuffer = fs.readFileSync(filePath);

    return {
      canceled: false,
      filePath,
      fileName: path.basename(filePath),
      fileBuffer: Array.from(fileBuffer), // Convertir Buffer en Array pour IPC
    };
  } catch (error) {
    console.error('Error opening Excel file dialog:', error);
    throw error;
  }
});

/**
 * Ouvre un dialogue pour sauvegarder un fichier Excel
 */
ipcMain.handle('files:saveExcelDialog', async (_event, defaultName?: string) => {
  try {
    const result = await dialog.showSaveDialog({
      title: 'Exporter vers Excel',
      defaultPath: defaultName || 'export.xlsx',
      filters: [
        { name: 'Fichiers Excel', extensions: ['xlsx'] },
        { name: 'Tous les fichiers', extensions: ['*'] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return { canceled: true };
    }

    return {
      canceled: false,
      filePath: result.filePath,
    };
  } catch (error) {
    console.error('Error saving Excel file dialog:', error);
    throw error;
  }
});

/**
 * Ouvre un dialogue pour sauvegarder un fichier PDF
 */
ipcMain.handle('files:savePDFDialog', async (_event, defaultName?: string) => {
  try {
    const result = await dialog.showSaveDialog({
      title: 'Exporter en PDF',
      defaultPath: defaultName || 'export.pdf',
      filters: [
        { name: 'Fichiers PDF', extensions: ['pdf'] },
        { name: 'Tous les fichiers', extensions: ['*'] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return { canceled: true };
    }

    return {
      canceled: false,
      filePath: result.filePath,
    };
  } catch (error) {
    console.error('Error saving PDF file dialog:', error);
    throw error;
  }
});

/**
 * Sauvegarde un buffer dans un fichier
 */
ipcMain.handle('files:saveBuffer', async (_event, filePath: string, buffer: number[]) => {
  try {
    // Convertir l'array en Buffer
    const fileBuffer = Buffer.from(buffer);
    fs.writeFileSync(filePath, fileBuffer);
    return { success: true };
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
});

/**
 * Lit un fichier et retourne son contenu en tant que buffer
 */
ipcMain.handle('files:readFile', async (_event, filePath: string) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return {
      success: true,
      fileBuffer: Array.from(fileBuffer),
      fileName: path.basename(filePath),
    };
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
});

import React, { useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle, FileText, FileSpreadsheet } from 'lucide-react';
import { importTasksFromExcel, importTasksFromCSV, ImportResult, ImportError } from '../lib/excelImport';
import { useTasksStore } from '../stores/tasksStore';
import { useProjectsStore } from '../stores/projectsStore';
import type { TaskInput } from '../types/task';

interface TasksImportDialogProps {
  projectId: string;
  onClose: () => void;
}

type ImportStep = 'select' | 'importing' | 'results';

export const TasksImportDialog: React.FC<TasksImportDialogProps> = ({ projectId, onClose }) => {
  const { createTask } = useTasksStore();
  const { projects } = useProjectsStore();

  const [step, setStep] = useState<ImportStep>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult<TaskInput> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);

  const project = projects.find(p => p.id === projectId);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'xlsx' || extension === 'xls' || extension === 'csv') {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Format de fichier non supporté. Utilisez .xlsx, .xls ou .csv');
        setSelectedFile(null);
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setStep('importing');
    setError(null);

    try {
      // Créer une map des projets (nom -> id)
      const projectIdMap = new Map<string, string>();
      projects.forEach(p => {
        projectIdMap.set(p.name, p.id);
      });
      // Ajouter aussi le projet courant pour faciliter l'import
      if (project) {
        projectIdMap.set(project.name, project.id);
      }

      // Importer selon le type de fichier
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      let result: ImportResult<TaskInput>;

      if (extension === 'csv') {
        result = await importTasksFromCSV(selectedFile, projectIdMap);
      } else {
        result = await importTasksFromExcel(selectedFile, projectIdMap);
      }

      setImportResult(result);

      // Créer les tâches importées avec succès
      let successCount = 0;
      for (const taskData of result.success) {
        try {
          // Si pas de projectId spécifié, utiliser le projet courant
          if (!taskData.projectId) {
            taskData.projectId = projectId;
          }
          await createTask(taskData);
          successCount++;
        } catch (err) {
          console.error('Erreur lors de la création de la tâche:', err);
        }
      }

      setImportedCount(successCount);
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'import');
      setStep('select');
    }
  };

  const handleClose = () => {
    if (step === 'results' && importedCount > 0) {
      // Rafraîchir la liste des tâches avant de fermer
      window.location.reload();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Importer des tâches</h2>
            {project && (
              <p className="text-sm text-gray-500 mt-1">Projet : {project.name}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'select' && (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Format du fichier</h3>
                <p className="text-sm text-blue-800 mb-3">
                  Le fichier doit contenir les colonnes suivantes :
                </p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li><strong>Projet</strong> : Nom du projet (optionnel, utilisera le projet courant si absent)</li>
                  <li><strong>Titre</strong> ou <strong>Nom</strong> : Nom de la tâche (requis)</li>
                  <li><strong>Description</strong> : Description de la tâche</li>
                  <li><strong>Heures estimées</strong> : Nombre d'heures estimées</li>
                  <li><strong>Date début</strong> ou <strong>Date de début</strong> : Date de début (format dd/MM/yyyy)</li>
                  <li><strong>Date fin</strong> ou <strong>Date de fin</strong> : Date de fin (format dd/MM/yyyy)</li>
                  <li><strong>Statut</strong> : À faire, En cours, En révision, Terminé, Bloqué</li>
                  <li><strong>Priorité</strong> : Basse, Moyenne, Haute, Urgente</li>
                  <li><strong>Assigné à</strong> : Nom de la personne assignée</li>
                  <li><strong>Tags</strong> : Tags séparés par des virgules</li>
                </ul>
              </div>

              {/* File selector */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {selectedFile ? selectedFile.name : 'Sélectionner un fichier'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Formats acceptés : Excel (.xlsx, .xls) ou CSV (.csv)
                  </p>
                </label>
              </div>

              {selectedFile && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  {selectedFile.name.endsWith('.csv') ? (
                    <FileText className="w-5 h-5 text-green-600" />
                  ) : (
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">{selectedFile.name}</p>
                    <p className="text-xs text-green-700">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>
          )}

          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-lg font-medium text-gray-900">Import en cours...</p>
              <p className="text-sm text-gray-500 mt-2">Veuillez patienter</p>
            </div>
          )}

          {step === 'results' && importResult && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{importResult.totalRows}</p>
                  <p className="text-sm text-blue-900 mt-1">Lignes lues</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{importedCount}</p>
                  <p className="text-sm text-green-900 mt-1">Tâches importées</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{importResult.errors.length}</p>
                  <p className="text-sm text-red-900 mt-1">Erreurs</p>
                </div>
              </div>

              {/* Success message */}
              {importedCount > 0 && (
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800">
                    {importedCount} tâche{importedCount > 1 ? 's' : ''} importée{importedCount > 1 ? 's' : ''} avec succès !
                  </p>
                </div>
              )}

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Erreurs rencontrées :</h3>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {importResult.errors.map((error, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm"
                      >
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-red-900">Ligne {error.row}</p>
                          <p className="text-red-800">
                            {error.field}: {error.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t">
          {step === 'select' && (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleImport}
                disabled={!selectedFile}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Importer
              </button>
            </>
          )}
          {step === 'results' && (
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

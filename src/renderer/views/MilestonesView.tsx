import React, { useEffect, useState } from 'react';
import { Plus, Filter, Edit2, Trash2, Flag, Calendar, Download, Upload } from 'lucide-react';
import { useMilestonesStore } from '../stores/milestonesStore';
import { useProjectsStore } from '../stores/projectsStore';
import { MilestoneForm } from '../components/MilestoneForm';
import type { Milestone } from '../types/milestone';
import { exportMilestonesToExcel } from '../lib/excelExport';
import { importMilestonesFromExcel } from '../lib/excelImport';

const statusConfig = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  achieved: { label: 'Atteint', color: 'bg-green-100 text-green-700 border-green-300' },
  missed: { label: 'Manqué', color: 'bg-red-100 text-red-700 border-red-300' },
};

export const MilestonesView: React.FC = () => {
  const { milestones, isLoading, error, fetchMilestones, deleteMilestone, createMilestone } = useMilestonesStore();
  const { projects, fetchProjects } = useProjectsStore();
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchMilestones();
  }, [fetchProjects, fetchMilestones]);

  const filteredMilestones = selectedProject === 'all'
    ? milestones
    : milestones.filter(m => m.projectId === selectedProject);

  const sortedMilestones = [...filteredMilestones].sort((a, b) =>
    new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
  );

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Projet inconnu';
  };

  const getProjectColor = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.color || '#3B82F6';
  };

  const handleEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce jalon ?')) {
      try {
        await deleteMilestone(id);
      } catch (error) {
        console.error('Error deleting milestone:', error);
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingMilestone(null);
  };

  const isOverdue = (targetDate: string, status: string) => {
    if (status === 'achieved') return false;
    return new Date(targetDate) < new Date();
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportMilestonesToExcel(filteredMilestones, projects);
    } catch (error) {
      console.error('Error exporting milestones:', error);
      alert('Erreur lors de l\'export des jalons');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    try {
      setIsImporting(true);

      // Ouvrir le dialogue de sélection de fichier
      const result = await window.api.files.openExcelDialog();

      if (result.canceled || !result.fileBuffer) {
        setIsImporting(false);
        return;
      }

      // Convertir le buffer en File object
      const uint8Array = new Uint8Array(result.fileBuffer);
      const blob = new Blob([uint8Array], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const file = new File([blob], result.fileName || 'import.xlsx');

      // Créer une map nom projet -> ID projet
      const projectIdMap = new Map(projects.map(p => [p.name, p.id]));

      // Importer les données
      const importResult = await importMilestonesFromExcel(file, projectIdMap);

      if (importResult.errors.length > 0) {
        const errorMessages = importResult.errors.map(e => `Ligne ${e.row}, ${e.field}: ${e.message}`).join('\n');
        alert(`Import terminé avec des erreurs:\n\n${errorMessages}\n\n${importResult.success.length} jalons importés avec succès.`);
      }

      // Créer les jalons importés
      let successCount = 0;
      for (const milestoneInput of importResult.success) {
        try {
          await createMilestone(milestoneInput);
          successCount++;
        } catch (error) {
          console.error('Error creating milestone:', error);
        }
      }

      if (successCount > 0) {
        await fetchMilestones();
        alert(`${successCount} jalon(s) importé(s) avec succès !`);
      }
    } catch (error) {
      console.error('Error importing milestones:', error);
      alert('Erreur lors de l\'import des jalons');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les projets</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleImport}
            disabled={isImporting || projects.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Importer depuis Excel"
          >
            <Upload className="w-5 h-5" />
            {isImporting ? 'Import...' : 'Importer'}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || filteredMilestones.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Exporter vers Excel"
          >
            <Download className="w-5 h-5" />
            {isExporting ? 'Export...' : 'Exporter'}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouveau jalon
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Chargement des jalons...</div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && sortedMilestones.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <Flag className="w-16 h-16 mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">Aucun jalon</p>
          <p className="text-sm">Créez votre premier jalon pour marquer les étapes importantes</p>
        </div>
      )}

      {/* Milestones Table */}
      {!isLoading && sortedMilestones.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jalon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Projet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date cible
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedMilestones.map(milestone => (
                <tr key={milestone.id} className="hover:bg-gray-50 transition-colors">
                  {/* Milestone Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: milestone.color }}
                      />
                      <div>
                        <div className="font-medium text-gray-900">
                          {milestone.name}
                        </div>
                        {milestone.description && (
                          <div className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                            {milestone.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Project */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getProjectColor(milestone.projectId) }}
                      />
                      <span className="text-sm text-gray-700">
                        {getProjectName(milestone.projectId)}
                      </span>
                    </div>
                  </td>

                  {/* Target Date */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span
                        className={`text-sm ${
                          isOverdue(milestone.targetDate, milestone.status)
                            ? 'text-red-600 font-medium'
                            : 'text-gray-700'
                        }`}
                      >
                        {new Date(milestone.targetDate).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                      {isOverdue(milestone.targetDate, milestone.status) && (
                        <span className="text-xs text-red-600 font-medium">
                          (En retard)
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        statusConfig[milestone.status].color
                      }`}
                    >
                      {statusConfig[milestone.status].label}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(milestone)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(milestone.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Milestone Form Modal */}
      {showForm && (
        <MilestoneForm
          milestone={editingMilestone}
          projectId={selectedProject !== 'all' ? selectedProject : undefined}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

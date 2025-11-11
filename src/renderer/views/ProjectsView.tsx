import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, FolderOpen } from 'lucide-react';
import { useProjectsStore } from '../stores/projectsStore';
import { ProjectForm } from '../components/ProjectForm';
import type { Project } from '../types/project';

const statusColors = {
  not_started: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  archived: 'bg-gray-200 text-gray-500',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
};

const statusLabels = {
  not_started: 'Non démarré',
  in_progress: 'En cours',
  on_hold: 'En pause',
  completed: 'Terminé',
  archived: 'Archivé',
};

const priorityLabels = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  urgent: 'Urgente',
};

export const ProjectsView: React.FC = () => {
  const { projects, isLoading, error, fetchProjects, deleteProject } = useProjectsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      try {
        await deleteProject(id);
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProject(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un projet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="ml-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouveau projet
        </button>
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
          <div className="text-gray-500">Chargement des projets...</div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredProjects.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <FolderOpen className="w-16 h-16 mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">
            {searchQuery ? 'Aucun projet trouvé' : 'Aucun projet'}
          </p>
          <p className="text-sm">
            {searchQuery ? 'Essayez une autre recherche' : 'Créez votre premier projet pour commencer'}
          </p>
        </div>
      )}

      {/* Projects Grid */}
      {!isLoading && filteredProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map(project => (
            <div
              key={project.id}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              {/* Project Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <h3 className="font-semibold text-gray-900 truncate">
                      {project.name}
                    </h3>
                  </div>
                  {project.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => handleEdit(project)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Modifier"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status and Priority Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[project.status]}`}>
                  {statusLabels[project.status]}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded ${priorityColors[project.priority]}`}>
                  {priorityLabels[project.priority]}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Progression</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Dates */}
              {(project.startDate || project.endDate) && (
                <div className="text-xs text-gray-500 space-y-1">
                  {project.startDate && (
                    <div>Début: {new Date(project.startDate).toLocaleDateString('fr-FR')}</div>
                  )}
                  {project.endDate && (
                    <div>Fin: {new Date(project.endDate).toLocaleDateString('fr-FR')}</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Project Form Modal */}
      {showForm && (
        <ProjectForm
          project={editingProject}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

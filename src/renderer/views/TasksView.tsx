import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Filter, Clock, User, Edit2, Trash2, Download, Tag, X } from 'lucide-react';
import { useTasksStore } from '../stores/tasksStore';
import { useProjectsStore } from '../stores/projectsStore';
import { TaskForm } from '../components/TaskForm';
import type { Task, TaskStatus } from '../types/task';
import { exportTasksToExcel } from '../lib/excelExport';

const statusConfig = {
  todo: { label: 'À faire', color: 'bg-gray-100 border-gray-300' },
  in_progress: { label: 'En cours', color: 'bg-blue-100 border-blue-300' },
  review: { label: 'En revue', color: 'bg-purple-100 border-purple-300' },
  done: { label: 'Terminé', color: 'bg-green-100 border-green-300' },
  blocked: { label: 'Bloqué', color: 'bg-red-100 border-red-300' },
};

const priorityColors = {
  low: 'text-gray-600',
  medium: 'text-blue-600',
  high: 'text-orange-600',
  urgent: 'text-red-600',
};

export const TasksView: React.FC = () => {
  const { tasks, isLoading, error, fetchTasks, updateTaskStatus, deleteTask, createTask } = useTasksStore();
  const { projects, fetchProjects } = useProjectsStore();
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, [fetchProjects, fetchTasks]);

  // Helper function to parse tags from a task
  const parseTaskTags = (task: Task): string[] => {
    if (!task.tags) return [];
    if (typeof task.tags === 'string') {
      try {
        return JSON.parse(task.tags);
      } catch (e) {
        return [];
      }
    }
    if (Array.isArray(task.tags)) {
      return task.tags;
    }
    return [];
  };

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    tasks.forEach(task => {
      const tags = parseTaskTags(task);
      tags.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [tasks]);

  // Filter by project first
  const projectFilteredTasks = selectedProject === 'all'
    ? tasks
    : tasks.filter(task => task.projectId === selectedProject);

  // Then filter by tags
  const filteredTasks = useMemo(() => {
    if (selectedTags.length === 0) {
      return projectFilteredTasks;
    }
    return projectFilteredTasks.filter(task => {
      const taskTags = parseTaskTags(task);
      return selectedTags.some(selectedTag => taskTags.includes(selectedTag));
    });
  }, [projectFilteredTasks, selectedTags]);

  const tasksByStatus = (status: TaskStatus) =>
    filteredTasks.filter(task => task.status === status);

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (newStatus: TaskStatus) => {
    if (draggedTask && draggedTask.status !== newStatus) {
      try {
        await updateTaskStatus(draggedTask.id, newStatus);
      } catch (error) {
        console.error('Error updating task status:', error);
      }
    }
    setDraggedTask(null);
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Projet inconnu';
  };

  const getProjectColor = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.color || '#3B82F6';
  };

  const handleEdit = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      try {
        await deleteTask(id);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportTasksToExcel(filteredTasks, projects);
    } catch (error) {
      console.error('Error exporting tasks:', error);
      alert('Erreur lors de l\'export des tâches');
    } finally {
      setIsExporting(false);
    }
  };


  return (
    <div className="h-full flex flex-col">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-4">
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
            onClick={handleExport}
            disabled={isExporting || filteredTasks.length === 0}
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
            Nouvelle tâche
          </button>
        </div>
      </div>

      {/* Tag Filter Section */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filtrer par tags:</span>
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="text-xs text-blue-600 hover:text-blue-800 ml-auto"
              >
                Réinitialiser
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedTags(selectedTags.filter(t => t !== tag));
                    } else {
                      setSelectedTags([...selectedTags, tag]);
                    }
                  }}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-all ${
                    isSelected
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                  {isSelected && <X className="w-3 h-3 ml-1" />}
                </button>
              );
            })}
          </div>
          {selectedTags.length > 0 && (
            <div className="mt-2 text-xs text-gray-600">
              {filteredTasks.length} tâche(s) affichée(s) sur {projectFilteredTasks.length}
            </div>
          )}
          {allTags.length === 0 && (
            <div className="text-sm text-gray-500 italic">
              Aucun tag disponible. Ajoutez des tags aux tâches pour les filtrer.
            </div>
          )}
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
          <div className="text-gray-500">Chargement des tâches...</div>
        </div>
      )}

      {/* Kanban Board */}
      {!isLoading && (
        <div className="flex-1 grid grid-cols-5 gap-4 overflow-x-auto">
          {(Object.keys(statusConfig) as TaskStatus[]).map(status => (
            <div
              key={status}
              className="flex flex-col min-w-[250px]"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(status)}
            >
              {/* Column Header */}
              <div className={`px-4 py-3 rounded-t-lg border-2 ${statusConfig[status].color}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">
                    {statusConfig[status].label}
                  </span>
                  <span className="text-sm font-medium text-gray-600 bg-white px-2 py-0.5 rounded-full">
                    {tasksByStatus(status).length}
                  </span>
                </div>
              </div>

              {/* Tasks Column */}
              <div className="flex-1 bg-gray-50 rounded-b-lg border-2 border-t-0 border-gray-200 p-3 space-y-3 overflow-y-auto">
                {tasksByStatus(status).map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    className="bg-white rounded-lg border border-gray-200 p-3 cursor-move hover:shadow-md transition-shadow group"
                  >
                    {/* Task Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-2 flex-1">
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-bold ${priorityColors[task.priority]}`}>
                          {task.priority === 'urgent' && '!!!'}
                          {task.priority === 'high' && '!!'}
                          {task.priority === 'medium' && '!'}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                          <button
                            onClick={(e) => handleEdit(task, e)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Modifier"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(task.id, e)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Task Description */}
                    {task.description && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {/* Task Meta */}
                    <div className="space-y-1.5">
                      {/* Project Badge */}
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getProjectColor(task.projectId) }}
                        />
                        <span className="text-xs text-gray-600 truncate">
                          {getProjectName(task.projectId)}
                        </span>
                      </div>

                      {/* Assignee */}
                      {task.assignee && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <User className="w-3 h-3" />
                          <span className="truncate">{task.assignee}</span>
                        </div>
                      )}

                      {/* Time Estimate */}
                      {task.estimatedHours && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Clock className="w-3 h-3" />
                          <span>{task.estimatedHours}h</span>
                          {task.actualHours && (
                            <span className="text-gray-400">/ {task.actualHours}h</span>
                          )}
                        </div>
                      )}

                      {/* Due Date */}
                      {task.endDate && (
                        <div className="text-xs text-gray-500">
                          Échéance: {new Date(task.endDate).toLocaleDateString('fr-FR')}
                        </div>
                      )}

                      {/* Tags */}
                      {task.tags && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(typeof task.tags === 'string'
                            ? JSON.parse(task.tags || '[]')
                            : Array.isArray(task.tags) ? task.tags : []
                          ).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Empty Column State */}
                {tasksByStatus(status).length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Aucune tâche
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Form Modal */}
      {showForm && (
        <TaskForm
          task={editingTask}
          projectId={selectedProject !== 'all' ? selectedProject : undefined}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

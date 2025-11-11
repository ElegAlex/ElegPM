import React, { useState, useEffect } from 'react';
import { X, Users } from 'lucide-react';
import { useTasksStore } from '../stores/tasksStore';
import { useProjectsStore } from '../stores/projectsStore';
import { useMilestonesStore } from '../stores/milestonesStore';
import { useResourcesStore } from '../stores/resourcesStore';
import { useTaskAssignmentsStore } from '../stores/taskAssignmentsStore';
import type { Task, TaskInput } from '../types/task';

interface TaskFormProps {
  task?: Task | null;
  projectId?: string;
  parentTaskId?: string | null;
  onClose: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ task, projectId, parentTaskId, onClose }) => {
  const { createTask, updateTask } = useTasksStore();
  const { projects, fetchProjects } = useProjectsStore();
  const { tasks, fetchTasks } = useTasksStore();
  const { milestones, fetchMilestones } = useMilestonesStore();
  const { resources, fetchResources } = useResourcesStore();
  const { fetchAssignments, assignResourcesToTask } = useTaskAssignmentsStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [formData, setFormData] = useState<TaskInput>({
    projectId: projectId || '',
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assignee: '',
    estimatedHours: undefined,
    actualHours: undefined,
    startDate: '',
    endDate: '',
    parentTaskId: parentTaskId || undefined,
    milestoneId: undefined,
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchProjects();
    fetchTasks();
    fetchMilestones();
    fetchResources();
  }, [fetchProjects, fetchTasks, fetchMilestones, fetchResources]);

  useEffect(() => {
    if (task) {
      // Parse tags if it's a string (from database)
      let parsedTags: string[] = [];
      if (task.tags) {
        if (typeof task.tags === 'string') {
          try {
            parsedTags = JSON.parse(task.tags);
          } catch (e) {
            console.error('Error parsing tags:', e);
            parsedTags = [];
          }
        } else if (Array.isArray(task.tags)) {
          parsedTags = task.tags;
        }
      }

      setFormData({
        projectId: task.projectId,
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        assignee: task.assignee || '',
        estimatedHours: task.estimatedHours || undefined,
        actualHours: task.actualHours || undefined,
        startDate: task.startDate || '',
        endDate: task.endDate || '',
        parentTaskId: task.parentTaskId || undefined,
        milestoneId: task.milestoneId || undefined,
        tags: parsedTags,
      });
    }
  }, [task]);

  // Fetch current assignments when editing a task
  useEffect(() => {
    const loadAssignments = async () => {
      if (task?.id) {
        try {
          const assignments = await window.api.taskAssignments.getAll({ taskId: task.id });
          setSelectedResourceIds(assignments.map(a => a.resourceId));
        } catch (error) {
          console.error('Error fetching task assignments:', error);
        }
      }
    };
    loadAssignments();
  }, [task?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let taskId: string;

      if (task) {
        await updateTask(task.id, formData);
        taskId = task.id;
      } else {
        const newTask = await createTask(formData);
        taskId = newTask.id;
      }

      // Save resource assignments
      if (selectedResourceIds.length > 0) {
        await assignResourcesToTask(taskId, selectedResourceIds);
      } else {
        // Clear assignments if no resources selected
        await assignResourcesToTask(taskId, []);
      }

      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'estimatedHours' || name === 'actualHours') {
      setFormData(prev => ({ ...prev, [name]: value ? parseFloat(value) : undefined }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddTag = () => {
    const currentTags = Array.isArray(formData.tags) ? formData.tags : [];
    if (tagInput.trim() && !currentTags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...currentTags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || [],
    }));
  };

  const handleToggleResource = (resourceId: string) => {
    setSelectedResourceIds(prev =>
      prev.includes(resourceId)
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const availableParentTasks = tasks.filter(
    t => t.projectId === formData.projectId && t.id !== task?.id
  );

  const availableMilestones = milestones.filter(
    m => m.projectId === formData.projectId
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? 'Modifier la tâche' : 'Nouvelle tâche'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Project Selection */}
          <div>
            <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-1">
              Projet <span className="text-red-500">*</span>
            </label>
            <select
              id="projectId"
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner un projet</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Titre de la tâche <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Créer la maquette de la page d'accueil"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Détails de la tâche..."
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todo">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="review">En revue</option>
                <option value="done">Terminé</option>
                <option value="blocked">Bloqué</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priorité
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>

          {/* Parent Task */}
          <div>
            <label htmlFor="parentTaskId" className="block text-sm font-medium text-gray-700 mb-1">
              Tâche parente
            </label>
            <select
              id="parentTaskId"
              name="parentTaskId"
              value={formData.parentTaskId || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!formData.projectId}
            >
              <option value="">Aucune</option>
              {availableParentTasks.map(parentTask => (
                <option key={parentTask.id} value={parentTask.id}>
                  {parentTask.title}
                </option>
              ))}
            </select>
          </div>

          {/* Milestone */}
          <div>
            <label htmlFor="milestoneId" className="block text-sm font-medium text-gray-700 mb-1">
              Jalon associé
            </label>
            <select
              id="milestoneId"
              name="milestoneId"
              value={formData.milestoneId || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!formData.projectId}
            >
              <option value="">Aucun</option>
              {availableMilestones.map(milestone => (
                <option key={milestone.id} value={milestone.id}>
                  {milestone.name} ({new Date(milestone.targetDate).toLocaleDateString('fr-FR')})
                </option>
              ))}
            </select>
          </div>

          {/* Resource Assignments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Ressources assignées
            </label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
              {resources.length === 0 ? (
                <p className="text-sm text-gray-500">Aucune ressource disponible</p>
              ) : (
                <div className="space-y-2">
                  {resources.map(resource => (
                    <label
                      key={resource.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedResourceIds.includes(resource.id)}
                        onChange={() => handleToggleResource(resource.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {resource.name}
                        </div>
                        {resource.role && (
                          <div className="text-xs text-gray-500">
                            {resource.role}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {resource.availability}% dispo
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {selectedResourceIds.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {selectedResourceIds.length} ressource(s) sélectionnée(s)
              </p>
            )}
          </div>

          {/* Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700 mb-1">
                Heures estimées
              </label>
              <input
                type="number"
                id="estimatedHours"
                name="estimatedHours"
                value={formData.estimatedHours || ''}
                onChange={handleChange}
                min="0"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 8"
              />
            </div>

            <div>
              <label htmlFor="actualHours" className="block text-sm font-medium text-gray-700 mb-1">
                Heures réelles
              </label>
              <input
                type="number"
                id="actualHours"
                name="actualHours"
                value={formData.actualHours || ''}
                onChange={handleChange}
                min="0"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 10"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Date de début
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ajouter un tag..."
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Ajouter
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(formData.tags) && formData.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-lg flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Enregistrement...' : (task ? 'Enregistrer' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Users, BarChart3, AlertCircle, Edit2, Trash2, Calendar, Tag, Clock } from 'lucide-react';
import { useResourcesStore } from '../stores/resourcesStore';
import { useTasksStore } from '../stores/tasksStore';
import { useTaskAssignmentsStore } from '../stores/taskAssignmentsStore';
import { useProjectsStore } from '../stores/projectsStore';
import { useTranslation } from '../i18n/useTranslation';
import type { Resource } from '../types/resource';
import type { Task } from '../types/task';
import type { TaskAssignment } from '../types/taskAssignment';

const getTaskStatusConfig = (t: (key: string) => string) => ({
  todo: { label: t('statusTodo'), color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  in_progress: { label: t('statusInProgress'), color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  review: { label: t('statusInReview'), color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  done: { label: t('statusDone'), color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  blocked: { label: t('statusBlocked'), color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
});

const getPriorityConfig = (t: (key: string) => string) => ({
  low: { label: t('priorityLow'), color: 'text-gray-600 dark:text-gray-400' },
  medium: { label: t('priorityMedium'), color: 'text-blue-600 dark:text-blue-400' },
  high: { label: t('priorityHigh'), color: 'text-orange-600 dark:text-orange-400' },
  urgent: { label: t('priorityUrgent'), color: 'text-red-600 dark:text-red-400' },
});

interface ResourceWorkload {
  resource: Resource;
  assignments: TaskAssignment[];
  tasks: Task[];
  totalEstimatedHours: number;
  totalActualHours: number;
  utilizationPercentage: number;
}

export const WorkloadView: React.FC = () => {
  const { t } = useTranslation();
  const { resources, fetchResources, isLoading: resourcesLoading } = useResourcesStore();
  const { tasks, fetchTasks, updateTask } = useTasksStore();
  const { fetchAssignments } = useTaskAssignmentsStore();
  const { projects, fetchProjects } = useProjectsStore();
  const [workloads, setWorkloads] = useState<ResourceWorkload[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const taskStatusConfig = getTaskStatusConfig(t);
  const priorityConfig = getPriorityConfig(t);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchResources(),
          fetchTasks(),
          fetchProjects(),
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchResources, fetchTasks, fetchProjects]);

  useEffect(() => {
    const calculateWorkloads = async () => {
      if (!resources.length || !tasks.length) return;

      const workloadData: ResourceWorkload[] = await Promise.all(
        resources.map(async (resource) => {
          try {
            // Fetch assignments for this resource
            const assignments = await window.api.taskAssignments.getAll({ resourceId: resource.id });

            // Get tasks for these assignments
            const resourceTasks = tasks.filter(task =>
              assignments.some(a => a.taskId === task.id)
            );

            // Calculate total estimated and actual hours
            const totalEstimatedHours = resourceTasks.reduce(
              (sum, task) => sum + (task.estimatedHours || 0),
              0
            );
            const totalActualHours = resourceTasks.reduce(
              (sum, task) => sum + (task.actualHours || 0),
              0
            );

            // Calculate utilization percentage based on availability
            // Assuming availability is a percentage (0-100) of a standard work week (40 hours)
            const availableHours = (resource.availability / 100) * 40;
            const utilizationPercentage = availableHours > 0
              ? Math.round((totalEstimatedHours / availableHours) * 100)
              : 0;

            return {
              resource,
              assignments,
              tasks: resourceTasks,
              totalEstimatedHours,
              totalActualHours,
              utilizationPercentage,
            };
          } catch (error) {
            console.error(`Error calculating workload for resource ${resource.id}:`, error);
            return {
              resource,
              assignments: [],
              tasks: [],
              totalEstimatedHours: 0,
              totalActualHours: 0,
              utilizationPercentage: 0,
            };
          }
        })
      );

      setWorkloads(workloadData);
    };

    calculateWorkloads();
  }, [resources, tasks]);

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || t('unknownProject');
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30';
    if (percentage >= 80) return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30';
    return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30';
  };

  const getUtilizationBarColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500 dark:bg-red-600';
    if (percentage >= 80) return 'bg-orange-500 dark:bg-orange-600';
    if (percentage >= 60) return 'bg-yellow-500 dark:bg-yellow-600';
    return 'bg-green-500 dark:bg-green-600';
  };

  // Helper function to parse tags from a task
  const parseTaskTags = (task: Task): string[] => {
    if (!task.tags) return [];

    if (typeof task.tags === 'string') {
      try {
        return JSON.parse(task.tags);
      } catch (e) {
        console.error('Error parsing tags:', e);
        return [];
      }
    }

    if (Array.isArray(task.tags)) {
      return task.tags;
    }

    return [];
  };

  // Group tasks by project
  const groupTasksByProject = (tasks: Task[]) => {
    const grouped = new Map<string, Task[]>();
    tasks.forEach(task => {
      const projectId = task.projectId;
      if (!grouped.has(projectId)) {
        grouped.set(projectId, []);
      }
      grouped.get(projectId)?.push(task);
    });
    return grouped;
  };

  // Quick update handlers for inline editing
  const handleQuickUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await updateTask(taskId, { status: newStatus as any });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleQuickUpdateTaskDate = async (taskId: string, field: 'startDate' | 'endDate', value: string) => {
    try {
      await updateTask(taskId, { [field]: value || undefined });
    } catch (error) {
      console.error('Error updating task date:', error);
    }
  };

  const getProjectColor = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.color || '#3B82F6';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('workloadTitle')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('workloadDescription')}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <BarChart3 className="w-5 h-5" />
          <span>{resources.length} {resources.length > 1 ? t('resources') : t('resource')}</span>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">{t('loadingData')}</div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && workloads.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
          <Users className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-lg font-medium mb-2">{t('noResources')}</p>
          <p className="text-sm">{t('addTeamMembers')}</p>
        </div>
      )}

      {/* Workload List */}
      {!isLoading && workloads.length > 0 && (
        <div className="space-y-4">
          {workloads.map(({ resource, tasks: resourceTasks, totalEstimatedHours, totalActualHours, utilizationPercentage }) => (
            <div
              key={resource.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              {/* Resource Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-blue-600 dark:text-blue-300">
                      {resource.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {resource.name}
                    </h3>
                    {resource.role && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {resource.role}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getUtilizationColor(utilizationPercentage)}`}>
                    {utilizationPercentage >= 100 && <AlertCircle className="w-4 h-4 mr-1" />}
                    {utilizationPercentage}% {t('utilized')}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('availability')}</div>
                  <div className="text-xl font-semibold text-gray-900 dark:text-white">
                    {resource.availability}%
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('assignedTasks')}</div>
                  <div className="text-xl font-semibold text-gray-900 dark:text-white">
                    {resourceTasks.length}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('estimatedHours')}</div>
                  <div className="text-xl font-semibold text-gray-900 dark:text-white">
                    {totalEstimatedHours}h
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('actualHours')}</div>
                  <div className="text-xl font-semibold text-gray-900 dark:text-white">
                    {totalActualHours}h
                  </div>
                </div>
              </div>

              {/* Utilization Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">{t('utilizationRate')}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {totalEstimatedHours}h / {Math.round((resource.availability / 100) * 40)}h {t('availableHours')}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${getUtilizationBarColor(utilizationPercentage)}`}
                    style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Tasks List - Grouped by Project */}
              {resourceTasks.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('assignedTasks')}:</h4>
                  {Array.from(groupTasksByProject(resourceTasks).entries()).map(([projectId, projectTasks]) => {
                    const project = projects.find(p => p.id === projectId);
                    const projectColor = project?.color || '#3B82F6';

                    return (
                      <div key={projectId} className="mb-4">
                        {/* Project Header */}
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: projectColor }}
                          />
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {project?.name || t('unknownProject')}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({projectTasks.length} {projectTasks.length > 1 ? t('taskPlural') : t('taskSingular')})
                          </span>
                        </div>

                        {/* Task Cards */}
                        <div className="space-y-2">
                          {projectTasks.map(task => {
                            const taskTags = parseTaskTags(task);

                            return (
                              <div
                                key={task.id}
                                className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:shadow-sm transition-shadow"
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: '1fr auto auto auto auto',
                                  gap: '1rem',
                                  alignItems: 'center'
                                }}
                              >
                                {/* Left section: Title, description, and tags */}
                                <div className="min-w-0">
                                  <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">{task.title}</h3>
                                  {task.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">{task.description}</p>
                                  )}
                                  {taskTags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {taskTags.map((tag, idx) => (
                                        <span
                                          key={idx}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                                        >
                                          <Tag className="w-3 h-3" />
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Status section (fixed width) */}
                                <div className="flex items-center gap-2" style={{ width: '200px' }}>
                                  <select
                                    value={task.status}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleQuickUpdateTaskStatus(task.id, e.target.value);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 ${taskStatusConfig[task.status].color}`}
                                  >
                                    {Object.entries(taskStatusConfig).map(([value, config]) => (
                                      <option key={value} value={value}>
                                        {config.label}
                                      </option>
                                    ))}
                                  </select>

                                  <span className={`${priorityConfig[task.priority].color} text-xs font-medium`}>
                                    {priorityConfig[task.priority].label}
                                  </span>
                                </div>

                                {/* Dates section (fixed width) */}
                                <div className="flex items-center gap-2" style={{ width: '280px' }}>
                                  <input
                                    type="date"
                                    value={task.startDate || ''}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleQuickUpdateTaskDate(task.id, 'startDate', e.target.value);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder={t('start')}
                                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-xs w-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                  <span className="text-gray-400 dark:text-gray-500 text-xs">→</span>
                                  <input
                                    type="date"
                                    value={task.endDate || ''}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleQuickUpdateTaskDate(task.id, 'endDate', e.target.value);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder={t('end')}
                                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-xs w-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>

                                {/* Hours info (fixed width) - Display both estimated and actual hours */}
                                <div className="flex flex-col gap-1 text-xs" style={{ width: '120px' }}>
                                  <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                                    <Clock className="w-3 h-3 flex-shrink-0" />
                                    <span className="font-medium">{task.estimatedHours || 0}h</span>
                                    <span className="text-gray-500 dark:text-gray-400">{t('estimated')}</span>
                                  </div>
                                  {task.actualHours !== undefined && task.actualHours > 0 && (
                                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                      <Clock className="w-3 h-3 flex-shrink-0 opacity-50" />
                                      <span>{task.actualHours}h</span>
                                      <span className="text-gray-500 dark:text-gray-400">{t('actual')}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Actions (fixed width) */}
                                <div className="flex items-center gap-1" style={{ width: '60px' }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Could add edit functionality here if needed
                                    }}
                                    className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                    title={t('edit')}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Warning for overloaded resources */}
              {utilizationPercentage >= 100 && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700 dark:text-red-300">
                    <strong>{t('overloadDetected')}:</strong> {t('overloadMessage')}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

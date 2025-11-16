import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Edit2, Trash2, Plus, Calendar, Users, Flag, ListTodo, Activity, GanttChart, Tag, X, Clock, MessageSquare, TrendingUp, Send, Network, ChevronDown, ChevronRight, Upload, LayoutGrid, List } from 'lucide-react';
import { useProjectsStore } from '../stores/projectsStore';
import { useTasksStore } from '../stores/tasksStore';
import { useMilestonesStore } from '../stores/milestonesStore';
import { useResourcesStore } from '../stores/resourcesStore';
import { useTaskAssignmentsStore } from '../stores/taskAssignmentsStore';
import { ProjectForm } from '../components/ProjectForm';
import { TaskForm } from '../components/TaskForm';
import { MilestoneForm } from '../components/MilestoneForm';
import { ProjectGanttView } from '../components/ProjectGanttView';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { TasksImportDialog } from '../components/TasksImportDialog';
import { MilestonesImportDialog } from '../components/MilestonesImportDialog';
import type { Project } from '../types/project';
import type { Task } from '../types/task';

interface ProjectDetailViewProps {
  projectId: string;
  onBack: () => void;
}

type TabType = 'tasks' | 'milestones' | 'gantt' | 'wbs' | 'resources' | 'activity';

const statusConfig = {
  not_started: { label: 'Non commencé', color: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'En cours', color: 'bg-blue-100 text-blue-700' },
  on_hold: { label: 'En pause', color: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Terminé', color: 'bg-green-100 text-green-700' },
  archived: { label: 'Archivé', color: 'bg-gray-100 text-gray-700' },
};

const priorityConfig = {
  low: { label: 'Basse', color: 'text-gray-600' },
  medium: { label: 'Moyenne', color: 'text-blue-600' },
  high: { label: 'Haute', color: 'text-orange-600' },
  urgent: { label: 'Urgente', color: 'text-red-600' },
};

const taskStatusConfig = {
  todo: { label: 'À faire', color: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'En cours', color: 'bg-blue-100 text-blue-700' },
  review: { label: 'En revue', color: 'bg-purple-100 text-purple-700' },
  done: { label: 'Terminé', color: 'bg-green-100 text-green-700' },
  blocked: { label: 'Bloqué', color: 'bg-red-100 text-red-700' },
};

const milestoneStatusConfig = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  achieved: { label: 'Atteint', color: 'bg-green-100 text-green-700' },
  missed: { label: 'Manqué', color: 'bg-red-100 text-red-700' },
};

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({ projectId, onBack }) => {
  const { projects, fetchProjects, deleteProject } = useProjectsStore();
  const { tasks, fetchTasks, updateTask, deleteTask } = useTasksStore();
  const { milestones, fetchMilestones, deleteMilestone } = useMilestonesStore();
  const { resources, fetchResources } = useResourcesStore();
  const { fetchAssignments } = useTaskAssignmentsStore();

  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showTasksImport, setShowTasksImport] = useState(false);
  const [showMilestonesImport, setShowMilestonesImport] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
  const [resourceAssignments, setResourceAssignments] = useState<Map<string, string[]>>(new Map());
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [projectComments, setProjectComments] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [expandedWbsNodes, setExpandedWbsNodes] = useState<Set<string>>(new Set());
  const [wbsViewMode, setWbsViewMode] = useState<'deliverables' | 'phases'>('deliverables');
  const [selectedWbsElement, setSelectedWbsElement] = useState<string | null>(null);
  const [taskViewMode, setTaskViewMode] = useState<'table' | 'kanban'>('table');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const project = projects.find(p => p.id === projectId);

  useEffect(() => {
    fetchProjects();
    fetchTasks();
    fetchMilestones();
    fetchResources();
  }, [fetchProjects, fetchTasks, fetchMilestones, fetchResources]);

  // Load resource assignments for tasks
  useEffect(() => {
    const loadAssignments = async () => {
      const projectTasks = tasks.filter(t => t.projectId === projectId);
      const assignmentsMap = new Map<string, string[]>();

      for (const task of projectTasks) {
        try {
          const assignments = await window.api.taskAssignments.getAll({ taskId: task.id });
          const resourceIds = assignments.map(a => a.resourceId);
          assignmentsMap.set(task.id, resourceIds);
        } catch (error) {
          console.error(`Error loading assignments for task ${task.id}:`, error);
        }
      }

      setResourceAssignments(assignmentsMap);
    };

    if (tasks.length > 0) {
      loadAssignments();
    }
  }, [tasks, projectId]);

  // Load activity data when activity tab is selected
  useEffect(() => {
    const loadActivityData = async () => {
      if (activeTab === 'activity') {
        setIsLoadingActivity(true);
        try {
          // Load comments for this project
          const comments = await window.api.comments.getAll({ projectId });
          setProjectComments(comments);

          // Load activity logs for this project
          const logs = await window.api.activityLog.getByProject(projectId, 50);
          setActivityLogs(logs);
        } catch (error) {
          console.error('Error loading activity data:', error);
        } finally {
          setIsLoadingActivity(false);
        }
      }
    };

    loadActivityData();
  }, [activeTab, projectId]);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-gray-500 mb-4">Projet non trouvé</p>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux projets
        </button>
      </div>
    );
  }

  const projectTasks = tasks.filter(t => t.projectId === projectId);
  const projectMilestones = milestones.filter(m => m.projectId === projectId);

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

  // Get all unique tags from project tasks
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    projectTasks.forEach(task => {
      const tags = parseTaskTags(task);
      tags.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [projectTasks]);

  // Filter tasks by selected tags
  const filteredProjectTasks = useMemo(() => {
    if (selectedTags.length === 0) {
      return projectTasks;
    }

    return projectTasks.filter(task => {
      const taskTags = parseTaskTags(task);
      return selectedTags.some(selectedTag => taskTags.includes(selectedTag));
    });
  }, [projectTasks, selectedTags]);

  // Sort tasks by end date (earliest first, tasks without date at the end)
  const sortedProjectTasks = [...filteredProjectTasks].sort((a, b) => {
    // Tasks without end date go to the end
    if (!a.endDate && !b.endDate) return 0;
    if (!a.endDate) return 1;
    if (!b.endDate) return -1;

    // Sort by end date
    return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
  });

  // Build task hierarchy
  const buildTaskHierarchy = (tasks: any[]) => {
    const taskMap = new Map(tasks.map(t => [t.id, { ...t, children: [] }]));
    const rootTasks: any[] = [];

    tasks.forEach(task => {
      const taskWithChildren = taskMap.get(task.id);
      if (task.parentTaskId && taskMap.has(task.parentTaskId)) {
        const parent = taskMap.get(task.parentTaskId);
        parent.children.push(taskWithChildren);
      } else {
        rootTasks.push(taskWithChildren);
      }
    });

    // Sort root tasks by end date
    rootTasks.sort((a, b) => {
      if (!a.endDate && !b.endDate) return 0;
      if (!a.endDate) return 1;
      if (!b.endDate) return -1;
      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    });

    // Sort children of each task
    rootTasks.forEach(task => {
      if (task.children && task.children.length > 0) {
        task.children.sort((a: any, b: any) => {
          if (!a.endDate && !b.endDate) return 0;
          if (!a.endDate) return 1;
          if (!b.endDate) return -1;
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        });
      }
    });

    return rootTasks;
  };

  const hierarchicalTasks = buildTaskHierarchy(sortedProjectTasks);

  const [selectedParentTask, setSelectedParentTask] = useState<string | null>(null);

  // Get unique resources assigned to project tasks
  const projectResourceIds = new Set<string>();
  resourceAssignments.forEach(ids => ids.forEach(id => projectResourceIds.add(id)));
  const projectResources = resources.filter(r => projectResourceIds.has(r.id));

  const handleDeleteProject = async () => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.name}" ? Toutes les tâches et jalons associés seront également supprimés.`)) {
      try {
        await deleteProject(project.id);
        onBack();
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      try {
        await window.api.tasks.delete(taskId);
        await fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleEditMilestone = (milestone: any) => {
    setEditingMilestone(milestone);
    setShowMilestoneForm(true);
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce jalon ?')) {
      try {
        await window.api.milestones.delete(milestoneId);
        await fetchMilestones();
      } catch (error) {
        console.error('Error deleting milestone:', error);
      }
    }
  };

  const getResourceNames = (taskId: string) => {
    const resourceIds = resourceAssignments.get(taskId) || [];
    return resourceIds
      .map(id => resources.find(r => r.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const handleAddSubtask = (parentTaskId: string) => {
    setSelectedParentTask(parentTaskId);
    setEditingTask(null);
    setShowTaskForm(true);
  };

  // Quick update handlers for inline editing
  const handleQuickUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      await updateTask(taskId, { status: newStatus as any });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleQuickUpdateTaskDate = async (taskId: string, field: 'startDate' | 'endDate', value: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      await updateTask(taskId, { [field]: value || undefined });
    } catch (error) {
      console.error('Error updating task date:', error);
    }
  };

  // Handle adding a new comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await window.api.comments.create({
        projectId,
        author: 'Utilisateur', // TODO: Use actual user name when auth is implemented
        content: newComment,
      });

      // Reload comments
      const comments = await window.api.comments.getAll({ projectId });
      setProjectComments(comments);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Kanban drag & drop handlers
  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (newStatus: any) => {
    if (draggedTask && draggedTask.status !== newStatus) {
      try {
        await updateTask(draggedTask.id, { status: newStatus });
      } catch (error) {
        console.error('Error updating task status:', error);
      }
    }
    setDraggedTask(null);
  };

  const tasksByStatus = (status: any) =>
    filteredProjectTasks.filter(task => task.status === status);

  // Calculate project statistics
  const projectStats = useMemo(() => {
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(t => t.status === 'done').length;
    const inProgressTasks = projectTasks.filter(t => t.status === 'in_progress').length;
    const todoTasks = projectTasks.filter(t => t.status === 'todo').length;

    const totalMilestones = projectMilestones.length;
    const achievedMilestones = projectMilestones.filter(m => m.status === 'achieved').length;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      totalMilestones,
      achievedMilestones,
      milestonesRate: totalMilestones > 0 ? Math.round((achievedMilestones / totalMilestones) * 100) : 0,
    };
  }, [projectTasks, projectMilestones]);

  // Toggle WBS node expansion
  const toggleWbsNode = (taskId: string) => {
    const newExpanded = new Set(expandedWbsNodes);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedWbsNodes(newExpanded);
  };

  // Calculate aggregated statistics for WBS
  const calculateWbsStats = (task: any): { totalHours: number; completedHours: number; progress: number } => {
    let totalHours = task.estimatedHours || 0;
    let completedHours = task.status === 'done' ? (task.estimatedHours || 0) : 0;

    if (task.children && task.children.length > 0) {
      task.children.forEach((child: any) => {
        const childStats = calculateWbsStats(child);
        totalHours += childStats.totalHours;
        completedHours += childStats.completedHours;
      });
    }

    const progress = totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0;

    return { totalHours, completedHours, progress };
  };

  // Build WBS structure by deliverables (milestones)
  const wbsStructure = useMemo(() => {
    if (wbsViewMode === 'deliverables') {
      // Group tasks by milestone (deliverable)
      const structure: any[] = [];

      // Tasks with milestones
      projectMilestones.forEach((milestone, idx) => {
        const milestoneTasks = projectTasks.filter(t => t.milestoneId === milestone.id);
        if (milestoneTasks.length > 0 || true) { // Show all milestones
          structure.push({
            type: 'deliverable',
            id: milestone.id,
            name: milestone.name,
            description: milestone.description,
            targetDate: milestone.targetDate,
            status: milestone.status,
            color: milestone.color,
            wbsCode: `${idx + 1}.0`,
            tasks: milestoneTasks,
            stats: {
              totalTasks: milestoneTasks.length,
              completedTasks: milestoneTasks.filter(t => t.status === 'done').length,
              totalHours: milestoneTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
              completedHours: milestoneTasks.filter(t => t.status === 'done').reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
            }
          });
        }
      });

      // Tasks without milestones (unassigned work)
      const unassignedTasks = projectTasks.filter(t => !t.milestoneId);
      if (unassignedTasks.length > 0) {
        structure.push({
          type: 'deliverable',
          id: 'unassigned',
          name: 'Travaux non assignés à un livrable',
          description: 'Tâches qui doivent être associées à un livrable',
          wbsCode: `${structure.length + 1}.0`,
          tasks: unassignedTasks,
          stats: {
            totalTasks: unassignedTasks.length,
            completedTasks: unassignedTasks.filter(t => t.status === 'done').length,
            totalHours: unassignedTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
            completedHours: unassignedTasks.filter(t => t.status === 'done').reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
          }
        });
      }

      return structure;
    } else {
      // View by phases (use project timeline)
      // For simplicity, group by status for now
      const phases = [
        { phase: 'Planification', statuses: ['todo'] },
        { phase: 'Exécution', statuses: ['in_progress'] },
        { phase: 'Contrôle', statuses: ['review'] },
        { phase: 'Clôture', statuses: ['done'] },
      ];

      return phases.map((phaseInfo, idx) => {
        const phaseTasks = projectTasks.filter(t => phaseInfo.statuses.includes(t.status));
        return {
          type: 'phase',
          id: phaseInfo.phase,
          name: phaseInfo.phase,
          wbsCode: `${idx + 1}.0`,
          tasks: phaseTasks,
          stats: {
            totalTasks: phaseTasks.length,
            completedTasks: phaseTasks.filter(t => t.status === 'done').length,
            totalHours: phaseTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
            completedHours: phaseTasks.filter(t => t.status === 'done').reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
          }
        };
      }).filter(p => p.tasks.length > 0);
    }
  }, [projectTasks, projectMilestones, wbsViewMode]);

  // Render WBS tree node
  const renderWbsNode = (task: any, depth: number, wbsCode: string): React.ReactNode => {
    const hasChildren = task.children && task.children.length > 0;
    const isExpanded = expandedWbsNodes.has(task.id);
    const stats = calculateWbsStats(task);
    const taskTags = parseTaskTags(task);

    return (
      <React.Fragment key={task.id}>
        <div
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow mb-2"
          style={{ marginLeft: `${depth * 24}px` }}
        >
          <div className="flex items-start gap-3">
            {/* Expand/Collapse button */}
            <button
              onClick={() => hasChildren && toggleWbsNode(task.id)}
              className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors ${!hasChildren ? 'invisible' : ''}`}
            >
              {hasChildren && (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
            </button>

            {/* WBS Code */}
            <div className="flex-shrink-0 w-16">
              <span className="text-sm font-mono font-semibold text-gray-700">{wbsCode}</span>
            </div>

            {/* Task info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-gray-900">{task.title}</h4>
                <span className={`px-2 py-0.5 rounded-full text-xs ${taskStatusConfig[task.status].color}`}>
                  {taskStatusConfig[task.status].label}
                </span>
                <span className={`text-xs font-medium ${priorityConfig[task.priority].color}`}>
                  {priorityConfig[task.priority].label}
                </span>
              </div>

              {task.description && (
                <p className="text-sm text-gray-600 mb-2">{task.description}</p>
              )}

              {taskTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {taskTags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-600">
                {task.startDate && task.endDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(task.startDate).toLocaleDateString('fr-FR')} - {new Date(task.endDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
                {getResourceNames(task.id) && (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{getResourceNames(task.id)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Statistics */}
            <div className="flex-shrink-0 text-right">
              <div className="text-sm font-semibold text-gray-900 mb-1">{stats.totalHours}h</div>
              <div className="text-xs text-gray-500 mb-2">
                {stats.completedHours}h / {stats.totalHours}h
              </div>
              <div className="w-24">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${stats.progress}%` }}
                  />
                </div>
                <div className="text-xs text-gray-600 mt-1 text-center">{stats.progress}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && task.children.map((child: any, idx: number) =>
          renderWbsNode(child, depth + 1, `${wbsCode}.${idx + 1}`)
        )}
      </React.Fragment>
    );
  };

  const renderTaskWithChildren = (task: any, depth: number): React.ReactNode => {
    const hasChildren = task.children && task.children.length > 0;
    const marginLeft = depth * 32; // 32px per level
    const taskTags = parseTaskTags(task);

    return (
      <React.Fragment key={task.id}>
        <div
          className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
          style={{
            marginLeft: `${marginLeft}px`,
            display: 'grid',
            gridTemplateColumns: '1fr auto auto auto auto',
            gap: '1rem',
            alignItems: 'center'
          }}
        >
          {/* Left section: Title and description */}
          <div
            className="min-w-0 cursor-pointer"
            onClick={() => setSelectedTaskForDetail(task)}
          >
            <div className="flex items-center gap-2">
              {depth > 0 && (
                <span className="text-gray-400 text-xs flex-shrink-0">└─</span>
              )}
              <h3 className="font-medium text-gray-900 truncate">{task.title}</h3>
              {hasChildren && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
                  {task.children.length} sous-tâche{task.children.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {task.description && (
              <p className="text-xs text-gray-500 truncate mt-1">{task.description}</p>
            )}
            {taskTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {taskTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Status section (fixed width) */}
          <div className="flex items-center gap-3" style={{ width: '200px' }}>
            {/* Editable Status */}
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
              placeholder="Début"
              className="px-2 py-1 border border-gray-300 rounded text-xs w-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-gray-400 text-xs">→</span>
            <input
              type="date"
              value={task.endDate || ''}
              onChange={(e) => {
                e.stopPropagation();
                handleQuickUpdateTaskDate(task.id, 'endDate', e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              placeholder="Fin"
              className="px-2 py-1 border border-gray-300 rounded text-xs w-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Extra info (fixed width) */}
          <div className="flex items-center gap-2 text-xs text-gray-500" style={{ width: '120px' }}>
            {task.estimatedHours && (
              <span>{task.estimatedHours}h</span>
            )}
            {getResourceNames(task.id) && (
              <span className="flex items-center gap-1 truncate">
                <Users className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{getResourceNames(task.id)}</span>
              </span>
            )}
          </div>

          {/* Actions (fixed width) */}
          <div className="flex items-center gap-1" style={{ width: '110px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddSubtask(task.id);
              }}
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Ajouter une sous-tâche"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditTask(task);
              }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteTask(task.id);
              }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {hasChildren && task.children.map((child: any) => renderTaskWithChildren(child, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux projets
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProjectForm(true)}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Modifier
            </button>
            <button
              onClick={handleDeleteProject}
              className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        </div>

        {/* Project Info */}
        <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: project.color }}
          >
            <span className="text-2xl font-bold text-white">
              {project.name[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.name}</h1>
            {project.description && (
              <p className="text-gray-600 mb-3">{project.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm">
              <span className={`px-3 py-1 rounded-full font-medium ${statusConfig[project.status].color}`}>
                {statusConfig[project.status].label}
              </span>
              <span className={`font-medium ${priorityConfig[project.priority].color}`}>
                Priorité: {priorityConfig[project.priority].label}
              </span>
              {project.startDate && (
                <span className="text-gray-600 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(project.startDate).toLocaleDateString('fr-FR')}
                  {project.endDate && ` → ${new Date(project.endDate).toLocaleDateString('fr-FR')}`}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">Progression</div>
            <div className="text-3xl font-bold text-gray-900">{projectStats.completionRate}%</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${projectStats.completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'tasks'
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            Tâches ({projectTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'milestones'
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Flag className="w-4 h-4" />
            Jalons ({projectMilestones.length})
          </button>
          <button
            onClick={() => setActiveTab('gantt')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'gantt'
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <GanttChart className="w-4 h-4" />
            Gantt
          </button>
          <button
            onClick={() => setActiveTab('wbs')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'wbs'
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Network className="w-4 h-4" />
            WBS
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'resources'
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            Ressources ({projectResources.length})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'activity'
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            Activité
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Tâches du projet</h2>
                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setTaskViewMode('table')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      taskViewMode === 'table'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Vue tableau"
                  >
                    <List className="w-3.5 h-3.5" />
                    Tableau
                  </button>
                  <button
                    onClick={() => setTaskViewMode('kanban')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      taskViewMode === 'kanban'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Vue Kanban"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    Kanban
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTasksImport(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Importer
                </button>
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setShowTaskForm(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
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
                    {filteredProjectTasks.length} tâche(s) affichée(s) sur {projectTasks.length}
                  </div>
                )}
                {allTags.length === 0 && (
                  <div className="text-sm text-gray-500 italic">
                    Aucun tag disponible. Ajoutez des tags aux tâches pour les filtrer.
                  </div>
                )}
              </div>

            {projectTasks.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <ListTodo className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">Aucune tâche dans ce projet</p>
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="text-blue-600 hover:underline"
                >
                  Créer la première tâche
                </button>
              </div>
            ) : filteredProjectTasks.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Tag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">Aucune tâche ne correspond aux tags sélectionnés</p>
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : taskViewMode === 'table' ? (
              <div className="space-y-3">
                {hierarchicalTasks.map(task => renderTaskWithChildren(task, 0))}
              </div>
            ) : (
              /* Kanban View */
              <div className="flex-1 grid grid-cols-5 gap-4 overflow-x-auto">
                {(Object.keys(taskStatusConfig) as Array<keyof typeof taskStatusConfig>).map(status => (
                  <div
                    key={status}
                    className="flex flex-col min-w-[250px]"
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(status)}
                  >
                    {/* Column Header */}
                    <div className={`px-4 py-3 rounded-t-lg border-2 ${taskStatusConfig[status].color.replace('text-', 'border-')}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700">
                          {taskStatusConfig[status].label}
                        </span>
                        <span className="text-sm font-medium text-gray-600 bg-white px-2 py-0.5 rounded-full">
                          {tasksByStatus(status).length}
                        </span>
                      </div>
                    </div>

                    {/* Tasks Column */}
                    <div className="flex-1 bg-gray-50 rounded-b-lg border-2 border-t-0 border-gray-200 p-3 space-y-3 overflow-y-auto min-h-[400px]">
                      {tasksByStatus(status).map(task => {
                        const taskTags = parseTaskTags(task);
                        const priorityColors = {
                          low: 'text-gray-600',
                          medium: 'text-blue-600',
                          high: 'text-orange-600',
                          urgent: 'text-red-600',
                        };

                        return (
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditTask(task);
                                    }}
                                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                    title="Modifier"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTask(task.id);
                                    }}
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
                              {/* Resources */}
                              {getResourceNames(task.id) && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                  <Users className="w-3 h-3" />
                                  <span className="truncate">{getResourceNames(task.id)}</span>
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
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                  <Calendar className="w-3 h-3" />
                                  <span>{new Date(task.endDate).toLocaleDateString('fr-FR')}</span>
                                </div>
                              )}

                              {/* Tags */}
                              {taskTags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {taskTags.map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

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
          </div>
        )}

        {/* Milestones Tab */}
        {activeTab === 'milestones' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Jalons du projet</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMilestonesImport(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Importer
                </button>
                <button
                  onClick={() => {
                    setEditingMilestone(null);
                    setShowMilestoneForm(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nouveau jalon
                </button>
              </div>
            </div>

            {projectMilestones.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Flag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">Aucun jalon dans ce projet</p>
                <button
                  onClick={() => setShowMilestoneForm(true)}
                  className="text-blue-600 hover:underline"
                >
                  Créer le premier jalon
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {projectMilestones.map(milestone => (
                  <div
                    key={milestone.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className="w-3 h-3 rounded-full mt-1"
                          style={{ backgroundColor: milestone.color }}
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-2">{milestone.name}</h3>
                          {milestone.description && (
                            <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-sm">
                            <span className={`px-2 py-1 rounded-full ${milestoneStatusConfig[milestone.status].color}`}>
                              {milestoneStatusConfig[milestone.status].label}
                            </span>
                            <span className="text-gray-600 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(milestone.targetDate).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleEditMilestone(milestone)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMilestone(milestone.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Gantt Tab */}
        {activeTab === 'gantt' && (
          <div className="h-full">
            <ProjectGanttView
              projectId={projectId}
              projectColor={project.color}
            />
          </div>
        )}

        {/* WBS Tab */}
        {activeTab === 'wbs' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Structure de Décomposition du Travail (WBS - PMBOK)</h2>
                <p className="text-sm text-gray-600">
                  Décomposition hiérarchique orientée livrables selon le standard PMI
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setWbsViewMode('deliverables')}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      wbsViewMode === 'deliverables'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Par livrables
                  </button>
                  <button
                    onClick={() => setWbsViewMode('phases')}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      wbsViewMode === 'phases'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Par phases
                  </button>
                </div>
                <button
                  onClick={() => setExpandedWbsNodes(new Set(wbsStructure.map(d => d.id)))}
                  className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Tout développer
                </button>
                <button
                  onClick={() => setExpandedWbsNodes(new Set())}
                  className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Tout réduire
                </button>
              </div>
            </div>

            {wbsStructure.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Network className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">
                  {wbsViewMode === 'deliverables'
                    ? 'Aucun livrable (jalon) défini'
                    : 'Aucune tâche dans ce projet'}
                </p>
                <p className="text-sm text-gray-500">
                  {wbsViewMode === 'deliverables'
                    ? 'Créez des jalons pour définir les livrables principaux du projet'
                    : 'Créez des tâches pour voir la structure WBS par phases'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main WBS Structure */}
                <div className="lg:col-span-2 space-y-4">
                  {/* WBS Info Banner */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                    <div className="font-semibold text-blue-900 mb-2">Principes WBS PMBOK :</div>
                    <ul className="text-blue-800 space-y-1 text-xs">
                      <li>• <strong>Règle des 100%</strong> : La WBS doit capturer 100% de la portée du projet</li>
                      <li>• <strong>Focus livrables</strong> : Chaque niveau représente un livrable (résultat/produit), pas une action</li>
                      <li>• <strong>Packages de travail</strong> : Niveau le plus bas = unité assignable à une personne/équipe</li>
                    </ul>
                  </div>

                  {/* WBS Deliverables/Phases */}
                  {wbsStructure.map((element) => {
                    const isExpanded = expandedWbsNodes.has(element.id);
                    const completionRate = element.stats.totalTasks > 0
                      ? Math.round((element.stats.completedTasks / element.stats.totalTasks) * 100)
                      : 0;

                    return (
                      <div key={element.id} className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                        {/* Deliverable Header */}
                        <div
                          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                          style={{ backgroundColor: element.color ? `${element.color}15` : undefined }}
                          onClick={() => {
                            const newExpanded = new Set(expandedWbsNodes);
                            if (isExpanded) {
                              newExpanded.delete(element.id);
                            } else {
                              newExpanded.add(element.id);
                            }
                            setExpandedWbsNodes(newExpanded);
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <button className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-white transition-colors">
                              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                            </button>

                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-mono text-sm font-bold text-gray-700">{element.wbsCode}</span>
                                <h3 className="text-lg font-bold text-gray-900">{element.name}</h3>
                                {element.type === 'deliverable' && element.status && (
                                  <span className={`px-2 py-0.5 rounded-full text-xs ${milestoneStatusConfig[element.status].color}`}>
                                    {milestoneStatusConfig[element.status].label}
                                  </span>
                                )}
                              </div>

                              {element.description && (
                                <p className="text-sm text-gray-600 mb-3">{element.description}</p>
                              )}

                              <div className="grid grid-cols-4 gap-4 text-sm">
                                <div>
                                  <div className="text-gray-600 text-xs">Packages de travail</div>
                                  <div className="font-semibold text-gray-900">{element.stats.totalTasks}</div>
                                </div>
                                <div>
                                  <div className="text-gray-600 text-xs">Heures estimées</div>
                                  <div className="font-semibold text-gray-900">{element.stats.totalHours}h</div>
                                </div>
                                <div>
                                  <div className="text-gray-600 text-xs">Complétées</div>
                                  <div className="font-semibold text-green-600">{element.stats.completedTasks}/{element.stats.totalTasks}</div>
                                </div>
                                <div>
                                  <div className="text-gray-600 text-xs">Progression</div>
                                  <div className="font-semibold text-blue-600">{completionRate}%</div>
                                </div>
                              </div>

                              <div className="mt-3">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-green-500 h-2 rounded-full transition-all"
                                    style={{ width: `${completionRate}%` }}
                                  />
                                </div>
                              </div>

                              {element.targetDate && (
                                <div className="mt-2 flex items-center gap-1 text-xs text-gray-600">
                                  <Calendar className="w-3 h-3" />
                                  Date cible: {new Date(element.targetDate).toLocaleDateString('fr-FR')}
                                </div>
                              )}
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedWbsElement(selectedWbsElement === element.id ? null : element.id);
                              }}
                              className="flex-shrink-0 px-3 py-1 text-xs text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                            >
                              Dictionnaire
                            </button>
                          </div>
                        </div>

                        {/* Work Packages (Tasks) */}
                        {isExpanded && element.tasks.length > 0 && (
                          <div className="border-t border-gray-200 bg-gray-50 p-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Packages de travail :</h4>
                            <div className="space-y-2">
                              {element.tasks.map((task: any, idx: number) => {
                                const taskTags = parseTaskTags(task);
                                return (
                                  <div
                                    key={task.id}
                                    className="bg-white border border-gray-200 rounded p-3 text-sm"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-mono text-xs font-semibold text-gray-600">
                                            {element.wbsCode}.{idx + 1}
                                          </span>
                                          <span className="font-medium text-gray-900">{task.title}</span>
                                          <span className={`px-2 py-0.5 rounded-full text-xs ${taskStatusConfig[task.status].color}`}>
                                            {taskStatusConfig[task.status].label}
                                          </span>
                                        </div>
                                        {task.description && (
                                          <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                                        )}
                                        {taskTags.length > 0 && (
                                          <div className="flex flex-wrap gap-1">
                                            {taskTags.map((tag, tidx) => (
                                              <span key={tidx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                <Tag className="w-3 h-3" />
                                                {tag}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-right text-xs">
                                        <div className="text-gray-900 font-semibold">{task.estimatedHours || 0}h</div>
                                        {getResourceNames(task.id) && (
                                          <div className="text-gray-600 mt-1">{getResourceNames(task.id)}</div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* WBS Dictionary Sidebar */}
                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Flag className="w-4 h-4" />
                      Dictionnaire WBS
                    </h3>

                    {selectedWbsElement ? (
                      (() => {
                        const element = wbsStructure.find(d => d.id === selectedWbsElement);
                        if (!element) return <p className="text-sm text-gray-500">Élément non trouvé</p>;

                        return (
                          <div className="space-y-3 text-sm">
                            <div>
                              <div className="text-xs font-semibold text-gray-600 mb-1">Code WBS</div>
                              <div className="font-mono font-semibold">{element.wbsCode}</div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-600 mb-1">Nom du livrable</div>
                              <div className="font-semibold">{element.name}</div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-600 mb-1">Description</div>
                              <div className="text-gray-700">{element.description || 'Aucune description'}</div>
                            </div>
                            <div className="border-t border-gray-200 pt-3">
                              <div className="text-xs font-semibold text-gray-600 mb-2">Métriques</div>
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Packages:</span>
                                  <span className="font-medium">{element.stats.totalTasks}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Heures:</span>
                                  <span className="font-medium">{element.stats.totalHours}h</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Complétées:</span>
                                  <span className="font-medium">{element.stats.completedTasks}/{element.stats.totalTasks}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Progression:</span>
                                  <span className="font-medium">
                                    {Math.round((element.stats.completedTasks / Math.max(1, element.stats.totalTasks)) * 100)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            {element.targetDate && (
                              <div className="border-t border-gray-200 pt-3">
                                <div className="text-xs font-semibold text-gray-600 mb-1">Date cible</div>
                                <div>{new Date(element.targetDate).toLocaleDateString('fr-FR', {
                                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                })}</div>
                              </div>
                            )}
                            <div className="border-t border-gray-200 pt-3">
                              <div className="text-xs font-semibold text-gray-600 mb-1">Critères d'acceptation</div>
                              <div className="text-gray-700">
                                Tous les packages de travail doivent être complétés et validés
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <p className="text-sm text-gray-500">
                        Cliquez sur "Dictionnaire" d'un livrable pour voir ses détails
                      </p>
                    )}
                  </div>

                  {/* Règle des 100% */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2 text-sm">Règle des 100%</h4>
                    <div className="text-xs text-green-800 space-y-2">
                      <div className="flex justify-between">
                        <span>Livrables définis:</span>
                        <span className="font-semibold">{wbsStructure.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Packages totaux:</span>
                        <span className="font-semibold">
                          {wbsStructure.reduce((sum, d) => sum + d.stats.totalTasks, 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Heures capturées:</span>
                        <span className="font-semibold">
                          {wbsStructure.reduce((sum, d) => sum + d.stats.totalHours, 0)}h
                        </span>
                      </div>
                      <div className="pt-2 border-t border-green-300">
                        <div className="flex justify-between font-semibold">
                          <span>Couverture portée:</span>
                          <span className="text-green-700">
                            {projectTasks.length > 0 ? '100%' : '0%'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Ressources assignées au projet</h2>
            </div>

            {projectResources.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Aucune ressource assignée à ce projet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Assignez des ressources aux tâches pour les voir ici
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectResources.map(resource => {
                  const assignedTasks = projectTasks.filter(task =>
                    resourceAssignments.get(task.id)?.includes(resource.id)
                  );

                  return (
                    <div
                      key={resource.id}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">
                            {resource.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{resource.name}</h3>
                          {resource.role && (
                            <p className="text-sm text-gray-600">{resource.role}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {assignedTasks.length} tâche(s) assignée(s)
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Activité du projet</h2>

            {isLoadingActivity ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Chargement...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Column - Timeline & Comments */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Timeline Section */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-5 h-5 text-gray-600" />
                      <h3 className="font-semibold text-gray-900">Chronologie des événements</h3>
                    </div>

                    {activityLogs.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-8">Aucune activité enregistrée</p>
                    ) : (
                      <div className="space-y-3">
                        {activityLogs.map((log) => {
                          const changes = log.changes ? JSON.parse(log.changes) : null;
                          return (
                            <div key={log.id} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
                              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Activity className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900">
                                  <span className="font-medium">{log.author || 'Système'}</span>
                                  {' '}
                                  {log.action === 'status_changed' && changes && (
                                    <>a changé le statut de <span className="font-medium">{changes.old_status}</span> à <span className="font-medium">{changes.new_status}</span></>
                                  )}
                                  {log.action === 'created' && `a créé ${log.entityType === 'task' ? 'une tâche' : log.entityType === 'milestone' ? 'un jalon' : 'un élément'}`}
                                  {log.action === 'updated' && `a modifié ${log.entityType === 'task' ? 'une tâche' : log.entityType === 'milestone' ? 'un jalon' : 'un élément'}`}
                                  {log.action === 'deleted' && `a supprimé ${log.entityType === 'task' ? 'une tâche' : log.entityType === 'milestone' ? 'un jalon' : 'un élément'}`}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(log.createdAt).toLocaleString('fr-FR')}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Comments Section */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <MessageSquare className="w-5 h-5 text-gray-600" />
                      <h3 className="font-semibold text-gray-900">Commentaires & Notes</h3>
                    </div>

                    {/* Comment List */}
                    <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                      {projectComments.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">Aucun commentaire</p>
                      ) : (
                        projectComments.map((comment) => (
                          <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <span className="font-medium text-sm text-gray-900">{comment.author}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleString('fr-FR')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Comment Form */}
                    <div className="border-t border-gray-200 pt-4">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Ajouter un commentaire ou une note..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={3}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) {
                            handleAddComment();
                          }
                        }}
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-4 h-4" />
                          Envoyer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar - Statistics */}
                <div className="space-y-6">
                  {/* Statistics Overview */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-gray-600" />
                      <h3 className="font-semibold text-gray-900">Statistiques</h3>
                    </div>

                    <div className="space-y-4">
                      {/* Task Stats */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Tâches</span>
                          <span className="text-sm text-gray-600">{projectStats.completedTasks}/{projectStats.totalTasks}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${projectStats.completionRate}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{projectStats.completionRate}% complété</p>
                      </div>

                      {/* Task Breakdown */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-blue-50 rounded-lg p-2">
                          <div className="text-xs text-blue-600 mb-1">En cours</div>
                          <div className="text-lg font-semibold text-blue-700">{projectStats.inProgressTasks}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="text-xs text-gray-600 mb-1">À faire</div>
                          <div className="text-lg font-semibold text-gray-700">{projectStats.todoTasks}</div>
                        </div>
                      </div>

                      {/* Milestones Stats */}
                      {projectStats.totalMilestones > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Jalons</span>
                            <span className="text-sm text-gray-600">{projectStats.achievedMilestones}/{projectStats.totalMilestones}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full transition-all"
                              style={{ width: `${projectStats.milestonesRate}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{projectStats.milestonesRate}% atteints</p>
                        </div>
                      )}

                      {/* Project Progress */}
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Progression globale</span>
                          <span className="text-sm text-gray-600">{projectStats.completionRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="h-3 rounded-full transition-all"
                            style={{
                              width: `${projectStats.completionRate}%`,
                              backgroundColor: project.color
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm">Informations</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Statut:</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${statusConfig[project.status].color}`}>
                          {statusConfig[project.status].label}
                        </span>
                      </div>
                      {project.startDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Début:</span>
                          <span className="text-gray-900">{new Date(project.startDate).toLocaleDateString('fr-FR')}</span>
                        </div>
                      )}
                      {project.endDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fin:</span>
                          <span className="text-gray-900">{new Date(project.endDate).toLocaleDateString('fr-FR')}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Créé:</span>
                        <span className="text-gray-900">{new Date(project.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Modifié:</span>
                        <span className="text-gray-900">{new Date(project.updatedAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Forms Modals */}
      {showProjectForm && (
        <ProjectForm
          project={project}
          onClose={() => setShowProjectForm(false)}
        />
      )}

      {showTaskForm && (
        <TaskForm
          task={editingTask}
          projectId={projectId}
          parentTaskId={selectedParentTask}
          onClose={() => {
            setShowTaskForm(false);
            setEditingTask(null);
            setSelectedParentTask(null);
          }}
        />
      )}

      {showMilestoneForm && (
        <MilestoneForm
          milestone={editingMilestone}
          projectId={projectId}
          onClose={() => {
            setShowMilestoneForm(false);
            setEditingMilestone(null);
          }}
        />
      )}

      {/* Import Dialogs */}
      {showTasksImport && (
        <TasksImportDialog
          projectId={projectId}
          onClose={() => setShowTasksImport(false)}
        />
      )}

      {showMilestonesImport && (
        <MilestonesImportDialog
          projectId={projectId}
          onClose={() => setShowMilestonesImport(false)}
        />
      )}

      {/* Task Detail Modal */}
      {selectedTaskForDetail && (
        <TaskDetailModal
          task={selectedTaskForDetail}
          projectName={project.name}
          projectColor={project.color}
          onClose={() => setSelectedTaskForDetail(null)}
        />
      )}
    </div>
  );
};

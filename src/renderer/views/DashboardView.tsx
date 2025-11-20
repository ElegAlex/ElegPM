import React, { useEffect, useRef, useState } from 'react';
import { FolderOpen, CheckSquare, Flag, Users, TrendingUp, AlertCircle, Calendar, FileDown } from 'lucide-react';
import { useProjectsStore } from '../stores/projectsStore';
import { useTasksStore } from '../stores/tasksStore';
import { useMilestonesStore } from '../stores/milestonesStore';
import { useResourcesStore } from '../stores/resourcesStore';
import { exportDashboardToPDF } from '../lib/pdfExport';
import { useTranslation } from '../i18n/useTranslation';

export const DashboardView: React.FC = () => {
  const { t } = useTranslation();
  const { projects, fetchProjects } = useProjectsStore();
  const { tasks, fetchTasks } = useTasksStore();
  const { milestones, fetchMilestones } = useMilestonesStore();
  const { resources, fetchResources } = useResourcesStore();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchTasks();
    fetchMilestones();
    fetchResources();
  }, [fetchProjects, fetchTasks, fetchMilestones, fetchResources]);

  // Projects stats
  const activeProjects = projects.filter(p => p.status === 'in_progress').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const onHoldProjects = projects.filter(p => p.status === 'on_hold').length;

  // Tasks stats
  const todoTasks = tasks.filter(t => t.status === 'todo').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const blockedTasks = tasks.filter(t => t.status === 'blocked').length;

  // Milestones stats
  const upcomingMilestones = milestones.filter(m => {
    if (m.status !== 'pending') return false;
    const targetDate = new Date(m.targetDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return targetDate >= now && targetDate <= thirtyDaysFromNow;
  });

  const overdueMilestones = milestones.filter(m => {
    if (m.status !== 'pending') return false;
    return new Date(m.targetDate) < new Date();
  });

  // Resources stats
  const availableResources = resources.filter(r => r.availability >= 50).length;
  const avgAvailability = resources.length > 0
    ? Math.round(resources.reduce((acc, r) => acc + r.availability, 0) / resources.length)
    : 0;

  // Overall project progress
  const totalProgress = projects.length > 0
    ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length)
    : 0;

  // Get active projects with dates for display
  const activeProjectsList = projects
    .filter(p => p.status === 'in_progress' || p.status === 'not_started')
    .sort((a, b) => {
      // Sort by start date if available
      if (a.startDate && b.startDate) {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }
      return 0;
    });

  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;

    try {
      setIsExporting(true);
      await exportDashboardToPDF(dashboardRef.current);
    } catch (error) {
      console.error('Error exporting dashboard to PDF:', error);
      alert(t('exportError'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6" ref={dashboardRef}>
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('dashboard')}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('dashboardOverview')}
          </p>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('exportPDF')}
        >
          <FileDown className="w-5 h-5" />
          {isExporting ? t('exporting') : t('exportPDF')}
        </button>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Projects */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{activeProjects}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('activeProjects')}</div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {completedProjects} {t('completedProjects')} · {onHoldProjects} {t('onHoldProjects')}
          </div>
        </div>

        {/* Tasks in Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            {blockedTasks > 0 && (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{inProgressTasks}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('tasksInProgress')}</div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {todoTasks} {t('todoTasks')} · {doneTasks} {t('completedTasks')}
            {blockedTasks > 0 && ` · ${blockedTasks} ${t('blockedTasks')}`}
          </div>
        </div>

        {/* Upcoming Milestones */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Flag className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            {overdueMilestones.length > 0 && (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{upcomingMilestones.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('upcomingMilestones')}</div>
          {overdueMilestones.length > 0 && (
            <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">
              {overdueMilestones.length} {t('overdueCount')}
            </div>
          )}
        </div>

        {/* Available Resources */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{availableResources}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('availableResources')}</div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {t('avgAvailability')}: {avgAvailability}%
          </div>
        </div>
      </div>

      {/* Projects and Tasks Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects by Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('projectsByStatus')}</h3>
          <div className="space-y-4">
            {projects.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">{t('noProjects')}</p>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('statusInProgress')}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{activeProjects}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                      style={{ width: `${projects.length > 0 ? (activeProjects / projects.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('statusCompleted')}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{completedProjects}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 dark:bg-green-500 h-2 rounded-full"
                      style={{ width: `${projects.length > 0 ? (completedProjects / projects.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {onHoldProjects > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('onHold')}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{onHoldProjects}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-yellow-600 dark:bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${projects.length > 0 ? (onHoldProjects / projects.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('overallProgress')}</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{totalProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-2">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-3 rounded-full"
                      style={{ width: `${totalProgress}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tasks by Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('tasksByStatus')}</h3>
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">{t('noTasks')}</p>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('statusTodo')}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{todoTasks}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gray-600 dark:bg-gray-500 h-2 rounded-full"
                      style={{ width: `${tasks.length > 0 ? (todoTasks / tasks.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('statusInProgress')}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{inProgressTasks}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                      style={{ width: `${tasks.length > 0 ? (inProgressTasks / tasks.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('statusDone')}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{doneTasks}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 dark:bg-green-500 h-2 rounded-full"
                      style={{ width: `${tasks.length > 0 ? (doneTasks / tasks.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {blockedTasks > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('statusBlocked')}</span>
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">{blockedTasks}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-red-600 dark:bg-red-500 h-2 rounded-full"
                        style={{ width: `${tasks.length > 0 ? (blockedTasks / tasks.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Active Projects List */}
      {activeProjectsList.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            {t('activeProjects')}
          </h3>
          <div className="space-y-4">
            {activeProjectsList.slice(0, 5).map(project => (
              <div
                key={project.id}
                className="py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                      style={{ backgroundColor: project.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white">{project.name}</div>
                      {(project.startDate || project.endDate) && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {project.startDate && (
                            <span>
                              {new Date(project.startDate).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          )}
                          {project.startDate && project.endDate && <span>→</span>}
                          {project.endDate && (
                            <span>
                              {new Date(project.endDate).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {project.progress}%
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${project.progress}%`,
                      backgroundColor: project.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Milestones List */}
      {upcomingMilestones.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t('upcomingMilestonesNext30Days')}
          </h3>
          <div className="space-y-3">
            {upcomingMilestones.slice(0, 5).map(milestone => (
              <div
                key={milestone.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: milestone.color }}
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{milestone.name}</div>
                    {milestone.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{milestone.description}</div>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(milestone.targetDate).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

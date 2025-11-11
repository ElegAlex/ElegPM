import React, { useEffect } from 'react';
import { FolderOpen, CheckSquare, Flag, Users, TrendingUp, AlertCircle, Calendar } from 'lucide-react';
import { useProjectsStore } from '../stores/projectsStore';
import { useTasksStore } from '../stores/tasksStore';
import { useMilestonesStore } from '../stores/milestonesStore';
import { useResourcesStore } from '../stores/resourcesStore';

export const DashboardView: React.FC = () => {
  const { projects, fetchProjects } = useProjectsStore();
  const { tasks, fetchTasks } = useTasksStore();
  const { milestones, fetchMilestones } = useMilestonesStore();
  const { resources, fetchResources } = useResourcesStore();

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

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h1>
        <p className="text-gray-600">
          Vue d'ensemble de vos projets et activités
        </p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Projects */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{activeProjects}</div>
          <div className="text-sm text-gray-600">Projets actifs</div>
          <div className="mt-2 text-xs text-gray-500">
            {completedProjects} terminés · {onHoldProjects} en pause
          </div>
        </div>

        {/* Tasks in Progress */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-purple-600" />
            </div>
            {blockedTasks > 0 && (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{inProgressTasks}</div>
          <div className="text-sm text-gray-600">Tâches en cours</div>
          <div className="mt-2 text-xs text-gray-500">
            {todoTasks} à faire · {doneTasks} terminées
            {blockedTasks > 0 && ` · ${blockedTasks} bloquées`}
          </div>
        </div>

        {/* Upcoming Milestones */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Flag className="w-6 h-6 text-green-600" />
            </div>
            {overdueMilestones.length > 0 && (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{upcomingMilestones.length}</div>
          <div className="text-sm text-gray-600">Jalons à venir (30j)</div>
          {overdueMilestones.length > 0 && (
            <div className="mt-2 text-xs text-red-600 font-medium">
              {overdueMilestones.length} en retard
            </div>
          )}
        </div>

        {/* Available Resources */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{availableResources}</div>
          <div className="text-sm text-gray-600">Ressources disponibles</div>
          <div className="mt-2 text-xs text-gray-500">
            Disponibilité moyenne: {avgAvailability}%
          </div>
        </div>
      </div>

      {/* Projects and Tasks Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects by Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Projets par statut</h3>
          <div className="space-y-4">
            {projects.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Aucun projet</p>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">En cours</span>
                    <span className="text-sm font-medium text-gray-900">{activeProjects}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${projects.length > 0 ? (activeProjects / projects.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Terminés</span>
                    <span className="text-sm font-medium text-gray-900">{completedProjects}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${projects.length > 0 ? (completedProjects / projects.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {onHoldProjects > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">En pause</span>
                      <span className="text-sm font-medium text-gray-900">{onHoldProjects}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-600 h-2 rounded-full"
                        style={{ width: `${projects.length > 0 ? (onHoldProjects / projects.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Progression globale</span>
                    <span className="text-lg font-bold text-blue-600">{totalProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                    <div
                      className="bg-blue-600 h-3 rounded-full"
                      style={{ width: `${totalProgress}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tasks by Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tâches par statut</h3>
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Aucune tâche</p>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">À faire</span>
                    <span className="text-sm font-medium text-gray-900">{todoTasks}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gray-600 h-2 rounded-full"
                      style={{ width: `${tasks.length > 0 ? (todoTasks / tasks.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">En cours</span>
                    <span className="text-sm font-medium text-gray-900">{inProgressTasks}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${tasks.length > 0 ? (inProgressTasks / tasks.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Terminées</span>
                    <span className="text-sm font-medium text-gray-900">{doneTasks}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${tasks.length > 0 ? (doneTasks / tasks.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {blockedTasks > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Bloquées</span>
                      <span className="text-sm font-medium text-red-600">{blockedTasks}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full"
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

      {/* Upcoming Milestones List */}
      {upcomingMilestones.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Jalons à venir (30 prochains jours)
          </h3>
          <div className="space-y-3">
            {upcomingMilestones.slice(0, 5).map(milestone => (
              <div
                key={milestone.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: milestone.color }}
                  />
                  <div>
                    <div className="font-medium text-gray-900">{milestone.name}</div>
                    {milestone.description && (
                      <div className="text-sm text-gray-500 line-clamp-1">{milestone.description}</div>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
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
